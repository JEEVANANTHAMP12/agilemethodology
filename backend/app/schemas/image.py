from datetime import datetime

from app.schemas.defect import DefectResponse
from pydantic import BaseModel


class ImageUploadResponse(BaseModel):
    id: int
    inspection_id: int
    file_name: str
    original_url: str
    processed_url: str | None = None
    timestamp: datetime
    defects_count: int = 0
    primary_severity: str | None = "NONE"

class ImageDetailResponse(BaseModel):
    id: int
    inspection_id: int
    file_name: str
    original_url: str
    processed_url: str | None = None
    timestamp: datetime
    sequence_number: int
    resolution: str
    focal_length_mm: float
    distance_to_wall_mm: float
    calibration_pixel_per_mm: float
    defects: list[DefectResponse] = []

    class Config:
        from_attributes = True
