from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.models.expense import ExpenseCategory, ExpenseFrequency

class ExpenseBase(BaseModel):
    amount: float
    category: ExpenseCategory
    subcategory: Optional[str] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    frequency: ExpenseFrequency = ExpenseFrequency.ONE_TIME
    is_recurring: bool = False
    date: datetime
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor que 0')
        return v

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[ExpenseCategory] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    frequency: Optional[ExpenseFrequency] = None
    is_recurring: Optional[bool] = None
    date: Optional[datetime] = None
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('El monto debe ser mayor que 0')
        return v

class ExpenseInDBBase(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Expense(ExpenseInDBBase):
    pass

# Schema for expense statistics
class ExpenseStats(BaseModel):
    total_expenses: float
    monthly_average: float
    expenses_by_category: dict[str, float]
    expenses_by_month: list[dict]
    top_vendors: list[dict]
    recurring_expenses_total: float
    fixed_expenses: float  # Gastos fijos mensuales
    variable_expenses: float  # Gastos variables mensuales