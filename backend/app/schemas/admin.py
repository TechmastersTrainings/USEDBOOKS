from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.order import OrderResponse
from app.schemas.listing import ListingResponse

class AdminPlatformOverview(BaseModel):
    total_gmv: float
    total_orders: int
    orders_by_status: Dict[str, int]
    total_users: int
    buyers_count: int
    sellers_count: int
    active_listings_count: int
    catalogue_titles_count: int
    escrow_liability_balance: float
    total_platform_revenue: float
    total_gst_collected: float
    pending_disputes_count: int

class DisputeItemResponse(BaseModel):
    order: OrderResponse
    dispute_reason: str
    created_at: datetime

class DisputeResolutionRequest(BaseModel):
    decision: Literal["REFUND_BUYER", "RELEASE_TO_SELLER"]
    resolution_notes: str = Field(..., min_length=5, max_length=1000)

class DisputeResolutionResponse(BaseModel):
    order_id: str
    order_number: str
    decision: str
    order_status: str
    message: str
    amount: float
    resolution_notes: str

class ListingModerationRequest(BaseModel):
    action: Literal["APPROVE", "REJECT", "SUSPEND", "FLAG_COPYRIGHT"]
    moderation_notes: Optional[str] = None

class ListingModerationResponse(BaseModel):
    listing_id: str
    status: str
    message: str

class SystemSettingCreateUpdate(BaseModel):
    key: str = Field(..., min_length=2, max_length=100)
    value: str
    description: Optional[str] = None
    is_public: bool = False

class SystemSettingResponse(BaseModel):
    id: str
    key: str
    value: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    kyc_status: Optional[str] = None
