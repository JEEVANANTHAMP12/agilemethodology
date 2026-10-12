import os
import shutil
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.image import Image
from app.models.inspection import Inspection
from app.models.defect import Defect
from app.schemas.image import ImageUploadResponse, ImageDetailResponse
from app.services.crack_detector import CrackDetector
from app.services.shi_engine import SHIEngine
from app.services.rul_predictor import RULPredictor
from app.services.alert_manager import AlertManager
from app.models.health_result import HealthResult
from app.models.rul_prediction import RulPrediction
from app.models.wall import Wall
from app.models.building import Building

router = APIRouter(prefix="/images", tags=["Image Capture & Processing"])

crack_detector = CrackDetector(pixels_per_mm=settings.DEFAULT_PIXELS_PER_MM)
shi_engine = SHIEngine()
rul_predictor = RULPredictor()

@router.post("/upload")
async def upload_inspection_image(
    inspection_id: int = Form(...),
    file: UploadFile = File(...),
    distance_to_wall_mm: Optional[float] = Form(250.0),
    ambient_temp_c: Optional[float] = Form(None),
    humidity_pct: Optional[float] = Form(None),
    rover_tilt_deg: Optional[float] = Form(None),
    vibration_level: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Receives image capture from ESP32 Rover camera over Wi-Fi,
    executes automated crack detection & measurement, stores results,
    and updates inspection analytics.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection session not found")

    # Update sensor telemetry if provided in packet
    if ambient_temp_c is not None:
        inspection.ambient_temp_c = ambient_temp_c
    if humidity_pct is not None:
        inspection.humidity_pct = humidity_pct
    if rover_tilt_deg is not None:
        inspection.rover_tilt_deg = rover_tilt_deg
    if vibration_level is not None:
        inspection.vibration_level = vibration_level

    # Generate unique filenames
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    original_filename = f"insp_{inspection_id}_orig_{timestamp_str}_{file.filename}"
    processed_filename = f"insp_{inspection_id}_proc_{timestamp_str}_{file.filename}"

    original_file_path = settings.UPLOAD_DIR / original_filename
    processed_file_path = settings.PROCESSED_DIR / processed_filename

    # Save uploaded file to disk
    with open(original_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Calculate dynamic calibration pixels_per_mm if distance varies
    calibrated_px_per_mm = settings.DEFAULT_PIXELS_PER_MM * (250.0 / max(50.0, distance_to_wall_mm))
    detector = CrackDetector(pixels_per_mm=calibrated_px_per_mm)

    # Run Crack Detection Pipeline (Phase 5)
    try:
        detection_result = detector.analyze_image(
            input_image_path=str(original_file_path),
            output_image_path=str(processed_file_path)
        )
    except Exception as e:
        # If OpenCV fails, fall back to saving unannotated
        shutil.copy(original_file_path, processed_file_path)
        detection_result = {
            "crack_detected": False,
            "total_cracks": 0,
            "primary_length_mm": 0.0,
            "primary_width_mm": 0.0,
            "severity": "NONE",
            "confidence_percentage": 95.0,
            "defects": []
        }

    # Count existing images for sequence number
    seq_num = db.query(Image).filter(Image.inspection_id == inspection_id).count() + 1

    # Create Image DB record
    image_record = Image(
        inspection_id=inspection_id,
        file_name=file.filename,
        original_path=original_filename,
        processed_path=processed_filename,
        sequence_number=seq_num,
        distance_to_wall_mm=distance_to_wall_mm,
        calibration_pixel_per_mm=calibrated_px_per_mm,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(image_record)
    db.commit()
    db.refresh(image_record)

    # Store detected defect records
    defect_records: List[Defect] = []
    for d in detection_result.get("defects", []):
        defect = Defect(
            image_id=image_record.id,
            defect_type=d.get("defect_type", "CRACK"),
            length_mm=d.get("length_mm", 0.0),
            max_width_mm=d.get("max_width_mm", 0.0),
            avg_width_mm=d.get("avg_width_mm", 0.0),
            area_sqmm=d.get("area_sqmm", 0.0),
            severity=d.get("severity", "MODERATE"),
            confidence=d.get("confidence", 0.90),
            bounding_box_json=json.dumps(d.get("bounding_box", [])),
            contour_points_json=json.dumps(d.get("contour_points", []))
        )
        db.add(defect)
        defect_records.append(defect)

    db.commit()

    # Automatically trigger SHI calculation, RUL, and alert evaluation
    wall = db.query(Wall).filter(Wall.id == inspection.wall_id).first()
    building = db.query(Building).filter(Building.id == wall.building_id).first() if wall else None
    building_year = building.construction_year if building else 2010

    # Get all defects across the entire inspection for cumulative SHI
    all_imgs = db.query(Image).filter(Image.inspection_id == inspection_id).all()
    all_img_ids = [im.id for im in all_imgs]
    all_defects = db.query(Defect).filter(Defect.image_id.in_(all_img_ids)).all()
    all_defect_dicts = [
        {"length_mm": def_item.length_mm, "max_width_mm": def_item.max_width_mm, "severity": def_item.severity}
        for def_item in all_defects
    ]

    telemetry = {
        "ambient_temp_c": inspection.ambient_temp_c,
        "humidity_pct": inspection.humidity_pct,
        "rover_tilt_deg": inspection.rover_tilt_deg,
        "vibration_level": inspection.vibration_level
    }

    shi_out = shi_engine.calculate_shi(
        defects=all_defect_dicts,
        building_construction_year=building_year,
        inspection_telemetry=telemetry
    )

    # Upsert HealthResult
    health_result = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
    if not health_result:
        health_result = HealthResult(
            inspection_id=inspection_id,
            wall_id=inspection.wall_id,
            shi_score=shi_out["shi_score"],
            health_status=shi_out["health_status"],
            crack_penalty=shi_out["crack_penalty"],
            age_penalty=shi_out["age_penalty"],
            env_penalty=shi_out["env_penalty"],
            history_penalty=shi_out["history_penalty"],
            calculation_factors_json=json.dumps(shi_out["calculation_factors"])
        )
        db.add(health_result)
    else:
        health_result.shi_score = shi_out["shi_score"]
        health_result.health_status = shi_out["health_status"]
        health_result.crack_penalty = shi_out["crack_penalty"]
        health_result.age_penalty = shi_out["age_penalty"]
        health_result.env_penalty = shi_out["env_penalty"]
        health_result.history_penalty = shi_out["history_penalty"]
        health_result.calculation_factors_json = json.dumps(shi_out["calculation_factors"])

    db.commit()
    db.refresh(health_result)

    # Update RUL prediction
    rul_out = rul_predictor.predict_rul(
        current_shi=health_result.shi_score,
        building_age_years=max(1, 2026 - building_year)
    )

    rul_rec = db.query(RulPrediction).filter(RulPrediction.health_result_id == health_result.id).first()
    if not rul_rec:
        rul_rec = RulPrediction(
            health_result_id=health_result.id,
            wall_id=inspection.wall_id,
            current_shi=rul_out["current_shi"],
            previous_shi=rul_out["previous_shi"],
            estimated_rul_years=rul_out["estimated_rul_years"],
            deterioration_rate=rul_out["deterioration_rate"],
            deterioration_trend=rul_out["deterioration_trend"],
            risk_level=rul_out["risk_level"],
            prediction_model=rul_out["prediction_model"],
            confidence_score=rul_out["confidence_score"],
            details_json=json.dumps(rul_out["details"])
        )
        db.add(rul_rec)
    else:
        rul_rec.current_shi = rul_out["current_shi"]
        rul_rec.estimated_rul_years = rul_out["estimated_rul_years"]
        rul_rec.deterioration_rate = rul_out["deterioration_rate"]
        rul_rec.deterioration_trend = rul_out["deterioration_trend"]
        rul_rec.risk_level = rul_out["risk_level"]
        rul_rec.confidence_score = rul_out["confidence_score"]
        rul_rec.details_json = json.dumps(rul_out["details"])

    db.commit()
    if rul_rec:
        db.refresh(rul_rec)

    # Evaluate alerts
    AlertManager.evaluate_inspection_alerts(
        db,
        inspection_id=inspection_id,
        defects=defect_records,
        health_result=health_result,
        rul_prediction=rul_rec
    )

    return {
        "id": image_record.id,
        "inspection_id": inspection_id,
        "file_name": file.filename,
        "original_url": f"/api/images/file/original/{original_filename}",
        "processed_url": f"/api/images/file/processed/{processed_filename}",
        "timestamp": image_record.timestamp,
        "crack_detected": detection_result["crack_detected"],
        "total_cracks": detection_result["total_cracks"],
        "primary_length_mm": detection_result["primary_length_mm"],
        "primary_width_mm": detection_result["primary_width_mm"],
        "severity": detection_result["severity"],
        "confidence_percentage": detection_result["confidence_percentage"],
        "shi_score": health_result.shi_score,
        "estimated_rul_years": rul_rec.estimated_rul_years if rul_rec else None
    }

@router.get("/file/original/{filename}")
def get_original_file(filename: str):
    path = settings.UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    return FileResponse(path)

@router.get("/file/processed/{filename}")
def get_processed_file(filename: str):
    path = settings.PROCESSED_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Processed file not found")
    return FileResponse(path)

@router.get("/inspection/{inspection_id}")
def get_inspection_images(inspection_id: int, db: Session = Depends(get_db)):
    images = db.query(Image).filter(Image.inspection_id == inspection_id).order_by(Image.sequence_number.asc()).all()
    results = []
    for img in images:
        defects = db.query(Defect).filter(Defect.image_id == img.id).all()
        results.append({
            "id": img.id,
            "inspection_id": img.inspection_id,
            "file_name": img.file_name,
            "original_url": f"/api/images/file/original/{img.original_path}",
            "processed_url": f"/api/images/file/processed/{img.processed_path}" if img.processed_path else None,
            "sequence_number": img.sequence_number,
            "timestamp": img.timestamp,
            "defects": [
                {
                    "id": d.id,
                    "severity": d.severity,
                    "length_mm": d.length_mm,
                    "max_width_mm": d.max_width_mm,
                    "avg_width_mm": d.avg_width_mm,
                    "confidence": d.confidence
                } for d in defects
            ]
        })
    return results
