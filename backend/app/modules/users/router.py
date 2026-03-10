from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users import crud, schemas
from app.modules.users.models import User

router = APIRouter()


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@router.get("/me", response_model=schemas.UserDetailedResponse)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user details"""
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile information"""
    updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
    return updated_user


@router.patch("/me/preferences", response_model=schemas.UserResponse)
def update_current_user_preferences(
    prefs_update: schemas.UserPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user preferences (theme, timezone, locale)"""
    updated_user = crud.update_user_preferences(
        db, user_id=current_user.id, prefs_update=prefs_update
    )
    return updated_user


# User Preferences (arbitrary key-value storage)

@router.get("/me/preferences/all")
def get_all_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all user preferences as a dictionary"""
    import json
    prefs = crud.get_all_user_preferences(db, user_id=current_user.id)
    result = {}
    for pref in prefs:
        try:
            result[pref.key] = json.loads(pref.value)
        except json.JSONDecodeError:
            result[pref.key] = pref.value
    return result


@router.get("/me/preferences/{key}")
def get_preference(
    key: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific user preference"""
    import json
    pref = crud.get_user_preference(db, user_id=current_user.id, key=key)
    if pref is None:
        raise HTTPException(status_code=404, detail="Preference not found")
    
    try:
        value = json.loads(pref.value)
    except json.JSONDecodeError:
        value = pref.value
    
    return {"key": pref.key, "value": value}


@router.post("/me/preferences/{key}")
def set_preference(
    key: str,
    value: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Set a user preference"""
    pref = crud.set_user_preference(db, user_id=current_user.id, key=key, value=value)
    return {"key": pref.key, "value": value}


@router.delete("/me/preferences/{key}")
def delete_preference(
    key: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a user preference"""
    success = crud.delete_user_preference(db, user_id=current_user.id, key=key)
    if not success:
        raise HTTPException(status_code=404, detail="Preference not found")
    
    return {"message": "Preference deleted"}


# Admin/Other user endpoints (by user_id)

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin or same user only)"""
    # For now, only allow users to access their own data
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
