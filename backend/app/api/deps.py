from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not auth_header or not auth_header.credentials:
        raise credentials_exception
    
    payload = decode_token(auth_header.credentials)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        try:
            # Ephemeral cloud database resilience:
            # If token signature is cryptographically valid from our SECRET_KEY,
            # auto-rehydrate the user account so server restarts don't orphan active sessions.
            role = payload.get("role", UserRole.BUYER.value)
            user = User(
                id=user_id,
                full_name="User",
                role=role if role in [UserRole.BUYER.value, UserRole.SELLER.value, UserRole.ADMIN.value] else UserRole.BUYER.value,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or user account not found. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_seller(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in [UserRole.SELLER.value, UserRole.ADMIN.value] and not current_user.seller_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller privilege or active seller profile required",
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required",
        )
    return current_user
