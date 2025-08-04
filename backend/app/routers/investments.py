from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database import get_db
from app.models.user import User
from app.models.investment import Investment, InvestmentType, InvestmentStatus
from app.schemas.investment import (
    Investment as InvestmentSchema,
    InvestmentCreate,
    InvestmentUpdate,
    InvestmentSale,
    PortfolioSummary,
    InvestmentWithMarketData
)
from app.utils.auth import get_current_active_user
from app.utils.market_data import (
    MarketDataService,
    update_investment_prices,
    calculate_portfolio_metrics
)

router = APIRouter(
    prefix="/investments",
    tags=["Investments"]
)

@router.get("/", response_model=List[InvestmentWithMarketData])
def get_investments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    investment_type: Optional[InvestmentType] = None,
    status: Optional[InvestmentStatus] = None,
    platform: Optional[str] = None,
    update_prices: bool = Query(True, description="Update current prices from market"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all investments for current user with optional real-time prices
    """
    query = db.query(Investment).filter(Investment.user_id == current_user.id)
    
    # Apply filters
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    
    if status:
        query = query.filter(Investment.status == status)
    
    if platform:
        query = query.filter(Investment.platform.ilike(f"%{platform}%"))
    
    # Order by purchase date descending
    investments = query.order_by(Investment.purchase_date.desc()).offset(skip).limit(limit).all()
    
    # Update prices if requested
    if update_prices:
        investments = update_investment_prices(investments)
        # Save updated prices to database
        db.commit()
    
    # Convert to schema with market data
    result = []
    for inv in investments:
        inv_dict = {
            column.name: getattr(inv, column.name) 
            for column in inv.__table__.columns
        }
        
        # Add real-time market data if available
        if inv.current_price and inv.last_price_update:
            market_data = MarketDataService.get_stock_price(inv.symbol)
            if market_data:
                inv_dict['real_time_price'] = market_data['current_price']
                inv_dict['day_change'] = market_data.get('change')
                inv_dict['day_change_percentage'] = market_data.get('change_percent')
                inv_dict['market_status'] = 'open'  # Simplified
        
        result.append(InvestmentWithMarketData(**inv_dict))
    
    return result

@router.get("/portfolio/summary", response_model=PortfolioSummary)
def get_portfolio_summary(
    update_prices: bool = Query(True, description="Update current prices from market"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get portfolio summary with performance metrics
    """
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.ACTIVE
    ).all()
    
    if not investments:
        return PortfolioSummary(
            total_invested=0,
            current_value=0,
            total_profit_loss=0,
            total_profit_loss_percentage=0,
            investments_count=0,
            investments_by_type={},
            top_performers=[],
            worst_performers=[]
        )
    
    # Update prices if requested
    if update_prices:
        investments = update_investment_prices(investments)
        db.commit()
    
    # Calculate portfolio metrics
    metrics = calculate_portfolio_metrics(investments)
    
    # Group by type
    investments_by_type = {}
    for inv in investments:
        type_key = inv.investment_type.value
        if type_key not in investments_by_type:
            investments_by_type[type_key] = {
                'count': 0,
                'value': 0,
                'invested': 0
            }
        
        investments_by_type[type_key]['count'] += 1
        investments_by_type[type_key]['value'] += inv.current_value or 0
        investments_by_type[type_key]['invested'] += inv.total_invested or 0
    
    # Calculate percentages
    for type_data in investments_by_type.values():
        type_data['percentage'] = round(
            (type_data['value'] / metrics['current_value'] * 100), 2
        ) if metrics['current_value'] > 0 else 0
    
    # Get top and worst performers
    active_investments = [inv for inv in investments if inv.profit_loss_percentage is not None]
    sorted_by_performance = sorted(
        active_investments,
        key=lambda x: x.profit_loss_percentage,
        reverse=True
    )
    
    top_performers = [
        {
            'id': inv.id,
            'symbol': inv.symbol,
            'name': inv.name,
            'profit_loss_percentage': round(inv.profit_loss_percentage, 2),
            'profit_loss': round(inv.profit_loss, 2)
        }
        for inv in sorted_by_performance[:5]
        if inv.profit_loss_percentage > 0
    ]
    
    worst_performers = [
        {
            'id': inv.id,
            'symbol': inv.symbol,
            'name': inv.name,
            'profit_loss_percentage': round(inv.profit_loss_percentage, 2),
            'profit_loss': round(inv.profit_loss, 2)
        }
        for inv in sorted_by_performance[-5:]
        if inv.profit_loss_percentage < 0
    ]
    
    return PortfolioSummary(
        total_invested=metrics['total_invested'],
        current_value=metrics['current_value'],
        total_profit_loss=metrics['profit_loss'],
        total_profit_loss_percentage=metrics['profit_loss_percentage'],
        investments_count=len(investments),
        investments_by_type=investments_by_type,
        top_performers=top_performers,
        worst_performers=worst_performers
    )

@router.get("/{investment_id}", response_model=InvestmentWithMarketData)
def get_investment(
    investment_id: int,
    update_price: bool = Query(True, description="Update current price from market"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get specific investment by ID with market data
    """
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inversión no encontrada"
        )
    
    # Update price if requested
    if update_price:
        investments = update_investment_prices([investment])
        investment = investments[0]
        db.commit()
    
    # Convert to schema with market data
    inv_dict = {
        column.name: getattr(investment, column.name) 
        for column in investment.__table__.columns
    }
    
    # Add real-time market data
    market_data = MarketDataService.get_stock_price(investment.symbol)
    if market_data:
        inv_dict['real_time_price'] = market_data['current_price']
        inv_dict['day_change'] = market_data.get('change')
        inv_dict['day_change_percentage'] = market_data.get('change_percent')
        inv_dict['market_status'] = 'open'
    
    return InvestmentWithMarketData(**inv_dict)

@router.post("/", response_model=InvestmentSchema)
def create_investment(
    investment_data: InvestmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create new investment entry
    """
    # Validate symbol exists
    if investment_data.investment_type == InvestmentType.CRYPTO:
        symbol_to_check = f"{investment_data.symbol}-USD"
    else:
        symbol_to_check = investment_data.symbol
    
    if not MarketDataService.validate_symbol(symbol_to_check):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Símbolo '{investment_data.symbol}' no válido o no encontrado"
        )
    
    # Create investment
    db_investment = Investment(
        **investment_data.model_dump(),
        user_id=current_user.id,
        status=InvestmentStatus.ACTIVE
    )
    
    # Calculate initial metrics
    db_investment.total_invested = (
        db_investment.quantity * db_investment.purchase_price + 
        db_investment.purchase_fees
    )
    
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    
    # Update price in background
    background_tasks.add_task(
        update_single_investment_price,
        db_investment.id,
        db_investment.symbol,
        db_investment.investment_type
    )
    
    return db_investment

@router.put("/{investment_id}", response_model=InvestmentSchema)
def update_investment(
    investment_id: int,
    investment_update: InvestmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update investment details (not for recording sales)
    """
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inversión no encontrada"
        )
    
    # Update fields
    update_data = investment_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(investment, field, value)
    
    db.commit()
    db.refresh(investment)
    
    return investment

@router.post("/{investment_id}/sell", response_model=InvestmentSchema)
def sell_investment(
    investment_id: int,
    sale_data: InvestmentSale,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Record sale of investment (partial or complete)
    """
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inversión no encontrada"
        )
    
    if investment.status == InvestmentStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta inversión ya fue vendida completamente"
        )
    
    # Validate quantity
    remaining_quantity = investment.quantity - (investment.sale_quantity or 0)
    if sale_data.quantity > remaining_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo tienes {remaining_quantity} unidades disponibles para vender"
        )
    
    # Update sale information
    investment.sale_quantity = (investment.sale_quantity or 0) + sale_data.quantity
    investment.sale_price = sale_data.sale_price
    investment.sale_date = datetime.now()
    investment.sale_fees = (investment.sale_fees or 0) + sale_data.sale_fees
    
    # Update status
    if investment.sale_quantity >= investment.quantity:
        investment.status = InvestmentStatus.SOLD
    else:
        investment.status = InvestmentStatus.PARTIAL_SOLD
    
    # Recalculate metrics
    total_sale_amount = sale_data.quantity * sale_data.sale_price - sale_data.sale_fees
    partial_investment = (investment.total_invested / investment.quantity) * sale_data.quantity
    sale_profit = total_sale_amount - partial_investment
    
    db.commit()
    db.refresh(investment)
    
    return investment

@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete investment entry
    """
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inversión no encontrada"
        )
    
    db.delete(investment)
    db.commit()
    
    return {"detail": "Inversión eliminada exitosamente"}

@router.get("/market/search")
def search_market_symbols(
    query: str = Query(..., min_length=1),
    investment_type: InvestmentType = Query(InvestmentType.STOCK),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for valid market symbols (for autocomplete)
    """
    # This is a simplified version - in production you'd want a proper symbol search API
    # For now, just validate if the symbol exists
    if investment_type == InvestmentType.CRYPTO:
        symbol = f"{query.upper()}-USD"
    else:
        symbol = query.upper()
    
    is_valid = MarketDataService.validate_symbol(symbol)
    
    if is_valid:
        price_data = MarketDataService.get_stock_price(symbol)
        if price_data:
            return [{
                'symbol': query.upper(),
                'name': price_data.get('name', query.upper()),
                'current_price': price_data.get('current_price'),
                'currency': price_data.get('currency', 'USD')
            }]
    
    return []

@router.get("/{investment_id}/history")
def get_investment_history(
    investment_id: int,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$"),
    interval: str = Query("1d", regex="^(1d|1wk|1mo)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get historical price data for an investment
    """
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inversión no encontrada"
        )
    
    # Get historical data
    if investment.investment_type == InvestmentType.CRYPTO:
        symbol = f"{investment.symbol}-USD"
    else:
        symbol = investment.symbol
    
    history = MarketDataService.get_historical_data(symbol, period, interval)
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron datos históricos para este símbolo"
        )
    
    return {
        'symbol': investment.symbol,
        'name': investment.name,
        'period': period,
        'interval': interval,
        'data': history
    }

# Background task helper
def update_single_investment_price(investment_id: int, symbol: str, investment_type: InvestmentType):
    """Background task to update investment price"""
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        investment = db.query(Investment).filter(Investment.id == investment_id).first()
        
        if investment:
            if investment_type == InvestmentType.CRYPTO:
                price_data = MarketDataService.get_crypto_price(symbol)
            else:
                price_data = MarketDataService.get_stock_price(symbol)
            
            if price_data:
                investment.current_price = price_data['current_price']
                investment.last_price_update = datetime.now()
                
                # Update metrics
                investment.current_value = investment.quantity * investment.current_price
                investment.profit_loss = investment.current_value - investment.total_invested
                investment.profit_loss_percentage = (
                    (investment.profit_loss / investment.total_invested) * 100
                    if investment.total_invested > 0 else 0
                )
                
                db.commit()
        
        db.close()
    except Exception as e:
        print(f"Error updating investment price: {e}")