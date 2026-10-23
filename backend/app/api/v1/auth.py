from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.api.deps import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.user import User, SellerProfile, UserRole
from app.schemas.user import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    OTPSendRequest, OTPSendResponse, OTPVerifyRequest, TokenRefreshRequest
)
from app.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Normalize email & phone
    normalized_email = user_in.email.strip().lower() if user_in.email else None
    normalized_phone = otp_service.normalize_phone(user_in.phone_number) if user_in.phone_number else None

    # Check for existing email (case-insensitive)
    if normalized_email:
        existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    # Check for existing phone
    if normalized_phone:
        existing_phone = db.query(User).filter(User.phone_number == normalized_phone).first()
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number is already registered.")

    if not normalized_email and not normalized_phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either email or phone number is required.")

    # Create user
    new_user = User(
        full_name=user_in.full_name.strip(),
        email=normalized_email,
        phone_number=normalized_phone,
        hashed_password=hash_password(user_in.password),
        role=user_in.role if user_in.role in [UserRole.BUYER.value, UserRole.SELLER.value] else UserRole.BUYER.value,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.flush()

    # If seller, create empty seller profile
    if new_user.role == UserRole.SELLER.value:
        seller_prof = SellerProfile(
            user_id=new_user.id,
            store_name=f"{new_user.full_name}'s Book Shelf",
            kyc_status="pending",
        )
        db.add(seller_prof)

    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    refresh_token = create_refresh_token(subject=new_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=new_user,
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    ident = login_in.identifier.strip()
    ident_lower = ident.lower()
    normalized_phone = otp_service.normalize_phone(ident)

    user = db.query(User).filter(
        or_(
            func.lower(User.email) == ident_lower,
            User.email == ident,
            User.phone_number == normalized_phone,
            User.phone_number == ident,
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was registered via Mobile OTP without a password. Please sign in using the Mobile OTP tab.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated.")

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )

@router.post("/otp/send", response_model=OTPSendResponse)
def send_otp(otp_in: OTPSendRequest):
    success, message, code = otp_service.request_otp(otp_in.phone_number)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)

    return OTPSendResponse(
        message=message,
        phone_number=otp_service.normalize_phone(otp_in.phone_number),
        cooldown_seconds=otp_service.cooldown_seconds,
        sandbox_otp=code if settings.DEBUG else None,
    )

@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(verify_in: OTPVerifyRequest, db: Session = Depends(get_db)):
    success, message = otp_service.verify_otp(verify_in.phone_number, verify_in.otp)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    normalized_phone = otp_service.normalize_phone(verify_in.phone_number)
    user = db.query(User).filter(User.phone_number == normalized_phone).first()

    if not user:
        # First-time OTP registration: auto-create account
        full_name = verify_in.full_name or f"Reader {normalized_phone[-4:]}"
        user = User(
            full_name=full_name,
            phone_number=normalized_phone,
            role=UserRole.BUYER.value,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Mark phone verified
        if not user.is_verified:
            user.is_verified = True
            db.commit()
            db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(refresh_in: TokenRefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(refresh_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=user,
    )

from pydantic import BaseModel

class ResetPasswordPayload(BaseModel):
    identifier: str
    new_password: str

@router.post("/reset-password", response_model=UserResponse)
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    ident = payload.identifier.strip().lower()
    normalized_phone = otp_service.normalize_phone(ident)
    user = db.query(User).filter(
        or_(
            func.lower(User.email) == ident,
            User.phone_number == normalized_phone,
            User.phone_number == ident,
        )
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user

class SyncUserPayload(BaseModel):
    full_name: str
    email: str
    phone_number: Optional[str] = None
    hashed_password: str

@router.post("/sync-user")
def sync_user(payload: SyncUserPayload, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if user:
        user.hashed_password = payload.hashed_password
        user.full_name = payload.full_name
        if payload.phone_number:
            user.phone_number = payload.phone_number
        db.commit()
        return {"status": "updated", "email": clean_email}
    else:
        user = User(
            full_name=payload.full_name,
            email=clean_email,
            phone_number=payload.phone_number,
            hashed_password=payload.hashed_password,
            role=UserRole.BUYER.value,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        return {"status": "created", "email": clean_email}

@router.delete("/delete-user/{email}")
def delete_user(email: str, db: Session = Depends(get_db)):
    clean_email = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if user:
        db.delete(user)
        db.commit()
        return {"message": f"User {clean_email} deleted successfully."}
    raise HTTPException(status_code=404, detail="User not found.")
