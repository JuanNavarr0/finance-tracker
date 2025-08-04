from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class GoalPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Viaje a Japón 2026"
    description = Column(Text, nullable=True)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(GoalStatus), default=GoalStatus.ACTIVE)
    priority = Column(Enum(GoalPriority), default=GoalPriority.MEDIUM)
    
    # Visual customization
    icon = Column(String, nullable=True)  # Emoji o nombre de icono
    color = Column(String, nullable=True)  # Color hex para UI
    
    # Progress tracking
    monthly_contribution = Column(Float, nullable=True)  # Contribución mensual sugerida
    last_contribution_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="goals")