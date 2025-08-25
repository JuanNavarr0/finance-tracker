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
from app.services.market_data import (
    get_current_price,
    get_quote,
    search_symbol,
    market_data_service,
    update_investment_prices,
    calculate_portfolio_metrics
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/investments",
    tags=["Investments"]
)

def update_investment_prices(investments: List[Investment]) -> List[Investment]:
    """
    Update prices for a list of investments using Alpha Vantage
    """
    for investment in investments:
        if investment.status == InvestmentStatus.ACTIVE:
            try:
                # Get current price from Alpha Vantage
                current_price = get_current_price(investment.symbol)
                
                if current_price:
                    investment.current_price = current_price
                    investment.last_price_update = datetime.now()
                    
                    # Update calculated fields
                    investment.current_value = current_price * investment.quantity
                    investment.profit_loss = investment.current_value - investment.total_invested
                    investment.profit_loss_percentage = (
                        (investment.profit_loss / investment.total_invested * 100) 
                        if investment.total_invested > 0 else 0
                    )
                    logger.info(f"Updated price for {investment.symbol}: ${current_price}")
                else:
                    logger.warning(f"Could not get price for {investment.symbol}")
                    
            except Exception as e:
                logger.error(f"Error updating price for {investment.symbol}: {e}")
                # Keep last known price if update fails
                pass
    
    return investments

def calculate_portfolio_metrics(investments: List[Investment]) -> dict:
    """
    Calculate portfolio performance metrics
    """
    total_invested = sum(inv.total_invested or 0 for inv in investments)
    current_value = sum(inv.current_value or 0 for inv in investments)
    profit_loss = current_value - total_invested
    profit_loss_percentage = (profit_loss / total_invested * 100) if total_invested > 0 else 0
    
    return {
        'total_invested': total_invested,
        'current_value': current_value,
        'profit_loss': profit_loss,
        'profit_loss_percentage': profit_loss_percentage
    }

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
        
        # Add real-time market data if available (from Alpha Vantage)
        if inv.current_price and inv.last_price_update:
            quote_data = get_quote(inv.symbol)
            if quote_data:
                inv_dict['real_time_price'] = quote_data.get('price', inv.current_price)
                inv_dict['day_change'] = quote_data.get('change')
                inv_dict['day_change_percentage'] = quote_data.get('change_percent')
                inv_dict['market_status'] = 'open' if quote_data else 'closed'
        
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
    
    # Add real-time market data from Alpha Vantage
    quote_data = get_quote(investment.symbol)
    if quote_data:
        inv_dict['real_time_price'] = quote_data.get('price')
        inv_dict['day_change'] = quote_data.get('change')
        inv_dict['day_change_percentage'] = quote_data.get('change_percent')
        inv_dict['market_status'] = 'open' if quote_data else 'closed'
    
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
    # Validate symbol exists using Alpha Vantage
    quote_data = get_quote(investment_data.symbol)
    if not quote_data:
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
    
    # Set current price from quote
    if quote_data:
        db_investment.current_price = quote_data.get('price')
        db_investment.last_price_update = datetime.now()
        db_investment.current_value = db_investment.quantity * db_investment.current_price
        db_investment.profit_loss = db_investment.current_value - db_investment.total_invested
        db_investment.profit_loss_percentage = (
            (db_investment.profit_loss / db_investment.total_invested * 100)
            if db_investment.total_invested > 0 else 0
        )
    
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    
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
    
    # Recalculate metrics if quantity or price changed
    if 'quantity' in update_data or 'purchase_price' in update_data:
        investment.total_invested = (
            investment.quantity * investment.purchase_price + 
            investment.purchase_fees
        )
        
        if investment.current_price:
            investment.current_value = investment.quantity * investment.current_price
            investment.profit_loss = investment.current_value - investment.total_invested
            investment.profit_loss_percentage = (
                (investment.profit_loss / investment.total_invested * 100)
                if investment.total_invested > 0 else 0
            )
    
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
    current_user: User = Depends(get_current_active_user)
):
    """
    Search for valid market symbols using Alpha Vantage
    """
    try:
        # Search using Alpha Vantage
        results = search_symbol(query)
        
        if not results:
            # If no results, try getting a direct quote
            quote = get_quote(query.upper())
            if quote:
                return [{
                    'symbol': query.upper(),
                    'name': query.upper(),
                    'current_price': quote.get('price'),
                    'currency': 'USD'
                }]
        
        # Format results for frontend
        formatted_results = []
        for result in results[:5]:  # Limit to 5 results
            # Get current price for each result
            price = get_current_price(result['symbol'])
            formatted_results.append({
                'symbol': result['symbol'],
                'name': result['name'],
                'type': result.get('type', 'Stock'),
                'region': result.get('region', 'US'),
                'currency': result.get('currency', 'USD'),
                'current_price': price
            })
        
        return formatted_results
        
    except Exception as e:
        logger.error(f"Error searching symbols: {e}")
        return []

@router.get("/{investment_id}/history")
def get_investment_history(
    investment_id: int,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get historical price data for an investment
    Note: Alpha Vantage free tier has limited historical data access
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
    
    # For free tier, we'll return simplified data
    # You could implement TIME_SERIES_DAILY from Alpha Vantage here if needed
    current_quote = get_quote(investment.symbol)
    
    if not current_quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron datos para este símbolo"
        )
    
    # Return simplified current data
    return {
        'symbol': investment.symbol,
        'name': investment.name,
        'period': period,
        'current_data': {
            'price': current_quote.get('price'),
            'change': current_quote.get('change'),
            'change_percent': current_quote.get('change_percent'),
            'volume': current_quote.get('volume'),
            'timestamp': current_quote.get('timestamp')
        },
        'message': 'Datos históricos completos disponibles con API key premium'
    }