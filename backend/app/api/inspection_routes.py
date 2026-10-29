import random
from datetime import datetime, timezone

from app.database import get_db
from app.models.defect import Defect
from app.models.image import Image
from app.models.inspection import Inspection
from app.models.rover import Rover
from app.models.wall import Wall
from app.schemas.inspection import (
    InspectionResponse,
    InspectionStartRequest,
    InspectionStopRequest,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/inspection", tags=["Inspection Lifecycle"])

@router.post("/start", response_model=InspectionResponse)
def start_inspection(payload: InspectionStartRequest, db: Session = Depends(get_db)):
    """
    Initializes a new wall inspection run assigned to a Rover.
    """
    wall = db.query(Wall).filter(Wall.id == payload.wall_id).first()
    if not wall:
        raise HTTPException(status_code=404, detail="Target Wall not found")

    rover = db.query(Rover).filter(Rover.rover_code == payload.rover_code).first()
    if not rover:
        # Create rover if not existing
        rover = Rover(
            rover_code=payload.rover_code or "ROVER-01",
            name="Autonomous Wall Rover",
            status="INSPECTING"
        )
        db.add(rover)
        db.commit()
        db.refresh(rover)
    else:
        rover.status = "INSPECTING"

    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = random.randint(100, 999)
    inspection_code = f"INSP-{date_str}-{random_suffix}"

    inspection = Inspection(
        wall_id=wall.id,
        rover_id=rover.id,
        inspection_code=inspection_code,
        status="IN_PROGRESS",
        start_time=datetime.now(timezone.utc),
        ambient_temp_c=payload.ambient_temp_c or 26.5,
        humidity_pct=payload.humidity_pct or 55.0,
        rover_tilt_deg=1.2,
        vibration_level=0.08,
        notes=payload.notes or f"Inspection initiated on wall {wall.wall_code}"
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    resp = InspectionResponse.model_validate(inspection)
    resp.total_images = 0
    resp.total_defects = 0
    return resp

@router.post("/stop", response_model=InspectionResponse)
def stop_inspection(payload: InspectionStopRequest, db: Session = Depends(get_db)):
    """
    Finalizes an ongoing inspection session.
    """
    inspection = db.query(Inspection).filter(Inspection.id == payload.inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection session not found")

    inspection.status = "COMPLETED"
    inspection.end_time = datetime.now(timezone.utc)
    if payload.notes:
        inspection.notes = (inspection.notes or "") + " | " + payload.notes

    if inspection.rover:
        inspection.rover.status = "CONNECTED"

    db.commit()
    db.refresh(inspection)

    images = db.query(Image).filter(Image.inspection_id == inspection.id).all()
    img_ids = [im.id for im in images]
    defects_count = db.query(Defect).filter(Defect.image_id.in_(img_ids)).count() if img_ids else 0

    resp = InspectionResponse.model_validate(inspection)
    resp.total_images = len(images)
    resp.total_defects = defects_count
    return resp

@router.get("/list", response_model=list[InspectionResponse])
def list_inspections(db: Session = Depends(get_db), limit: int = 50):
    inspections = db.query(Inspection).order_by(Inspection.start_time.desc()).limit(limit).all()
    results = []
    for insp in inspections:
        imgs = db.query(Image).filter(Image.inspection_id == insp.id).all()
        img_ids = [im.id for im in imgs]
        def_count = db.query(Defect).filter(Defect.image_id.in_(img_ids)).count() if img_ids else 0
        r = InspectionResponse.model_validate(insp)
        r.total_images = len(imgs)
        r.total_defects = def_count
        results.append(r)
    return results

@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
    imgs = db.query(Image).filter(Image.inspection_id == insp.id).all()
    img_ids = [im.id for im in imgs]
    def_count = db.query(Defect).filter(Defect.image_id.in_(img_ids)).count() if img_ids else 0
    r = InspectionResponse.model_validate(insp)
    r.total_images = len(imgs)
    r.total_defects = def_count
    return r
