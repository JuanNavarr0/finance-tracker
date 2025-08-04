from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.models.income import IncomeType

class IncomeBase(BaseModel):
    amount: float
    source: str
    income_type: IncomeType = IncomeType.SALARY
    description: Optional[str] = None
    date: datetime
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor que 0')
        return v

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    source: Optional[str] = None
    income_type: Optional[IncomeType] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('El monto debe ser mayor que 0')
        return v

class IncomeInDBBase(IncomeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Income(IncomeInDBBase):
    pass

# Schema for income statistics
class IncomeStats(BaseModel):
    total_income: float
    monthly_average: float
    income_by_type: dict[str, float]
    income_by_month: list[dict]
    last_income_date: Optional[datetime] = None