from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship


class Rover(Base):
    __tablename__ = "rovers"

    id = Column(Integer, primary_key=True, index=True)
    rover_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "ROVER-01"
    name = Column(String(100), nullable=False)
    ip_address = Column(String(50), default="192.168.4.1")
    port = Column(Integer, default=8080)
    battery_percentage = Column(Float, default=95.0)
    status = Column(String(30), default="CONNECTED")  # DISCONNECTED, CONNECTED, INSPECTING, IDLE, CHARGING
    wifi_signal_dbm = Column(Integer, default=-58)  # Wi-Fi signal strength
    firmware_version = Column(String(30), default="v2.4.1-ESP32-CAM")
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    inspections = relationship("Inspection", back_populates="rover")
