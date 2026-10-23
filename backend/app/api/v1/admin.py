from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.models.order import Order, OrderState
from app.models.listing import Listing, ListingStatus
from app.schemas.admin import (
    AdminPlatformOverview,
    DisputeResolutionRequest,
    DisputeResolutionResponse,
    ListingModerationRequest,
    ListingModerationResponse,
    SystemSettingCreateUpdate,
    SystemSettingResponse,
    UserStatusUpdateRequest,
    AdminOrderStatusUpdate
)
from app.schemas.order import OrderResponse
from app.schemas.listing import ListingResponse
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Administration, Moderation & Governance"])

@router.get("/orders", response_model=List[OrderResponse])
def list_all_orders(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    return query.order_by(Order.created_at.desc()).limit(limit).all()

@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status_admin(
    order_id: str,
    payload: AdminOrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    
    order.status = payload.status
    if payload.status == OrderState.COMPLETED.value:
        try:
            from app.services.ledger_service import LedgerService
            LedgerService.record_settlement_disbursement(db=db, order=order, payout_reference=f"ADMIN-SETTLE-{order.order_number}")
        except Exception:
            pass
    db.commit()
    db.refresh(order)
    return order

@router.get("/overview", response_model=AdminPlatformOverview)
def get_platform_overview(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    overview = AdminService.get_platform_overview(db=db)
    return AdminPlatformOverview(**overview)

@router.get("/disputes", response_model=List[OrderResponse])
def list_pending_disputes(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    disputed_orders = db.query(Order).filter(
        Order.status.in_([OrderState.RETURN_REQUESTED.value, OrderState.DISPUTED.value])
    ).order_by(Order.created_at.desc()).all()
    return disputed_orders

@router.post("/disputes/{order_id}/adjudicate", response_model=DisputeResolutionResponse)
def adjudicate_dispute(
    order_id: str,
    payload: DisputeResolutionRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    res = AdminService.adjudicate_dispute(
        db=db,
        order_id=order_id,
        decision=payload.decision,
        resolution_notes=payload.resolution_notes
    )
    return DisputeResolutionResponse(**res)

@router.get("/moderation/listings", response_model=List[ListingResponse])
def get_listings_for_moderation(
    status_filter: Optional[str] = Query(None, description="pending_moderation, active, rejected, paused"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Listing)
    if status_filter:
        query = query.filter(Listing.status == status_filter)
    else:
        query = query.filter(Listing.status.in_([ListingStatus.PENDING_MODERATION.value, ListingStatus.ACTIVE.value]))
    
    return query.order_by(Listing.created_at.desc()).limit(100).all()

@router.post("/moderation/listings/{listing_id}", response_model=ListingModerationResponse)
def moderate_listing(
    listing_id: str,
    payload: ListingModerationRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    res = AdminService.moderate_listing(
        db=db,
        listing_id=listing_id,
        action=payload.action,
        notes=payload.moderation_notes
    )
    return ListingModerationResponse(**res)

@router.get("/settings", response_model=List[SystemSettingResponse])
def list_system_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return AdminService.get_system_settings(db=db, public_only=False)

@router.post("/settings", response_model=SystemSettingResponse)
def create_or_update_setting(
    payload: SystemSettingCreateUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    setting = AdminService.set_system_setting(
        db=db,
        key=payload.key,
        value=payload.value,
        description=payload.description,
        is_public=payload.is_public
    )
    return setting

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).limit(limit).all()

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    updated = AdminService.update_user_status(
        db=db,
        user_id=user_id,
        is_active=payload.is_active,
        role=payload.role,
        kyc_status=payload.kyc_status
    )
    return updated
