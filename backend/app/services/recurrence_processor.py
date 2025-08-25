from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from app.models import Income, Expense, Goal
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

class RecurrenceProcessor:
    """Procesa transacciones recurrentes automáticamente"""
    
    @staticmethod
    def process_all_recurring(db: Session):
        """Procesa todas las transacciones recurrentes pendientes"""
        today = datetime.now().date()
        
        # Procesar ingresos recurrentes
        RecurrenceProcessor.process_recurring_incomes(db, today)
        
        # Procesar gastos recurrentes
        RecurrenceProcessor.process_recurring_expenses(db, today)
        
        # Procesar contribuciones automáticas a objetivos
        RecurrenceProcessor.process_goal_contributions(db, today)
        
        # Actualizar rollover de presupuestos
        RecurrenceProcessor.update_budget_rollovers(db, today)
        
        db.commit()
    
    @staticmethod
    def process_recurring_incomes(db: Session, today):
        """Procesa ingresos recurrentes"""
        incomes = db.query(Income).filter(
            Income.is_recurring == True,
            Income.next_occurrence <= today
        ).all()
        
        for income in incomes:
            # Crear nueva instancia del ingreso
            new_income = Income(
                user_id=income.user_id,
                amount=income.amount,
                source=income.source,
                income_type=income.income_type,
                description=f"[Automático] {income.description or ''}",
                date=income.next_occurrence,
                is_recurring=False  # La copia no es recurrente
            )
            db.add(new_income)
            
            # Calcular próxima ocurrencia
            income.next_occurrence = RecurrenceProcessor.calculate_next_occurrence(
                income.recurrence_type,
                income.recurrence_day_option,
                income.recurrence_custom_day,
                income.next_occurrence
            )
            income.last_processed = today
            
            logger.info(f"Processed recurring income {income.id} for user {income.user_id}")
    
    @staticmethod
    def process_recurring_expenses(db: Session, today):
        """Procesa gastos recurrentes"""
        expenses = db.query(Expense).filter(
            Expense.is_recurring == True,
            # Assuming next_occurrence field exists, if not, this would need to be adjusted
        ).all()
        
        for expense in expenses:
            # Create new expense instance
            new_expense = Expense(
                user_id=expense.user_id,
                budget_id=expense.budget_id,
                amount=expense.amount,
                category=expense.category,
                subcategory=expense.subcategory,
                description=f"[Automático] {expense.description or ''}",
                vendor=expense.vendor,
                frequency=expense.frequency,
                is_recurring=False,  # The copy is not recurring
                date=today
            )
            db.add(new_expense)
            
            logger.info(f"Processed recurring expense {expense.id} for user {expense.user_id}")
    
    @staticmethod
    def process_goal_contributions(db: Session, today):
        """Procesa contribuciones automáticas a objetivos"""
        # This would process automatic goal contributions
        # Implementation depends on if there's an auto-contribution feature
        goals = db.query(Goal).filter(
            Goal.status == "active",
            # Add conditions for auto-contributions if needed
        ).all()
        
        for goal in goals:
            # Logic for automatic contributions would go here
            logger.info(f"Checking goal {goal.id} for auto-contributions")
    
    @staticmethod
    def update_budget_rollovers(db: Session, today):
        """Actualiza rollover de presupuestos al inicio de un nuevo período"""
        # This would handle budget rollover logic
        # Implementation depends on budget rollover requirements
        logger.info(f"Processing budget rollovers for {today}")
    
    @staticmethod
    def calculate_next_occurrence(recurrence_type, day_option, custom_day, current_date):
        """Calcula la próxima fecha de ocurrencia"""
        if recurrence_type == 'daily':
            return current_date + timedelta(days=1)
        elif recurrence_type == 'weekly':
            return current_date + timedelta(weeks=1)
        elif recurrence_type == 'monthly':
            next_month = current_date + relativedelta(months=1)
            if day_option == 'first_day':
                return next_month.replace(day=1)
            elif day_option == 'last_day':
                return next_month + relativedelta(day=31)  # relativedelta ajusta al último día
            elif day_option == 'custom' and custom_day:
                try:
                    return next_month.replace(day=custom_day)
                except ValueError:
                    # Si el día no existe en el mes, usar el último día
                    return next_month + relativedelta(day=31)
        elif recurrence_type == 'yearly':
            return current_date + relativedelta(years=1)
        
        return current_date

# Crear tarea programada (usar con Celery o APScheduler)
def run_daily_processing():
    """Ejecutar diariamente a las 00:01"""
    with next(get_db()) as db:
        processor = RecurrenceProcessor()
        processor.process_all_recurring(db)