"""
Auth router — handles signup, login, and password reset.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import (
    create_access_token,
    verify_password,
    create_password_reset_token,
    verify_password_reset_token,
    get_password_hash,
)
from app.core.email import send_password_reset_email
from app.core.config import settings
from app.dependencies.rate_limit import rate_limit_auth, rate_limit_authenticated
from app.modules.auth.schemas import AuthUser, LoginRequest, RegisterRequest, TokenResponse
from app.modules.users.models import User
from app.modules.users import crud
from app.modules.users.schemas import (
    SignInResponse,
    UserResponse as FullUserResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)

router = APIRouter()


async def _send_new_user_notification(db: Session, user_id):
    """Background task to send notification for new user signup."""
    try:
        from app.modules.notifications.integration import notify_new_user_signup
        
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            await notify_new_user_signup(db, user)
    except Exception:
        # Fail silently - don't break the signup flow
        pass


@router.post("/signup", response_model=AuthUser, status_code=status.HTTP_201_CREATED)
def signup(
    body: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_auth)
):
    if crud.get_user_by_email(db, email=body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    from app.modules.users.schemas import UserCreate
    user = crud.create_user(db, UserCreate(email=body.email, password=body.password, full_name=body.full_name))
    
    # Send notification in background for new beta signups
    background_tasks.add_task(_send_new_user_notification, db, user.id)
    
    return user


@router.post("/login", response_model=SignInResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_auth)
):
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
    access_token = create_access_token(data={"sub": str(user.id)})
    return SignInResponse(
        user=FullUserResponse.model_validate(user),
        access_token=access_token,
    )


@router.get("/me", response_model=AuthUser)
def me(
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """Return the currently authenticated user."""
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    body: PasswordResetRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_auth)
):
    """
    Request a password reset email.
    Always returns 200 OK to prevent email enumeration attacks.
    """
    user = crud.get_user_by_email(db, email=body.email)
    
    if user:
        # Generate reset token
        token = create_password_reset_token(str(user.id))
        
        # Build reset link
        reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        
        # Send email in background
        send_password_reset_email(user.email, reset_link)
    
    # Always return success, even if email doesn't exist (security best practice)
    return {
        "message": "If an account exists with this email, you will receive password reset instructions."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    body: PasswordResetConfirm,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_auth)
):
    """
    Reset password using a valid reset token.
    """
    # Verify token and get user_id
    user_id = verify_password_reset_token(body.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )
    
    # Get user
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    
    # Find email auth method
    email_auth = next((auth for auth in user.auth_methods if auth.provider == "email"), None)
    if not email_auth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account does not support password authentication.",
        )
    
    # Check passwords match
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )
    
    # Update password
    email_auth.password_hash = get_password_hash(body.new_password)
    db.commit()
    
    return {"message": "Password reset successfully. You can now sign in with your new password."}
