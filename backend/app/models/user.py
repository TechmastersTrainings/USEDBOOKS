from sqlalchemy import Column, String, Boolean, Enum, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class UserRole(str, enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"
    MODERATOR = "moderator"
    RIDER = "rider"

class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default=UserRole.BUYER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)

    # Relationships
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    listings = relationship("Listing", back_populates="seller")
    orders = relationship("Order", back_populates="buyer")

class SellerProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "seller_profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    store_name = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    rating_average = Column(Float, default=5.0)
    rating_count = Column(Float, default=0.0)
    upi_id = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    kyc_status = Column(String(50), default="pending")  # pending, verified, rejected
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="seller_profile")
