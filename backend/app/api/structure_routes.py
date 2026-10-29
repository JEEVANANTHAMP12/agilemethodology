
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.building import Building
from app.models.user import User
from app.models.wall import Wall
from app.schemas.structure import (
    BuildingCreate,
    BuildingResponse,
    WallCreate,
    WallResponse,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/structures", tags=["Buildings & Walls"])

@router.get("/buildings", response_model=list[BuildingResponse])
def get_buildings(db: Session = Depends(get_db)):
    return db.query(Building).all()

@router.post("/buildings", response_model=BuildingResponse)
def create_building(
    payload: BuildingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = Building(
        user_id=current_user.id,
        name=payload.name,
        address=payload.address,
        construction_year=payload.construction_year,
        structural_type=payload.structural_type or "Reinforced Concrete",
        notes=payload.notes
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.get("/walls", response_model=list[WallResponse])
def get_walls(building_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Wall)
    if building_id:
        q = q.filter(Wall.building_id == building_id)
    return q.all()

@router.post("/walls", response_model=WallResponse)
def create_wall(payload: WallCreate, db: Session = Depends(get_db)):
    building = db.query(Building).filter(Building.id == payload.building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Parent Building not found")

    w = Wall(
        building_id=payload.building_id,
        wall_code=payload.wall_code,
        name=payload.name,
        orientation=payload.orientation or "North",
        material=payload.material or "Concrete",
        surface_area_sqm=payload.surface_area_sqm or 24.0,
        height_m=payload.height_m or 3.0,
        width_m=payload.width_m or 8.0
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w
