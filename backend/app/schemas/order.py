from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.order import OrderState
from app.schemas.listing import ListingResponse
from app.schemas.address import AddressResponse

class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    listing_id: str
    price: float
    commission_amount: float
    seller_payout_amount: float
    listing: Optional[ListingResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    delivery_address_id: str
    listing_ids: List[str] = Field(..., min_length=1)
    payment_method: str = Field(default="mock_upi", description="UPI, Card, NetBanking, or Mock Sandbox")

class OrderStatusUpdate(BaseModel):
    status: OrderState
    reason: Optional[str] = None

class OrderCancellationRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)

class OrderDisputeRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=1000)
    evidence_photo_urls: List[str] = Field(default=[])

class OrderResponse(BaseModel):
    id: str
    order_number: str
    buyer_id: str
    delivery_address_id: str
    total_books_amount: float
    delivery_fee: float
    platform_commission: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse] = []
    delivery_address: Optional[AddressResponse] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedOrdersResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[OrderResponse]
