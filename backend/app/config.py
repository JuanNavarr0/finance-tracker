from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Finance Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./finance_tracker.db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60  # 30 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    
    # Market Data Settings (actualizado de yfinance a Alpha Vantage)
    ALPHA_VANTAGE_API_KEY: str = ""  # Se carga desde .env
    MARKET_DATA_CACHE_MINUTES: int = 15  # Mantener caché de 15 minutos
    MARKET_DATA_RATE_LIMIT_SECONDS: int = 12  # Alpha Vantage: 5 llamadas por minuto
    
    # File paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    
    # Optional: Scheduled tasks
    ENABLE_SCHEDULED_TASKS: bool = False  # Activar si quieres tareas programadas
    UPDATE_PRICES_SCHEDULE_HOURS: int = 4  # Actualizar precios cada 4 horas
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = "allow"  # Permite campos extra sin error

settings = Settings()

# Create directories if they don't exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Validation
if not settings.ALPHA_VANTAGE_API_KEY and settings.DEBUG:
    print("⚠️  WARNING: ALPHA_VANTAGE_API_KEY not set in .env file")
    print("   Market data features will not work properly.")
    print("   Get your free API key at: https://www.alphavantage.co/support/#api-key")