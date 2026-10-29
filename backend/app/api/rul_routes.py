import json

from app.database import get_db
from app.models.building import Building
from app.models.health_result import HealthResult
from app.models.rul_prediction import RulPrediction
from app.models.wall import Wall
from app.schemas.rul import RULResponse
from app.services.rul_predictor import RULPredictor
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/rul", tags=["Remaining Useful Life"])

rul_predictor = RULPredictor()

@router.post("/predict/{inspection_id}", response_model=RULResponse)
def predict_inspection_rul(inspection_id: int, db: Session = Depends(get_db)):
    health_result = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
    if not health_result:
        raise HTTPException(status_code=400, detail="Run SHI assessment first before predicting RUL")

    wall = db.query(Wall).filter(Wall.id == health_result.wall_id).first()
    building = db.query(Building).filter(Building.id == wall.building_id).first() if wall else None
    building_age = max(1, 2026 - (building.construction_year if building else 2010))

    # Look up prior health scores for regression
    prior_healths = db.query(HealthResult).filter(
        HealthResult.wall_id == wall.id,
        HealthResult.inspection_id < inspection_id
    ).order_by(HealthResult.evaluated_at.asc()).all()

    history = [{"shi_score": ph.shi_score} for ph in prior_healths]

    pred = rul_predictor.predict_rul(
        current_shi=health_result.shi_score,
        previous_shi_history=history,
        building_age_years=building_age
    )

    rul_rec = db.query(RulPrediction).filter(RulPrediction.health_result_id == health_result.id).first()
    if not rul_rec:
        rul_rec = RulPrediction(
            health_result_id=health_result.id,
            wall_id=health_result.wall_id,
            current_shi=pred["current_shi"],
            previous_shi=pred["previous_shi"],
            estimated_rul_years=pred["estimated_rul_years"],
            deterioration_rate=pred["deterioration_rate"],
            deterioration_trend=pred["deterioration_trend"],
            risk_level=pred["risk_level"],
            prediction_model=pred["prediction_model"],
            confidence_score=pred["confidence_score"],
            details_json=json.dumps(pred["details"])
        )
        db.add(rul_rec)
    else:
        rul_rec.current_shi = pred["current_shi"]
        rul_rec.previous_shi = pred["previous_shi"]
        rul_rec.estimated_rul_years = pred["estimated_rul_years"]
        rul_rec.deterioration_rate = pred["deterioration_rate"]
        rul_rec.deterioration_trend = pred["deterioration_trend"]
        rul_rec.risk_level = pred["risk_level"]
        rul_rec.confidence_score = pred["confidence_score"]
        rul_rec.details_json = json.dumps(pred["details"])

    db.commit()
    db.refresh(rul_rec)

    resp = RULResponse.model_validate(rul_rec)
    resp.details = pred["details"]
    return resp

@router.get("/inspection/{inspection_id}", response_model=RULResponse)
def get_inspection_rul(inspection_id: int, db: Session = Depends(get_db)):
    health_result = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
    if not health_result:
        raise HTTPException(status_code=404, detail="Health assessment not found for this inspection")

    rul_rec = db.query(RulPrediction).filter(RulPrediction.health_result_id == health_result.id).first()
    if not rul_rec:
        return predict_inspection_rul(inspection_id, db)

    resp = RULResponse.model_validate(rul_rec)
    if rul_rec.details_json:
        resp.details = json.loads(rul_rec.details_json)
    return resp
