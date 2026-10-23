import re
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=r"^[6-9]\d{9}$", description="Indian 10-digit mobile number")
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="buyer")

    @field_validator("email", mode="before")
    def clean_email(cls, v):
        if not v:
            return None
        return str(v).strip().lower()

    @field_validator("phone_number", mode="before")
    def clean_phone(cls, v):
        if not v:
            return None
        cleaned = re.sub(r"[\s\-\+]", "", str(v))
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email or 10-digit phone number")
    password: str = Field(..., min_length=1)

    @field_validator("identifier", mode="before")
    def clean_ident(cls, v):
        if not v:
            return ""
        ident = str(v).strip()
        if "@" in ident:
            return ident.lower()
        cleaned = re.sub(r"[\s\-\+]", "", ident)
        if cleaned.startswith("91") and len(cleaned) == 12:
            return cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            return cleaned[1:]
        return cleaned

class OTPSendRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^[6-9]\d{9}$", description="Indian 10-digit mobile number")

    @field_validator("phone_number", mode="before")
    def clean_otp_phone(cls, v):
        if not v:
            return ""
        cleaned = re.sub(r"[\s\-\+]", "", str(v))
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

class OTPSendResponse(BaseModel):
    message: str
    phone_number: str
    cooldown_seconds: int = 60
    # For testing/sandbox environments, expose the OTP code for automated testing
    sandbox_otp: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    otp: str = Field(..., min_length=4, max_length=6)
    full_name: Optional[str] = None

    @field_validator("phone_number", mode="before")
    def clean_verify_phone(cls, v):
        if not v:
            return ""
        cleaned = re.sub(r"[\s\-\+]", "", str(v))
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

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
