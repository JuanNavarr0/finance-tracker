from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, incomes, expenses, goals, investments, dashboard, budgets
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.recurrence_processor import run_daily_processing


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=run_daily_processing,
    trigger="cron",
    hour=0,
    minute=1,
    id="process_recurring_transactions",
    name="Process recurring transactions",
    replace_existing=True
)
scheduler.start()

# En el shutdown
@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

# Create all tables
Base.metadata.create_all(bind=engine)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(incomes.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(goals.router, prefix=settings.API_V1_STR)
app.include_router(investments.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(budgets.router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "API de gestión de finanzas personales",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }

# API info endpoint
@app.get(f"{settings.API_V1_STR}/info")
def api_info():
    return {
        "version": "1.0",
        "endpoints": {
            "auth": {
                "register": f"{settings.API_V1_STR}/auth/register",
                "login": f"{settings.API_V1_STR}/auth/login",
                "me": f"{settings.API_V1_STR}/auth/me"
            },
            "users": f"{settings.API_V1_STR}/users",
            "incomes": f"{settings.API_V1_STR}/incomes",
            "expenses": f"{settings.API_V1_STR}/expenses",
            "goals": f"{settings.API_V1_STR}/goals",
            "investments": f"{settings.API_V1_STR}/investments",
            "dashboard": f"{settings.API_V1_STR}/dashboard"
        },
        "features": [
            "JWT Authentication",
            "Income tracking",
            "Expense management with categories",
            "Savings goals with progress tracking",
            "Investment portfolio with real-time prices",
            "Comprehensive dashboard with analytics",
            "Multi-user support"
        ]
    }