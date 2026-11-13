from datetime import datetime, timezone

from app.database import get_db
from app.models.inspection import Inspection
from app.models.rover import Rover
from app.schemas.rover import (
    RoverConnectRequest,
    RoverStatusResponse,
    RoverTelemetryUpdate,
)
from app.services.rover_service import RoverService
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/rover", tags=["Rover Integration"])

@router.post("/connect", response_model=RoverStatusResponse)
def connect_rover(payload: RoverConnectRequest, db: Session = Depends(get_db)):
    """
    Registers or updates connection status of ESP32 Rover crawler over Wi-Fi.
    """
    rover = RoverService.connect_rover(
        db,
        rover_code=payload.rover_code,
        ip_address=payload.ip_address,
        port=payload.port,
        name=payload.name
    )
    
    # Check if there is an active inspection running
    active_insp = db.query(Inspection).filter(
        Inspection.rover_id == rover.id,
        Inspection.status.in_(["STARTED", "IN_PROGRESS"])
    ).first()

    resp = RoverStatusResponse.model_validate(rover)
    resp.active_inspection_id = active_insp.id if active_insp else None
    return resp

@router.get("/status", response_model=RoverStatusResponse)
def get_rover_status(rover_code: str = "ROVER-01", db: Session = Depends(get_db)):
    """
    Returns live connection, battery, Wi-Fi RSSI and operational status of Rover.
    """
    rover = RoverService.get_status(db, rover_code)
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")
    active_insp = db.query(Inspection).filter(
        Inspection.rover_id == rover.id,
        Inspection.status.in_(["STARTED", "IN_PROGRESS"])
    ).first()

    resp = RoverStatusResponse.model_validate(rover)
    resp.active_inspection_id = active_insp.id if active_insp else None
    return resp

@router.post("/telemetry")
def update_telemetry(data: RoverTelemetryUpdate, db: Session = Depends(get_db)):
    rover = db.query(Rover).filter(Rover.rover_code == data.rover_code).first()
    if not rover:
        raise HTTPException(status_code=404, detail="Rover not found")
        
    if data.battery_percentage is not None:
        rover.battery_percentage = data.battery_percentage
    if data.status:
        rover.status = data.status
    if data.wifi_signal_dbm is not None:
        rover.wifi_signal_dbm = data.wifi_signal_dbm
        
    rover.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rover)

    # Relay telemetry packet to Scala reactive stream engine
    try:
        from app.config import settings
        import httpx
        sample = {
            "roverCode": rover.rover_code,
            "batteryPercentage": rover.battery_percentage,
            "wifiSignalDbm": rover.wifi_signal_dbm or -54,
            "ambientTempC": 26.5,
            "humidityPct": 54.0,
            "roverTiltDeg": 1.2,
            "vibrationLevel": 0.08,
            "standoffDistanceMm": 250.0
        }
        with httpx.Client(timeout=0.5) as client:
            client.post(f"{settings.SCALA_TELEMETRY_URL}/api/v1/telemetry/ingest", json=sample)
    except Exception:
        pass

    return {"message": "Telemetry updated", "rover_code": rover.rover_code}
