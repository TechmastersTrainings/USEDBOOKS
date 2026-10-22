from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, EmailStr

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=r"^(\+91)?[6-9]\d{9}$", description="Indian 10-digit mobile number")
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="buyer")

class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email or 10-digit phone number")
    password: str = Field(..., min_length=1)

class OTPSendRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^(\+91)?[6-9]\d{9}$", description="Indian 10-digit mobile number")

class OTPSendResponse(BaseModel):
    message: str
    phone_number: str
    cooldown_seconds: int = 60
    # For testing/sandbox environments, expose the OTP code for automated testing
    sandbox_otp: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^(\+91)?[6-9]\d{9}$")
    otp: str = Field(..., min_length=4, max_length=6)
    full_name: Optional[str] = None

class SellerProfileResponse(BaseModel):
    id: str
    store_name: Optional[str] = None
    bio: Optional[str] = None
    rating_average: float
    rating_count: float
    upi_id: Optional[str] = None
    kyc_status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class SellerKYCSubmit(BaseModel):
    store_name: Optional[str] = Field(None, min_length=2, max_length=150)
    bio: Optional[str] = None
    upi_id: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$", description="Valid Indian UPI VPA")
    bank_account_number: Optional[str] = Field(None, min_length=9, max_length=18)
    bank_ifsc: Optional[str] = Field(None, pattern=r"^[A-Z]{4}0[A-Z0-9]{6}$", description="Valid 11-character Indian IFSC code")

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    seller_profile: Optional[SellerProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenRefreshRequest(BaseModel):
    refresh_token: str
