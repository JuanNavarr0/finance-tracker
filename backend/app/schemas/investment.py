from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from ..models.investment import InvestmentType, InvestmentStatus

class InvestmentBase(BaseModel):
    symbol: str
    name: str
    investment_type: InvestmentType
    quantity: float
    purchase_price: float
    purchase_date: datetime
    purchase_fees: float = 0.0
    platform: Optional[str] = None
    notes: Optional[str] = None
    
    @field_validator('quantity', 'purchase_price')
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El valor debe ser mayor que 0')
        return v
    
    @field_validator('purchase_fees')
    def fees_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Las comisiones no pueden ser negativas')
        return v

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    investment_type: Optional[InvestmentType] = None
    platform: Optional[str] = None
    notes: Optional[str] = None

class InvestmentSale(BaseModel):
    quantity: float
    sale_price: float
    sale_fees: float = 0.0
    
    @field_validator('quantity', 'sale_price')
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El valor debe ser mayor que 0')
        return v

class InvestmentInDBBase(InvestmentBase):
    id: int
    user_id: int
    current_price: Optional[float] = None
    last_price_update: Optional[datetime] = None
    sale_quantity: Optional[float] = None
    sale_price: Optional[float] = None
    sale_date: Optional[datetime] = None
    sale_fees: float = 0.0
    status: InvestmentStatus = InvestmentStatus.ACTIVE
    total_invested: Optional[float] = None
    current_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_percentage: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Investment(InvestmentInDBBase):
    pass

# Schema for portfolio summary
class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    total_profit_loss: float
    total_profit_loss_percentage: float
    investments_count: int
    investments_by_type: dict[str, dict]  # type -> {count, value, percentage}
    top_performers: list[dict]
    worst_performers: list[dict]

# Schema for investment with real-time data
class InvestmentWithMarketData(Investment):
    real_time_price: Optional[float] = None
    day_change: Optional[float] = None
    day_change_percentage: Optional[float] = None
    market_status: Optional[str] = None  # "open", "closed", "pre-market", etc.