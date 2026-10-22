import enum
from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class OrderState(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    PAYMENT_CONFIRMED = "payment_confirmed"
    AWAITING_SELLER_CONFIRMATION = "awaiting_seller_confirmation"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DELIVERY_FAILED = "delivery_failed"
    RETURN_REQUESTED = "return_requested"
    RETURN_IN_TRANSIT = "return_in_transit"
    REFUNDED = "refunded"
    DISPUTED = "disputed"

class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "orders"

    order_number = Column(String(50), unique=True, index=True, nullable=False)
    buyer_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    delivery_address_id = Column(String(36), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    
    # Financial breakdown
    total_books_amount = Column(Float, nullable=False, default=0.0)
    delivery_fee = Column(Float, nullable=False, default=0.0)
    platform_commission = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)

    # State & Audit
    status = Column(String(50), default=OrderState.PENDING_PAYMENT.value, nullable=False, index=True)
    cancellation_reason = Column(Text, nullable=True)

    # Relationships
    buyer = relationship("User", back_populates="orders")
    delivery_address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order")
    shipments = relationship("Shipment", back_populates="order")
    ledger_entries = relationship("LedgerEntry", back_populates="order")

class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = Column(String(36), ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False, default=0.0)
    seller_payout_amount = Column(Float, nullable=False, default=0.0)

    order = relationship("Order", back_populates="items")
    listing = relationship("Listing", back_populates="order_items")
