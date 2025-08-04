"""
Script para crear datos de ejemplo para pruebas
"""
from datetime import datetime, timedelta
from random import randint, choice, uniform
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Income, Expense, Goal, Investment
from app.models.income import IncomeType
from app.models.expense import ExpenseCategory, ExpenseFrequency
from app.models.goal import GoalStatus, GoalPriority
from app.models.investment import InvestmentType, InvestmentStatus

def create_sample_data():
    """Crea datos de ejemplo para todos los usuarios"""
    db = SessionLocal()
    
    # Obtener usuarios existentes (excepto admin)
    users = db.query(User).filter(User.username != "admin").all()
    
    if not users:
        print("⚠️  No hay usuarios para crear datos de ejemplo")
        print("   Ejecuta primero: python create_test_user.py")
        return
    
    print(f"📊 Creando datos de ejemplo para {len(users)} usuarios...")
    
    for user in users:
        print(f"\n👤 Creando datos para {user.username}...")
        
        # 1. Crear ingresos (últimos 6 meses)
        incomes_created = 0
        for month_offset in range(6):
            date = datetime.now() - timedelta(days=30 * month_offset)
            
            # Salario mensual
            salary = Income(
                user_id=user.id,
                amount=2500 + randint(-200, 500),
                source="Empresa Tech Solutions",
                income_type=IncomeType.SALARY,
                description="Salario mensual",
                date=date.replace(day=25)
            )
            db.add(salary)
            incomes_created += 1
            
            # Ingreso extra ocasional
            if randint(1, 3) == 1:
                extra = Income(
                    user_id=user.id,
                    amount=randint(100, 500),
                    source=choice(["Proyecto Freelance", "Venta Wallapop", "Regalo familiar"]),
                    income_type=choice([IncomeType.FREELANCE, IncomeType.GIFT, IncomeType.OTHER]),
                    date=date.replace(day=randint(5, 20))
                )
                db.add(extra)
                incomes_created += 1
        
        # 2. Crear gastos (últimos 3 meses)
        expenses_created = 0
        expense_templates = [
            # Gastos fijos
            {"category": ExpenseCategory.HOUSING, "vendor": "Alquiler Piso", "amount_range": (700, 900), "frequency": ExpenseFrequency.MONTHLY, "recurring": True},
            {"category": ExpenseCategory.UTILITIES, "vendor": "Iberdrola", "amount_range": (40, 80), "frequency": ExpenseFrequency.MONTHLY, "recurring": True},
            {"category": ExpenseCategory.UTILITIES, "vendor": "Vodafone", "amount_range": (30, 50), "frequency": ExpenseFrequency.MONTHLY, "recurring": True},
            {"category": ExpenseCategory.INSURANCE, "vendor": "Mapfre Seguro Coche", "amount_range": (50, 70), "frequency": ExpenseFrequency.MONTHLY, "recurring": True},
            
            # Gastos variables
            {"category": ExpenseCategory.GROCERIES, "vendor": "Mercadona", "amount_range": (50, 150), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.GROCERIES, "vendor": "Carrefour", "amount_range": (30, 80), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.FOOD, "vendor": choice(["Restaurante Italiano", "Burger King", "Telepizza", "Sushi Bar"]), "amount_range": (15, 40), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.TRANSPORTATION, "vendor": "Gasolinera Repsol", "amount_range": (40, 60), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.ENTERTAINMENT, "vendor": choice(["Netflix", "Spotify", "Cine", "Concierto"]), "amount_range": (10, 50), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.CLOTHING, "vendor": choice(["Zara", "H&M", "Decathlon"]), "amount_range": (30, 100), "frequency": ExpenseFrequency.ONE_TIME},
            {"category": ExpenseCategory.HEALTH, "vendor": choice(["Farmacia", "Gimnasio", "Fisioterapeuta"]), "amount_range": (20, 60), "frequency": ExpenseFrequency.ONE_TIME},
        ]
        
        for month_offset in range(3):
            base_date = datetime.now() - timedelta(days=30 * month_offset)
            
            # Gastos fijos
            for template in expense_templates:
                if template["frequency"] == ExpenseFrequency.MONTHLY:
                    expense = Expense(
                        user_id=user.id,
                        amount=uniform(*template["amount_range"]),
                        category=template["category"],
                        vendor=template["vendor"],
                        frequency=template["frequency"],
                        is_recurring=template.get("recurring", False),
                        date=base_date.replace(day=randint(1, 5))
                    )
                    db.add(expense)
                    expenses_created += 1
            
            # Gastos variables (varios por mes)
            for _ in range(randint(15, 25)):
                template = choice([t for t in expense_templates if t["frequency"] == ExpenseFrequency.ONE_TIME])
                expense = Expense(
                    user_id=user.id,
                    amount=uniform(*template["amount_range"]),
                    category=template["category"],
                    vendor=template["vendor"],
                    frequency=template["frequency"],
                    date=base_date - timedelta(days=randint(0, 29))
                )
                db.add(expense)
                expenses_created += 1
        
        # 3. Crear objetivos de ahorro
        goals_created = 0
        goal_templates = [
            {"name": "Viaje a Japón 2026", "target": 3000, "months": 18, "priority": GoalPriority.HIGH, "icon": "✈️", "color": "#FF6B6B"},
            {"name": "Fondo de emergencia", "target": 5000, "months": 12, "priority": GoalPriority.CRITICAL, "icon": "🛡️", "color": "#4ECDC4"},
            {"name": "MacBook Pro nuevo", "target": 2500, "months": 8, "priority": GoalPriority.MEDIUM, "icon": "💻", "color": "#95E1D3"},
            {"name": "Curso de inglés", "target": 800, "months": 4, "priority": GoalPriority.LOW, "icon": "📚", "color": "#F38181"},
        ]
        
        for template in goal_templates[:randint(2, 4)]:
            goal = Goal(
                user_id=user.id,
                name=template["name"],
                description=f"Ahorrar para {template['name'].lower()}",
                target_amount=template["target"],
                current_amount=uniform(0, template["target"] * 0.6),
                target_date=datetime.now() + timedelta(days=30 * template["months"]),
                status=GoalStatus.ACTIVE,
                priority=template["priority"],
                icon=template["icon"],
                color=template["color"]
            )
            db.add(goal)
            goals_created += 1
        
        # 4. Crear inversiones
        investments_created = 0
        investment_templates = [
            # Acciones
            {"symbol": "AAPL", "name": "Apple Inc.", "type": InvestmentType.STOCK, "quantity": 10, "price_range": (150, 180)},
            {"symbol": "MSFT", "name": "Microsoft Corp.", "type": InvestmentType.STOCK, "quantity": 5, "price_range": (300, 350)},
            {"symbol": "GOOGL", "name": "Alphabet Inc.", "type": InvestmentType.STOCK, "quantity": 3, "price_range": (120, 140)},
            
            # ETFs
            {"symbol": "VOO", "name": "Vanguard S&P 500 ETF", "type": InvestmentType.ETF, "quantity": 15, "price_range": (380, 420)},
            {"symbol": "VWCE.DE", "name": "Vanguard FTSE All-World", "type": InvestmentType.ETF, "quantity": 20, "price_range": (90, 105)},
            
            # Crypto
            {"symbol": "BTC", "name": "Bitcoin", "type": InvestmentType.CRYPTO, "quantity": 0.1, "price_range": (30000, 45000)},
            {"symbol": "ETH", "name": "Ethereum", "type": InvestmentType.CRYPTO, "quantity": 1.5, "price_range": (2000, 3000)},
        ]
        
        for template in investment_templates[:randint(3, 5)]:
            purchase_date = datetime.now() - timedelta(days=randint(30, 365))
            investment = Investment(
                user_id=user.id,
                symbol=template["symbol"],
                name=template["name"],
                investment_type=template["type"],
                quantity=template["quantity"],
                purchase_price=uniform(*template["price_range"]),
                purchase_date=purchase_date,
                purchase_fees=uniform(5, 20),
                platform=choice(["Interactive Brokers", "DEGIRO", "Revolut", "Binance"]),
                status=InvestmentStatus.ACTIVE
            )
            
            # Calcular métricas iniciales
            investment.total_invested = (
                investment.quantity * investment.purchase_price + 
                investment.purchase_fees
            )
            
            db.add(investment)
            investments_created += 1
        
        print(f"   ✅ Creados: {incomes_created} ingresos, {expenses_created} gastos")
        print(f"   ✅ Creados: {goals_created} objetivos, {investments_created} inversiones")
    
    # Guardar todos los cambios
    db.commit()
    db.close()
    
    print("\n✨ Datos de ejemplo creados exitosamente!")
    print("\n📝 Resumen:")
    print(f"   - Ingresos: Salarios mensuales + extras ocasionales")
    print(f"   - Gastos: Fijos (alquiler, servicios) + variables")
    print(f"   - Objetivos: Viajes, emergencias, tecnología")
    print(f"   - Inversiones: Acciones, ETFs y crypto")

if __name__ == "__main__":
    print("🔨 Creando datos de ejemplo...")
    create_sample_data()