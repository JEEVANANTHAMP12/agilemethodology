from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    wall_id = Column(Integer, ForeignKey("walls.id"), nullable=False)
    rover_id = Column(Integer, ForeignKey("rovers.id"), nullable=True)
    inspector_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    inspection_code = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(30), default="STARTED")  # STARTED, IN_PROGRESS, COMPLETED, FAILED
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    
    # Environmental / Rover Telemetry
    ambient_temp_c = Column(Float, default=26.5)
    humidity_pct = Column(Float, default=55.0)
    rover_tilt_deg = Column(Float, default=1.2)
    vibration_level = Column(Float, default=0.08)  # g-force or RMS vibration
    notes = Column(Text, nullable=True)

    wall = relationship("Wall", back_populates="inspections")
    rover = relationship("Rover", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    images = relationship("Image", back_populates="inspection", cascade="all, delete-orphan")
    health_results = relationship("HealthResult", back_populates="inspection", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="inspection", cascade="all, delete-orphan")
