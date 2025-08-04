from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class InvestmentType(str, enum.Enum):
    STOCK = "stock"              # Acciones
    ETF = "etf"                  # ETFs
    MUTUAL_FUND = "mutual_fund"  # Fondos mutuos
    BOND = "bond"                # Bonos
    CRYPTO = "crypto"            # Criptomonedas
    REAL_ESTATE = "real_estate"  # Bienes raíces
    COMMODITY = "commodity"      # Materias primas
    OTHER = "other"              # Otros

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "active"            # Inversión activa
    SOLD = "sold"                # Vendida
    PARTIAL_SOLD = "partial_sold"  # Vendida parcialmente

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic info
    symbol = Column(String, nullable=False)  # e.g., "AAPL", "BTC", "VWCE.DE"
    name = Column(String, nullable=False)    # e.g., "Apple Inc.", "Bitcoin"
    investment_type = Column(Enum(InvestmentType), nullable=False)
    
    # Purchase info
    quantity = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)  # Precio por unidad
    purchase_date = Column(DateTime(timezone=True), nullable=False)
    purchase_fees = Column(Float, default=0.0)     # Comisiones de compra
    
    # Current info (se actualizará periódicamente)
    current_price = Column(Float, nullable=True)
    last_price_update = Column(DateTime(timezone=True), nullable=True)
    
    # Sale info (si aplica)
    sale_quantity = Column(Float, nullable=True)
    sale_price = Column(Float, nullable=True)
    sale_date = Column(DateTime(timezone=True), nullable=True)
    sale_fees = Column(Float, default=0.0)
    
    # Additional info
    platform = Column(String, nullable=True)  # e.g., "Interactive Brokers", "Binance"
    notes = Column(Text, nullable=True)
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.ACTIVE)
    
    # Performance metrics (calculados)
    total_invested = Column(Float, nullable=True)     # quantity * purchase_price + fees
    current_value = Column(Float, nullable=True)      # quantity * current_price
    profit_loss = Column(Float, nullable=True)        # current_value - total_invested
    profit_loss_percentage = Column(Float, nullable=True)  # (profit_loss / total_invested) * 100
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="investments")