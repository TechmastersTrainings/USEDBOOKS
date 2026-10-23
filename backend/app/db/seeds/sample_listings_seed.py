from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, SellerProfile, UserRole
from app.models.address import Address
from app.models.category import Category
from app.models.book_catalogue import BookCatalogue
from app.models.listing import Listing, ListingImage, ConditionGrade, ListingStatus

def seed_sample_marketplace_data(db: Session):
    # 1. Create Verified Sellers in Bidar
    seller1 = db.query(User).filter(User.phone_number == "9845112233").first()
    if not seller1:
        seller1 = User(
            full_name="Rajesh Patil",
            email="rajesh.patil@example.com",
            phone_number="9845112233",
            role=UserRole.SELLER.value,
            is_verified=True
        )
        db.add(seller1)
        db.flush()

        profile1 = SellerProfile(
            user_id=seller1.id,
            store_name="Patil Academic Resale",
            bio="Graduated from GNDEC Bidar. Selling pre-loved engineering and competitive exam texts.",
            rating_average=4.9,
            rating_count=14.0,
            upi_id="rajeshpatil@okhdfcbank",
            kyc_status="verified"
        )
        db.add(profile1)

        addr1 = Address(
            user_id=seller1.id,
            full_name="Rajesh Patil",
            phone_number="9845112233",
            address_line1="Plot 42, GNDEC Campus Road, Naubad",
            city="Bidar",
            state="Karnataka",
            pincode="585402",
            is_pickup_address=True
        )
        db.add(addr1)
        db.flush()
    else:
        addr1 = db.query(Address).filter(Address.user_id == seller1.id).first()

    seller2 = db.query(User).filter(User.phone_number == "9880223344").first()
    if not seller2:
        seller2 = User(
            full_name="Sunita Kulkarni",
            email="sunita.kulkarni@example.com",
            phone_number="9880223344",
            role=UserRole.SELLER.value,
            is_verified=True
        )
        db.add(seller2)
        db.flush()

        profile2 = SellerProfile(
            user_id=seller2.id,
            store_name="Sunita's Book Corner",
            bio="Avid reader and UPSC aspirant in Bidar. All books kept in clean, smoke-free home.",
            rating_average=5.0,
            rating_count=8.0,
            upi_id="sunitakulkarni@okaxis",
            kyc_status="verified"
        )
        db.add(profile2)

        addr2 = Address(
            user_id=seller2.id,
            full_name="Sunita Kulkarni",
            phone_number="9880223344",
            address_line1="House 3-4-88, Near Gandhi Gunj Circle",
            city="Bidar",
            state="Karnataka",
            pincode="585401",
            is_pickup_address=True
        )
        db.add(addr2)
        db.flush()
    else:
        addr2 = db.query(Address).filter(Address.user_id == seller2.id).first()

    # 2. Find Category References
    upsc_cat = db.query(Category).filter(Category.name == "UPSC Civil Services").first()
    eng_cat = db.query(Category).filter(Category.name == "Computer Science").first()

    # 3. Create Sample Book Catalogue Records
    book1 = db.query(BookCatalogue).filter(BookCatalogue.isbn_13 == "9789354601422").first()
    if not book1:
        book1 = BookCatalogue(
            title="Indian Polity for Civil Services",
            subtitle="Sixth Revised Edition",
            authors="M. Laxmikanth",
            isbn_13="9789354601422",
            isbn_10="9354601424",
            publisher="McGraw Hill Education India",
            edition="6th Revised",
            publication_year=2023,
            original_mrp=895.0,
            page_count=920,
            cover_image_url="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
            category_id=upsc_cat.id if upsc_cat else None,
            description="The definitive guide for Indian Polity and Constitution for UPSC and State PSC exams.",
            is_verified=True
        )
        db.add(book1)
        db.flush()

    book2 = db.query(BookCatalogue).filter(BookCatalogue.isbn_13 == "9789389588286").first()
    if not book2:
        book2 = BookCatalogue(
            title="Higher Engineering Mathematics",
            subtitle="44th Edition",
            authors="Dr. B.S. Grewal",
            isbn_13="9789389588286",
            isbn_10="9389588285",
            publisher="Khanna Publishers",
            edition="44th",
            publication_year=2022,
            original_mrp=995.0,
            page_count=1315,
            cover_image_url="https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80",
            category_id=eng_cat.id if eng_cat else None,
            description="Standard comprehensive mathematics text for B.E. and B.Tech engineering undergraduate courses across Indian universities.",
            is_verified=True
        )
        db.add(book2)
        db.flush()

    # 4. Create Seller Listings
    existing_listing = db.query(Listing).filter(Listing.seller_id == seller1.id).first()
    if not existing_listing and addr1 and book2:
        listing1 = Listing(
            seller_id=seller1.id,
            book_catalogue_id=book2.id,
            asking_price=420.0,
            condition_grade=ConditionGrade.LIKE_NEW.value,
            missing_pages_defect=False,
            has_annotations_highlighting=False,
            defect_description="No missing pages, no marks. Pristine condition with protective plastic wrapper.",
            pickup_address_id=addr1.id,
            status=ListingStatus.ACTIVE.value
        )
        db.add(listing1)
        db.flush()

        img1 = ListingImage(
            listing_id=listing1.id,
            image_url="https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80",
            is_primary=True,
            caption="Front Cover"
        )
        db.add(img1)

    existing_listing2 = db.query(Listing).filter(Listing.seller_id == seller2.id).first()
    if not existing_listing2 and addr2 and book1:
        listing2 = Listing(
            seller_id=seller2.id,
            book_catalogue_id=book1.id,
            asking_price=380.0,
            condition_grade=ConditionGrade.VERY_GOOD.value,
            missing_pages_defect=False,
            has_annotations_highlighting=True,
            defect_description="Pencil underlines on first three chapters only. Zero missing pages. Binding completely intact.",
            pickup_address_id=addr2.id,
            status=ListingStatus.ACTIVE.value
        )
        db.add(listing2)
        db.flush()

    # 5. Ensure deterministic sample listings 1-4 exist for fallback and storefront demo
    sample_catalog_records = [
        {
            'id': '1',
            'seller_id': seller2.id,
            'book_catalogue_id': book1.id if book1 else None,
            'custom_title': 'Indian Polity for Civil Services',
            'custom_authors': 'M. Laxmikanth',
            'asking_price': 380.0,
            'condition_grade': ConditionGrade.VERY_GOOD.value,
            'pickup_address_id': addr2.id if addr2 else addr1.id,
            'img': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
        },
        {
            'id': '2',
            'seller_id': seller1.id,
            'book_catalogue_id': book2.id if book2 else None,
            'custom_title': 'Higher Engineering Mathematics',
            'custom_authors': 'Dr. B.S. Grewal',
            'asking_price': 420.0,
            'condition_grade': ConditionGrade.LIKE_NEW.value,
            'pickup_address_id': addr1.id,
            'img': 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80'
        },
        {
            'id': '3',
            'seller_id': seller1.id,
            'book_catalogue_id': None,
            'custom_title': 'Atomic Habits',
            'custom_authors': 'James Clear',
            'asking_price': 260.0,
            'condition_grade': ConditionGrade.GOOD.value,
            'pickup_address_id': addr1.id,
            'img': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
        },
        {
            'id': '4',
            'seller_id': seller2.id,
            'book_catalogue_id': None,
            'custom_title': 'Karvalo & Other Stories (Kannada)',
            'custom_authors': 'K.P. Poornachandra Tejaswi',
            'asking_price': 180.0,
            'condition_grade': ConditionGrade.VERY_GOOD.value,
            'pickup_address_id': addr2.id if addr2 else addr1.id,
            'img': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
        }
    ]

    for item in sample_catalog_records:
        existing = db.query(Listing).filter(Listing.id == item['id']).first()
        if not existing:
            l = Listing(
                id=item['id'],
                seller_id=item['seller_id'],
                book_catalogue_id=item['book_catalogue_id'],
                custom_title=item['custom_title'],
                custom_authors=item['custom_authors'],
                asking_price=item['asking_price'],
                condition_grade=item['condition_grade'],
                missing_pages_defect=False,
                has_annotations_highlighting=False,
                pickup_address_id=item['pickup_address_id'],
                status=ListingStatus.ACTIVE.value
            )
            db.add(l)
            db.flush()
            img = ListingImage(
                listing_id=item['id'],
                image_url=item['img'],
                is_primary=True,
                caption='Cover'
            )
            db.add(img)
        else:
            existing.status = ListingStatus.ACTIVE.value

    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_sample_marketplace_data(db)
        print("Sample marketplace sellers, verified books, and physical listings seeded.")
    finally:
        db.close()
