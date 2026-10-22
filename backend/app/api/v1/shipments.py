from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.shipment import Shipment
from app.schemas.shipment import (
    ShippingRateQuoteRequest,
    ShippingRateQuoteResponse,
    ShipmentManifestCreate,
    ShipmentResponse,
    ShipmentMilestoneUpdateRequest,
    DeliveryVerificationRequest
)
from app.services.logistics_service import LogisticsService

router = APIRouter(prefix="/shipments", tags=["Delivery, Logistics & Couriers"])

@router.post("/quote", response_model=ShippingRateQuoteResponse)
def get_shipping_quote(payload: ShippingRateQuoteRequest):
    quote = LogisticsService.get_rate_quote(payload)
    return ShippingRateQuoteResponse(**quote)

@router.post("/manifest", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def manifest_shipment(
    payload: ShipmentManifestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = LogisticsService.manifest_order_shipment(
        db=db,
        order_id=payload.order_id,
        courier_provider=payload.courier_provider,
        pickup_address_id=payload.pickup_address_id,
        parcel_weight_grams=payload.parcel_weight_grams
    )
    return shipment

@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_details(
    shipment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found.")
    return shipment

@router.get("/order/{order_id}", response_model=ShipmentResponse)
def get_order_shipment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(Shipment.order_id == order_id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No shipment manifested for this order yet.")
    return shipment

@router.patch("/{shipment_id}/milestone", response_model=ShipmentResponse)
def update_shipment_milestone(
    shipment_id: str,
    payload: ShipmentMilestoneUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = LogisticsService.update_milestone(
        db=db,
        shipment_id=shipment_id,
        new_status=payload.status,
        location=payload.location,
        details=payload.details,
        delivery_otp=payload.delivery_otp
    )
    return shipment

@router.post("/{shipment_id}/verify-delivery", response_model=ShipmentResponse)
def verify_otp_and_deliver(
    shipment_id: str,
    payload: DeliveryVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shipment = LogisticsService.verify_delivery_with_otp(
        db=db,
        shipment_id=shipment_id,
        delivery_otp=payload.delivery_otp
    )
    return shipment

@router.get("/label/{tracking_number}", response_class=HTMLResponse)
def render_printable_shipping_label(
    tracking_number: str,
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping label not found.")

    pickup = shipment.pickup_address
    delivery = shipment.delivery_address

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Shipping Label - {tracking_number}</title>
        <style>
            body {{ font-family: monospace, sans-serif; margin: 20px; }}
            .label-card {{ border: 2px solid #000; width: 420px; padding: 16px; margin: 0 auto; }}
            .header {{ border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }}
            .barcode {{ text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; border: 1px dashed #000; margin: 12px 0; }}
            .section {{ margin-bottom: 12px; font-size: 12px; line-height: 1.4; }}
            .title {{ font-weight: bold; text-transform: uppercase; }}
            .footer {{ border-top: 1px solid #000; padding-top: 8px; font-size: 10px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="label-card">
            <div class="header">
                <div><strong>BOOKLOOP LOGISTICS</strong><br><small>{shipment.courier_provider.upper()}</small></div>
                <div><strong>AWB: {shipment.awb_code or tracking_number}</strong></div>
            </div>
            
            <div class="barcode">
                ||| | ||||| |||| || | ||||<br>
                <span>{tracking_number}</span>
            </div>

            <div class="section">
                <span class="title">DELIVER TO:</span><br>
                <strong>{delivery.full_name if delivery else 'Recipient'}</strong><br>
                {delivery.address_line1 if delivery else ''}<br>
                {delivery.city if delivery else ''}, {delivery.state if delivery else ''} - <strong>{delivery.pincode if delivery else ''}</strong><br>
                Phone: {delivery.phone_number if delivery else ''}
            </div>

            <div class="section">
                <span class="title">SHIPPED FROM (SELLER):</span><br>
                {pickup.full_name if pickup else 'Seller'}<br>
                {pickup.city if pickup else ''}, {pickup.state if pickup else ''} - {pickup.pincode if pickup else ''}
            </div>

            <div class="section">
                <strong>Weight:</strong> {shipment.chargeable_weight_grams}g | <strong>Prepaid Escrow:</strong> Flat Doorstep
            </div>

            <div class="footer">
                BookLoop T+3 Inspection Safe Delivery. Recipient OTP verification required.
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
