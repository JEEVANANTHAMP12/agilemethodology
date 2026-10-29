from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SHIEvaluateRequest(BaseModel):
    inspection_id: int
    force_recalculate: bool | None = False

class SHIResponse(BaseModel):
    id: int
    inspection_id: int
    wall_id: int
    shi_score: float
    health_status: str  # HEALTHY, MODERATE, CRITICAL
    crack_penalty: float
    age_penalty: float
    env_penalty: float
    history_penalty: float
    calculation_factors: dict[str, Any] | None = None
    evaluated_at: datetime

    class Config:
        from_attributes = True
