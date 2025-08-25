import requests
import logging
from typing import Optional, Dict, List
from datetime import datetime
from functools import lru_cache
from app.config import settings

logger = logging.getLogger(__name__)

class AlphaVantageService:
    """Service for fetching market data using Alpha Vantage API"""
    
    BASE_URL = "https://www.alphavantage.co/query"
    
    @staticmethod
    @lru_cache(maxsize=128)
    def get_quote(symbol: str) -> Optional[Dict]:
        """
        Get real-time quote for a symbol using Alpha Vantage GLOBAL_QUOTE
        """
        if not settings.ALPHA_VANTAGE_API_KEY:
            logger.warning("Alpha Vantage API key not configured")
            return None
            
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': settings.ALPHA_VANTAGE_API_KEY
            }
            
            response = requests.get(AlphaVantageService.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'Global Quote' in data:
                quote = data['Global Quote']
                return {
                    'symbol': quote.get('01. symbol', symbol),
                    'price': float(quote.get('05. price', 0)),
                    'change': float(quote.get('09. change', 0)),
                    'change_percent': quote.get('10. change percent', '0%').replace('%', ''),
                    'volume': int(quote.get('06. volume', 0)),
                    'previous_close': float(quote.get('08. previous close', 0)),
                    'timestamp': datetime.now().isoformat()
                }
            elif 'Error Message' in data:
                logger.error(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                return None
            elif 'Note' in data:
                logger.warning(f"Alpha Vantage rate limit for {symbol}: {data['Note']}")
                return None
            else:
                logger.warning(f"Unexpected response format for {symbol}: {data}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Network error fetching quote for {symbol}: {e}")
            return None
        except (ValueError, KeyError) as e:
            logger.error(f"Data parsing error for {symbol}: {e}")
            return None
    
    @staticmethod
    def search_symbol(query: str) -> List[Dict]:
        """
        Search for symbols using Alpha Vantage SYMBOL_SEARCH
        """
        if not settings.ALPHA_VANTAGE_API_KEY:
            logger.warning("Alpha Vantage API key not configured")
            return []
            
        try:
            params = {
                'function': 'SYMBOL_SEARCH',
                'keywords': query,
                'apikey': settings.ALPHA_VANTAGE_API_KEY
            }
            
            response = requests.get(AlphaVantageService.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'bestMatches' in data:
                results = []
                for match in data['bestMatches'][:10]:  # Limit to 10 results
                    results.append({
                        'symbol': match.get('1. symbol', ''),
                        'name': match.get('2. name', ''),
                        'type': match.get('3. type', ''),
                        'region': match.get('4. region', ''),
                        'market_open': match.get('5. marketOpen', ''),
                        'market_close': match.get('6. marketClose', ''),
                        'timezone': match.get('7. timezone', ''),
                        'currency': match.get('8. currency', ''),
                        'match_score': float(match.get('9. matchScore', 0))
                    })
                return results
            else:
                logger.warning(f"No results found for search: {query}")
                return []
                
        except requests.RequestException as e:
            logger.error(f"Network error searching for {query}: {e}")
            return []
        except (ValueError, KeyError) as e:
            logger.error(f"Data parsing error for search {query}: {e}")
            return []

# Convenience functions for backward compatibility
def get_current_price(symbol: str) -> Optional[float]:
    """Get current price for a symbol"""
    quote = AlphaVantageService.get_quote(symbol)
    if quote:
        return quote.get('price')
    return None

def get_quote(symbol: str) -> Optional[Dict]:
    """Get full quote data for a symbol"""
    return AlphaVantageService.get_quote(symbol)

def search_symbol(query: str) -> List[Dict]:
    """Search for symbols"""
    return AlphaVantageService.search_symbol(query)

# Market data service instance
market_data_service = AlphaVantageService()

def update_investment_prices(investments: List) -> List:
    """Update current prices for a list of investments using Alpha Vantage"""
    updated_investments = []
    
    for investment in investments:
        try:
            quote_data = get_quote(investment.symbol)
            
            if quote_data and quote_data.get('price'):
                investment.current_price = quote_data['price']
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
                
                logger.info(f"Updated price for {investment.symbol}: {investment.current_price}")
            else:
                logger.warning(f"Could not fetch price for {investment.symbol}")
                
        except Exception as e:
            logger.error(f"Error updating price for {investment.symbol}: {e}")
        
        updated_investments.append(investment)
    
    return updated_investments

def calculate_portfolio_metrics(investments: List) -> Dict:
    """Calculate overall portfolio metrics"""
    total_invested = 0
    current_value = 0
    
    for inv in investments:
        if hasattr(inv, 'status') and inv.status.value == "active":
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
