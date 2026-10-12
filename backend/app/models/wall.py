from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Wall(Base):
    __tablename__ = "walls"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    wall_code = Column(String(50), nullable=False)  # e.g. "WALL-N-01"
    name = Column(String(100), nullable=False)
    orientation = Column(String(20), default="North")  # North, South, East, West, Interior
    material = Column(String(50), default="Concrete")
    surface_area_sqm = Column(Float, default=24.0)
    height_m = Column(Float, default=3.0)
    width_m = Column(Float, default=8.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    building = relationship("Building", back_populates="walls")
    inspections = relationship("Inspection", back_populates="wall", cascade="all, delete-orphan")
    health_results = relationship("HealthResult", back_populates="wall")
    rul_predictions = relationship("RulPrediction", back_populates="wall")
