from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, GoalStatus, GoalPriority
from app.schemas.goal import (
    Goal as GoalSchema,
    GoalCreate,
    GoalUpdate,
    GoalContribution
)
from app.utils.auth import get_current_active_user

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)

@router.get("/", response_model=List[GoalSchema])
def get_goals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[GoalStatus] = None,
    priority: Optional[GoalPriority] = None,
    include_completed: bool = Query(False, description="Include completed goals"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all goals for current user with optional filters
    """
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(Goal.status == status)
    elif not include_completed:
        # By default, exclude completed and cancelled goals
        query = query.filter(
            Goal.status.in_([GoalStatus.ACTIVE, GoalStatus.PAUSED])
        )
    
    if priority:
        query = query.filter(Goal.priority == priority)
    
    # Order by priority (critical first) and target date
    goals = query.order_by(
        Goal.priority.desc(),
        Goal.target_date.asc()
    ).offset(skip).limit(limit).all()
    
    # Convert to schema with calculations
    return [GoalSchema.from_orm_with_calculations(goal) for goal in goals]

@router.get("/summary")
def get_goals_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get summary of all goals
    """
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    
    if not goals:
        return {
            "total_goals": 0,
            "active_goals": 0,
            "completed_goals": 0,
            "paused_goals": 0,
            "total_target_amount": 0,
            "total_saved_amount": 0,
            "overall_progress": 0,
            "goals_by_priority": {},
            "upcoming_deadlines": []
        }
    
    # Calculate statistics
    active_goals = [g for g in goals if g.status == GoalStatus.ACTIVE]
    completed_goals = [g for g in goals if g.status == GoalStatus.COMPLETED]
    paused_goals = [g for g in goals if g.status == GoalStatus.PAUSED]
    
    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.current_amount for g in goals)
    
    # Goals by priority
    goals_by_priority = {}
    for priority in GoalPriority:
        priority_goals = [g for g in active_goals if g.priority == priority]
        if priority_goals:
            goals_by_priority[priority.value] = {
                "count": len(priority_goals),
                "total_target": sum(g.target_amount for g in priority_goals),
                "total_saved": sum(g.current_amount for g in priority_goals)
            }
    
    # Upcoming deadlines (next 3 active goals)
    upcoming = sorted(
        [g for g in active_goals if g.target_date > datetime.now()],
        key=lambda x: x.target_date
    )[:3]
    
    upcoming_deadlines = [
        {
            "id": g.id,
            "name": g.name,
            "target_date": g.target_date,
            "days_remaining": (g.target_date - datetime.now()).days,
            "progress_percentage": round((g.current_amount / g.target_amount * 100), 2) if g.target_amount > 0 else 0
        }
        for g in upcoming
    ]
    
    return {
        "total_goals": len(goals),
        "active_goals": len(active_goals),
        "completed_goals": len(completed_goals),
        "paused_goals": len(paused_goals),
        "total_target_amount": total_target,
        "total_saved_amount": total_saved,
        "overall_progress": round((total_saved / total_target * 100), 2) if total_target > 0 else 0,
        "goals_by_priority": goals_by_priority,
        "upcoming_deadlines": upcoming_deadlines
    }

@router.get("/{goal_id}", response_model=GoalSchema)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get specific goal by ID
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    return GoalSchema.from_orm_with_calculations(goal)

@router.post("/", response_model=GoalSchema)
def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create new savings goal
    """
    # Validate target date is in the future
    if goal_data.target_date <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha objetivo debe ser en el futuro"
        )
    
    db_goal = Goal(
        **goal_data.model_dump(),
        user_id=current_user.id,
        current_amount=0.0,
        status=GoalStatus.ACTIVE
    )
    
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    return GoalSchema.from_orm_with_calculations(db_goal)

@router.put("/{goal_id}", response_model=GoalSchema)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update goal details
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    # Update fields
    update_data = goal_update.model_dump(exclude_unset=True)
    
    # Validate target date if being updated
    if "target_date" in update_data and update_data["target_date"] <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha objetivo debe ser en el futuro"
        )
    
    # Check if goal is being completed
    if "status" in update_data and update_data["status"] == GoalStatus.COMPLETED:
        update_data["completed_at"] = datetime.now()
    
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    
    return GoalSchema.from_orm_with_calculations(goal)

@router.post("/{goal_id}/contribute", response_model=GoalSchema)
def contribute_to_goal(
    goal_id: int,
    contribution: GoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add contribution to a goal
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    if goal.status != GoalStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede contribuir a objetivos activos"
        )
    
    # Update current amount
    goal.current_amount += contribution.amount
    goal.last_contribution_date = datetime.now()
    
    # Check if goal is completed
    if goal.current_amount >= goal.target_amount:
        goal.status = GoalStatus.COMPLETED
        goal.completed_at = datetime.now()
        goal.current_amount = goal.target_amount  # Cap at target amount
    
    db.commit()
    db.refresh(goal)
    
    return GoalSchema.from_orm_with_calculations(goal)

@router.post("/{goal_id}/withdraw", response_model=GoalSchema)
def withdraw_from_goal(
    goal_id: int,
    withdrawal: GoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Withdraw money from a goal
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    if goal.status == GoalStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede retirar de un objetivo cancelado"
        )
    
    if withdrawal.amount > goal.current_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes retirar más de lo que has ahorrado"
        )
    
    # Update current amount
    goal.current_amount -= withdrawal.amount
    
    # If goal was completed, reactivate it
    if goal.status == GoalStatus.COMPLETED:
        goal.status = GoalStatus.ACTIVE
        goal.completed_at = None
    
    db.commit()
    db.refresh(goal)
    
    return GoalSchema.from_orm_with_calculations(goal)

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete goal (only if no money saved)
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    if goal.current_amount > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar un objetivo con dinero ahorrado. Retira el dinero primero."
        )
    
    db.delete(goal)
    db.commit()
    
    return {"detail": "Objetivo eliminado exitosamente"}

@router.get("/calculate/monthly-contribution/{goal_id}")
def calculate_monthly_contribution(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculate suggested monthly contribution to reach goal on time
    """
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objetivo no encontrado"
        )
    
    remaining_amount = goal.target_amount - goal.current_amount
    
    if remaining_amount <= 0:
        return {
            "monthly_contribution": 0,
            "message": "¡Objetivo ya alcanzado!"
        }
    
    days_remaining = (goal.target_date - datetime.now()).days
    
    if days_remaining <= 0:
        return {
            "monthly_contribution": 0,
            "message": "La fecha objetivo ya pasó"
        }
    
    months_remaining = days_remaining / 30
    monthly_contribution = remaining_amount / months_remaining
    
    return {
        "monthly_contribution": round(monthly_contribution, 2),
        "months_remaining": round(months_remaining, 1),
        "days_remaining": days_remaining,
        "remaining_amount": round(remaining_amount, 2)
    }