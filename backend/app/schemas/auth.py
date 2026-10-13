from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=128, description="User full name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    gender: Optional[str] = Field("Male", description="Gender selection")
    mobileNumber: Optional[str] = Field("", description="Mobile phone number")
    address: Optional[str] = Field("", description="Address line")
    city: Optional[str] = Field("Bangalore", description="City")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fullName: str
    email: str
    gender: Optional[str] = None
    mobileNumber: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    avatarId: Optional[str] = "owl_avatar_1"
    avatarUri: Optional[str] = None
    is_verified: bool
    createdAt: Optional[str] = None


class UserRegisterResponse(BaseModel):
    success: bool
    message: str
    email: str
    is_verified: bool = False


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class VerifyOtpResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[UserResponse] = None


class ResendOtpRequest(BaseModel):
    email: EmailStr


class ResendOtpResponse(BaseModel):
    success: bool
    message: str
    cooldown_seconds: int = 60


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    token: Optional[str] = None
    user: Optional[UserResponse] = None
    is_verified: bool = True
