from datetime import datetime

from pydantic import BaseModel, Field


class RoverConnectRequest(BaseModel):
    rover_code: str = Field(default="ROVER-01", description="Unique rover identifier")
    name: str | None = "ESP32 Autonomous Crawler"
    ip_address: str | None = "192.168.4.1"
    port: int | None = 8080
    firmware_version: str | None = "v2.4.1-ESP32-CAM"

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
    active_inspection_id: int | None = None

    class Config:
        from_attributes = True

class RoverTelemetryUpdate(BaseModel):
    rover_code: str
    battery_percentage: float | None = None
    status: str | None = None
    wifi_signal_dbm: int | None = None
    tilt_deg: float | None = None
    vibration_level: float | None = None
    ambient_temp_c: float | None = None
    humidity_pct: float | None = None
