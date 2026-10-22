import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_users():
    # Cleanup any test users created during test runs
    db = SessionLocal()
    try:
        test_emails = ["testbuyer@bookloop.in", "testseller@bookloop.in", "updated@bookloop.in"]
        test_phones = ["9876543210", "9876543211", "9876543212"]
        db.query(User).filter(
            (User.email.in_(test_emails)) | (User.phone_number.in_(test_phones))
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield

def test_user_registration_and_login_flow():
    # 1. Register a new user
    reg_payload = {
        "full_name": "Ramesh Kulkarni",
        "email": "testbuyer@bookloop.in",
        "phone_number": "9876543210",
        "password": "SecurePassword123",
        "role": "buyer"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "testbuyer@bookloop.in"
    assert data["user"]["full_name"] == "Ramesh Kulkarni"

    # 2. Reject duplicate email
    dup_response = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"].lower()

    # 3. Successful Login with email
    login_response = client.post("/api/v1/auth/login", json={
        "identifier": "testbuyer@bookloop.in",
        "password": "SecurePassword123"
    })
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    access_token = login_data["access_token"]

    # 4. Successful Login with phone number
    login_phone_res = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "SecurePassword123"
    })
    assert login_phone_res.status_code == 200

    # 5. Failed Login with wrong password
    bad_login = client.post("/api/v1/auth/login", json={
        "identifier": "testbuyer@bookloop.in",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

def test_otp_flow_and_auto_signup():
    test_phone = "9876543211"
    
    # 1. Request OTP
    otp_req = client.post("/api/v1/auth/otp/send", json={"phone_number": test_phone})
    assert otp_req.status_code == 200
    otp_data = otp_req.json()
    assert "sandbox_otp" in otp_data
    sandbox_otp = otp_data["sandbox_otp"]
    assert len(sandbox_otp) == 6

    # 2. Rate limit / Cooldown enforcement
    repeat_req = client.post("/api/v1/auth/otp/send", json={"phone_number": test_phone})
    assert repeat_req.status_code == 429
    assert "cooldown" in repeat_req.json()["detail"].lower() or "wait" in repeat_req.json()["detail"].lower()

    # 3. Verify with wrong OTP
    bad_verify = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": test_phone,
        "otp": "000000"
    })
    assert bad_verify.status_code == 400
    assert "incorrect otp" in bad_verify.json()["detail"].lower()

    # 4. Verify with correct OTP (first time auto-signup)
    good_verify = client.post("/api/v1/auth/otp/verify", json={
        "phone_number": test_phone,
        "otp": sandbox_otp,
        "full_name": "Pooja Patil"
    })
    assert good_verify.status_code == 200
    verify_data = good_verify.json()
    assert "access_token" in verify_data
    assert verify_data["user"]["full_name"] == "Pooja Patil"
    assert verify_data["user"]["is_verified"] is True

def test_user_profile_and_addresses():
    # Register user
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Anil Bidar",
        "email": "testseller@bookloop.in",
        "phone_number": "9876543212",
        "password": "SecurePassword123",
        "role": "seller"
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch /users/me
    me_res = client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testseller@bookloop.in"

    # 2. Update profile
    update_res = client.put("/api/v1/users/me", json={"full_name": "Anil Kumar Bidar"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Anil Kumar Bidar"

    # 3. Create Address in Bidar
    addr_payload = {
        "full_name": "Anil Kumar",
        "phone_number": "9876543212",
        "address_line1": "Flat 302, Green Meadows",
        "address_line2": "Near Gurudwara Nanak Jhira",
        "landmark": "Opposite City Garden",
        "city": "Bidar",
        "state": "Karnataka",
        "pincode": "585401",
        "is_default": True,
        "is_pickup_address": True,
        "is_delivery_address": True
    }
    addr_res = client.post("/api/v1/users/me/addresses", json=addr_payload, headers=headers)
    assert addr_res.status_code == 201
    address = addr_res.json()
    assert address["city"] == "Bidar"
    assert address["pincode"] == "585401"
    address_id = address["id"]

    # 4. List addresses
    list_res = client.get("/api/v1/users/me/addresses", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Pincode lookup test
    pin_res = client.get("/api/v1/users/pincode/585401")
    assert pin_res.status_code == 200
    assert pin_res.json()["is_pilot_zone"] is True
    assert pin_res.json()["city"] == "Bidar"

    # 6. Seller KYC Submission
    kyc_payload = {
        "store_name": "Bidar Book Haven",
        "bio": "Curated collection of engineering & literature books.",
        "upi_id": "anilbidar@oksbi",
        "bank_account_number": "123456789012",
        "bank_ifsc": "SBIN0001234"
    }
    kyc_res = client.post("/api/v1/users/me/seller/kyc", json=kyc_payload, headers=headers)
    assert kyc_res.status_code == 200
    assert kyc_res.json()["store_name"] == "Bidar Book Haven"
    assert kyc_res.json()["kyc_status"] == "verified"

    # 7. Delete Address
    del_res = client.delete(f"/api/v1/users/me/addresses/{address_id}", headers=headers)
    assert del_res.status_code == 204
