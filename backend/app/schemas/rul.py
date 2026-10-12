from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class RULPredictRequest(BaseModel):
    inspection_id: int

class RULResponse(BaseModel):
    id: int
    health_result_id: int
    wall_id: int
    current_shi: float
    previous_shi: Optional[float] = None
    estimated_rul_years: float
    deterioration_rate: float
    deterioration_trend: str  # Stable, Increasing, Accelerating
    risk_level: str           # Low, Moderate, High, Critical
    prediction_model: str
    confidence_score: float
    details: Optional[Dict[str, Any]] = None
    predicted_at: datetime

    class Config:
        from_attributes = True
