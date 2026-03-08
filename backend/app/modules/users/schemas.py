from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    is_active: bool = True
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int

    model_config = {"from_attributes": True}

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
