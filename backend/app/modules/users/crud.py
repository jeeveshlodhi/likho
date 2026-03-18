from sqlalchemy.orm import Session
from typing import Optional, List
import json
from uuid import UUID

from app.modules.users.models import User, UserAuth, UserPreference
from app.modules.users.schemas import UserCreate, UserUpdate, UserPreferencesUpdate
from app.core.security import get_password_hash


def get_user(db: Session, user_id: str | UUID):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, full_name=user.full_name)
    db_auth = UserAuth(provider="email", password_hash=hashed_password)
    db_user.auth_methods.append(db_auth)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: str | UUID, user_update: UserUpdate):
    """Update user profile information"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_preferences(db: Session, user_id: str | UUID, prefs_update: UserPreferencesUpdate):
    """Update user preferences (theme, timezone, locale) directly on User model"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = prefs_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


# User Preferences CRUD (for arbitrary key-value settings)

def get_user_preference(db: Session, user_id: str | UUID, key: str) -> Optional[UserPreference]:
    """Get a specific user preference by key"""
    return db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.key == key
    ).first()


def get_all_user_preferences(db: Session, user_id: str | UUID) -> List[UserPreference]:
    """Get all user preferences"""
    return db.query(UserPreference).filter(UserPreference.user_id == user_id).all()


def set_user_preference(db: Session, user_id: str | UUID, key: str, value: dict) -> UserPreference:
    """Set or update a user preference"""
    pref = get_user_preference(db, user_id, key)
    
    if pref:
        pref.value = json.dumps(value)
    else:
        pref = UserPreference(
            user_id=user_id,
            key=key,
            value=json.dumps(value)
        )
        db.add(pref)
    
    db.commit()
    db.refresh(pref)
    return pref


def delete_user_preference(db: Session, user_id: str | UUID, key: str) -> bool:
    """Delete a user preference"""
    pref = get_user_preference(db, user_id, key)
    if pref:
        db.delete(pref)
        db.commit()
        return True
    return False
