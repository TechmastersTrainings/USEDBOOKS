from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class Address(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "addresses"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    landmark = Column(String(150), nullable=True)
    city = Column(String(100), nullable=False, default="Bidar")
    state = Column(String(100), nullable=False, default="Karnataka")
    pincode = Column(String(10), nullable=False, index=True)
    is_default = Column(Boolean, default=False)
    is_pickup_address = Column(Boolean, default=False)
    is_delivery_address = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="addresses")
