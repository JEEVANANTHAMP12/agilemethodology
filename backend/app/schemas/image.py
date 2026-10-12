from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.defect import DefectResponse

class ImageUploadResponse(BaseModel):
    id: int
    inspection_id: int
    file_name: str
    original_url: str
    processed_url: Optional[str] = None
    timestamp: datetime
    defects_count: int = 0
    primary_severity: Optional[str] = "NONE"

class ImageDetailResponse(BaseModel):
    id: int
    inspection_id: int
    file_name: str
    original_url: str
    processed_url: Optional[str] = None
    timestamp: datetime
    sequence_number: int
    resolution: str
    focal_length_mm: float
    distance_to_wall_mm: float
    calibration_pixel_per_mm: float
    defects: List[DefectResponse] = []

    class Config:
        from_attributes = True
