from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class FinancialSummary(BaseModel):
    """Resumen financiero general"""
    total_income: float
    total_expenses: float
    net_balance: float
    savings_rate: float  # Porcentaje de ahorro
    
class MonthlyOverview(BaseModel):
    """Vista general del mes actual"""
    month: str
    year: int
    income: float
    expenses: float
    balance: float
    
class CashFlow(BaseModel):
    """Flujo de caja por período"""
    date: str  # "2024-01" for monthly, "2024-01-15" for daily
    income: float
    expenses: float
    net_flow: float
    cumulative_balance: float

class CategoryBreakdown(BaseModel):
    """Desglose por categoría"""
    category: str
    amount: float
    percentage: float
    count: int  # Número de transacciones
    
class GoalsSummary(BaseModel):
    """Resumen de objetivos"""
    total_goals: int
    active_goals: int
    completed_goals: int
    total_target_amount: float
    total_saved_amount: float
    overall_progress: float
    
class InvestmentsSummary(BaseModel):
    """Resumen de inversiones"""
    total_invested: float
    current_value: float
    total_return: float
    return_percentage: float
    best_performer: Optional[Dict] = None
    worst_performer: Optional[Dict] = None

class RecentTransaction(BaseModel):
    """Transacción reciente (ingreso o gasto)"""
    id: int
    type: str  # "income" o "expense"
    amount: float
    description: str
    category: str
    date: datetime
    
class DashboardData(BaseModel):
    """Datos completos del dashboard"""
    # Resúmenes principales
    financial_summary: FinancialSummary
    monthly_overview: MonthlyOverview
    
    # Flujo de caja (últimos 6 meses)
    cash_flow: List[CashFlow]
    
    # Desgloses
    income_by_type: List[CategoryBreakdown]
    expenses_by_category: List[CategoryBreakdown]
    
    # Objetivos e inversiones
    goals_summary: GoalsSummary
    investments_summary: InvestmentsSummary
    
    # Transacciones recientes
    recent_transactions: List[RecentTransaction]
    
    # Métricas adicionales
    average_daily_expense: float
    days_until_month_end: int
    projected_month_end_balance: float
    
    # Alertas/Notificaciones
    alerts: List[Dict]  # e.g., "Has excedido tu presupuesto de restaurantes"