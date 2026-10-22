import enum
from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class PaymentState(str, enum.Enum):
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    gateway_name = Column(String(50), nullable=False, default="razorpay")  # razorpay, cashfree, mock
    gateway_order_id = Column(String(100), nullable=True, index=True)
    gateway_payment_id = Column(String(100), nullable=True, index=True)
    gateway_signature = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default=PaymentState.INITIATED.value, nullable=False, index=True)
    error_code = Column(String(100), nullable=True)
    error_description = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")

class ProcessedWebhookEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "processed_webhook_events"

    event_id = Column(String(100), unique=True, nullable=False, index=True)
    gateway = Column(String(50), nullable=False, default="razorpay")
    event_type = Column(String(100), nullable=False)
    payload_hash = Column(String(64), nullable=True)

