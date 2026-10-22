from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.order import Order
from app.schemas.payment import (
    PaymentOrderCreate,
    PaymentOrderResponse,
    PaymentVerificationRequest,
    PaymentResponse,
    LedgerEntryResponse,
    OrderFinancialSummary,
    LedgerTrialBalanceResponse,
    SettlementExecutionResponse
)
from app.services.payment_service import PaymentService
from app.services.ledger_service import LedgerService
from app.services.settlement_service import SettlementService

router = APIRouter(prefix="/payments", tags=["Payments, Ledger & Settlements"])

@router.post("/create-order", response_model=PaymentOrderResponse)
def create_payment_order(
    payload: PaymentOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.buyer_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this order.")

    res = PaymentService.create_payment_order(db=db, order=order, gateway_name=payload.gateway_name)
    return PaymentOrderResponse(**res)

@router.post("/verify", response_model=PaymentResponse)
def verify_payment(
    payload: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.buyer_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this order.")

    payment = PaymentService.verify_payment_signature(
        db=db,
        order_id=payload.order_id,
        gateway_order_id=payload.gateway_order_id,
        gateway_payment_id=payload.gateway_payment_id,
        gateway_signature=payload.gateway_signature
    )
    return payment

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    body = await request.body()
    result = PaymentService.process_webhook(
        db=db,
        raw_body=body,
        signature_header=x_razorpay_signature
    )
    return result

@router.get("/ledger/{order_id}", response_model=OrderFinancialSummary)
def get_order_ledger_summary(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    is_buyer = order.buyer_id == current_user.id
    is_seller = any(item.listing and item.listing.seller_id == current_user.id for item in order.items)
    is_admin = current_user.role == UserRole.ADMIN.value

    if not (is_buyer or is_seller or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to order financials.")

    entries = LedgerService.get_order_ledger(db=db, order_id=order.id)
    total_seller_payout = sum(item.seller_payout_amount for item in order.items)

    return OrderFinancialSummary(
        order_id=order.id,
        order_number=order.order_number,
        total_amount=order.total_amount,
        escrow_held=order.total_amount if order.status not in ["COMPLETED", "CANCELLED", "REFUNDED"] else 0.0,
        seller_payout_target=total_seller_payout,
        platform_commission=order.platform_commission,
        gst_collected=order.tax_amount,
        delivery_fee=order.delivery_fee,
        is_settled=order.status == "COMPLETED",
        entries_count=len(entries),
        entries=entries
    )

@router.get("/ledger/balances/trial", response_model=LedgerTrialBalanceResponse)
def get_ledger_trial_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trial = LedgerService.get_trial_balance(db=db)
    return trial

@router.post("/settlements/execute", response_model=SettlementExecutionResponse)
def trigger_settlements(
    force_instant: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = SettlementService.execute_due_settlements(db=db, force_instant=force_instant)
    return result
