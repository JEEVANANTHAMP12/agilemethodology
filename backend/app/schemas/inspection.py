from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class InspectionStartRequest(BaseModel):
    wall_id: int
    rover_code: Optional[str] = "ROVER-01"
    notes: Optional[str] = "Standard crawler wall inspection"
    ambient_temp_c: Optional[float] = 26.5
    humidity_pct: Optional[float] = 55.0

class InspectionStopRequest(BaseModel):
    inspection_id: int
    notes: Optional[str] = "Completed automated scan"

class InspectionResponse(BaseModel):
    id: int
    wall_id: int
    rover_id: Optional[int]
    inspector_user_id: Optional[int]
    inspection_code: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    ambient_temp_c: float
    humidity_pct: float
    rover_tilt_deg: float
    vibration_level: float
    notes: Optional[str]
    total_images: Optional[int] = 0
    total_defects: Optional[int] = 0

    class Config:
        from_attributes = True
