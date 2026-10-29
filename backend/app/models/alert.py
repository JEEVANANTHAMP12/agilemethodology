from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    defect_id = Column(Integer, ForeignKey("defects.id"), nullable=True)
    health_result_id = Column(Integer, ForeignKey("health_results.id"), nullable=True)
    rul_prediction_id = Column(Integer, ForeignKey("rul_predictions.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # CRITICAL_CRACK, HEALTH_WARNING, MAINTENANCE_RECOMMENDATION, ROVER_DISCONNECT
    severity = Column(String(30), nullable=False, default="WARNING")  # INFO, WARNING, CRITICAL
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    inspection = relationship("Inspection", back_populates="alerts")
    defect = relationship("Defect", back_populates="alerts")
    health_result = relationship("HealthResult", back_populates="alerts")
    rul_prediction = relationship("RulPrediction", back_populates="alerts")
