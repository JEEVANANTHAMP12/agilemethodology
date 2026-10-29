import json

from app.database import get_db
from app.models.building import Building
from app.models.defect import Defect
from app.models.health_result import HealthResult
from app.models.image import Image
from app.models.inspection import Inspection
from app.models.wall import Wall
from app.schemas.shi import SHIResponse
from app.services.shi_engine import SHIEngine
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/shi", tags=["Structural Health Index"])

shi_engine = SHIEngine()

@router.post("/evaluate/{inspection_id}", response_model=SHIResponse)
def evaluate_inspection_shi(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    wall = db.query(Wall).filter(Wall.id == inspection.wall_id).first()
    building = db.query(Building).filter(Building.id == wall.building_id).first() if wall else None
    building_year = building.construction_year if building else 2010

    images = db.query(Image).filter(Image.inspection_id == inspection_id).all()
    img_ids = [img.id for img in images]
    defects = db.query(Defect).filter(Defect.image_id.in_(img_ids)).all() if img_ids else []

    defect_dicts = [
        {"length_mm": d.length_mm, "max_width_mm": d.max_width_mm, "severity": d.severity}
        for d in defects
    ]

    telemetry = {
        "ambient_temp_c": inspection.ambient_temp_c,
        "humidity_pct": inspection.humidity_pct,
        "rover_tilt_deg": inspection.rover_tilt_deg,
        "vibration_level": inspection.vibration_level
    }

    result = shi_engine.calculate_shi(
        defects=defect_dicts,
        building_construction_year=building_year,
        inspection_telemetry=telemetry
    )

    health_record = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
    if not health_record:
        health_record = HealthResult(
            inspection_id=inspection_id,
            wall_id=inspection.wall_id,
            shi_score=result["shi_score"],
            health_status=result["health_status"],
            crack_penalty=result["crack_penalty"],
            age_penalty=result["age_penalty"],
            env_penalty=result["env_penalty"],
            history_penalty=result["history_penalty"],
            calculation_factors_json=json.dumps(result["calculation_factors"])
        )
        db.add(health_record)
    else:
        health_record.shi_score = result["shi_score"]
        health_record.health_status = result["health_status"]
        health_record.crack_penalty = result["crack_penalty"]
        health_record.age_penalty = result["age_penalty"]
        health_record.env_penalty = result["env_penalty"]
        health_record.history_penalty = result["history_penalty"]
        health_record.calculation_factors_json = json.dumps(result["calculation_factors"])

    db.commit()
    db.refresh(health_record)

    resp = SHIResponse.model_validate(health_record)
    resp.calculation_factors = result["calculation_factors"]
    return resp

@router.get("/inspection/{inspection_id}", response_model=SHIResponse)
def get_inspection_shi(inspection_id: int, db: Session = Depends(get_db)):
    health_record = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
    if not health_record:
        # Calculate if not yet evaluated
        return evaluate_inspection_shi(inspection_id, db)
    
    resp = SHIResponse.model_validate(health_record)
    if health_record.calculation_factors_json:
        resp.calculation_factors = json.loads(health_record.calculation_factors_json)
    return resp
