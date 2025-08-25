# Import all routers
from . import auth, users, incomes, expenses, goals, investments, dashboard, budgets

# This makes all routers available when importing from app.routers
__all__ = [
    "auth",
    "users", 
    "incomes",
    "expenses",
    "goals",
    "investments",
    "dashboard",
    "budgets"
]