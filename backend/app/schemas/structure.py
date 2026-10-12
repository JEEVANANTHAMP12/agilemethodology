from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WallCreate(BaseModel):
    building_id: int
    wall_code: str
    name: str
    orientation: Optional[str] = "North"
    material: Optional[str] = "Concrete"
    surface_area_sqm: Optional[float] = 24.0
    height_m: Optional[float] = 3.0
    width_m: Optional[float] = 8.0

class WallResponse(BaseModel):
    id: int
    building_id: int
    wall_code: str
    name: str
    orientation: str
    material: str
    surface_area_sqm: float
    height_m: float
    width_m: float
    created_at: datetime

    class Config:
        from_attributes = True

class BuildingCreate(BaseModel):
    name: str
    address: str
    construction_year: int = Field(default=2010, ge=1800, le=2050)
    structural_type: Optional[str] = "Reinforced Concrete"
    notes: Optional[str] = None

class BuildingResponse(BaseModel):
    id: int
    user_id: int
    name: str
    address: str
    construction_year: int
    structural_type: str
    notes: Optional[str] = None
    created_at: datetime
    walls: List[WallResponse] = []

    class Config:
        from_attributes = True
