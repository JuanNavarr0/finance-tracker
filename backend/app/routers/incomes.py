from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.database import get_db
from app.models.user import User
from app.models.income import Income, IncomeType
from app.schemas.income import (
    Income as IncomeSchema,
    IncomeCreate,
    IncomeUpdate,
    IncomeStats
)
from app.utils.auth import get_current_active_user

router = APIRouter(
    prefix="/incomes",
    tags=["Incomes"]
)

@router.get("/", response_model=List[IncomeSchema])
def get_incomes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    income_type: Optional[IncomeType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all incomes for current user with optional filters
    """
    query = db.query(Income).filter(Income.user_id == current_user.id)
    
    # Apply filters
    if income_type:
        query = query.filter(Income.income_type == income_type)
    
    if start_date:
        query = query.filter(Income.date >= start_date)
    
    if end_date:
        query = query.filter(Income.date <= end_date)
    
    # Order by date descending
    incomes = query.order_by(Income.date.desc()).offset(skip).limit(limit).all()
    
    return incomes

@router.get("/stats", response_model=IncomeStats)
def get_income_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get income statistics for current user
    """
    query = db.query(Income).filter(Income.user_id == current_user.id)
    
    # Apply date filters
    if year:
        query = query.filter(extract('year', Income.date) == year)
    if month:
        query = query.filter(extract('month', Income.date) == month)
    
    incomes = query.all()
    
    if not incomes:
        return IncomeStats(
            total_income=0,
            monthly_average=0,
            income_by_type={},
            income_by_month=[],
            last_income_date=None
        )
    
    # Calculate statistics
    total_income = sum(income.amount for income in incomes)
    
    # Income by type
    income_by_type = {}
    for income in incomes:
        type_key = income.income_type.value
        income_by_type[type_key] = income_by_type.get(type_key, 0) + income.amount
    
    # Income by month
    monthly_query = (
        db.query(
            extract('year', Income.date).label('year'),
            extract('month', Income.date).label('month'),
            func.sum(Income.amount).label('total')
        )
        .filter(Income.user_id == current_user.id)
        .group_by('year', 'month')
        .order_by('year', 'month')
    )
    
    if year:
        monthly_query = monthly_query.filter(extract('year', Income.date) == year)
    
    monthly_data = monthly_query.all()
    
    income_by_month = [
        {
            'year': int(row.year),
            'month': int(row.month),
            'total': float(row.total)
        }
        for row in monthly_data
    ]
    
    # Calculate monthly average
    if income_by_month:
        monthly_average = sum(m['total'] for m in income_by_month) / len(income_by_month)
    else:
        monthly_average = 0
    
    # Last income date
    last_income = max(incomes, key=lambda x: x.date)
    
    return IncomeStats(
        total_income=total_income,
        monthly_average=monthly_average,
        income_by_type=income_by_type,
        income_by_month=income_by_month,
        last_income_date=last_income.date
    )

@router.get("/{income_id}", response_model=IncomeSchema)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get specific income by ID
    """
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingreso no encontrado"
        )
    
    return income

@router.post("/", response_model=IncomeSchema)
def create_income(
    income_data: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create new income entry
    """
    db_income = Income(
        **income_data.model_dump(),
        user_id=current_user.id
    )
    
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    
    return db_income

@router.put("/{income_id}", response_model=IncomeSchema)
def update_income(
    income_id: int,
    income_update: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update income entry
    """
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingreso no encontrado"
        )
    
    # Update fields
    update_data = income_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)
    
    db.commit()
    db.refresh(income)
    
    return income

@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete income entry
    """
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingreso no encontrado"
        )
    
    db.delete(income)
    db.commit()
    
    return {"detail": "Ingreso eliminado exitosamente"}