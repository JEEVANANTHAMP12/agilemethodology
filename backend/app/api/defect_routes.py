
from app.database import get_db
from app.models.defect import Defect
from app.models.image import Image
from app.schemas.defect import DefectResponse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/defects", tags=["Defects & Cracks"])

@router.get("/inspection/{inspection_id}", response_model=list[DefectResponse])
def get_defects_by_inspection(inspection_id: int, db: Session = Depends(get_db)):
    images = db.query(Image).filter(Image.inspection_id == inspection_id).all()
    img_ids = [img.id for img in images]
    if not img_ids:
        return []
    defects = db.query(Defect).filter(Defect.image_id.in_(img_ids)).order_by(Defect.length_mm.desc()).all()
    return defects

@router.get("/{defect_id}", response_model=DefectResponse)
def get_defect(defect_id: int, db: Session = Depends(get_db)):
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect
