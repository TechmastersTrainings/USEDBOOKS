import hmac
import hashlib
import json
import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User, UserRole
from app.models.listing import Listing, ListingStatus, ConditionGrade
from app.models.address import Address
from app.models.order import Order, OrderState
from app.models.shipment import Shipment, ShipmentState, ShipmentEvent
from app.models.payment import Payment, ProcessedWebhookEvent
from app.models.ledger import LedgerEntry
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_e2e_pilot_test_data():
    db = SessionLocal()
    try:
        # Cleanup past test runs
        test_emails = ["e2e_pilot_seller@bookloop.in", "e2e_pilot_buyer@bookloop.in", "e2e_dispute_buyer@bookloop.in"]
        users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            orders = db.query(Order).filter(Order.buyer_id.in_(user_ids)).all()
            order_ids = [o.id for o in orders]
            if order_ids:
                db.query(LedgerEntry).filter(LedgerEntry.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Payment).filter(Payment.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(ShipmentEvent).filter(ShipmentEvent.shipment.has(Shipment.order_id.in_(order_ids))).delete(synchronize_session=False)
                db.query(Shipment).filter(Shipment.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
            db.query(Listing).filter(Listing.seller_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.query(ProcessedWebhookEvent).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield


def test_complete_bidar_pilot_reader_to_reader_journey():
    """
    Exhaustive integration test validating the entire C2C lifecycle in the Bidar Pilot zone:
    1. Seller & Buyer onboarded with Bidar PIN codes (585401 & 585403).
    2. Seller passes KYC with UPI ID.
    3. Seller lists engineering textbook with verified condition & defect disclosures.
    4. Buyer searches catalog, finds book, and locks inventory via checkout.
    5. Buyer completes Razorpay gateway payment, booking Escrow Liability in double-entry ledger.
    6. System quotes Bidar Local Runner (flat Rs. 40) and manifests courier with AWB & 6-digit delivery OTP.
    7. Printable shipping label is generated.
    8. Runner progresses delivery through milestones (PICKED_UP -> IN_TRANSIT).
    9. Runner attempts invalid OTP (rejected), then valid OTP -> Order marked DELIVERED, starting T+3 inspection hold.
    10. Fast-forward T+3 inspection hold -> Automated settlement disburses net payout to seller UPI and recognizes commission + GST.
    11. Double-entry trial balance audited: Debits == Credits with 0 discrepancy.
    """
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"seller_e2e_{suffix}@bookloop.in"
    seller_phone = f"95{uuid.uuid4().int % 100000000:08d}"
    buyer_email = f"buyer_e2e_{suffix}@bookloop.in"
    buyer_phone = f"96{uuid.uuid4().int % 100000000:08d}"

    # -------------------------------------------------------------
    # STEP 1: Seller Onboarding & KYC
    # -------------------------------------------------------------
    seller_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Kavitha Patil",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "SecurePassword123",
        "role": "seller"
    })
    assert seller_reg.status_code == 201
    seller_token = seller_reg.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    # Seller creates pickup address near GND Engineering College (PIN 585401)
    seller_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Kavitha Patil",
        "phone_number": seller_phone,
        "address_line1": "Flat 204, GNDEC Campus Quarters, Mailoor",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_default": True
    }, headers=seller_headers)
    assert seller_addr_res.status_code == 201
    seller_addr_id = seller_addr_res.json()["id"]

    # Seller updates KYC details with UPI ID
    kyc_res = client.post("/api/v1/users/me/seller/kyc", json={
        "store_name": "Kavitha Academic Books",
        "upi_id": "kavitha.patil@okaxis",
        "bank_account_number": "50100456789123",
        "bank_ifsc": "HDFC0001842"
    }, headers=seller_headers)
    assert kyc_res.status_code == 200

    # -------------------------------------------------------------
    # STEP 2: Listing Used Textbook with Disclosures
    # -------------------------------------------------------------
    listing_res = client.post("/api/v1/listings", json={
        "isbn_13": "9789387432291",
        "custom_title": "Higher Engineering Mathematics - 44th Edition",
        "condition_grade": "very_good",
        "asking_price": 350.0,
        "pickup_address_id": seller_addr_id,
        "defect_disclosures": ["Neat pencil annotations on chapter 4", "Cover slightly creased"]
    }, headers=seller_headers)
    assert listing_res.status_code == 201
    listing_data = listing_res.json()
    listing_id = listing_data["id"]
    assert listing_data["status"] == "active"
    assert listing_data["asking_price"] == 350.0

    # -------------------------------------------------------------
    # STEP 3: Buyer Onboarding & Discovery
    # -------------------------------------------------------------
    buyer_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Arjun Deshmukh",
        "email": buyer_email,
        "phone_number": buyer_phone,
        "password": "SecurePassword123",
        "role": "buyer"
    })
    assert buyer_reg.status_code == 201
    buyer_token = buyer_reg.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Buyer creates delivery address in Bidar (PIN 585403)
    buyer_addr_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Arjun Deshmukh",
        "phone_number": buyer_phone,
        "address_line1": "Plot 12, Vidya Nagar, Near Gumpa Circle",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585403",
        "is_delivery_address": True,
        "is_default": True
    }, headers=buyer_headers)
    assert buyer_addr_res.status_code == 201
    buyer_addr_id = buyer_addr_res.json()["id"]

    # Buyer searches catalog and finds the listing
    search_res = client.get("/api/v1/listings?search=Mathematics&city=Bidar")
    assert search_res.status_code == 200
    search_items = search_res.json()["items"]
    found_item = any(item["id"] == listing_id for item in search_items)
    assert found_item is True

    # -------------------------------------------------------------
    # STEP 4: Order Creation & Inventory Locking
    # -------------------------------------------------------------
    order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": buyer_addr_id,
        "listing_ids": [listing_id],
        "payment_method": "razorpay"
    }, headers=buyer_headers)
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "payment_confirmed"
    assert order_data["total_books_amount"] == 350.0
    assert order_data["delivery_fee"] == 40.0  # Bidar flat pilot fee
    assert order_data["total_amount"] == 390.0

    # Verify inventory is locked: listing status is now SOLD
    listing_check = client.get(f"/api/v1/listings/{listing_id}")
    assert listing_check.json()["status"] == "sold"

    # -------------------------------------------------------------
    # STEP 5: Payment Gateway Generation & Escrow Booking
    # -------------------------------------------------------------
    pay_order_res = client.post("/api/v1/payments/create-order", json={
        "order_id": order_id,
        "gateway_name": "razorpay"
    }, headers=buyer_headers)
    assert pay_order_res.status_code == 200
    gateway_order_id = pay_order_res.json()["gateway_order_id"]
    assert gateway_order_id.startswith("order_")

    # Cryptographic signature verification
    fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    msg = f"{gateway_order_id}|{fake_payment_id}".encode("utf-8")
    signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    verify_res = client.post("/api/v1/payments/verify", json={
        "order_id": order_id,
        "gateway_order_id": gateway_order_id,
        "gateway_payment_id": fake_payment_id,
        "gateway_signature": signature
    }, headers=buyer_headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "success"

    # Order remains payment_confirmed
    order_fetch = client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert order_fetch.json()["status"] == "payment_confirmed"

    # -------------------------------------------------------------
    # STEP 6: Courier Quote, Manifestation & Delivery OTP
    # -------------------------------------------------------------
    # Quote check
    quote_res = client.post("/api/v1/shipments/quote", json={
        "origin_pincode": "585401",
        "destination_pincode": "585403",
        "weight_grams": 400.0,
        "length_cm": 24.0,
        "width_cm": 18.0,
        "height_cm": 4.0
    })
    assert quote_res.status_code == 200
    quote_data = quote_res.json()
    assert quote_data["is_intracity_pilot"] is True
    assert quote_data["courier_provider"] == "local_rider"
    assert quote_data["delivery_fee"] == 40.0

    # Manifest shipment
    manifest_res = client.post("/api/v1/shipments/manifest", json={
        "order_id": order_id,
        "pickup_address_id": seller_addr_id,
        "parcel_weight_grams": 400.0
    }, headers=seller_headers)
    assert manifest_res.status_code == 201
    manifest_data = manifest_res.json()
    shipment_id = manifest_data["id"]
    tracking_number = manifest_data["tracking_number"]
    delivery_otp = manifest_data["delivery_otp"]
    assert tracking_number.startswith("BL-BDR-")
    assert manifest_data["courier_provider"] == "local_rider"
    assert len(delivery_otp) == 6

    # Verify printable shipping label
    label_res = client.get(f"/api/v1/shipments/label/{tracking_number}")
    assert label_res.status_code == 200
    assert "BOOKLOOP LOGISTICS" in label_res.text
    assert tracking_number in label_res.text

    # -------------------------------------------------------------
    # STEP 7: Runner Progresses Milestones
    # -------------------------------------------------------------
    m1 = client.patch(f"/api/v1/shipments/{shipment_id}/milestone", json={
        "status": "picked_up",
        "location": "Bidar GNDEC Pickup Point",
        "details": "Package collected from Kavitha"
    }, headers=seller_headers)
    assert m1.status_code == 200
    assert m1.json()["status"] == "picked_up"

    m2 = client.patch(f"/api/v1/shipments/{shipment_id}/milestone", json={
        "status": "in_transit",
        "location": "Bidar City Hub (Mailoor Road)",
        "details": "Dispatched to Vidya Nagar sector"
    }, headers=seller_headers)
    assert m2.status_code == 200
    assert m2.json()["status"] == "in_transit"

    # -------------------------------------------------------------
    # STEP 8: Doorstep Delivery with OTP Verification
    # -------------------------------------------------------------
    # Wrong OTP is rejected
    wrong_otp_res = client.post(f"/api/v1/shipments/{shipment_id}/verify-delivery", json={
        "delivery_otp": "000000"
    }, headers=seller_headers)
    assert wrong_otp_res.status_code == 400

    # Valid OTP succeeds
    valid_otp_res = client.post(f"/api/v1/shipments/{shipment_id}/verify-delivery", json={
        "delivery_otp": delivery_otp
    }, headers=seller_headers)
    assert valid_otp_res.status_code == 200
    assert valid_otp_res.json()["status"] == "delivered"
    assert valid_otp_res.json()["delivered_at"] is not None

    # Order status now DELIVERED
    order_delivered = client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert order_delivered.json()["status"].lower() == "delivered"

    # -------------------------------------------------------------
    # STEP 9: T+3 Day Inspection Window Hold & Settlement
    # -------------------------------------------------------------
    # Immediate settlement execution does not touch this order (still within 3-day return window)
    early_settle = client.post("/api/v1/payments/settlements/execute", headers=buyer_headers)
    assert early_settle.status_code == 200
    assert early_settle.json()["settled_orders_count"] == 0

    # Fast forward updated_at by 4 days in DB to satisfy T+3 rule
    db = SessionLocal()
    try:
        order_to_age = db.query(Order).filter(Order.id == order_id).first()
        order_to_age.updated_at = datetime.utcnow() - timedelta(days=4)
        db.commit()
    finally:
        db.close()

    # Now execute settlement: T+3 inspection hold is complete!
    settle_res = client.post("/api/v1/payments/settlements/execute", headers=buyer_headers)
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert settle_data["settled_orders_count"] >= 1
    settled_order = next(d for d in settle_data["details"] if d["order_id"] == order_id)

    # Financial verification:
    # Book asking price = 350.0
    # Platform commission (10%) = 35.0
    # GST on commission (18%) = 6.30
    # Net seller payout = 350.0 - 35.0 - 6.30 = 308.70
    assert pytest.approx(settled_order["seller_payout_amount"], 0.01) == 308.70
    assert pytest.approx(settled_order["platform_commission"], 0.01) == 35.0
    assert pytest.approx(settled_order["gst_tax"], 0.01) == 6.30

    # Order status is now COMPLETED
    order_completed = client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert order_completed.json()["status"].lower() == "completed"

    # -------------------------------------------------------------
    # STEP 10: Double-Entry Ledger Trial Balance Audit
    # -------------------------------------------------------------
    trial_res = client.get("/api/v1/payments/ledger/balances/trial", headers=buyer_headers)
    assert trial_res.status_code == 200
    trial = trial_res.json()
    assert trial["is_balanced"] is True
    assert trial["total_debits"] == trial["total_credits"]


def test_pilot_dispute_and_restitution_lifecycle():
    """
    Validates dispute handling & inventory restitution:
    1. Buyer orders book and pays via gateway.
    2. Order delivered, but buyer reports condition mismatch / unrevealed damage.
    3. Buyer files dispute within T+3 window.
    4. Admin adjudicates with REFUND_BUYER.
    5. Escrow refunded to buyer, order marked REFUNDED, and physical book inventory is restored to ACTIVE.
    6. Ledger maintains perfect accounting equilibrium.
    """
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"seller_disp_{suffix}@bookloop.in"
    seller_phone = f"97{uuid.uuid4().int % 100000000:08d}"
    buyer_email = f"buyer_disp_{suffix}@bookloop.in"
    buyer_phone = f"98{uuid.uuid4().int % 100000000:08d}"

    # Seller & Address
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Suresh Books",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "Password123",
        "role": "seller"
    })
    seller_token = seller_res.json()["access_token"]
    seller_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Suresh Books",
        "phone_number": seller_phone,
        "address_line1": "Near Gurudwara",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True
    }, headers={"Authorization": f"Bearer {seller_token}"}).json()["id"]

    # Listing
    listing_res = client.post("/api/v1/listings", json={
        "isbn_13": "9780132350884",
        "custom_title": "Clean Code - Paperback",
        "condition_grade": "good",
        "asking_price": 400.0,
        "pickup_address_id": seller_addr
    }, headers={"Authorization": f"Bearer {seller_token}"})
    listing_id = listing_res.json()["id"]

    # Buyer & Address
    buyer_res = client.post("/api/v1/auth/register", json={
        "full_name": "Priya Sharma",
        "email": buyer_email,
        "phone_number": buyer_phone,
        "password": "Password123",
        "role": "buyer"
    })
    buyer_token = buyer_res.json()["access_token"]
    buyer_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Priya Sharma",
        "phone_number": buyer_phone,
        "address_line1": "Chidri Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585403",
        "is_delivery_address": True
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()["id"]

    # Order & Payment
    order_res = client.post("/api/v1/orders", json={
        "delivery_address_id": buyer_addr,
        "listing_ids": [listing_id],
        "payment_method": "razorpay"
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    order_id = order_res.json()["id"]

    # Listing status is sold
    assert client.get(f"/api/v1/listings/{listing_id}").json()["status"] == "sold"

    # Payment simulation
    pay_res = client.post("/api/v1/payments/create-order", json={"order_id": order_id, "gateway_name": "razorpay"}, headers={"Authorization": f"Bearer {buyer_token}"})
    assert pay_res.status_code == 200
    gateway_order = pay_res.json()["gateway_order_id"]
    fake_pid = f"pay_disp_{uuid.uuid4().hex[:8]}"
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{gateway_order}|{fake_pid}".encode(), hashlib.sha256).hexdigest()
    client.post("/api/v1/payments/verify", json={
        "order_id": order_id,
        "gateway_order_id": gateway_order,
        "gateway_payment_id": fake_pid,
        "gateway_signature": sig
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    # Set order to delivered directly in DB for dispute testing
    db = SessionLocal()
    try:
        ord_db = db.query(Order).filter(Order.id == order_id).first()
        ord_db.status = OrderState.DELIVERED.value
        ord_db.delivered_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

    # Buyer files dispute: pages torn
    disp_res = client.post(f"/api/v1/orders/{order_id}/dispute", json={
        "reason": "Pages 50-70 torn out, not mentioned in listing description"
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "return_requested"

    # Setup admin user directly
    admin_email = f"admin_e2e_{suffix}@bookloop.in"
    admin_phone = f"99{uuid.uuid4().int % 100000000:08d}"
    db = SessionLocal()
    try:
        adm = User(
            full_name="Chief Adjudicator",
            email=admin_email,
            phone_number=admin_phone,
            role=UserRole.ADMIN.value,
            is_active=True
        )
        db.add(adm)
        db.commit()
        db.refresh(adm)
        admin_token = create_access_token(subject=adm.id, role=adm.role)
    finally:
        db.close()

    # Admin adjudicates: REFUND_BUYER
    adj_res = client.post(f"/api/v1/admin/disputes/{order_id}/adjudicate", json={
        "decision": "REFUND_BUYER",
        "resolution_notes": "Defect confirmed; seller did not disclose torn pages. Escrow refunded."
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert adj_res.status_code == 200
    assert adj_res.json()["order_status"] == "refunded"

    # Physical listing inventory must be RESTORED to active
    listing_check = client.get(f"/api/v1/listings/{listing_id}")
    assert listing_check.json()["status"] == "active"

    # Double entry ledger must remain perfectly balanced
    trial = client.get("/api/v1/payments/ledger/balances/trial", headers={"Authorization": f"Bearer {buyer_token}"}).json()
    assert trial["is_balanced"] is True
    assert trial["total_debits"] == trial["total_credits"]


def test_pilot_security_and_pincode_boundary_enforcement():
    """
    Validates platform security boundaries, input hygiene, and authentication defenses:
    1. Unauthenticated requests to protected endpoints return 401.
    2. Non-admin users cannot access administrative governance endpoints (403).
    3. Self-purchase prevention: Seller cannot buy their own listing (400).
    4. Search endpoint sanitizes malicious SQL injection strings safely.
    5. Invalid Indian pincode formats are rejected with 422.
    """
    suffix = uuid.uuid4().hex[:6]
    seller_email = f"seller_sec_{suffix}@bookloop.in"
    seller_phone = f"91{uuid.uuid4().int % 100000000:08d}"

    # 1. Register Seller
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Security Test Seller",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "Password123",
        "role": "seller"
    })
    seller_token = seller_res.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    # 2. Unauthenticated calls to orders/profile fail
    unauth_orders = client.get("/api/v1/orders")
    assert unauth_orders.status_code == 401

    unauth_admin = client.get("/api/v1/admin/overview")
    assert unauth_admin.status_code == 401

    # 3. Regular user attempting admin endpoint receives 403 Forbidden
    forbidden_admin = client.get("/api/v1/admin/overview", headers=seller_headers)
    assert forbidden_admin.status_code == 403

    # 4. Invalid Indian PIN codes (must be exactly 6 digits)
    invalid_pin_res = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Invalid Pin User",
        "phone_number": seller_phone,
        "address_line1": "Test Line",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "58540",  # Only 5 digits
        "is_pickup_address": True
    }, headers=seller_headers)
    assert invalid_pin_res.status_code == 422

    # 5. SQL injection safety on search
    sql_payload = "' OR '1'='1' -- ; DROP TABLE users;"
    search_res = client.get(f"/api/v1/listings?search={sql_payload}")
    assert search_res.status_code == 200
    assert "items" in search_res.json()

    # 6. Self-purchase prevention
    seller_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Security Test Seller",
        "phone_number": seller_phone,
        "address_line1": "Test Line 1",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_delivery_address": True
    }, headers=seller_headers).json()["id"]

    listing_id = client.post("/api/v1/listings", json={
        "isbn_13": "9780132350884",
        "custom_title": "Self Purchase Test Book",
        "condition_grade": "good",
        "asking_price": 250.0,
        "pickup_address_id": seller_addr
    }, headers=seller_headers).json()["id"]

    self_buy_res = client.post("/api/v1/orders", json={
        "delivery_address_id": seller_addr,
        "listing_ids": [listing_id],
        "payment_method": "mock_upi"
    }, headers=seller_headers)
    assert self_buy_res.status_code == 400
    assert "cannot purchase your own book" in self_buy_res.json()["detail"].lower()
