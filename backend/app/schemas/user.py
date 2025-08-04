from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import datetime

# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    
    @field_validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'El nombre de usuario debe ser alfanumérico'
        return v

# Schema for user creation
class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

# Schema for user update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    
    @field_validator('username')
    def username_alphanumeric(cls, v):
        if v is not None:
            assert v.isalnum(), 'El nombre de usuario debe ser alfanumérico'
        return v
    
    @field_validator('password')
    def password_min_length(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v

# Schema for user in database
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Schema for user response
class User(UserInDBBase):
    pass

# Schema with password (internal use only)
class UserInDB(UserInDBBase):
    hashed_password: str

# Authentication schemas
class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None