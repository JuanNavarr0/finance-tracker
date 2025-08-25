import os
os.environ['ALPHA_VANTAGE_API_KEY'] = '1BT0NREPKEKFYOR1'

from app.services.market_data import get_current_price, search_symbol

print("Probando Alpha Vantage API...")
print("-" * 40)

# Probar obtener precio de Apple
print("Obteniendo precio de Apple (AAPL)...")
price = get_current_price("AAPL")
if price:
    print(f"✅ Apple price: ${price}")
else:
    print("❌ No se pudo obtener el precio")

print("\n" + "-" * 40)

# Probar búsqueda
print("Buscando 'Microsoft'...")
results = search_symbol("Microsoft")
if results:
    print(f"✅ Encontrados {len(results)} resultados:")
    for r in results[:3]:
        print(f"  - {r['symbol']}: {r['name']}")
else:
    print("❌ No se encontraron resultados")

