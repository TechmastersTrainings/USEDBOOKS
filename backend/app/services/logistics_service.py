import random
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.shipment import Shipment, ShipmentEvent, ShipmentState
from app.models.order import Order, OrderState
from app.models.address import Address
from app.schemas.shipment import ShippingRateQuoteRequest
from app.services.courier_adapters import CourierFactory

class LogisticsService:
    @staticmethod
    def get_rate_quote(payload: ShippingRateQuoteRequest) -> Dict[str, Any]:
        adapter = CourierFactory.get_adapter(payload.origin_pincode, payload.destination_pincode)
        res = adapter.calculate_rate(
            origin_pin=payload.origin_pincode,
            dest_pin=payload.destination_pincode,
            weight_grams=payload.weight_grams,
            length_cm=payload.length_cm,
            width_cm=payload.width_cm,
            height_cm=payload.height_cm
        )
        return {
            "origin_pincode": payload.origin_pincode,
            "destination_pincode": payload.destination_pincode,
            **res
        }

    @staticmethod
    def manifest_order_shipment(
        db: Session,
        order_id: str,
        courier_provider: Optional[str] = None,
        pickup_address_id: Optional[str] = None,
        parcel_weight_grams: float = 350.0
    ) -> Shipment:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        # Check existing active shipment
        existing = db.query(Shipment).filter(Shipment.order_id == order.id).first()
        if existing and existing.status != ShipmentState.DELIVERY_FAILED.value:
            return existing

        # Determine pickup address
        if not pickup_address_id:
            # Locate from first item's listing
            if order.items and order.items[0].listing and order.items[0].listing.pickup_address_id:
                pickup_address_id = order.items[0].listing.pickup_address_id
            else:
                # Fallback to seller default address
                seller_id = order.items[0].listing.seller_id if order.items else None
                seller_addr = db.query(Address).filter(Address.user_id == seller_id).first()
                if not seller_addr:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Seller pickup address not found.")
                pickup_address_id = seller_addr.id

        pickup_addr = db.query(Address).filter(Address.id == pickup_address_id).first()
        delivery_addr = order.delivery_address

        if not delivery_addr:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order delivery address missing.")

        # Select Courier Adapter
        if courier_provider:
            adapter = CourierFactory.get_adapter_by_name(courier_provider)
        else:
            adapter = CourierFactory.get_adapter(pickup_addr.pincode, delivery_addr.pincode)

        manifest = adapter.manifest_shipment(
            order_number=order.order_number,
            pickup_pin=pickup_addr.pincode,
            delivery_pin=delivery_addr.pincode,
            weight_grams=parcel_weight_grams
        )

        # Generate 6-digit delivery verification OTP
        delivery_otp = f"{random.randint(100000, 999999)}"

        new_shipment = Shipment(
            order_id=order.id,
            courier_provider=manifest["courier_provider"],
            tracking_number=manifest["tracking_number"],
            awb_code=manifest["awb_code"],
            shipping_label_url=manifest["shipping_label_url"],
            status=ShipmentState.PICKUP_SCHEDULED.value,
            weight_grams=parcel_weight_grams,
            chargeable_weight_grams=parcel_weight_grams,
            courier_cost=manifest["courier_cost"],
            pickup_address_id=pickup_addr.id,
            delivery_address_id=delivery_addr.id,
            delivery_otp=delivery_otp
        )
        db.add(new_shipment)
        db.flush()

        # Initial Tracking Event
        event = ShipmentEvent(
            shipment_id=new_shipment.id,
            status=ShipmentState.PICKUP_SCHEDULED.value,
            location=f"{pickup_addr.city} ({pickup_addr.pincode})",
            details=manifest.get("initial_event", "Shipment manifested. Pickup scheduled.")
        )
        db.add(event)

        # Sync Order Status
        order.status = OrderState.PICKUP_SCHEDULED.value

        db.commit()
        db.refresh(new_shipment)
        return new_shipment

    @staticmethod
    def update_milestone(
        db: Session,
        shipment_id: str,
        new_status: ShipmentState,
        location: Optional[str] = None,
        details: Optional[str] = None,
        delivery_otp: Optional[str] = None
    ) -> Shipment:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found.")

        # If marking DELIVERED, verify OTP
        if new_status == ShipmentState.DELIVERED or new_status.value == ShipmentState.DELIVERED.value:
            if shipment.delivery_otp and delivery_otp and shipment.delivery_otp != delivery_otp:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid delivery verification OTP.")
            shipment.delivered_at = datetime.now(timezone.utc)
            if shipment.order:
                shipment.order.status = OrderState.DELIVERED.value

        elif new_status == ShipmentState.PICKED_UP or new_status.value == ShipmentState.PICKED_UP.value:
            if shipment.order:
                shipment.order.status = OrderState.PICKED_UP.value

        elif new_status in [ShipmentState.IN_TRANSIT, ShipmentState.OUT_FOR_DELIVERY] or new_status.value in [ShipmentState.IN_TRANSIT.value, ShipmentState.OUT_FOR_DELIVERY.value]:
            if shipment.order:
                shipment.order.status = OrderState.IN_TRANSIT.value

        shipment.status = new_status.value if hasattr(new_status, 'value') else str(new_status)

        # Log event
        event = ShipmentEvent(
            shipment_id=shipment.id,
            status=shipment.status,
            location=location or (shipment.delivery_address.city if shipment.delivery_address else "In Transit"),
            details=details or f"Shipment milestone updated to {shipment.status.replace('_', ' ').title()}"
        )
        db.add(event)
        db.commit()
        db.refresh(shipment)
        return shipment

    @staticmethod
    def verify_delivery_with_otp(
        db: Session,
        shipment_id: str,
        delivery_otp: str
    ) -> Shipment:
        return LogisticsService.update_milestone(
            db=db,
            shipment_id=shipment_id,
            new_status=ShipmentState.DELIVERED,
            location="Buyer Doorstep",
            details="Package handed over to recipient upon OTP verification.",
            delivery_otp=delivery_otp
        )
