import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User, UserRole
from app.models.address import Address
from app.models.book_catalogue import BookCatalogue
from app.models.listing import Listing, ConditionGrade, ListingStatus
from app.models.order import Order, OrderState
from app.models.ledger import LedgerEntry, AccountType

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

def test_user_and_address_creation(test_db):
    user = User(
        full_name="Anand Kulkarni",
        phone_number="9876543210",
        role=UserRole.SELLER.value,
        is_verified=True,
    )
    test_db.add(user)
    test_db.flush()

    address = Address(
        user_id=user.id,
        full_name="Anand Kulkarni",
        phone_number="9876543210",
        address_line1="Shop 5, Gandhi Gunj",
        city="Bidar",
        state="Karnataka",
        pincode="585401",
        is_pickup_address=True,
    )
    test_db.add(address)
    test_db.commit()

    saved_user = test_db.query(User).filter(User.phone_number == "9876543210").first()
    assert saved_user is not None
    assert len(saved_user.addresses) == 1
    assert saved_user.addresses[0].city == "Bidar"

def test_listing_and_order_flow(test_db):
    user = User(full_name="Pooja Patil", phone_number="9845012345")
    test_db.add(user)
    test_db.flush()

    address = Address(
        user_id=user.id,
        full_name="Pooja Patil",
        phone_number="9845012345",
        address_line1="Near Bidar Fort",
        city="Bidar",
        pincode="585401",
    )
    test_db.add(address)
    test_db.flush()

    book = BookCatalogue(
        title="Concepts of Physics",
        authors="H.C. Verma",
        isbn_13="9788177091878",
        original_mrp=450.0,
    )
    test_db.add(book)
    test_db.flush()

    listing = Listing(
        seller_id=user.id,
        book_catalogue_id=book.id,
        asking_price=220.0,
        condition_grade=ConditionGrade.VERY_GOOD.value,
        pickup_address_id=address.id,
        status=ListingStatus.ACTIVE.value,
    )
    test_db.add(listing)
    test_db.commit()

    saved_listing = test_db.query(Listing).filter(Listing.seller_id == user.id).first()
    assert saved_listing is not None
    assert saved_listing.asking_price == 220.0
    assert saved_listing.book_catalogue.title == "Concepts of Physics"
