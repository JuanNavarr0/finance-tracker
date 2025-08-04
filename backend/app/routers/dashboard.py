from typing import Optional
from datetime import datetime, date, timedelta
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, and_, or_
from app.database import get_db
from app.models.user import User
from app.models.income import Income, IncomeType
from app.models.expense import Expense, ExpenseCategory
from app.models.goal import Goal, GoalStatus
from app.models.investment import Investment, InvestmentStatus
from app.schemas.dashboard import (
    DashboardData,
    FinancialSummary,
    MonthlyOverview,
    CashFlow,
    CategoryBreakdown,
    GoalsSummary,
    InvestmentsSummary,
    RecentTransaction
)
from app.utils.auth import get_current_active_user
from app.utils.market_data import update_investment_prices, calculate_portfolio_metrics

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/", response_model=DashboardData)
def get_dashboard_data(
    year: Optional[int] = None,
    month: Optional[int] = None,
    update_investment_prices: bool = Query(True, description="Update investment prices"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive dashboard data for the user
    """
    # Set default to current year/month if not provided
    now = datetime.now()
    if not year:
        year = now.year
    if not month:
        month = now.month
    
    # Calculate date ranges
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])
    
    # Get all time data for totals
    all_incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    all_expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    
    # Calculate total income and expenses
    total_income = sum(income.amount for income in all_incomes)
    total_expenses = sum(expense.amount for expense in all_expenses)
    net_balance = total_income - total_expenses
    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
    
    # Financial Summary
    financial_summary = FinancialSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=net_balance,
        savings_rate=round(savings_rate, 2)
    )
    
    # Monthly Overview
    monthly_incomes = db.query(Income).filter(
        Income.user_id == current_user.id,
        Income.date >= first_day,
        Income.date <= last_day
    ).all()
    
    monthly_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date >= first_day,
        Expense.date <= last_day
    ).all()
    
    monthly_income_total = sum(income.amount for income in monthly_incomes)
    monthly_expense_total = sum(expense.amount for expense in monthly_expenses)
    
    monthly_overview = MonthlyOverview(
        month=first_day.strftime("%B"),
        year=year,
        income=monthly_income_total,
        expenses=monthly_expense_total,
        balance=monthly_income_total - monthly_expense_total
    )
    
    # Cash Flow (last 6 months)
    cash_flow = []
    cumulative_balance = 0
    
    for i in range(5, -1, -1):
        # Calculate month
        flow_date = date(year, month, 1) - timedelta(days=i * 30)
        flow_year = flow_date.year
        flow_month = flow_date.month
        
        # Get income and expenses for this month
        month_income = db.query(func.sum(Income.amount)).filter(
            Income.user_id == current_user.id,
            extract('year', Income.date) == flow_year,
            extract('month', Income.date) == flow_month
        ).scalar() or 0
        
        month_expense = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            extract('year', Expense.date) == flow_year,
            extract('month', Expense.date) == flow_month
        ).scalar() or 0
        
        net_flow = month_income - month_expense
        cumulative_balance += net_flow
        
        cash_flow.append(CashFlow(
            date=f"{flow_year}-{flow_month:02d}",
            income=float(month_income),
            expenses=float(month_expense),
            net_flow=net_flow,
            cumulative_balance=cumulative_balance
        ))
    
    # Income by Type
    income_by_type_data = db.query(
        Income.income_type,
        func.sum(Income.amount).label('total'),
        func.count(Income.id).label('count')
    ).filter(
        Income.user_id == current_user.id
    ).group_by(Income.income_type).all()
    
    income_by_type = [
        CategoryBreakdown(
            category=row.income_type.value,
            amount=float(row.total),
            percentage=round((row.total / total_income * 100), 2) if total_income > 0 else 0,
            count=row.count
        )
        for row in income_by_type_data
    ]
    
    # Expenses by Category
    expense_by_category_data = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count')
    ).filter(
        Expense.user_id == current_user.id
    ).group_by(Expense.category).all()
    
    expenses_by_category = [
        CategoryBreakdown(
            category=row.category.value,
            amount=float(row.total),
            percentage=round((row.total / total_expenses * 100), 2) if total_expenses > 0 else 0,
            count=row.count
        )
        for row in expense_by_category_data
    ]
    
    # Goals Summary
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    active_goals = [g for g in goals if g.status == GoalStatus.ACTIVE]
    completed_goals = [g for g in goals if g.status == GoalStatus.COMPLETED]
    
    total_target = sum(g.target_amount for g in goals) if goals else 0
    total_saved = sum(g.current_amount for g in goals) if goals else 0
    
    goals_summary = GoalsSummary(
        total_goals=len(goals),
        active_goals=len(active_goals),
        completed_goals=len(completed_goals),
        total_target_amount=total_target,
        total_saved_amount=total_saved,
        overall_progress=round((total_saved / total_target * 100), 2) if total_target > 0 else 0
    )
    
    # Investments Summary
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.ACTIVE
    ).all()
    
    if investments and update_investment_prices:
        investments = update_investment_prices(investments)
        db.commit()
    
    if investments:
        portfolio_metrics = calculate_portfolio_metrics(investments)
        
        # Get best and worst performers
        sorted_investments = sorted(
            [inv for inv in investments if inv.profit_loss_percentage is not None],
            key=lambda x: x.profit_loss_percentage,
            reverse=True
        )
        
        best_performer = None
        worst_performer = None
        
        if sorted_investments:
            if sorted_investments[0].profit_loss_percentage > 0:
                best = sorted_investments[0]
                best_performer = {
                    'symbol': best.symbol,
                    'name': best.name,
                    'profit_loss_percentage': round(best.profit_loss_percentage, 2)
                }
            
            if sorted_investments[-1].profit_loss_percentage < 0:
                worst = sorted_investments[-1]
                worst_performer = {
                    'symbol': worst.symbol,
                    'name': worst.name,
                    'profit_loss_percentage': round(worst.profit_loss_percentage, 2)
                }
        
        investments_summary = InvestmentsSummary(
            total_invested=portfolio_metrics['total_invested'],
            current_value=portfolio_metrics['current_value'],
            total_return=portfolio_metrics['profit_loss'],
            return_percentage=portfolio_metrics['profit_loss_percentage'],
            best_performer=best_performer,
            worst_performer=worst_performer
        )
    else:
        investments_summary = InvestmentsSummary(
            total_invested=0,
            current_value=0,
            total_return=0,
            return_percentage=0
        )
    
    # Recent Transactions
    recent_incomes = db.query(Income).filter(
        Income.user_id == current_user.id
    ).order_by(Income.date.desc()).limit(5).all()
    
    recent_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(Expense.date.desc()).limit(5).all()
    
    recent_transactions = []
    
    for income in recent_incomes:
        recent_transactions.append(RecentTransaction(
            id=income.id,
            type="income",
            amount=income.amount,
            description=income.source,
            category=income.income_type.value,
            date=income.date
        ))
    
    for expense in recent_expenses:
        recent_transactions.append(RecentTransaction(
            id=expense.id,
            type="expense",
            amount=expense.amount,
            description=expense.description or expense.vendor or expense.category.value,
            category=expense.category.value,
            date=expense.date
        ))
    
    # Sort by date and get top 10
    recent_transactions.sort(key=lambda x: x.date, reverse=True)
    recent_transactions = recent_transactions[:10]
    
    # Calculate additional metrics
    days_in_month = monthrange(year, month)[1]
    days_passed = (datetime.now().date() - first_day).days + 1
    days_remaining = days_in_month - days_passed
    
    # Average daily expense (based on current month)
    average_daily_expense = monthly_expense_total / days_passed if days_passed > 0 else 0
    
    # Projected month end balance
    projected_remaining_expenses = average_daily_expense * days_remaining
    projected_month_end_balance = monthly_income_total - (monthly_expense_total + projected_remaining_expenses)
    
    # Alerts
    alerts = []
    
    # Check if over budget (expenses > 80% of income)
    if monthly_income_total > 0 and monthly_expense_total > monthly_income_total * 0.8:
        alerts.append({
            "type": "warning",
            "title": "Gastos elevados",
            "message": f"Has gastado {round(monthly_expense_total / monthly_income_total * 100, 1)}% de tus ingresos este mes"
        })
    
    # Check for category overspending
    for expense_cat in expenses_by_category:
        if expense_cat.percentage > 30:  # If any category is > 30% of total expenses
            alerts.append({
                "type": "info",
                "title": f"Alto gasto en {expense_cat.category}",
                "message": f"Esta categoría representa el {expense_cat.percentage}% de tus gastos totales"
            })
    
    # Check for upcoming goals
    upcoming_goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.status == GoalStatus.ACTIVE,
        Goal.target_date <= datetime.now() + timedelta(days=30)
    ).all()
    
    for goal in upcoming_goals:
        days_left = (goal.target_date - datetime.now()).days
        if days_left >= 0:
            progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
            if progress < 80:
                alerts.append({
                    "type": "warning",
                    "title": f"Objetivo próximo: {goal.name}",
                    "message": f"Faltan {days_left} días y has alcanzado el {round(progress, 1)}% de tu meta"
                })
    
    # Investment alerts
    if investments_summary.return_percentage < -10:
        alerts.append({
            "type": "danger",
            "title": "Pérdidas en inversiones",
            "message": f"Tu portfolio ha perdido un {abs(round(investments_summary.return_percentage, 1))}% de su valor"
        })
    elif investments_summary.return_percentage > 20:
        alerts.append({
            "type": "success",
            "title": "¡Excelente rendimiento!",
            "message": f"Tu portfolio ha ganado un {round(investments_summary.return_percentage, 1)}%"
        })
    
    # Limit alerts to 5 most important
    alerts = alerts[:5]
    
    return DashboardData(
        financial_summary=financial_summary,
        monthly_overview=monthly_overview,
        cash_flow=cash_flow,
        income_by_type=income_by_type,
        expenses_by_category=expenses_by_category,
        goals_summary=goals_summary,
        investments_summary=investments_summary,
        recent_transactions=recent_transactions,
        average_daily_expense=round(average_daily_expense, 2),
        days_until_month_end=max(0, days_remaining),
        projected_month_end_balance=round(projected_month_end_balance, 2),
        alerts=alerts
    )

@router.get("/quick-stats")
def get_quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get quick statistics for header/widgets
    """
    # Current month
    now = datetime.now()
    first_day = date(now.year, now.month, 1)
    
    # This month's balance
    month_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == current_user.id,
        Income.date >= first_day
    ).scalar() or 0
    
    month_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date >= first_day
    ).scalar() or 0
    
    # Active goals count
    active_goals = db.query(func.count(Goal.id)).filter(
        Goal.user_id == current_user.id,
        Goal.status == GoalStatus.ACTIVE
    ).scalar() or 0
    
    # Investment value
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.status == InvestmentStatus.ACTIVE
    ).all()
    
    portfolio_value = sum(inv.current_value or 0 for inv in investments)
    
    return {
        "current_month_balance": float(month_income - month_expense),
        "active_goals_count": active_goals,
        "portfolio_value": float(portfolio_value),
        "month_name": now.strftime("%B %Y")
    }