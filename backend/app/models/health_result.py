from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class HealthResult(Base):
    __tablename__ = "health_results"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    wall_id = Column(Integer, ForeignKey("walls.id"), nullable=False)
    shi_score = Column(Float, nullable=False, default=100.0)  # 0 to 100
    health_status = Column(String(30), nullable=False, default="HEALTHY")  # HEALTHY (80-100), MODERATE (50-79), CRITICAL (0-49)
    crack_penalty = Column(Float, default=0.0)
    age_penalty = Column(Float, default=0.0)
    env_penalty = Column(Float, default=0.0)
    history_penalty = Column(Float, default=0.0)
    calculation_factors_json = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    inspection = relationship("Inspection", back_populates="health_results")
    wall = relationship("Wall", back_populates="health_results")
    rul_predictions = relationship("RulPrediction", back_populates="health_result", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="health_result")
