from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Budget, User, Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.utils.auth import get_current_active_user

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all budgets for current user"""
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    
    # Calcular gastos actuales para cada presupuesto
    for budget in budgets:
        # Obtener gastos del período actual
        expenses = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            Expense.budget_id == budget.id,
            # Filtrar por período actual según budget.period
        ).all()
        
        budget.current_spent = sum(e.amount for e in expenses)
        budget.available = budget.amount + budget.rollover_amount - budget.current_spent
        budget.percentage_used = (budget.current_spent / (budget.amount + budget.rollover_amount)) * 100 if budget.amount > 0 else 0
        
        if budget.percentage_used >= 100:
            budget.status = 'over'
        elif budget.percentage_used >= budget.alert_percentage:
            budget.status = 'warning'
        else:
            budget.status = 'under'
    
    return budgets

@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new budget"""
    db_budget = Budget(**budget.dict(), user_id=current_user.id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a budget"""
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    for key, value in budget.dict(exclude_unset=True).items():
        setattr(db_budget, key, value)
    
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a budget"""
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(db_budget)
    db.commit()
    return {"message": "Budget deleted successfully"}