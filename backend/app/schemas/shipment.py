from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.shipment import ShipmentState

class ShippingRateQuoteRequest(BaseModel):
    origin_pincode: str = Field(..., min_length=6, max_length=6)
    destination_pincode: str = Field(..., min_length=6, max_length=6)
    weight_grams: float = Field(default=350.0, ge=10.0, le=25000.0)
    length_cm: float = Field(default=24.0, ge=1.0)
    width_cm: float = Field(default=18.0, ge=1.0)
    height_cm: float = Field(default=4.0, ge=0.5)

class ShippingRateQuoteResponse(BaseModel):
    origin_pincode: str
    destination_pincode: str
    courier_provider: str
    is_intracity_pilot: bool
    delivery_fee: float
    estimated_delivery_days: int
    volumetric_weight_grams: float
    chargeable_weight_grams: float

class ShipmentManifestCreate(BaseModel):
    order_id: str
    courier_provider: Optional[str] = None
    pickup_address_id: Optional[str] = None
    parcel_weight_grams: float = Field(default=350.0, ge=10.0)

class ShipmentEventResponse(BaseModel):
    id: str
    status: str
    location: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ShipmentResponse(BaseModel):
    id: str
    order_id: str
    courier_provider: str
    tracking_number: Optional[str] = None
    awb_code: Optional[str] = None
    shipping_label_url: Optional[str] = None
    status: str
    delivery_otp: Optional[str] = None
    chargeable_weight_grams: float
    courier_cost: float
    delivered_at: Optional[datetime] = None
    created_at: datetime
    events: List[ShipmentEventResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ShipmentMilestoneUpdateRequest(BaseModel):
    status: ShipmentState
    location: Optional[str] = None
    details: Optional[str] = None
    delivery_otp: Optional[str] = None

class DeliveryVerificationRequest(BaseModel):
    delivery_otp: str = Field(..., min_length=4, max_length=6)
