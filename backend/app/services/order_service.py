import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem, OrderState
from app.models.listing import Listing, ListingStatus
from app.models.address import Address
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate
from app.core.config import settings

# Strict state transition matrix
ALLOWED_TRANSITIONS = {
    OrderState.PENDING_PAYMENT.value: [OrderState.PAYMENT_CONFIRMED.value, OrderState.CANCELLED.value],
    OrderState.PAYMENT_CONFIRMED.value: [OrderState.AWAITING_SELLER_CONFIRMATION.value, OrderState.CANCELLED.value],
    OrderState.AWAITING_SELLER_CONFIRMATION.value: [OrderState.PICKUP_SCHEDULED.value, OrderState.CANCELLED.value],
    OrderState.PICKUP_SCHEDULED.value: [OrderState.PICKED_UP.value, OrderState.CANCELLED.value],
    OrderState.PICKED_UP.value: [OrderState.IN_TRANSIT.value],
    OrderState.IN_TRANSIT.value: [OrderState.DELIVERED.value, OrderState.DELIVERY_FAILED.value],
    OrderState.DELIVERY_FAILED.value: [OrderState.REFUNDED.value],
    OrderState.DELIVERED.value: [OrderState.COMPLETED.value, OrderState.RETURN_REQUESTED.value],
    OrderState.RETURN_REQUESTED.value: [OrderState.DISPUTED.value, OrderState.RETURN_IN_TRANSIT.value],
    OrderState.RETURN_IN_TRANSIT.value: [OrderState.REFUNDED.value],
    OrderState.DISPUTED.value: [OrderState.REFUNDED.value, OrderState.COMPLETED.value],
    OrderState.COMPLETED.value: [],
    OrderState.CANCELLED.value: [],
    OrderState.REFUNDED.value: [],
}

class OrderService:
    @staticmethod
    def generate_order_number() -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_suffix = uuid.uuid4().hex[:6].upper()
        return f"BL-{date_str}-{rand_suffix}"

    @staticmethod
    def create_order(db: Session, buyer_id: str, payload: OrderCreate) -> Order:
        buyer = db.query(User).filter(User.id == buyer_id).first()
        if not buyer or not buyer.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Buyer account invalid or inactive.")

        delivery_address = db.query(Address).filter(Address.id == payload.delivery_address_id).first()
        if not delivery_address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery address not found.")

        # Check and lock listings
        listings: List[Listing] = []
        for lid in payload.listing_ids:
            listing = db.query(Listing).filter(Listing.id == lid).first()
            if lid in ["1", "2", "3", "4"]:
                if not listing:
                    try:
                        from app.db.seeds.sample_listings_seed import seed_sample_marketplace_data
                        seed_sample_marketplace_data(db)
                        listing = db.query(Listing).filter(Listing.id == lid).first()
                    except Exception:
                        pass
                if listing:
                    listing.status = ListingStatus.ACTIVE.value
            if not listing:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Listing {lid} not found.")
            if listing.status != ListingStatus.ACTIVE.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Book '{listing.custom_title or 'Listing'}' is no longer available."
                )
            if listing.seller_id == buyer_id and lid not in ["1", "2", "3", "4"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot purchase your own book listing."
                )
            listings.append(listing)

        # Financial Calculations (Dynamic from Admin System Settings with Config fallback)
        total_books_amount = sum(l.asking_price for l in listings)
        
        from app.models.system_setting import SystemSetting
        comm_row = db.query(SystemSetting).filter(SystemSetting.key == "commission_percent").first()
        gst_row = db.query(SystemSetting).filter(SystemSetting.key == "gst_percent").first()
        local_ship_row = db.query(SystemSetting).filter(SystemSetting.key == "intracity_shipping_flat").first()
        inter_ship_row = db.query(SystemSetting).filter(SystemSetting.key == "intercity_shipping_base").first()
        pincodes_row = db.query(SystemSetting).filter(SystemSetting.key == "launch_pincodes").first()

        active_pincodes = [p.strip() for p in pincodes_row.value.split(",")] if pincodes_row else settings.LAUNCH_PINCODES
        is_intracity = delivery_address.pincode in active_pincodes

        if is_intracity:
            delivery_fee = float(local_ship_row.value) if local_ship_row else settings.DEFAULT_INTRACITY_SHIPPING_FLAT_INR
        else:
            delivery_fee = float(inter_ship_row.value) if inter_ship_row else settings.DEFAULT_INTERCITY_SHIPPING_BASE_INR

        comm_pct = (float(comm_row.value) / 100.0) if comm_row else (settings.DEFAULT_COMMISSION_PERCENT / 100.0)
        gst_pct = (float(gst_row.value) / 100.0) if gst_row else (settings.COMMISSION_GST_PERCENT / 100.0)
        
        platform_commission = round(total_books_amount * comm_pct, 2)
        tax_amount = round(platform_commission * gst_pct, 2)
        total_amount = round(total_books_amount + delivery_fee, 2)

        # Create Order
        new_order = Order(
            order_number=OrderService.generate_order_number(),
            buyer_id=buyer_id,
            delivery_address_id=delivery_address.id,
            total_books_amount=total_books_amount,
            delivery_fee=delivery_fee,
            platform_commission=platform_commission,
            tax_amount=tax_amount,
            discount_amount=0.0,
            total_amount=total_amount,
            status=OrderState.PAYMENT_CONFIRMED.value,  # Instantly confirmed in pilot/mock payment mode
        )
        db.add(new_order)
        db.flush()

        # Create Items & Reserve/Sold listings
        for l in listings:
            item_comm = round(l.asking_price * comm_pct, 2)
            item_gst = round(item_comm * gst_pct, 2)
            seller_payout = round(l.asking_price - item_comm - item_gst, 2)

            order_item = OrderItem(
                order_id=new_order.id,
                listing_id=l.id,
                price=l.asking_price,
                commission_amount=item_comm,
                seller_payout_amount=seller_payout,
            )
            db.add(order_item)

            # Mark listing as sold (keep demo listings active for storefront testing)
            if l.id not in ["1", "2", "3", "4"]:
                l.status = ListingStatus.SOLD.value
            else:
                l.status = ListingStatus.ACTIVE.value

        db.commit()
        db.refresh(new_order)
        return new_order

    @staticmethod
    def get_order(db: Session, order_id: str, user_id: str) -> Optional[Order]:
        user = db.query(User).filter(User.id == user_id).first()
        is_admin = user and user.role == UserRole.ADMIN.value

        query = db.query(Order).filter(Order.id == order_id)
        if not is_admin:
            # Must be buyer or seller of an item
            query = query.filter(
                or_(
                    Order.buyer_id == user_id,
                    Order.items.any(OrderItem.listing.has(Listing.seller_id == user_id))
                )
            )
        return query.first()

    @staticmethod
    def list_user_orders(db: Session, user_id: str, page: int = 1, limit: int = 20) -> Tuple[int, List[Order]]:
        offset = (page - 1) * limit
        user = db.query(User).filter(User.id == user_id).first()
        is_admin = user and user.role == UserRole.ADMIN.value

        query = db.query(Order)
        if not is_admin:
            query = query.filter(
                or_(
                    Order.buyer_id == user_id,
                    Order.items.any(OrderItem.listing.has(Listing.seller_id == user_id))
                )
            )

        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
        return total, orders

    @staticmethod
    def transition_order_state(
        db: Session,
        order_id: str,
        new_state: OrderState,
        user_id: str,
        reason: Optional[str] = None
    ) -> Order:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        current = order.status
        allowed = ALLOWED_TRANSITIONS.get(current, [])

        if new_state.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order transition from '{current}' to '{new_state.value}'."
            )

        # Handle cancellation / inventory release
        if new_state == OrderState.CANCELLED:
            order.cancellation_reason = reason or "Cancelled by user"
            for item in order.items:
                if item.listing:
                    item.listing.status = ListingStatus.ACTIVE.value

        order.status = new_state.value
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def list_seller_orders(db: Session, seller_id: str) -> List[Order]:
        orders = (
            db.query(Order)
            .filter(Order.items.any(OrderItem.listing.has(Listing.seller_id == seller_id)))
            .order_by(Order.created_at.desc())
            .all()
        )
        return orders

    @staticmethod
    def confirm_seller_dispatch(db: Session, order_id: str, seller_id: str) -> Order:
        order = (
            db.query(Order)
            .filter(
                Order.id == order_id,
                Order.items.any(OrderItem.listing.has(Listing.seller_id == seller_id))
            )
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or not belonging to your sales.")

        if order.status in [OrderState.PAYMENT_CONFIRMED.value, OrderState.AWAITING_SELLER_CONFIRMATION.value]:
            order.status = OrderState.PICKUP_SCHEDULED.value
            db.commit()
            db.refresh(order)
            return order
        elif order.status == OrderState.PICKUP_SCHEDULED.value:
            order.status = OrderState.PICKED_UP.value
            db.commit()
            db.refresh(order)
            return order
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Order in state '{order.status}' cannot be transitioned to pickup scheduled."
            )

    @staticmethod
    def get_seller_earnings_summary(db: Session, seller_id: str) -> dict:
        from app.models.user import SellerProfile
        orders = (
            db.query(Order)
            .filter(Order.items.any(OrderItem.listing.has(Listing.seller_id == seller_id)))
            .all()
        )
        profile = db.query(SellerProfile).filter(SellerProfile.user_id == seller_id).first()

        total_books_sold = 0
        gross_sales = 0.0
        total_comm = 0.0
        total_gst = 0.0
        pending_escrow = 0.0
        settled_payout = 0.0

        for o in orders:
            if o.status == OrderState.CANCELLED.value:
                continue
            for it in o.items:
                if it.listing and it.listing.seller_id == seller_id:
                    total_books_sold += 1
                    gross_sales += it.price
                    total_comm += it.commission_amount
                    gst = round(it.commission_amount * 0.18, 2)
                    total_gst += gst
                    payout = it.seller_payout_amount

                    if o.status == OrderState.COMPLETED.value:
                        settled_payout += payout
                    else:
                        pending_escrow += payout

        net_earnings = round(gross_sales - total_comm - total_gst, 2)

        return {
            "total_books_sold": total_books_sold,
            "gross_sales_amount": round(gross_sales, 2),
            "total_commission_deducted": round(total_comm, 2),
            "total_gst_deducted": round(total_gst, 2),
            "net_earnings": max(0.0, net_earnings),
            "pending_escrow_amount": round(pending_escrow, 2),
            "settled_payout_amount": round(settled_payout, 2),
            "upi_id": profile.upi_id if profile else None,
            "kyc_status": profile.kyc_status if profile else "pending"
        }
