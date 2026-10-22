import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.listing import Listing
from app.models.address import Address
from app.models.order import Order, OrderState
from app.models.shipment import Shipment, ShipmentState, ShipmentEvent
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_logistics_test_data():
    db = SessionLocal()
    try:
        test_emails = ["ship_buyer@bookloop.in", "ship_seller@bookloop.in"]
        users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            orders = db.query(Order).filter(Order.buyer_id.in_(user_ids)).all()
            order_ids = [o.id for o in orders]
            if order_ids:
                db.query(ShipmentEvent).filter(ShipmentEvent.shipment.has(Shipment.order_id.in_(order_ids))).delete(synchronize_session=False)
                db.query(Shipment).filter(Shipment.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
            db.query(Listing).filter(Listing.seller_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield

def setup_order_for_shipping():
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"ship_seller_{suffix}@bookloop.in"
    seller_phone = f"93{uuid.uuid4().int % 100000000:08d}"
    buyer_email = f"ship_buyer_{suffix}@bookloop.in"
    buyer_phone = f"94{uuid.uuid4().int % 100000000:08d}"

    # 1. Seller
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Bidar Book Emporium",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "Password123",
        "role": "seller"
    })
    seller_token = seller_res.json()["access_token"]

    seller_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Bidar Book Emporium",
        "phone_number": seller_phone,
        "address_line1": "Near Fort Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {seller_token}"}).json()

    listing = client.post("/api/v1/listings", json={
        "isbn_13": "9780132350884",
        "custom_title": "Clean Code (Logistics Pilot)",
        "condition_grade": "like_new",
        "asking_price": 450.0,
        "pickup_address_id": seller_addr["id"]
    }, headers={"Authorization": f"Bearer {seller_token}"}).json()

    # 2. Buyer
    buyer_res = client.post("/api/v1/auth/register", json={
        "full_name": "Arun Reader",
        "email": buyer_email,
        "phone_number": buyer_phone,
        "password": "Password123",
        "role": "buyer"
    })
    buyer_token = buyer_res.json()["access_token"]

    buyer_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Arun Reader",
        "phone_number": buyer_phone,
        "address_line1": "Mailoor Extension",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585403",
        "is_delivery_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()

    order = client.post("/api/v1/orders", json={
        "delivery_address_id": buyer_addr["id"],
        "listing_ids": [listing["id"]],
        "payment_method": "mock_upi"
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()

    return {
        "buyer_token": buyer_token,
        "seller_token": seller_token,
        "order_id": order["id"],
        "order_number": order["order_number"],
        "pickup_address_id": seller_addr["id"]
    }

def test_shipping_rate_quotes():
    # 1. Bidar Intracity Quote (585401 to 585403)
    res_bdr = client.post("/api/v1/shipments/quote", json={
        "origin_pincode": "585401",
        "destination_pincode": "585403",
        "weight_grams": 400.0,
        "length_cm": 24.0,
        "width_cm": 18.0,
        "height_cm": 4.0
    })
    assert res_bdr.status_code == 200
    data_bdr = res_bdr.json()
    assert data_bdr["is_intracity_pilot"] is True
    assert data_bdr["courier_provider"] == "local_rider"
    assert data_bdr["delivery_fee"] == 40.0
    assert data_bdr["estimated_delivery_days"] == 1

    # 2. Intercity Surface Quote (Bidar 585401 to Bengaluru 560001)
    res_inter = client.post("/api/v1/shipments/quote", json={
        "origin_pincode": "585401",
        "destination_pincode": "560001",
        "weight_grams": 400.0,
        "length_cm": 24.0,
        "width_cm": 18.0,
        "height_cm": 4.0
    })
    assert res_inter.status_code == 200
    data_inter = res_inter.json()
    assert data_inter["is_intracity_pilot"] is False
    assert data_inter["courier_provider"] == "delhivery"
    assert data_inter["delivery_fee"] == 70.0
    assert data_inter["estimated_delivery_days"] == 4

def test_manifest_order_shipment():
    setup = setup_order_for_shipping()
    headers = {"Authorization": f"Bearer {setup['seller_token']}"}

    manifest_res = client.post("/api/v1/shipments/manifest", json={
        "order_id": setup["order_id"],
        "pickup_address_id": setup["pickup_address_id"],
        "parcel_weight_grams": 400.0
    }, headers=headers)
    assert manifest_res.status_code == 201
    shipment = manifest_res.json()

    assert shipment["order_id"] == setup["order_id"]
    assert shipment["courier_provider"] == "local_rider"
    assert shipment["tracking_number"].startswith("BL-BDR-")
    assert shipment["status"] == "pickup_scheduled"
    assert len(shipment["delivery_otp"]) == 6
    assert len(shipment["events"]) >= 1

def test_milestone_progression_and_otp_verification():
    setup = setup_order_for_shipping()
    headers = {"Authorization": f"Bearer {setup['seller_token']}"}

    # 1. Manifest
    manifest_res = client.post("/api/v1/shipments/manifest", json={
        "order_id": setup["order_id"],
        "parcel_weight_grams": 400.0
    }, headers=headers)
    shipment_id = manifest_res.json()["id"]
    delivery_otp = manifest_res.json()["delivery_otp"]

    # 2. Update to Picked Up
    pick_res = client.patch(f"/api/v1/shipments/{shipment_id}/milestone", json={
        "status": "picked_up",
        "location": "Bidar Fort Hub",
        "details": "Picked up from seller doorstep."
    }, headers=headers)
    assert pick_res.status_code == 200
    assert pick_res.json()["status"] == "picked_up"

    # 3. Update to In Transit
    transit_res = client.patch(f"/api/v1/shipments/{shipment_id}/milestone", json={
        "status": "in_transit",
        "location": "En route to Mailoor Extension",
        "details": "Out for doorstep delivery with Bidar local runner."
    }, headers=headers)
    assert transit_res.status_code == 200
    assert transit_res.json()["status"] == "in_transit"

    # 4. Attempt delivery with WRONG OTP
    wrong_otp_res = client.post(f"/api/v1/shipments/{shipment_id}/verify-delivery", json={
        "delivery_otp": "000000"
    }, headers=headers)
    assert wrong_otp_res.status_code == 400

    # 5. Verify delivery with CORRECT OTP
    success_res = client.post(f"/api/v1/shipments/{shipment_id}/verify-delivery", json={
        "delivery_otp": delivery_otp
    }, headers=headers)
    assert success_res.status_code == 200
    assert success_res.json()["status"] == "delivered"
    assert success_res.json()["delivered_at"] is not None

    # 6. Verify order status has transitioned to DELIVERED
    order_res = client.get(f"/api/v1/orders/{setup['order_id']}", headers=headers)
    assert order_res.status_code == 200
    assert order_res.json()["status"].lower() == "delivered"

def test_printable_shipping_label():
    setup = setup_order_for_shipping()
    headers = {"Authorization": f"Bearer {setup['seller_token']}"}

    manifest_res = client.post("/api/v1/shipments/manifest", json={
        "order_id": setup["order_id"],
        "parcel_weight_grams": 350.0
    }, headers=headers)
    tracking_number = manifest_res.json()["tracking_number"]

    # Get label
    label_res = client.get(f"/api/v1/shipments/label/{tracking_number}")
    assert label_res.status_code == 200
    assert "text/html" in label_res.headers["content-type"]
    assert tracking_number in label_res.text
    assert "BOOKLOOP LOGISTICS" in label_res.text
