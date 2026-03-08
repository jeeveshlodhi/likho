from sqlalchemy.orm import Session
from app.modules.users.models import User, UserAuth
from app.modules.users.schemas import UserCreate
from app.core.security import get_password_hash

from uuid import UUID

def get_user(db: Session, user_id: str | UUID):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, full_name=user.full_name)
    db_auth = UserAuth(provider="email", password_hash=hashed_password)
    db_user.auth_methods.append(db_auth)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
