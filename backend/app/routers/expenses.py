from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, and_
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory, ExpenseFrequency
from app.schemas.expense import (
    Expense as ExpenseSchema,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseStats
)
from app.utils.auth import get_current_active_user

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)

@router.get("/", response_model=List[ExpenseSchema])
def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[ExpenseCategory] = None,
    frequency: Optional[ExpenseFrequency] = None,
    is_recurring: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    vendor: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all expenses for current user with optional filters
    """
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    # Apply filters
    if category:
        query = query.filter(Expense.category == category)
    
    if frequency:
        query = query.filter(Expense.frequency == frequency)
    
    if is_recurring is not None:
        query = query.filter(Expense.is_recurring == is_recurring)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    if vendor:
        query = query.filter(Expense.vendor.ilike(f"%{vendor}%"))
    
    # Order by date descending
    expenses = query.order_by(Expense.date.desc()).offset(skip).limit(limit).all()
    
    return expenses

@router.get("/stats", response_model=ExpenseStats)
def get_expense_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get expense statistics for current user
    """
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    # Apply date filters
    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    
    expenses = query.all()
    
    if not expenses:
        return ExpenseStats(
            total_expenses=0,
            monthly_average=0,
            expenses_by_category={},
            expenses_by_month=[],
            top_vendors=[],
            recurring_expenses_total=0,
            fixed_expenses=0,
            variable_expenses=0
        )
    
    # Calculate statistics
    total_expenses = sum(expense.amount for expense in expenses)
    
    # Expenses by category
    expenses_by_category = {}
    for expense in expenses:
        category_key = expense.category.value
        expenses_by_category[category_key] = expenses_by_category.get(category_key, 0) + expense.amount
    
    # Monthly expenses
    monthly_query = (
        db.query(
            extract('year', Expense.date).label('year'),
            extract('month', Expense.date).label('month'),
            func.sum(Expense.amount).label('total')
        )
        .filter(Expense.user_id == current_user.id)
        .group_by('year', 'month')
        .order_by('year', 'month')
    )
    
    if year:
        monthly_query = monthly_query.filter(extract('year', Expense.date) == year)
    
    monthly_data = monthly_query.all()
    
    expenses_by_month = [
        {
            'year': int(row.year),
            'month': int(row.month),
            'total': float(row.total)
        }
        for row in monthly_data
    ]
    
    # Calculate monthly average
    if expenses_by_month:
        monthly_average = sum(m['total'] for m in expenses_by_month) / len(expenses_by_month)
    else:
        monthly_average = 0
    
    # Top vendors
    vendor_query = (
        db.query(
            Expense.vendor,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        )
        .filter(
            Expense.user_id == current_user.id,
            Expense.vendor.isnot(None)
        )
        .group_by(Expense.vendor)
        .order_by(func.sum(Expense.amount).desc())
        .limit(10)
    )
    
    if year:
        vendor_query = vendor_query.filter(extract('year', Expense.date) == year)
    if month:
        vendor_query = vendor_query.filter(extract('month', Expense.date) == month)
    
    vendor_data = vendor_query.all()
    
    top_vendors = [
        {
            'vendor': row.vendor,
            'total': float(row.total),
            'count': row.count
        }
        for row in vendor_data
    ]
    
    # Recurring expenses
    recurring_expenses = [e for e in expenses if e.is_recurring]
    recurring_expenses_total = sum(e.amount for e in recurring_expenses)
    
    # Fixed vs Variable expenses
    fixed_categories = [
        ExpenseCategory.HOUSING,
        ExpenseCategory.UTILITIES,
        ExpenseCategory.INSURANCE
    ]
    
    fixed_expenses = sum(
        e.amount for e in expenses 
        if e.category in fixed_categories or e.is_recurring
    )
    
    variable_expenses = total_expenses - fixed_expenses
    
    return ExpenseStats(
        total_expenses=total_expenses,
        monthly_average=monthly_average,
        expenses_by_category=expenses_by_category,
        expenses_by_month=expenses_by_month,
        top_vendors=top_vendors,
        recurring_expenses_total=recurring_expenses_total,
        fixed_expenses=fixed_expenses,
        variable_expenses=variable_expenses
    )

@router.get("/{expense_id}", response_model=ExpenseSchema)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get specific expense by ID
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    
    return expense

@router.post("/", response_model=ExpenseSchema)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create new expense entry
    """
    db_expense = Expense(
        **expense_data.model_dump(),
        user_id=current_user.id
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense

@router.put("/{expense_id}", response_model=ExpenseSchema)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update expense entry
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    
    # Update fields
    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    
    db.commit()
    db.refresh(expense)
    
    return expense

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete expense entry
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    
    db.delete(expense)
    db.commit()
    
    return {"detail": "Gasto eliminado exitosamente"}

@router.get("/categories/summary")
def get_categories_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get expense summary grouped by category with percentages
    """
    query = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count')
    ).filter(Expense.user_id == current_user.id)
    
    if year:
        query = query.filter(extract('year', Expense.date) == year)
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    
    category_data = query.group_by(Expense.category).all()
    
    # Calculate total for percentages
    total = sum(row.total for row in category_data)
    
    summary = [
        {
            'category': row.category.value,
            'total': float(row.total),
            'count': row.count,
            'percentage': round((row.total / total * 100), 2) if total > 0 else 0
        }
        for row in category_data
    ]
    
    # Sort by total descending
    summary.sort(key=lambda x: x['total'], reverse=True)
    
    return {
        'categories': summary,
        'total': total
    }