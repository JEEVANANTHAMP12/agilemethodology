from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DefectResponse(BaseModel):
    id: int
    image_id: int
    defect_type: str
    length_mm: float
    max_width_mm: float
    avg_width_mm: float
    area_sqmm: float
    severity: str  # LOW, MODERATE, HIGH, CRITICAL
    confidence: float
    bounding_box: Any | None = None
    detected_at: datetime

    class Config:
        from_attributes = True

class CrackDetectionResult(BaseModel):
    crack_detected: bool
    total_cracks: int
    primary_length_mm: float
    primary_width_mm: float
    severity: str
    confidence_percentage: float
    defects: list[DefectResponse] = []
    annotated_image_url: str | None = None
