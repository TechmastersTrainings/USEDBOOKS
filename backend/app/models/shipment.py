import enum
from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class ShipmentState(str, enum.Enum):
    PENDING_MANIFEST = "pending_manifest"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    DELIVERY_FAILED = "delivery_failed"
    RETURN_TO_ORIGIN = "return_to_origin"
    RETURNED_TO_SELLER = "returned_to_seller"

class Shipment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "shipments"

    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    courier_provider = Column(String(50), nullable=False, default="mock_courier")  # delhivery, local_rider, mock_courier
    tracking_number = Column(String(100), unique=True, index=True, nullable=True)
    awb_code = Column(String(100), nullable=True)
    shipping_label_url = Column(String(500), nullable=True)
    status = Column(String(50), default=ShipmentState.PENDING_MANIFEST.value, nullable=False, index=True)
    
    # Parcel measurements
    weight_grams = Column(Float, default=350.0)
    length_cm = Column(Float, default=24.0)
    width_cm = Column(Float, default=18.0)
    height_cm = Column(Float, default=4.0)
    chargeable_weight_grams = Column(Float, default=350.0)
    courier_cost = Column(Float, default=40.0)

    # Pickup & Delivery addresses
    pickup_address_id = Column(String(36), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    delivery_address_id = Column(String(36), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)

    delivered_at = Column(DateTime, nullable=True)
    delivery_otp = Column(String(6), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="shipments")
    pickup_address = relationship("Address", foreign_keys=[pickup_address_id])
    delivery_address = relationship("Address", foreign_keys=[delivery_address_id])
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")

class ShipmentEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "shipment_events"

    shipment_id = Column(String(36), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)

    shipment = relationship("Shipment", back_populates="events")
