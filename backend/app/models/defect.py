from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    defect_type = Column(String(50), default="CRACK")  # CRACK, SPALLING, VOID
    length_mm = Column(Float, nullable=False, default=0.0)
    max_width_mm = Column(Float, nullable=False, default=0.0)
    avg_width_mm = Column(Float, nullable=False, default=0.0)
    area_sqmm = Column(Float, nullable=False, default=0.0)
    severity = Column(String(30), nullable=False, default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float, nullable=False, default=0.92)  # Confidence score 0.0 - 1.0
    bounding_box_json = Column(Text, nullable=True)  # [x, y, w, h]
    contour_points_json = Column(Text, nullable=True)  # polygon coordinates
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    image = relationship("Image", back_populates="defects")
    alerts = relationship("Alert", back_populates="defect")
