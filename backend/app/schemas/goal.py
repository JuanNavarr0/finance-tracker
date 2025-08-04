from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.models.goal import GoalStatus, GoalPriority

class GoalBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    target_date: datetime
    priority: GoalPriority = GoalPriority.MEDIUM
    icon: Optional[str] = None
    color: Optional[str] = None
    monthly_contribution: Optional[float] = None
    
    @field_validator('target_amount')
    def target_amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El monto objetivo debe ser mayor que 0')
        return v
    
    @field_validator('color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            raise ValueError('El color debe ser un código hexadecimal (ej: #FF5733)')
        return v

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    status: Optional[GoalStatus] = None
    priority: Optional[GoalPriority] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    monthly_contribution: Optional[float] = None
    
    @field_validator('target_amount')
    def target_amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('El monto objetivo debe ser mayor que 0')
        return v

class GoalContribution(BaseModel):
    amount: float
    
    @field_validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor que 0')
        return v

class GoalInDBBase(GoalBase):
    id: int
    user_id: int
    current_amount: float = 0.0
    status: GoalStatus = GoalStatus.ACTIVE
    last_contribution_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class Goal(GoalInDBBase):
    progress_percentage: float = 0.0
    remaining_amount: float = 0.0
    days_remaining: int = 0
    monthly_contribution_suggested: float = 0.0
    
    @classmethod
    def from_orm_with_calculations(cls, db_goal):
        """Crea una instancia con cálculos adicionales"""
        goal_dict = {
            column.name: getattr(db_goal, column.name) 
            for column in db_goal.__table__.columns
        }
        
        # Calcular progreso
        progress = (db_goal.current_amount / db_goal.target_amount * 100) if db_goal.target_amount > 0 else 0
        goal_dict['progress_percentage'] = round(progress, 2)
        
        # Calcular monto restante
        goal_dict['remaining_amount'] = max(0, db_goal.target_amount - db_goal.current_amount)
        
        # Calcular días restantes
        if db_goal.target_date:
            days_remaining = (db_goal.target_date - datetime.now()).days
            goal_dict['days_remaining'] = max(0, days_remaining)
            
            # Calcular contribución mensual sugerida
            if days_remaining > 0 and goal_dict['remaining_amount'] > 0:
                months_remaining = days_remaining / 30
                goal_dict['monthly_contribution_suggested'] = round(
                    goal_dict['remaining_amount'] / months_remaining, 2
                )
        
        return cls(**goal_dict)