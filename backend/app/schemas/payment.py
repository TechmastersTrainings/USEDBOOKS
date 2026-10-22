from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class PaymentOrderCreate(BaseModel):
    order_id: str
    gateway_name: str = Field(default="razorpay", description="razorpay or mock")

class PaymentOrderResponse(BaseModel):
    order_id: str
    gateway_order_id: str
    key_id: str
    amount: float
    currency: str = "INR"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class PaymentVerificationRequest(BaseModel):
    order_id: str
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: str

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    gateway_name: str
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LedgerEntryResponse(BaseModel):
    id: str
    order_id: Optional[str] = None
    transaction_reference: str
    account: str
    debit: float
    credit: float
    currency: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderFinancialSummary(BaseModel):
    order_id: str
    order_number: str
    total_amount: float
    escrow_held: float
    seller_payout_target: float
    platform_commission: float
    gst_collected: float
    delivery_fee: float
    is_settled: bool
    entries_count: int
    entries: List[LedgerEntryResponse] = []

class AccountBalanceResponse(BaseModel):
    account: str
    total_debit: float
    total_credit: float
    net_balance: float

class LedgerTrialBalanceResponse(BaseModel):
    accounts: List[AccountBalanceResponse]
    total_debits: float
    total_credits: float
    is_balanced: bool

class SettlementExecutionResponse(BaseModel):
    settled_orders_count: int
    total_settled_amount: float
    details: List[Dict[str, Any]] = []
