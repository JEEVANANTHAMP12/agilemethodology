from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AlertResponse(BaseModel):
    id: int
    inspection_id: Optional[int]
    defect_id: Optional[int]
    health_result_id: Optional[int]
    rul_prediction_id: Optional[int]
    alert_type: str
    severity: str
    title: str
    message: str
    is_acknowledged: bool
    acknowledged_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAckRequest(BaseModel):
    alert_id: int
