from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import OrderState
from app.schemas.order import (
    OrderCreate, OrderResponse, PaginatedOrdersResponse,
    OrderCancellationRequest, OrderDisputeRequest, SellerEarningsSummary
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders & Checkout"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place an order for verified physical used book listings."""
    return OrderService.create_order(db, current_user.id, order_in)

@router.get("", response_model=PaginatedOrdersResponse)
def list_my_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders for the logged-in user (as buyer or seller)."""
    total, orders = OrderService.list_user_orders(db, current_user.id, page=page, limit=limit)
    return PaginatedOrdersResponse(total=total, page=page, limit=limit, items=orders)

@router.get("/seller/list", response_model=List[OrderResponse])
def list_my_seller_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve orders where items were sold by the current logged-in seller."""
    return OrderService.list_seller_orders(db, current_user.id)

@router.get("/seller/earnings", response_model=SellerEarningsSummary)
def get_my_seller_earnings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve financial summary of gross sales, escrow, and settled payouts for seller."""
    data = OrderService.get_seller_earnings_summary(db, current_user.id)
    return SellerEarningsSummary(**data)

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full order details, tracking state, and delivery timeline."""
    order = OrderService.get_order(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: str,
    cancel_in: OrderCancellationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel order before courier pickup and restore book listing to active."""
    order = OrderService.get_order(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    return OrderService.transition_order_state(
        db, order_id, OrderState.CANCELLED, current_user.id, reason=cancel_in.reason
    )

@router.post("/{order_id}/dispute", response_model=OrderResponse)
def dispute_order(
    order_id: str,
    dispute_in: OrderDisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit condition or damage dispute within the T+3 inspection window."""
    order = OrderService.get_order(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    return OrderService.transition_order_state(
        db, order_id, OrderState.RETURN_REQUESTED, current_user.id, reason=dispute_in.reason
    )

@router.post("/{order_id}/confirm-dispatch", response_model=OrderResponse)
def seller_confirm_dispatch(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller marks book packed and ready for pickup, transitioning to pickup_scheduled."""
    return OrderService.confirm_seller_dispatch(db, order_id, current_user.id)
