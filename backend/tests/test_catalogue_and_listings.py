import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.address import Address
from app.models.book_catalogue import BookCatalogue
from app.models.listing import Listing, ConditionGrade, ListingStatus

client = TestClient(app)

import uuid

@pytest.fixture
def seed_test_context():
    db = SessionLocal()
    phone = f"99{uuid.uuid4().hex[:8]}"
    seller = User(full_name="Test Seller", phone_number=phone)
    db.add(seller)
    db.flush()

    addr = Address(
        user_id=seller.id,
        full_name="Test Seller",
        phone_number="9999988888",
        address_line1="Test Street",
        city="Bidar",
        pincode="585401",
        is_pickup_address=True
    )
    db.add(addr)
    db.flush()

    isbn = f"978{uuid.uuid4().hex[:10]}"
    book = BookCatalogue(
        title="Test Algorithm Handbook",
        authors="Thomas Cormen",
        isbn_13=isbn,
        original_mrp=1200.0
    )
    db.add(book)
    db.commit()
    
    yield {"seller_id": seller.id, "address_id": addr.id, "book_id": book.id}
    db.close()

def test_catalog_search_endpoint(seed_test_context):
    res = client.get("/api/v1/catalog/search?q=Algorithm")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert "Algorithm" in data[0]["title"]

def test_create_listing_and_condition_validation(seed_test_context):
    ctx = seed_test_context

    # 1. Invalid: Heavily used without defect description
    bad_payload = {
        "book_catalogue_id": ctx["book_id"],
        "asking_price": 500.0,
        "condition_grade": "heavily_used",
        "missing_pages_defect": False,
        "has_annotations_highlighting": True,
        "defect_description": None,
        "pickup_address_id": ctx["address_id"],
        "quantity": 1
    }
    res = client.post(f"/api/v1/listings?seller_id={ctx['seller_id']}", json=bad_payload)
    assert res.status_code == 422
    assert "mandatory" in res.json()["detail"].lower()

    # 2. Valid: Good condition with notes
    valid_payload = {
        "book_catalogue_id": ctx["book_id"],
        "asking_price": 650.0,
        "condition_grade": "good",
        "missing_pages_defect": False,
        "has_annotations_highlighting": False,
        "defect_description": "Clean pages, intact cover",
        "pickup_address_id": ctx["address_id"],
        "quantity": 1
    }
    res = client.post(f"/api/v1/listings?seller_id={ctx['seller_id']}", json=valid_payload)
    assert res.status_code == 201
    listing = res.json()
    assert listing["asking_price"] == 650.0
    assert listing["status"] == "active"

    # 3. Attach image to listing
    listing_id = listing["id"]
    img_res = client.post(
        f"/api/v1/listings/{listing_id}/images?image_url=https://example.com/photo.jpg&is_primary=true&caption=Front+Cover"
    )
    assert img_res.status_code == 200
    assert img_res.json()["is_primary"] is True

def test_search_listings_with_filters():
    res = client.get("/api/v1/listings?city=Bidar&sort=price_low")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1
    prices = [item["asking_price"] for item in data["items"]]
    assert prices == sorted(prices)
