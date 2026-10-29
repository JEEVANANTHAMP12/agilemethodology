from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    original_path = Column(String(500), nullable=False)
    processed_path = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sequence_number = Column(Integer, default=1)
    resolution = Column(String(50), default="1280x720")
    focal_length_mm = Column(Float, default=3.6)
    distance_to_wall_mm = Column(Float, default=250.0)  # 250mm standoff distance
    calibration_pixel_per_mm = Column(Float, default=2.5)  # 2.5 pixels = 1 mm

    inspection = relationship("Inspection", back_populates="images")
    defects = relationship("Defect", back_populates="image", cascade="all, delete-orphan")
