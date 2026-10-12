from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class RoverConnectRequest(BaseModel):
    rover_code: str = Field(default="ROVER-01", description="Unique rover identifier")
    name: Optional[str] = "ESP32 Autonomous Crawler"
    ip_address: Optional[str] = "192.168.4.1"
    port: Optional[int] = 8080
    firmware_version: Optional[str] = "v2.4.1-ESP32-CAM"

class RoverStatusResponse(BaseModel):
    id: int
    rover_code: str
    name: str
    ip_address: str
    port: int
    battery_percentage: float
    status: str  # CONNECTED, DISCONNECTED, INSPECTING, IDLE, CHARGING
    wifi_signal_dbm: int
    firmware_version: str
    last_seen_at: datetime
    active_inspection_id: Optional[int] = None

    class Config:
        from_attributes = True

class RoverTelemetryUpdate(BaseModel):
    rover_code: str
    battery_percentage: Optional[float] = None
    status: Optional[str] = None
    wifi_signal_dbm: Optional[int] = None
    tilt_deg: Optional[float] = None
    vibration_level: Optional[float] = None
    ambient_temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
