from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class IncomeType(str, enum.Enum):
    SALARY = "salary"
    FREELANCE = "freelance"
    INVESTMENT = "investment"
    RENTAL = "rental"
    BUSINESS = "business"
    GIFT = "gift"
    OTHER = "other"

class Income(Base):
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # e.g., "Empresa XYZ", "Cliente ABC"
    income_type = Column(Enum(IncomeType), default=IncomeType.SALARY)
    description = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="incomes")