from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    construction_year = Column(Integer, nullable=False, default=2010)
    structural_type = Column(String(50), default="Reinforced Concrete")  # Masonry, Steel, RC
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="buildings")
    walls = relationship("Wall", back_populates="building", cascade="all, delete-orphan")
