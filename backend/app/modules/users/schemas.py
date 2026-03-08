from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from .enums import PlanType, ThemeType, AuthProvider, DeviceType, MemberRole


# ============================================================
# USER SCHEMAS
# ============================================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None
    theme: Optional[ThemeType] = None


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences"""
    timezone: Optional[str] = None
    locale: Optional[str] = None
    theme: Optional[ThemeType] = None
    plan: Optional[PlanType] = None


class UserResponse(UserBase):
    """Public user response schema (no sensitive data)"""
    id: UUID
    email_verified: bool
    timezone: str
    locale: str
    theme: ThemeType
    plan: PlanType
    is_active: bool
    last_seen_at: Optional[datetime] = None
    onboarded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserDetailedResponse(UserResponse):
    """Detailed user response with additional information"""
    storage_used: int
    storage_limit: int
    plan_expires_at: Optional[datetime] = None
    email_verified: bool

    class Config:
        from_attributes = True


class UserInDBBase(UserBase):
    """Base schema for user data from database"""
    id: UUID
    email_verified: bool
    timezone: str
    locale: str
    theme: ThemeType
    plan: PlanType
    plan_expires_at: Optional[datetime]
    storage_used: int
    storage_limit: int
    is_active: bool
    last_seen_at: Optional[datetime]
    onboarded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserInDB(UserInDBBase):
    """User schema from database with relationships"""
    pass


# ============================================================
# USER AUTH SCHEMAS
# ============================================================

class UserAuthBase(BaseModel):
    """Base schema for user authentication methods"""
    provider: AuthProvider


class UserAuthCreate(UserAuthBase):
    """Schema for creating a new authentication method"""
    provider_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None


class UserAuthResponse(UserAuthBase):
    """Public response schema for user auth (no tokens)"""
    id: UUID
    provider: AuthProvider
    provider_id: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# SESSION SCHEMAS
# ============================================================

class SessionCreate(BaseModel):
    """Schema for creating a new session"""
    token_hash: str
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_tauri: bool = False


class SessionResponse(BaseModel):
    """Response schema for session"""
    id: UUID
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    ip_address: Optional[str] = None
    is_tauri: bool
    last_active_at: datetime
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# API KEY SCHEMAS
# ============================================================

class APIKeyCreate(BaseModel):
    """Schema for creating a new API key"""
    name: str = Field(..., min_length=1, max_length=255)
    scopes: Optional[str] = Field(None, description="Comma-separated scopes: read,write,admin")
    expires_at: Optional[datetime] = None


class APIKeyResponse(BaseModel):
    """Response schema for API key (without full key)"""
    id: UUID
    name: str
    key_prefix: str  # first 8 characters for display
    scopes: str
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class APIKeyCreateResponse(APIKeyResponse):
    """Response when creating API key - includes the full key once"""
    key: str = Field(..., description="Full API key - only shown once at creation")


# ============================================================
# USER PREFERENCE SCHEMAS
# ============================================================

class UserPreferenceCreate(BaseModel):
    """Schema for creating a user preference"""
    key: str = Field(..., min_length=1, max_length=100)
    value: str


class UserPreferenceResponse(BaseModel):
    """Response schema for user preference"""
    id: UUID
    key: str
    value: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# DEVICE REGISTRY SCHEMAS
# ============================================================

class DeviceRegisterCreate(BaseModel):
    """Schema for registering a new device"""
    device_id: str
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    platform: Optional[str] = None


class DeviceRegistryResponse(BaseModel):
    """Response schema for device registry"""
    id: UUID
    device_id: str
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    platform: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AUTH REQUEST/RESPONSE SCHEMAS
# ============================================================

class SignUpRequest(BaseModel):
    """Schema for user sign up"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    username: Optional[str] = None


class SignUpResponse(BaseModel):
    """Response schema for sign up"""
    user: UserResponse
    message: str


class SignInRequest(BaseModel):
    """Schema for user sign in"""
    email: EmailStr
    password: str


class SignInResponse(BaseModel):
    """Response schema for sign in"""
    user: UserResponse
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Schema for token refresh"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Response schema for token refresh"""
    access_token: str
    token_type: str = "bearer"


class PasswordChangeRequest(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset"""
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class EmailVerificationRequest(BaseModel):
    """Schema for requesting email verification"""
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    """Schema for confirming email verification"""
    token: str
