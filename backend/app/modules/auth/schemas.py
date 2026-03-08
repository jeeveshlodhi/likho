from pydantic import BaseModel, EmailStr
from uuid import UUID

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AuthUser(BaseModel):
    id: UUID
    email: str
    full_name: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}
