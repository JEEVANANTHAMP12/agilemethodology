from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RulPrediction(Base):
    __tablename__ = "rul_predictions"

    id = Column(Integer, primary_key=True, index=True)
    health_result_id = Column(Integer, ForeignKey("health_results.id"), nullable=False)
    wall_id = Column(Integer, ForeignKey("walls.id"), nullable=False)
    current_shi = Column(Float, nullable=False)
    previous_shi = Column(Float, nullable=True)
    estimated_rul_years = Column(Float, nullable=False)  # e.g. 14.5 Years
    deterioration_rate = Column(Float, default=1.8)     # SHI drop per year
    deterioration_trend = Column(String(30), default="Increasing")  # Stable, Increasing, Accelerating
    risk_level = Column(String(30), default="Moderate")  # Low, Moderate, High, Critical
    prediction_model = Column(String(50), default="Linear-Trend-Extrapolation-v1")
    confidence_score = Column(Float, default=0.88)
    details_json = Column(Text, nullable=True)
    predicted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    health_result = relationship("HealthResult", back_populates="rul_predictions")
    wall = relationship("Wall", back_populates="rul_predictions")
    alerts = relationship("Alert", back_populates="rul_prediction")
