from datetime import datetime

from pydantic import BaseModel


class InspectionStartRequest(BaseModel):
    wall_id: int
    rover_code: str | None = "ROVER-01"
    notes: str | None = "Standard crawler wall inspection"
    ambient_temp_c: float | None = 26.5
    humidity_pct: float | None = 55.0

class InspectionStopRequest(BaseModel):
    inspection_id: int
    notes: str | None = "Completed automated scan"

class InspectionResponse(BaseModel):
    id: int
    wall_id: int
    rover_id: int | None
    inspector_user_id: int | None
    inspection_code: str
    status: str
    start_time: datetime
    end_time: datetime | None
    ambient_temp_c: float
    humidity_pct: float
    rover_tilt_deg: float
    vibration_level: float
    notes: str | None
    total_images: int | None = 0
    total_defects: int | None = 0

    class Config:
        from_attributes = True
