from datetime import datetime

from pydantic import BaseModel, Field


class WallCreate(BaseModel):
    building_id: int
    wall_code: str
    name: str
    orientation: str | None = "North"
    material: str | None = "Concrete"
    surface_area_sqm: float | None = 24.0
    height_m: float | None = 3.0
    width_m: float | None = 8.0

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
    structural_type: str | None = "Reinforced Concrete"
    notes: str | None = None

class BuildingResponse(BaseModel):
    id: int
    user_id: int
    name: str
    address: str
    construction_year: int
    structural_type: str
    notes: str | None = None
    created_at: datetime
    walls: list[WallResponse] = []

    class Config:
        from_attributes = True
