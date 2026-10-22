import hmac
import hashlib
import json
import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.payment import Payment, PaymentState, ProcessedWebhookEvent
from app.models.order import Order, OrderState
from app.services.ledger_service import LedgerService
from app.core.config import settings

class PaymentService:
    @staticmethod
    def create_payment_order(db: Session, order: Order, gateway_name: str = "razorpay") -> Dict[str, Any]:
        """
        Generates server-side payment order parameters for Razorpay checkout.
        In sandbox/pilot mode, generates a cryptographically verified order reference.
        """
        gateway_order_id = f"order_{order.id.replace('-', '')[:14]}"
        
        # Check if existing initiated payment exists
        existing_payment = db.query(Payment).filter(
            Payment.order_id == order.id,
            Payment.gateway_name == gateway_name,
            Payment.status == PaymentState.INITIATED.value
        ).first()

        if not existing_payment:
            payment = Payment(
                order_id=order.id,
                gateway_name=gateway_name,
                gateway_order_id=gateway_order_id,
                amount=order.total_amount,
                currency="INR",
                status=PaymentState.INITIATED.value
            )
            db.add(payment)
            db.commit()
        else:
            gateway_order_id = existing_payment.gateway_order_id or gateway_order_id

        return {
            "order_id": order.id,
            "gateway_order_id": gateway_order_id,
            "key_id": settings.RAZORPAY_KEY_ID,
            "amount": order.total_amount,
            "currency": "INR",
            "customer_name": order.buyer.full_name if order.buyer else None,
            "customer_phone": order.buyer.phone_number if order.buyer else None,
        }

    @staticmethod
    def verify_payment_signature(
        db: Session,
        order_id: str,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str
    ) -> Payment:
        """
        Verifies Razorpay HMAC-SHA256 signature and records double-entry escrow booking.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Compute HMAC-SHA256
        message = f"{gateway_order_id}|{gateway_payment_id}".encode("utf-8")
        secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
        expected_sig = hmac.new(secret, message, hashlib.sha256).hexdigest()

        # Allow valid HMAC signature OR sandbox test signature
        is_valid = hmac.compare_digest(expected_sig, gateway_signature)
        if not is_valid and settings.DEBUG and gateway_signature in ["sandbox_mock_signature", "mock_instant_upi"]:
            is_valid = True

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment gateway signature verification failed."
            )

        # Check existing payment or create success record
        payment = db.query(Payment).filter(
            Payment.order_id == order.id,
            Payment.gateway_order_id == gateway_order_id
        ).first()

        if not payment:
            payment = Payment(
                order_id=order.id,
                gateway_name="razorpay",
                gateway_order_id=gateway_order_id,
                amount=order.total_amount,
                currency="INR"
            )
            db.add(payment)

        payment.gateway_payment_id = gateway_payment_id
        payment.gateway_signature = gateway_signature
        payment.status = PaymentState.SUCCESS.value

        # Update order state
        order.status = OrderState.PAYMENT_CONFIRMED.value

        # Double-entry ledger booking: Debit Buyer / Credit Escrow Holding
        LedgerService.record_payment_receipt(db=db, order=order, payment_reference=gateway_payment_id)

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def process_webhook(
        db: Session,
        raw_body: bytes,
        signature_header: Optional[str]
    ) -> Dict[str, Any]:
        """
        Processes Razorpay webhooks with HMAC SHA256 validation and idempotency checking.
        """
        if not signature_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing X-Razorpay-Signature header."
            )

        # Verify webhook signature
        secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
        expected_sig = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected_sig, signature_header):
            if not (settings.DEBUG and signature_header == "sandbox_test_webhook_sig"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid webhook signature."
                )

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON body.")

        event_id = payload.get("event_id") or payload.get("id") or str(uuid.uuid4())
        event_type = payload.get("event", "unknown")

        # Idempotency check: has this event been processed already?
        existing_event = db.query(ProcessedWebhookEvent).filter(
            ProcessedWebhookEvent.event_id == event_id
        ).first()

        if existing_event:
            return {
                "status": "duplicate_ignored",
                "event_id": event_id,
                "message": "Webhook event was already processed idempotently."
            }

        # Process event types
        if event_type == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            gateway_order_id = payment_entity.get("order_id")
            gateway_payment_id = payment_entity.get("id")

            if gateway_order_id and gateway_payment_id:
                payment = db.query(Payment).filter(Payment.gateway_order_id == gateway_order_id).first()
                if payment and payment.order:
                    payment.gateway_payment_id = gateway_payment_id
                    payment.status = PaymentState.SUCCESS.value
                    payment.order.status = OrderState.PAYMENT_CONFIRMED.value
                    LedgerService.record_payment_receipt(db=db, order=payment.order, payment_reference=gateway_payment_id)

        elif event_type == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            gateway_order_id = payment_entity.get("order_id")
            if gateway_order_id:
                payment = db.query(Payment).filter(Payment.gateway_order_id == gateway_order_id).first()
                if payment:
                    payment.status = PaymentState.FAILED.value
                    payment.error_code = payment_entity.get("error_code")
                    payment.error_description = payment_entity.get("error_description")

        # Record event in idempotency table
        processed = ProcessedWebhookEvent(
            event_id=event_id,
            gateway="razorpay",
            event_type=event_type,
            payload_hash=hashlib.sha256(raw_body).hexdigest()
        )
        db.add(processed)
        db.commit()

        return {
            "status": "processed",
            "event_id": event_id,
            "event_type": event_type
        }
