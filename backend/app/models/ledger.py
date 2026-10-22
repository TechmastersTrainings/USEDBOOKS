import enum
from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class AccountType(str, enum.Enum):
    ESCROW_HOLDING = "escrow_holding"
    BUYER_PAYABLE = "buyer_payable"
    SELLER_PAYABLE = "seller_payable"
    PLATFORM_COMMISSION_REVENUE = "platform_commission_revenue"
    LOGISTICS_REVENUE = "logistics_revenue"
    LOGISTICS_EXPENSE = "logistics_expense"
    PAYMENT_GATEWAY_EXPENSE = "payment_gateway_expense"
    GST_OUTPUT_TAX = "gst_output_tax"

class LedgerEntry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ledger_entries"

    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_reference = Column(String(100), nullable=False, index=True)
    account = Column(String(50), nullable=False, index=True)  # AccountType enum
    debit = Column(Float, default=0.0, nullable=False)
    credit = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR")
    description = Column(Text, nullable=True)

    order = relationship("Order", back_populates="ledger_entries")
