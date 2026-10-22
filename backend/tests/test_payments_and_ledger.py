import hmac
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.listing import Listing, ListingStatus, ConditionGrade
from app.models.address import Address
from app.models.order import Order, OrderState
from app.models.payment import Payment, ProcessedWebhookEvent
from app.models.ledger import LedgerEntry
from app.core.database import SessionLocal
from app.core.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_payment_test_data():
    db = SessionLocal()
    try:
        test_emails = ["pay_buyer@bookloop.in", "pay_seller@bookloop.in"]
        users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            orders = db.query(Order).filter(Order.buyer_id.in_(user_ids)).all()
            order_ids = [o.id for o in orders]
            if order_ids:
                db.query(LedgerEntry).filter(LedgerEntry.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Payment).filter(Payment.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
            db.query(Listing).filter(Listing.seller_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.query(ProcessedWebhookEvent).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield

def setup_buyer_seller_and_order():
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"seller_{suffix}@bookloop.in"
    seller_phone = f"91{uuid.uuid4().int % 100000000:08d}"
    buyer_email = f"buyer_{suffix}@bookloop.in"
    buyer_phone = f"92{uuid.uuid4().int % 100000000:08d}"

    # 1. Register Seller
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Ramesh Bookseller",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "Password123",
        "role": "seller"
    })
    seller_data = seller_res.json()
    seller_token = seller_data["access_token"]

    # Seller creates pickup address
    seller_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Ramesh Bookseller",
        "phone_number": seller_phone,
        "address_line1": "Station Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {seller_token}"})
    seller_addr_id = seller_addr_res.json()["id"]

    # Seller KYC update
    client.post("/api/v1/users/me/seller/kyc", json={
        "store_name": "Ramesh Bookstore",
        "upi_id": "ramesh@oksbi",
        "bank_account_number": "123456789012",
        "bank_ifsc": "SBIN0001234"
    }, headers={"Authorization": f"Bearer {seller_token}"})

    # Seller creates listing
    listing_res = client.post("/api/v1/listings", json={
        "isbn_13": "9780132350884",
        "custom_title": "Clean Code in Python (Payments Test)",
        "condition_grade": "very_good",
        "asking_price": 500.0,
        "pickup_address_id": seller_addr_id
    }, headers={"Authorization": f"Bearer {seller_token}"})
    listing_id = listing_res.json()["id"]

    # 2. Register Buyer
    buyer_res = client.post("/api/v1/auth/register", json={
        "full_name": "Pooja Buyer",
        "email": buyer_email,
        "phone_number": buyer_phone,
        "password": "Password123",
        "role": "buyer"
    })
    buyer_data = buyer_res.json()
    buyer_token = buyer_data["access_token"]

    # Buyer creates delivery address in Bidar (Pilot ₹40 delivery)
    buyer_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Pooja Buyer",
        "phone_number": buyer_phone,
        "address_line1": "Near Gumpa Circle",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585403",
        "is_delivery_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_addr_id = buyer_addr_res.json()["id"]

    # 3. Buyer creates order
    order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": buyer_addr_id,
        "listing_ids": [listing_id],
        "payment_method": "razorpay"
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    order_data = order_res.json()

    return {
        "buyer_token": buyer_token,
        "seller_token": seller_token,
        "order_id": order_data["id"],
        "order_number": order_data["order_number"],
        "listing_id": listing_id
    }

def test_payment_order_creation_and_verification():
    setup = setup_buyer_seller_and_order()
    buyer_headers = {"Authorization": f"Bearer {setup['buyer_token']}"}
    order_id = setup["order_id"]

    # 1. Create gateway payment order
    pay_order_res = client.post(
        "/api/v1/payments/create-order",
        json={"order_id": order_id, "gateway_name": "razorpay"},
        headers=buyer_headers
    )
    assert pay_order_res.status_code == 200
    pay_data = pay_order_res.json()
    gateway_order_id = pay_data["gateway_order_id"]
    assert gateway_order_id is not None
    assert pay_data["amount"] == 540.0  # 500 book + 40 Bidar shipping

    # 2. Simulate Razorpay Gateway Payment & HMAC Signature
    fake_payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
    message = f"{gateway_order_id}|{fake_payment_id}".encode("utf-8")
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    signature = hmac.new(secret, message, hashlib.sha256).hexdigest()

    # 3. Verify payment signature
    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "gateway_order_id": gateway_order_id,
            "gateway_payment_id": fake_payment_id,
            "gateway_signature": signature
        },
        headers=buyer_headers
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "success"

    # 4. Check double-entry ledger entries for order
    ledger_res = client.get(f"/api/v1/payments/ledger/{order_id}", headers=buyer_headers)
    assert ledger_res.status_code == 200
    ledger_data = ledger_res.json()
    assert ledger_data["entries_count"] >= 2
    assert ledger_data["total_amount"] == 540.0

def test_double_entry_balance_invariant():
    setup = setup_buyer_seller_and_order()
    buyer_headers = {"Authorization": f"Bearer {setup['buyer_token']}"}

    # Verify trial balance is balanced (sum(debits) == sum(credits))
    trial_res = client.get("/api/v1/payments/ledger/balances/trial", headers=buyer_headers)
    assert trial_res.status_code == 200
    trial = trial_res.json()
    assert trial["is_balanced"] is True
    assert trial["total_debits"] == trial["total_credits"]

def test_webhook_idempotency_and_security():
    event_id = f"evt_test_razorpay_{uuid.uuid4().hex[:10]}"
    webhook_payload = {
        "event": "payment.captured",
        "event_id": event_id,
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_hook_{uuid.uuid4().hex[:6]}",
                    "order_id": "order_non_existent",
                    "status": "captured"
                }
            }
        }
    }
    raw_bytes = json.dumps(webhook_payload).encode("utf-8")
    secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
    valid_sig = hmac.new(secret, raw_bytes, hashlib.sha256).hexdigest()

    # 1. First webhook delivery
    headers = {"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"}
    res1 = client.post("/api/v1/payments/webhook", content=raw_bytes, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "processed"

    # 2. Second duplicate webhook delivery (Idempotency test)
    res2 = client.post("/api/v1/payments/webhook", content=raw_bytes, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "duplicate_ignored"

    # 3. Invalid signature test
    bad_headers = {"X-Razorpay-Signature": "invalid_tampered_sig", "Content-Type": "application/json"}
    res_bad = client.post("/api/v1/payments/webhook", content=raw_bytes, headers=bad_headers)
    assert res_bad.status_code == 400

def test_t_plus_3_settlement_disbursement():
    setup = setup_buyer_seller_and_order()
    buyer_headers = {"Authorization": f"Bearer {setup['buyer_token']}"}
    order_id = setup["order_id"]

    # Transition order to DELIVERED
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        assert order is not None
        order.status = OrderState.DELIVERED.value
        db.commit()
    finally:
        db.close()

    # Execute settlement with force_instant=True
    settle_res = client.post("/api/v1/payments/settlements/execute?force_instant=true", headers=buyer_headers)
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert settle_data["settled_orders_count"] >= 1

    # Verify Order is now COMPLETED
    db = SessionLocal()
    try:
        order_refreshed = db.query(Order).filter(Order.id == order_id).first()
        assert order_refreshed.status == OrderState.COMPLETED.value
    finally:
        db.close()

    # Verify double-entry ledger balance is preserved after settlement disbursement
    trial_res = client.get("/api/v1/payments/ledger/balances/trial", headers=buyer_headers)
    assert trial_res.status_code == 200
    trial = trial_res.json()
    assert trial["is_balanced"] is True
    assert trial["total_debits"] == trial["total_credits"]
