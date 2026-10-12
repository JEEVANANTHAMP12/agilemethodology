import os
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.rover import Rover
from app.models.inspection import Inspection
from app.models.wall import Wall
from app.models.building import Building
from app.models.image import Image
from app.models.defect import Defect
from app.models.health_result import HealthResult
from app.models.rul_prediction import RulPrediction
from app.models.alert import Alert
from app.services.rover_service import RoverService
from app.services.crack_detector import CrackDetector
from app.services.shi_engine import SHIEngine
from app.services.rul_predictor import RULPredictor
from app.services.alert_manager import AlertManager
import json

router = APIRouter(prefix="/dashboard", tags=["Dashboard Aggregation"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    # 1. Rover status
    rover = db.query(Rover).first()
    if not rover:
        rover = RoverService.connect_rover(db, "ROVER-01")

    # 2. Latest or Active Inspection
    active_insp = db.query(Inspection).filter(Inspection.status.in_(["STARTED", "IN_PROGRESS"])).order_by(Inspection.start_time.desc()).first()
    latest_insp = active_insp or db.query(Inspection).order_by(Inspection.start_time.desc()).first()

    # 3. Health & RUL metrics
    current_shi = 82.0
    health_status = "HEALTHY"
    estimated_rul = 18.5
    deterioration_trend = "Stable"
    risk_level = "Low"
    wall_status = "HEALTHY"
    target_wall_name = "Wall-North-1 (Main Facade)"

    latest_health = None
    latest_rul = None
    if latest_insp:
        latest_health = db.query(HealthResult).filter(HealthResult.inspection_id == latest_insp.id).first()
        if latest_health:
            current_shi = latest_health.shi_score
            health_status = latest_health.health_status
            wall_status = latest_health.health_status
            latest_rul = db.query(RulPrediction).filter(RulPrediction.health_result_id == latest_health.id).first()
            if latest_rul:
                estimated_rul = latest_rul.estimated_rul_years
                deterioration_trend = latest_rul.deterioration_trend
                risk_level = latest_rul.risk_level

        if latest_insp.wall:
            target_wall_name = f"{latest_insp.wall.wall_code} - {latest_insp.wall.name}"

    # 4. Crack analysis images
    latest_image = None
    defects = []
    if latest_insp:
        latest_image = db.query(Image).filter(Image.inspection_id == latest_insp.id).order_by(Image.sequence_number.desc()).first()
        if latest_image:
            defects = db.query(Defect).filter(Defect.image_id == latest_image.id).all()

    # 5. Historical trend points
    historical_trend = []
    past_inspections = db.query(Inspection).order_by(Inspection.start_time.asc()).limit(10).all()
    for insp in past_inspections:
        h = db.query(HealthResult).filter(HealthResult.inspection_id == insp.id).first()
        r = db.query(RulPrediction).filter(RulPrediction.health_result_id == h.id).first() if h else None
        if h:
            historical_trend.append({
                "inspection_code": insp.inspection_code,
                "date": insp.start_time.strftime("%b %d, %H:%M") if insp.start_time else "Recent",
                "shi_score": h.shi_score,
                "health_status": h.health_status,
                "rul_years": r.estimated_rul_years if r else None
            })

    # 6. Unacknowledged Alerts
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()

    return {
        "top_cards": {
            "rover_status": rover.status if rover else "CONNECTED",
            "rover_code": rover.rover_code if rover else "ROVER-01",
            "battery_percentage": rover.battery_percentage if rover else 95.0,
            "wifi_signal_dbm": rover.wifi_signal_dbm if rover else -58,
            "health_index": current_shi,
            "wall_status": wall_status,
            "estimated_rul_years": estimated_rul,
            "deterioration_trend": deterioration_trend,
            "risk_level": risk_level
        },
        "live_inspection": {
            "is_active": active_insp is not None,
            "inspection_id": latest_insp.id if latest_insp else None,
            "inspection_code": latest_insp.inspection_code if latest_insp else "N/A",
            "status": latest_insp.status if latest_insp else "IDLE",
            "wall_name": target_wall_name,
            "ambient_temp_c": latest_insp.ambient_temp_c if latest_insp else 26.5,
            "humidity_pct": latest_insp.humidity_pct if latest_insp else 55.0,
            "rover_tilt_deg": latest_insp.rover_tilt_deg if latest_insp else 1.2,
            "vibration_level": latest_insp.vibration_level if latest_insp else 0.08
        },
        "crack_analysis": {
            "has_image": latest_image is not None,
            "image_id": latest_image.id if latest_image else None,
            "original_url": f"/api/images/file/original/{latest_image.original_path}" if latest_image else None,
            "processed_url": f"/api/images/file/processed/{latest_image.processed_path}" if latest_image and latest_image.processed_path else None,
            "total_defects": len(defects),
            "primary_severity": defects[0].severity if defects else "NONE",
            "primary_length_mm": defects[0].length_mm if defects else 0.0,
            "primary_width_mm": defects[0].max_width_mm if defects else 0.0,
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
        },
        "health_analysis": {
            "shi_score": current_shi,
            "health_status": health_status,
            "crack_penalty": latest_health.crack_penalty if latest_health else 0.0,
            "age_penalty": latest_health.age_penalty if latest_health else 0.0,
            "env_penalty": latest_health.env_penalty if latest_health else 0.0,
            "historical_trend": historical_trend
        },
        "prediction": {
            "current_shi": current_shi,
            "deterioration_trend": deterioration_trend,
            "estimated_rul_years": estimated_rul,
            "risk_level": risk_level,
            "model_name": latest_rul.prediction_model if latest_rul else "Trend-Extrapolation-Degradation-v1"
        },
        "alerts": [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "is_acknowledged": a.is_acknowledged,
                "created_at": a.created_at.isoformat() if a.created_at else None
            } for a in alerts
        ]
    }

@router.post("/simulate-scan")
def simulate_rover_scan(
    crack_severity: str = Query("MODERATE", enum=["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"]),
    wall_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """
    Hardware-in-the-Loop Rover Simulator:
    Simulates a full automated wall scan transmission:
    1. Connects rover
    2. Selects or creates Wall & Building
    3. Starts an inspection
    4. Synthesizes a concrete surface frame with chosen crack profile
    5. Runs computer vision crack detection, mm measurement, and HUD overlay
    6. Calculates Structural Health Index (SHI)
    7. Computes Remaining Useful Life (RUL)
    8. Fires safety and maintenance alerts
    """
    rover = RoverService.get_status(db, "ROVER-01")
    rover.status = "INSPECTING"
    rover.battery_percentage = max(10.0, rover.battery_percentage - 1.5)
    rover.last_seen_at = datetime.now(timezone.utc)

    # Get or create building and wall
    wall = db.query(Wall).filter(Wall.id == wall_id).first() if wall_id else db.query(Wall).first()
    if not wall:
        building = db.query(Building).first()
        if not building:
            building = Building(
                user_id=1,
                name="Aeronautical Research Complex - Wing B",
                address="Bay 4, Structural Dynamics Lab",
                construction_year=2008,
                structural_type="Reinforced Concrete Shear Wall"
            )
            db.add(building)
            db.commit()
            db.refresh(building)

        wall = Wall(
            building_id=building.id,
            wall_code="WALL-NW-04",
            name="Northwest Bearing Pier",
            orientation="North-West",
            material="C40/50 Reinforced Concrete",
            surface_area_sqm=36.0,
            height_m=3.5,
            width_m=10.2
        )
        db.add(wall)
        db.commit()
        db.refresh(wall)

    # Start inspection
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    code = f"INSP-{date_str}-{random.randint(100, 999)}"
    inspection = Inspection(
        wall_id=wall.id,
        rover_id=rover.id,
        inspection_code=code,
        status="IN_PROGRESS",
        start_time=datetime.now(timezone.utc),
        ambient_temp_c=27.2 + random.uniform(-1.5, 2.0),
        humidity_pct=58.0 + random.uniform(-4.0, 5.0),
        rover_tilt_deg=1.4 + random.uniform(-0.3, 0.4),
        vibration_level=0.11 + random.uniform(-0.02, 0.04),
        notes=f"Autonomous crawler scan on {wall.wall_code} [Profile: {crack_severity}]"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Synthesize test image
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    orig_filename = f"sim_{inspection.id}_orig_{ts}.jpg"
    proc_filename = f"sim_{inspection.id}_proc_{ts}.jpg"
    orig_path = settings.UPLOAD_DIR / orig_filename
    proc_path = settings.PROCESSED_DIR / proc_filename

    has_crack = crack_severity != "NONE"
    RoverService.generate_synthetic_wall_image(str(orig_path), add_crack=has_crack, crack_severity=crack_severity)

    # Run Crack Detection
    detector = CrackDetector(pixels_per_mm=settings.DEFAULT_PIXELS_PER_MM)
    det_out = detector.analyze_image(str(orig_path), str(proc_path))

    # Save Image DB record
    img_rec = Image(
        inspection_id=inspection.id,
        file_name=orig_filename,
        original_path=orig_filename,
        processed_path=proc_filename,
        sequence_number=1,
        calibration_pixel_per_mm=settings.DEFAULT_PIXELS_PER_MM
    )
    db.add(img_rec)
    db.commit()
    db.refresh(img_rec)

    # Store defects
    defect_records = []
    for d in det_out["defects"]:
        df = Defect(
            image_id=img_rec.id,
            defect_type="CRACK",
            length_mm=d["length_mm"],
            max_width_mm=d["max_width_mm"],
            avg_width_mm=d["avg_width_mm"],
            area_sqmm=d["area_sqmm"],
            severity=d["severity"],
            confidence=d["confidence"],
            bounding_box_json=json.dumps(d["bounding_box"]),
            contour_points_json=json.dumps(d["contour_points"])
        )
        db.add(df)
        defect_records.append(df)
    db.commit()

    # Calculate SHI
    building = db.query(Building).filter(Building.id == wall.building_id).first()
    building_year = building.construction_year if building else 2010

    # Prior SHI history for wall
    prior_healths = db.query(HealthResult).filter(HealthResult.wall_id == wall.id).all()
    prior_scores = [p.shi_score for p in prior_healths]

    shi_eng = SHIEngine()
    telemetry = {
        "ambient_temp_c": inspection.ambient_temp_c,
        "humidity_pct": inspection.humidity_pct,
        "rover_tilt_deg": inspection.rover_tilt_deg,
        "vibration_level": inspection.vibration_level
    }
    shi_result = shi_eng.calculate_shi(
        defects=[{"length_mm": d.length_mm, "max_width_mm": d.max_width_mm, "severity": d.severity} for d in defect_records],
        building_construction_year=building_year,
        inspection_telemetry=telemetry,
        previous_shi_scores=prior_scores
    )

    health_rec = HealthResult(
        inspection_id=inspection.id,
        wall_id=wall.id,
        shi_score=shi_result["shi_score"],
        health_status=shi_result["health_status"],
        crack_penalty=shi_result["crack_penalty"],
        age_penalty=shi_result["age_penalty"],
        env_penalty=shi_result["env_penalty"],
        history_penalty=shi_result["history_penalty"],
        calculation_factors_json=json.dumps(shi_result["calculation_factors"])
    )
    db.add(health_rec)
    db.commit()
    db.refresh(health_rec)

    # RUL Prediction
    rul_pred = RULPredictor()
    rul_out = rul_pred.predict_rul(
        current_shi=health_rec.shi_score,
        previous_shi_history=[{"shi_score": s} for s in prior_scores],
        building_age_years=max(1, 2026 - building_year)
    )

    rul_rec = RulPrediction(
        health_result_id=health_rec.id,
        wall_id=wall.id,
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
    db.commit()
    db.refresh(rul_rec)

    # Alerts
    AlertManager.evaluate_inspection_alerts(
        db,
        inspection_id=inspection.id,
        defects=defect_records,
        health_result=health_rec,
        rul_prediction=rul_rec
    )

    # Mark completed
    inspection.status = "COMPLETED"
    inspection.end_time = datetime.now(timezone.utc)
    rover.status = "CONNECTED"
    db.commit()

    return {
        "status": "success",
        "inspection_id": inspection.id,
        "inspection_code": inspection.inspection_code,
        "crack_severity_simulated": crack_severity,
        "total_defects_found": len(defect_records),
        "primary_length_mm": det_out["primary_length_mm"],
        "primary_width_mm": det_out["primary_width_mm"],
        "shi_score": health_rec.shi_score,
        "health_status": health_rec.health_status,
        "estimated_rul_years": rul_rec.estimated_rul_years,
        "risk_level": rul_rec.risk_level
    }
