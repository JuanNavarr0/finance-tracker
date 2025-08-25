from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class BudgetCategory(str, enum.Enum):
    HOUSING = "housing"
    UTILITIES = "utilities"
    INSURANCE = "insurance"
    SUBSCRIPTIONS = "subscriptions"
    FOOD = "food"
    GROCERIES = "groceries"
    TRANSPORTATION = "transportation"
    ENTERTAINMENT = "entertainment"
    CLOTHING = "clothing"
    HEALTH = "health"
    PERSONAL = "personal"
    SHOPPING = "shopping"
    OTHER = "other"

class BudgetPeriod(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(Enum(BudgetCategory), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(Enum(BudgetPeriod), default=BudgetPeriod.MONTHLY)
    is_fixed = Column(Boolean, default=False)
    rollover_enabled = Column(Boolean, default=False)
    rollover_amount = Column(Float, default=0)
    current_spent = Column(Float, default=0)
    alert_percentage = Column(Integer, default=80)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    expenses = relationship("Expense", back_populates="budget")