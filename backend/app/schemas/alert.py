from datetime import datetime

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    inspection_id: int | None
    defect_id: int | None
    health_result_id: int | None
    rul_prediction_id: int | None
    alert_type: str
    severity: str
    title: str
    message: str
    is_acknowledged: bool
    acknowledged_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAckRequest(BaseModel):
    alert_id: int
