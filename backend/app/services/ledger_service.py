import uuid
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ledger import LedgerEntry, AccountType
from app.models.order import Order

class LedgerService:
    @staticmethod
    def record_entry(
        db: Session,
        order_id: str,
        transaction_reference: str,
        account: AccountType,
        debit: float = 0.0,
        credit: float = 0.0,
        description: str = "",
        currency: str = "INR"
    ) -> LedgerEntry:
        entry = LedgerEntry(
            order_id=order_id,
            transaction_reference=transaction_reference,
            account=account.value if hasattr(account, 'value') else str(account),
            debit=round(debit, 2),
            credit=round(credit, 2),
            description=description,
            currency=currency
        )
        db.add(entry)
        return entry

    @classmethod
    def record_payment_receipt(
        cls,
        db: Session,
        order: Order,
        payment_reference: str
    ) -> List[LedgerEntry]:
        """
        Double-entry for payment receipt into escrow:
        Debit: BUYER_PAYABLE (cash inflow received from buyer gateway)
        Credit: ESCROW_HOLDING (nodal escrow liability to be released after T+3 inspection)
        """
        tx_ref = f"TX-RECEIPT-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        amount = round(order.total_amount, 2)

        entry1 = cls.record_entry(
            db=db,
            order_id=order.id,
            transaction_reference=tx_ref,
            account=AccountType.BUYER_PAYABLE,
            debit=amount,
            credit=0.0,
            description=f"Payment received via {payment_reference} for order #{order.order_number}"
        )

        entry2 = cls.record_entry(
            db=db,
            order_id=order.id,
            transaction_reference=tx_ref,
            account=AccountType.ESCROW_HOLDING,
            debit=0.0,
            credit=amount,
            description=f"Escrow lock for order #{order.order_number} held pending T+3 delivery inspection"
        )

        db.flush()
        return [entry1, entry2]

    @classmethod
    def record_cancellation_refund(
        cls,
        db: Session,
        order: Order,
        refund_reference: str,
        reason: str = ""
    ) -> List[LedgerEntry]:
        """
        Double-entry for order cancellation refund:
        Debit: ESCROW_HOLDING (release escrow liability)
        Credit: BUYER_PAYABLE (refund funds to buyer)
        """
        tx_ref = f"TX-REFUND-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        amount = round(order.total_amount, 2)

        entry1 = cls.record_entry(
            db=db,
            order_id=order.id,
            transaction_reference=tx_ref,
            account=AccountType.ESCROW_HOLDING,
            debit=amount,
            credit=0.0,
            description=f"Escrow released for cancellation of order #{order.order_number}: {reason}"
        )

        entry2 = cls.record_entry(
            db=db,
            order_id=order.id,
            transaction_reference=tx_ref,
            account=AccountType.BUYER_PAYABLE,
            debit=0.0,
            credit=amount,
            description=f"Refund issued via {refund_reference} for order #{order.order_number}"
        )

        db.flush()
        return [entry1, entry2]

    @classmethod
    def record_settlement_disbursement(
        cls,
        db: Session,
        order: Order,
        payout_reference: str
    ) -> List[LedgerEntry]:
        """
        Double-entry settlement post T+3 delivery inspection window:
        Debit:  ESCROW_HOLDING               (Total gross order amount held)
        Credit: SELLER_PAYABLE               (Net payout to sellers)
        Credit: PLATFORM_COMMISSION_REVENUE  (Platform fee revenue)
        Credit: GST_OUTPUT_TAX               (GST on platform fees 18%)
        Credit: LOGISTICS_REVENUE            (Courier fee collected)
        """
        tx_ref = f"TX-SETTLE-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        gross_amount = round(order.total_amount, 2)
        total_seller_payout = round(sum(item.seller_payout_amount for item in order.items), 2)
        commission = round(order.platform_commission, 2)
        tax = round(order.tax_amount, 2)
        logistics = round(order.delivery_fee, 2)

        # Micro-rounding adjustment to guarantee exact debit == credit balance
        credits_sum = round(total_seller_payout + commission + tax + logistics, 2)
        diff = round(gross_amount - credits_sum, 2)
        if diff != 0.0:
            total_seller_payout = round(total_seller_payout + diff, 2)

        entries = []

        # Debit Escrow Holding
        entries.append(
            cls.record_entry(
                db=db,
                order_id=order.id,
                transaction_reference=tx_ref,
                account=AccountType.ESCROW_HOLDING,
                debit=gross_amount,
                credit=0.0,
                description=f"Disbursement of escrow liability for order #{order.order_number}"
            )
        )

        # Credit Seller Payable
        entries.append(
            cls.record_entry(
                db=db,
                order_id=order.id,
                transaction_reference=tx_ref,
                account=AccountType.SELLER_PAYABLE,
                debit=0.0,
                credit=total_seller_payout,
                description=f"Seller payout disbursement via {payout_reference} for order #{order.order_number}"
            )
        )

        # Credit Platform Commission Revenue
        entries.append(
            cls.record_entry(
                db=db,
                order_id=order.id,
                transaction_reference=tx_ref,
                account=AccountType.PLATFORM_COMMISSION_REVENUE,
                debit=0.0,
                credit=commission,
                description=f"Platform commission (10%) for order #{order.order_number}"
            )
        )

        # Credit GST Output Tax
        entries.append(
            cls.record_entry(
                db=db,
                order_id=order.id,
                transaction_reference=tx_ref,
                account=AccountType.GST_OUTPUT_TAX,
                debit=0.0,
                credit=tax,
                description=f"GST Output Tax (18% on platform fee) for order #{order.order_number}"
            )
        )

        # Credit Logistics Revenue
        entries.append(
            cls.record_entry(
                db=db,
                order_id=order.id,
                transaction_reference=tx_ref,
                account=AccountType.LOGISTICS_REVENUE,
                debit=0.0,
                credit=logistics,
                description=f"Doorstep courier delivery fee for order #{order.order_number}"
            )
        )

        db.flush()
        return entries

    @staticmethod
    def get_order_ledger(db: Session, order_id: str) -> List[LedgerEntry]:
        return db.query(LedgerEntry).filter(LedgerEntry.order_id == order_id).order_by(LedgerEntry.created_at.asc()).all()

    @staticmethod
    def get_trial_balance(db: Session) -> Dict:
        """
        Aggregates debits and credits across all accounts to verify ledger integrity.
        Fundamental accounting invariant: sum(Debits) == sum(Credits).
        """
        results = db.query(
            LedgerEntry.account,
            func.sum(LedgerEntry.debit).label("total_debit"),
            func.sum(LedgerEntry.credit).label("total_credit")
        ).group_by(LedgerEntry.account).all()

        accounts = []
        overall_debits = 0.0
        overall_credits = 0.0

        for r in results:
            deb = round(float(r.total_debit or 0.0), 2)
            cred = round(float(r.total_credit or 0.0), 2)
            overall_debits += deb
            overall_credits += cred
            accounts.append({
                "account": r.account,
                "total_debit": deb,
                "total_credit": cred,
                "net_balance": round(deb - cred, 2)
            })

        overall_debits = round(overall_debits, 2)
        overall_credits = round(overall_credits, 2)
        is_balanced = abs(overall_debits - overall_credits) < 0.01

        return {
            "accounts": accounts,
            "total_debits": overall_debits,
            "total_credits": overall_credits,
            "is_balanced": is_balanced
        }
