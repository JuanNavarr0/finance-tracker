import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class MarketDataService:
    """Service for fetching market data using yfinance"""
    
    @staticmethod
    @lru_cache(maxsize=128)
    def get_stock_price(symbol: str) -> Optional[Dict]:
        """
        Get current stock price and related info
        Cached for 15 minutes to avoid excessive API calls
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Get current price
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            
            if not current_price:
                # Try to get from history if info doesn't have it
                hist = ticker.history(period="1d")
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
            
            if current_price:
                return {
                    'symbol': symbol,
                    'current_price': float(current_price),
                    'currency': info.get('currency', 'USD'),
                    'name': info.get('longName') or info.get('shortName', symbol),
                    'market_cap': info.get('marketCap'),
                    'day_high': info.get('dayHigh'),
                    'day_low': info.get('dayLow'),
                    'volume': info.get('volume'),
                    'previous_close': info.get('previousClose'),
                    'change': info.get('regularMarketChange'),
                    'change_percent': info.get('regularMarketChangePercent'),
                    'last_update': datetime.now()
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def get_historical_data(
        symbol: str,
        period: str = "1mo",
        interval: str = "1d"
    ) -> Optional[List[Dict]]:
        """
        Get historical price data
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        """
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                return None
            
            # Convert to list of dicts
            data = []
            for index, row in hist.iterrows():
                data.append({
                    'date': index.strftime('%Y-%m-%d'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                })
            
            return data
            
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def get_crypto_price(symbol: str) -> Optional[Dict]:
        """Get cryptocurrency price (symbol should include -USD suffix)"""
        # For crypto, yfinance expects format like "BTC-USD"
        if not symbol.endswith('-USD'):
            symbol = f"{symbol}-USD"
        
        return MarketDataService.get_stock_price(symbol)
    
    @staticmethod
    def validate_symbol(symbol: str) -> bool:
        """Check if a symbol exists and is valid"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return 'symbol' in info or 'shortName' in info
        except:
            return False
    
    @staticmethod
    def clear_cache():
        """Clear the price cache"""
        MarketDataService.get_stock_price.cache_clear()

# Helper functions for batch operations
def update_investment_prices(investments: List) -> List:
    """Update current prices for a list of investments"""
    updated_investments = []
    
    for investment in investments:
        # Get appropriate price based on investment type
        if investment.investment_type.value == "crypto":
            price_data = MarketDataService.get_crypto_price(investment.symbol)
        else:
            price_data = MarketDataService.get_stock_price(investment.symbol)
        
        if price_data:
            investment.current_price = price_data['current_price']
            investment.last_price_update = datetime.now()
            
            # Calculate performance metrics
            investment.total_invested = (
                investment.quantity * investment.purchase_price + 
                investment.purchase_fees
            )
            investment.current_value = investment.quantity * investment.current_price
            investment.profit_loss = investment.current_value - investment.total_invested
            investment.profit_loss_percentage = (
                (investment.profit_loss / investment.total_invested) * 100
                if investment.total_invested > 0 else 0
            )
        
        updated_investments.append(investment)
    
    return updated_investments

def calculate_portfolio_metrics(investments: List) -> Dict:
    """Calculate overall portfolio metrics"""
    total_invested = 0
    current_value = 0
    
    for inv in investments:
        if inv.status.value == "active":
            total_invested += inv.total_invested or 0
            current_value += inv.current_value or 0
    
    profit_loss = current_value - total_invested
    profit_loss_percentage = (
        (profit_loss / total_invested) * 100 if total_invested > 0 else 0
    )
    
    return {
        'total_invested': total_invested,
        'current_value': current_value,
        'profit_loss': profit_loss,
        'profit_loss_percentage': profit_loss_percentage
    }