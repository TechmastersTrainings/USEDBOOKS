import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.order import Order, OrderState
from app.models.user import User
from app.services.ledger_service import LedgerService
from app.core.config import settings

class SettlementService:
    @staticmethod
    def execute_due_settlements(
        db: Session,
        force_instant: bool = False
    ) -> Dict[str, Any]:
        """
        Scans for DELIVERED orders whose T+3 inspection hold window has elapsed,
        calculates seller payout allocations, creates double-entry ledger entries,
        and transitions the orders to COMPLETED.
        """
        now = datetime.now(timezone.utc)
        hold_days = 0 if force_instant else settings.SETTLEMENT_HOLD_DAYS
        cutoff_time = now - timedelta(days=hold_days)

        # Query orders in DELIVERED state
        delivered_orders = db.query(Order).filter(
            Order.status == OrderState.DELIVERED.value
        ).all()

        settled_orders = []
        total_settled_amount = 0.0

        for order in delivered_orders:
            # Check elapsed inspection period
            order_updated = order.updated_at
            if order_updated and order_updated.tzinfo is None:
                order_updated = order_updated.replace(tzinfo=timezone.utc)

            if not force_instant and order_updated and order_updated > cutoff_time:
                continue  # Still within active T+3 inspection window

            # Calculate total seller payout across all items
            payout_amount = sum(item.seller_payout_amount for item in order.items)

            # Retrieve seller information
            seller_refs = []
            for item in order.items:
                if item.listing and item.listing.seller:
                    seller: User = item.listing.seller
                    profile = seller.seller_profile
                    payout_dest = profile.upi_id if (profile and profile.upi_id) else (
                        f"A/C:{profile.bank_account_number}" if (profile and profile.bank_account_number) else "Pending KYC"
                    )
                    seller_refs.append(f"{seller.full_name} ({payout_dest})")

            payout_ref = f"SETTLE-UPI-{uuid.uuid4().hex[:8].upper()}"

            # Post double-entry settlement entries:
            # Debit ESCROW_HOLDING, Credit SELLER_PAYABLE, COMMISSION, GST, LOGISTICS
            LedgerService.record_settlement_disbursement(
                db=db,
                order=order,
                payout_reference=payout_ref
            )

            # Move order to COMPLETED
            order.status = OrderState.COMPLETED.value
            total_settled_amount += payout_amount

            settled_orders.append({
                "order_id": order.id,
                "order_number": order.order_number,
                "gross_order_amount": order.total_amount,
                "seller_payout_amount": round(payout_amount, 2),
                "platform_commission": order.platform_commission,
                "gst_tax": order.tax_amount,
                "delivery_fee": order.delivery_fee,
                "payout_reference": payout_ref,
                "recipients": seller_refs
            })

        db.commit()

        return {
            "settled_orders_count": len(settled_orders),
            "total_settled_amount": round(total_settled_amount, 2),
            "details": settled_orders
        }
