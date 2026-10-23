from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class AddressBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., pattern=r"^(\+91|0)?[6-9]\d{9}$")
    address_line1: str = Field(..., min_length=5, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = Field(None, max_length=150)
    city: str = Field(default="Bidar", min_length=2, max_length=100)
    state: str = Field(default="Karnataka", min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r"^[1-9][0-9]{5}$", description="Valid 6-digit Indian PIN code")
    is_default: bool = False
    is_pickup_address: bool = False
    is_delivery_address: bool = True

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r"^(\+91|0)?[6-9]\d{9}$")
    address_line1: Optional[str] = Field(None, min_length=5, max_length=255)
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, pattern=r"^[1-9][0-9]{5}$")
    is_default: Optional[bool] = None
    is_pickup_address: Optional[bool] = None
    is_delivery_address: Optional[bool] = None

class AddressResponse(AddressBase):
    id: str
    user_id: str

    model_config = ConfigDict(from_attributes=True)

class PincodeLookupResponse(BaseModel):
    pincode: str
    city: str
    state: str
    is_serviceable: bool
    is_pilot_zone: bool
    estimated_delivery_days: str
