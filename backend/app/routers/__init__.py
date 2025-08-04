# Import all routers
from app.routers import auth, users, incomes, expenses, goals, investments, dashboard

# This makes all routers available when importing from app.routers
__all__ = [
    "auth",
    "users", 
    "incomes",
    "expenses",
    "goals",
    "investments",
    "dashboard"
]