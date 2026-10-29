from app.database import get_db
from app.services.report_generator import ReportGenerator
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/reports", tags=["Inspection Reports"])

@router.get("/inspection/{inspection_id}")
def get_inspection_report_json(inspection_id: int, db: Session = Depends(get_db)):
    try:
        report = ReportGenerator.generate_inspection_report(db, inspection_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/inspection/{inspection_id}/html", response_class=HTMLResponse)
def get_inspection_report_html(inspection_id: int, db: Session = Depends(get_db)):
    try:
        report = ReportGenerator.generate_inspection_report(db, inspection_id)
        html_content = ReportGenerator.render_html_report(report)
        return HTMLResponse(content=html_content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
