from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.order import Order, OrderState
from app.models.listing import Listing, ListingStatus
from app.models.book_catalogue import BookCatalogue
from app.models.user import User, UserRole, SellerProfile
from app.models.system_setting import SystemSetting
from app.services.ledger_service import LedgerService

class AdminService:
    @staticmethod
    def get_platform_overview(db: Session) -> Dict[str, Any]:
        # Orders metrics
        orders = db.query(Order).all()
        total_orders = len(orders)
        
        orders_by_status = {}
        for o in orders:
            orders_by_status[o.status] = orders_by_status.get(o.status, 0) + 1

        total_gmv = round(sum(o.total_amount for o in orders if o.status != OrderState.CANCELLED.value), 2)
        
        escrow_states = [
            OrderState.PAYMENT_CONFIRMED.value,
            OrderState.AWAITING_SELLER_CONFIRMATION.value,
            OrderState.PICKUP_SCHEDULED.value,
            OrderState.PICKED_UP.value,
            OrderState.IN_TRANSIT.value,
            OrderState.DELIVERED.value,
            OrderState.RETURN_REQUESTED.value,
            OrderState.DISPUTED.value,
        ]
        escrow_liability = round(sum(o.total_amount for o in orders if o.status in escrow_states), 2)
        
        completed_orders = [o for o in orders if o.status == OrderState.COMPLETED.value]
        total_platform_revenue = round(sum(o.platform_commission for o in completed_orders), 2)
        total_gst_collected = round(sum(o.tax_amount for o in completed_orders), 2)

        # Users metrics
        users = db.query(User).all()
        total_users = len(users)
        buyers_count = sum(1 for u in users if u.role == UserRole.BUYER.value)
        sellers_count = sum(1 for u in users if u.role == UserRole.SELLER.value or u.seller_profile is not None)

        # Listings & Catalogue
        active_listings_count = db.query(Listing).filter(Listing.status == ListingStatus.ACTIVE.value).count()
        catalogue_titles_count = db.query(BookCatalogue).count()

        # Disputes
        pending_disputes_count = sum(
            1 for o in orders if o.status in [OrderState.RETURN_REQUESTED.value, OrderState.DISPUTED.value]
        )

        return {
            "total_gmv": total_gmv,
            "total_orders": total_orders,
            "orders_by_status": orders_by_status,
            "total_users": total_users,
            "buyers_count": buyers_count,
            "sellers_count": sellers_count,
            "active_listings_count": active_listings_count,
            "catalogue_titles_count": catalogue_titles_count,
            "escrow_liability_balance": escrow_liability,
            "total_platform_revenue": total_platform_revenue,
            "total_gst_collected": total_gst_collected,
            "pending_disputes_count": pending_disputes_count,
        }

    @staticmethod
    def adjudicate_dispute(
        db: Session,
        order_id: str,
        decision: str,
        resolution_notes: str
    ) -> Dict[str, Any]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        valid_dispute_states = [
            OrderState.RETURN_REQUESTED.value,
            OrderState.DISPUTED.value,
            OrderState.DELIVERED.value
        ]
        if order.status not in valid_dispute_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order in state '{order.status}' cannot be adjudicated for dispute."
            )

        if decision == "REFUND_BUYER":
            order.status = OrderState.REFUNDED.value
            # Release escrow liability back to buyer
            LedgerService.record_cancellation_refund(
                db=db,
                order=order,
                refund_reference=f"REFUND-DISPUTE-{order.order_number}",
                reason=resolution_notes
            )
            # Re-activate inventory if returned item is valid or mark listing
            for item in order.items:
                if item.listing and item.listing.status == ListingStatus.SOLD.value:
                    item.listing.status = ListingStatus.ACTIVE.value

            db.commit()
            return {
                "order_id": order.id,
                "order_number": order.order_number,
                "decision": decision,
                "order_status": order.status,
                "amount": order.total_amount,
                "resolution_notes": resolution_notes,
                "message": "Dispute resolved in favor of buyer. 100% Escrow refund released to buyer and inventory returned."
            }

        elif decision == "RELEASE_TO_SELLER":
            order.status = OrderState.COMPLETED.value
            # Settle escrow funds to seller
            payout_ref = f"DISPUTE-SETTLE-SELLER-{order.order_number}"
            LedgerService.record_settlement_disbursement(
                db=db,
                order=order,
                payout_reference=payout_ref
            )
            db.commit()
            return {
                "order_id": order.id,
                "order_number": order.order_number,
                "decision": decision,
                "order_status": order.status,
                "amount": order.total_amount,
                "resolution_notes": resolution_notes,
                "message": "Dispute dismissed upon administrative inspection. Escrow payout released to seller."
            }

        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dispute decision.")

    @staticmethod
    def moderate_listing(
        db: Session,
        listing_id: str,
        action: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

        if action == "APPROVE":
            listing.status = ListingStatus.ACTIVE.value
            msg = "Listing approved and published to public marketplace."
        elif action in ["REJECT", "FLAG_COPYRIGHT"]:
            listing.status = ListingStatus.REJECTED.value
            msg = f"Listing rejected: {notes or 'Content policy violation / defect misrepresentation'}."
        elif action == "SUSPEND":
            listing.status = ListingStatus.PAUSED.value
            msg = f"Listing paused: {notes or 'Temporarily suspended by administrator'}."
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown moderation action {action}.")

        db.commit()
        db.refresh(listing)
        return {
            "listing_id": listing.id,
            "status": listing.status,
            "message": msg
        }

    @staticmethod
    def set_system_setting(
        db: Session,
        key: str,
        value: str,
        description: Optional[str] = None,
        is_public: bool = False
    ) -> SystemSetting:
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not setting:
            setting = SystemSetting(
                key=key,
                value=value,
                description=description,
                is_public=is_public
            )
            db.add(setting)
        else:
            setting.value = value
            if description is not None:
                setting.description = description
            setting.is_public = is_public

        db.commit()
        db.refresh(setting)
        return setting

    @staticmethod
    def get_system_settings(db: Session, public_only: bool = False) -> List[SystemSetting]:
        query = db.query(SystemSetting)
        if public_only:
            query = query.filter(SystemSetting.is_public == True)
        return query.order_by(SystemSetting.key.asc()).all()

    @staticmethod
    def update_user_status(
        db: Session,
        user_id: str,
        is_active: Optional[bool] = None,
        role: Optional[str] = None,
        kyc_status: Optional[str] = None
    ) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if is_active is not None:
            user.is_active = is_active
        if role is not None:
            if role in [UserRole.BUYER.value, UserRole.SELLER.value, UserRole.ADMIN.value]:
                user.role = role
        if kyc_status is not None and user.seller_profile:
            user.seller_profile.kyc_status = kyc_status

        db.commit()
        db.refresh(user)
        return user
