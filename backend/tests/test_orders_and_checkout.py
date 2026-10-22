import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.listing import Listing, ListingStatus, ConditionGrade
from app.models.address import Address
from app.models.order import Order, OrderState
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_orders_and_test_data():
    db = SessionLocal()
    try:
        # Delete orders, addresses, listings created by test users
        test_emails = ["order_buyer@bookloop.in", "order_seller@bookloop.in", "order_buyer2@bookloop.in"]
        users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            # Delete orders
            db.query(Order).filter(Order.buyer_id.in_(user_ids)).delete(synchronize_session=False)
            # Delete listings
            db.query(Listing).filter(Listing.seller_id.in_(user_ids)).delete(synchronize_session=False)
            # Delete addresses
            db.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
            # Delete users
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()
    yield

def setup_buyer_and_seller():
    # Register Seller
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Kavita Bidar",
        "email": "order_seller@bookloop.in",
        "phone_number": "9811111111",
        "password": "Password123",
        "role": "seller"
    })
    seller_data = seller_res.json()
    seller_token = seller_data["access_token"]
    seller_id = seller_data["user"]["id"]

    # Seller creates pickup address
    seller_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Kavita Bidar",
        "phone_number": "9811111111",
        "address_line1": "Flat 101, Anand Nagar",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {seller_token}"})
    seller_addr_id = seller_addr_res.json()["id"]

    # Seller lists book
    listing_res = client.post("/api/v1/listings", json={
        "custom_title": "Database System Concepts (6th Edition)",
        "custom_authors": "Silberschatz, Korth",
        "asking_price": 350.0,
        "condition_grade": "very_good",
        "missing_pages_defect": False,
        "has_annotations_highlighting": False,
        "pickup_address_id": seller_addr_id,
        "quantity": 1
    }, headers={"Authorization": f"Bearer {seller_token}"})
    listing_id = listing_res.json()["id"]

    # Register Buyer
    buyer_res = client.post("/api/v1/auth/register", json={
        "full_name": "Sunil Kumar",
        "email": "order_buyer@bookloop.in",
        "phone_number": "9822222222",
        "password": "Password123",
        "role": "buyer"
    })
    buyer_data = buyer_res.json()
    buyer_token = buyer_data["access_token"]

    # Buyer creates delivery address in Bidar
    buyer_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Sunil Kumar",
        "phone_number": "9822222222",
        "address_line1": "Hostel 3, GND Engineering College",
        "address_line2": "Mailoor Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585403",
        "is_delivery_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_addr_id = buyer_addr_res.json()["id"]

    return {
        "seller_token": seller_token,
        "seller_id": seller_id,
        "listing_id": listing_id,
        "buyer_token": buyer_token,
        "buyer_addr_id": buyer_addr_id
    }

def test_create_order_and_inventory_locking():
    ctx = setup_buyer_and_seller()

    # 1. Place order as buyer
    order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": ctx["buyer_addr_id"],
        "listing_ids": [ctx["listing_id"]],
        "payment_method": "mock_upi"
    }, headers={"Authorization": f"Bearer {ctx['buyer_token']}"})

    assert order_res.status_code == 201
    order = order_res.json()
    assert order["total_books_amount"] == 350.0
    # Delivery fee for Bidar 585403 is flat 40.0
    assert order["delivery_fee"] == 40.0
    assert order["total_amount"] == 390.0
    assert order["status"] == OrderState.PAYMENT_CONFIRMED.value
    assert len(order["items"]) == 1

    # 2. Verify book listing status flipped to SOLD
    listing_check = client.get(f"/api/v1/listings/{ctx['listing_id']}")
    assert listing_check.json()["status"] == ListingStatus.SOLD.value

    # 3. Attempt to buy again by a second buyer should fail with 409 Conflict
    buyer2_res = client.post("/api/v1/auth/register", json={
        "full_name": "Second Buyer",
        "email": "order_buyer2@bookloop.in",
        "phone_number": "9833333333",
        "password": "Password123"
    })
    b2_token = buyer2_res.json()["access_token"]
    
    dup_order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": ctx["buyer_addr_id"],
        "listing_ids": [ctx["listing_id"]],
        "payment_method": "mock_upi"
    }, headers={"Authorization": f"Bearer {b2_token}"})

    assert dup_order_res.status_code == 409
    assert "no longer available" in dup_order_res.json()["detail"].lower()

def test_cannot_buy_own_listing():
    ctx = setup_buyer_and_seller()
    
    # Seller attempts to buy own book
    own_order = client.post("/api/v1/orders", json={
        "delivery_address_id": ctx["buyer_addr_id"],
        "listing_ids": [ctx["listing_id"]],
        "payment_method": "mock_upi"
    }, headers={"Authorization": f"Bearer {ctx['seller_token']}"})

    assert own_order.status_code == 400
    assert "cannot purchase your own" in own_order.json()["detail"].lower()

def test_order_cancellation_and_inventory_release():
    ctx = setup_buyer_and_seller()

    # Place order
    order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": ctx["buyer_addr_id"],
        "listing_ids": [ctx["listing_id"]]
    }, headers={"Authorization": f"Bearer {ctx['buyer_token']}"})
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    # Cancel order
    cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", json={
        "reason": "Ordered wrong semester textbook by mistake."
    }, headers={"Authorization": f"Bearer {ctx['buyer_token']}"})

    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == OrderState.CANCELLED.value
    assert "wrong semester" in cancel_res.json()["cancellation_reason"].lower()

    # Verify listing is restored to ACTIVE!
    listing_check = client.get(f"/api/v1/listings/{ctx['listing_id']}")
    assert listing_check.json()["status"] == ListingStatus.ACTIVE.value
