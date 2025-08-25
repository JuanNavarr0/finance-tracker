from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ExpenseCategory(str, enum.Enum):
    # Fixed categories
    HOUSING = "housing"          # Alquiler, hipoteca
    UTILITIES = "utilities"      # Luz, agua, gas, internet
    TRANSPORTATION = "transportation"  # Gasolina, transporte público
    GROCERIES = "groceries"      # Supermercado
    INSURANCE = "insurance"      # Seguros varios
    
    # Variable categories
    FOOD = "food"               # Restaurantes, delivery
    ENTERTAINMENT = "entertainment"  # Cine, conciertos, streaming
    CLOTHING = "clothing"       # Ropa y accesorios
    HEALTH = "health"          # Médico, farmacia, gimnasio
    EDUCATION = "education"    # Cursos, libros
    PERSONAL = "personal"      # Cuidado personal
    GIFTS = "gifts"           # Regalos
    TRAVEL = "travel"         # Viajes, vacaciones
    SHOPPING = "shopping"     # Compras generales
    OTHER = "other"           # Otros

class ExpenseFrequency(str, enum.Enum):
    ONE_TIME = "one_time"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=True)  # Relación opcional con presupuesto
    amount = Column(Float, nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    subcategory = Column(String, nullable=True)  # Subcategoría personalizable
    description = Column(Text, nullable=True)
    vendor = Column(String, nullable=True)  # Nombre del comercio
    frequency = Column(Enum(ExpenseFrequency), default=ExpenseFrequency.ONE_TIME)
    is_recurring = Column(Boolean, default=False)
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    budget = relationship("Budget", back_populates="expenses")