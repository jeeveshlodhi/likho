from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.modules.auth.schemas import AuthUser, LoginRequest, RegisterRequest, TokenResponse
from app.modules.users import crud

router = APIRouter()


@router.post("/signup", response_model=AuthUser, status_code=status.HTTP_201_CREATED)
def signup(body: RegisterRequest, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    from app.modules.users.schemas import UserCreate
    user = crud.create_user(db, UserCreate(email=body.email, password=body.password, full_name=body.full_name))
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=body.email)
    email_auth = next((auth for auth in user.auth_methods if auth.provider == "email"), None) if user else None
    if not user or not email_auth or not email_auth.password_hash or not verify_password(body.password, email_auth.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")
    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=AuthUser)
def me(db: Session = Depends(get_db), token: str = ""):
    """Placeholder – wire up with OAuth2PasswordBearer when adding protected routes."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Use /api/v1/auth/login to get a token.")
