from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.budget import BudgetCategory, BudgetPeriod

class BudgetBase(BaseModel):
    category: BudgetCategory
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    is_fixed: bool = False
    rollover_enabled: bool = False
    alert_percentage: int = Field(default=80, ge=50, le=100)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[BudgetCategory] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    period: Optional[BudgetPeriod] = None
    is_fixed: Optional[bool] = None
    rollover_enabled: Optional[bool] = None
    alert_percentage: Optional[int] = Field(None, ge=50, le=100)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    rollover_amount: float = 0
    current_spent: float = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Calculated fields
    available: float = 0
    percentage_used: float = 0
    status: str = "under"
    
    class Config:
        from_attributes = True

class BudgetStatsResponse(BaseModel):
    total_budgeted: float
    total_spent: float
    total_available: float
    fixed_expenses: float
    variable_budgets: float
    categories_over_budget: int
    categories_warning: int
    
    class Config:
        from_attributes = True
