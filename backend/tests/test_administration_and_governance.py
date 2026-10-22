import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User, UserRole, SellerProfile
from app.models.listing import Listing, ListingStatus, ConditionGrade
from app.models.address import Address
from app.models.order import Order, OrderState
from app.models.system_setting import SystemSetting
from app.models.ledger import LedgerEntry
from app.core.database import SessionLocal
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_admin_test_data():
    db = SessionLocal()
    try:
        test_emails = ["admin_test@bookloop.in", "adm_buyer@bookloop.in", "adm_seller@bookloop.in"]
        users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            orders = db.query(Order).filter(Order.buyer_id.in_(user_ids)).all()
            order_ids = [o.id for o in orders]
            if order_ids:
                db.query(LedgerEntry).filter(LedgerEntry.order_id.in_(order_ids)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
            db.query(Listing).filter(Listing.seller_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.query(SystemSetting).filter(SystemSetting.key.like("test_%")).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield

def setup_admin_and_parties():
    suffix = uuid.uuid4().hex[:6]
    
    # 1. Admin
    admin_email = f"admin_{suffix}@bookloop.in"
    admin_phone = f"95{uuid.uuid4().int % 100000000:08d}"
    db = SessionLocal()
    admin_user = User(
        full_name="Platform Administrator",
        email=admin_email,
        phone_number=admin_phone,
        role=UserRole.ADMIN.value,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    admin_token = create_access_token(subject=admin_user.id, role=admin_user.role)
    db.close()

    # 2. Buyer
    buyer_email = f"buyer_{suffix}@bookloop.in"
    buyer_phone = f"96{uuid.uuid4().int % 100000000:08d}"
    buyer_res = client.post("/api/v1/auth/register", json={
        "full_name": "Adm Buyer",
        "email": buyer_email,
        "phone_number": buyer_phone,
        "password": "Password123",
        "role": "buyer"
    }).json()
    buyer_token = buyer_res["access_token"]
    buyer_id = buyer_res["user"]["id"]

    buyer_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Adm Buyer",
        "phone_number": buyer_phone,
        "address_line1": "Udgir Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_delivery_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()

    # 3. Seller
    seller_email = f"seller_{suffix}@bookloop.in"
    seller_phone = f"97{uuid.uuid4().int % 100000000:08d}"
    seller_res = client.post("/api/v1/auth/register", json={
        "full_name": "Adm Seller",
        "email": seller_email,
        "phone_number": seller_phone,
        "password": "Password123",
        "role": "seller"
    }).json()
    seller_token = seller_res["access_token"]
    seller_id = seller_res["user"]["id"]

    seller_addr = client.post("/api/v1/users/me/addresses", json={
        "full_name": "Adm Seller",
        "phone_number": seller_phone,
        "address_line1": "Janwada Road",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_pickup_address": True,
        "is_default": True
    }, headers={"Authorization": f"Bearer {seller_token}"}).json()

    listing = client.post("/api/v1/listings", json={
        "isbn_13": "9780132350884",
        "custom_title": "Admin Governance Book",
        "condition_grade": "good",
        "asking_price": 300.0,
        "pickup_address_id": seller_addr["id"]
    }, headers={"Authorization": f"Bearer {seller_token}"}).json()

    # Create Order
    order = client.post("/api/v1/orders", json={
        "delivery_address_id": buyer_addr["id"],
        "listing_ids": [listing["id"]],
        "payment_method": "mock_upi"
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()

    return {
        "admin_token": admin_token,
        "buyer_token": buyer_token,
        "seller_token": seller_token,
        "order_id": order["id"],
        "listing_id": listing["id"],
        "buyer_id": buyer_id,
        "seller_id": seller_id
    }

def test_admin_platform_overview_and_access_control():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}
    buyer_headers = {"Authorization": f"Bearer {setup['buyer_token']}"}

    # 1. Non-admin access should be forbidden (403)
    forbidden_res = client.get("/api/v1/admin/overview", headers=buyer_headers)
    assert forbidden_res.status_code == 403

    # 2. Admin access should succeed (200)
    overview_res = client.get("/api/v1/admin/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    data = overview_res.json()

    assert data["total_orders"] >= 1
    assert data["total_gmv"] >= 340.0
    assert data["total_users"] >= 2
    assert "orders_by_status" in data
    assert "escrow_liability_balance" in data

def test_listing_moderation():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}
    listing_id = setup["listing_id"]

    # 1. Flag copyright / content violation
    mod_flag = client.post(f"/api/v1/admin/moderation/listings/{listing_id}", json={
        "action": "FLAG_COPYRIGHT",
        "moderation_notes": "Suspected pirated duplicate reprint."
    }, headers=admin_headers)
    assert mod_flag.status_code == 200
    assert mod_flag.json()["status"] == "rejected"

    # 2. Approve listing
    mod_appr = client.post(f"/api/v1/admin/moderation/listings/{listing_id}", json={
        "action": "APPROVE",
        "moderation_notes": "Verified genuine original edition upon review."
    }, headers=admin_headers)
    assert mod_appr.status_code == 200
    assert mod_appr.json()["status"] == "active"

def test_dispute_adjudication_refund_buyer():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}
    order_id = setup["order_id"]

    # Transition order to RETURN_REQUESTED (dispute filed)
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == order_id).first()
    order.status = OrderState.RETURN_REQUESTED.value
    db.commit()
    db.close()

    # Adjudicate in favor of buyer -> REFUND_BUYER
    adj_res = client.post(f"/api/v1/admin/disputes/{order_id}/adjudicate", json={
        "decision": "REFUND_BUYER",
        "resolution_notes": "Missing 20 pages confirmed from buyer photo evidence. Return approved."
    }, headers=admin_headers)
    assert adj_res.status_code == 200
    res_data = adj_res.json()
    assert res_data["order_status"] == "refunded"
    assert res_data["decision"] == "REFUND_BUYER"

    # Verify inventory was restored to active
    db = SessionLocal()
    listing = db.query(Listing).filter(Listing.id == setup["listing_id"]).first()
    assert listing.status == ListingStatus.ACTIVE.value
    db.close()

def test_dispute_adjudication_release_to_seller():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}
    order_id = setup["order_id"]

    # Transition order to DISPUTED
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == order_id).first()
    order.status = OrderState.DISPUTED.value
    db.commit()
    db.close()

    # Adjudicate in favor of seller -> RELEASE_TO_SELLER
    adj_res = client.post(f"/api/v1/admin/disputes/{order_id}/adjudicate", json={
        "decision": "RELEASE_TO_SELLER",
        "resolution_notes": "Book condition matches seller disclosure accurately. Claim dismissed."
    }, headers=admin_headers)
    assert adj_res.status_code == 200
    res_data = adj_res.json()
    assert res_data["order_status"] == "completed"
    assert res_data["decision"] == "RELEASE_TO_SELLER"

def test_system_settings_runtime_configuration():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}

    # 1. Create or update setting
    set_res = client.post("/api/v1/admin/settings", json={
        "key": "test_commission_pct",
        "value": "12.5",
        "description": "Dynamic test commission percentage",
        "is_public": True
    }, headers=admin_headers)
    assert set_res.status_code == 200
    data = set_res.json()
    assert data["key"] == "test_commission_pct"
    assert data["value"] == "12.5"

    # 2. List settings
    list_res = client.get("/api/v1/admin/settings", headers=admin_headers)
    assert list_res.status_code == 200
    settings_list = list_res.json()
    keys = [s["key"] for s in settings_list]
    assert "test_commission_pct" in keys

def test_user_governance_suspension_and_role():
    setup = setup_admin_and_parties()
    admin_headers = {"Authorization": f"Bearer {setup['admin_token']}"}
    seller_id = setup["seller_id"]

    # Suspend user
    suspend_res = client.patch(f"/api/v1/admin/users/{seller_id}/status", json={
        "is_active": False,
        "kyc_status": "rejected"
    }, headers=admin_headers)
    assert suspend_res.status_code == 200
    assert suspend_res.json()["is_active"] is False
    assert suspend_res.json()["seller_profile"]["kyc_status"] == "rejected"

    # Reactivate user
    activate_res = client.patch(f"/api/v1/admin/users/{seller_id}/status", json={
        "is_active": True,
        "kyc_status": "verified"
    }, headers=admin_headers)
    assert activate_res.status_code == 200
    assert activate_res.json()["is_active"] is True
    assert activate_res.json()["seller_profile"]["kyc_status"] == "verified"
