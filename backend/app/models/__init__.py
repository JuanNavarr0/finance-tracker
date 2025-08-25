# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.income import Income, IncomeType
from app.models.expense import Expense, ExpenseCategory, ExpenseFrequency
from app.models.goal import Goal, GoalStatus, GoalPriority
from app.models.investment import Investment, InvestmentType, InvestmentStatus
from app.models.budget import Budget, BudgetCategory, BudgetPeriod

# This ensures all models are imported when the models package is imported
__all__ = [
    "User",
    "Income", "IncomeType",
    "Expense", "ExpenseCategory", "ExpenseFrequency",
    "Goal", "GoalStatus", "GoalPriority",
    "Investment", "InvestmentType", "InvestmentStatus",
    "Budget", "BudgetCategory", "BudgetPeriod"
]