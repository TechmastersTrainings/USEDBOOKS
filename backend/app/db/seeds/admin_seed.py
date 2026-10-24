from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.address import Address
from app.core.security import hash_password

def seed_admin_accounts(db: Session):
    """Seed essential administrator accounts only, with zero mock or dummy marketplace listings."""
    default_pwd_hash = hash_password("Password@123")

    # 1. Main Admin (Shiva)
    shiva = db.query(User).filter(User.phone_number == "9108950128").first()
    if not shiva:
        shiva = User(
            full_name="shiva bhalke",
            email="shiva@bookloop.com",
            phone_number="9108950128",
            hashed_password=default_pwd_hash,
            role=UserRole.ADMIN.value,
            is_verified=True,
            is_active=True
        )
        db.add(shiva)
        db.flush()
        
        shiva_addr = Address(
            user_id=shiva.id,
            full_name="shiva bhalke",
            phone_number="9108950128",
            address_line1="BIDAR",
            address_line2="Laderi",
            landmark="laxmi nivas",
            city="Bidar",
            state="Karnataka",
            pincode="585401",
            is_default=True,
            is_delivery_address=True,
            is_pickup_address=True
        )
        db.add(shiva_addr)
    else:
        shiva.role = UserRole.ADMIN.value
        shiva.is_active = True
        shiva.is_verified = True
        if not shiva.hashed_password:
            shiva.hashed_password = default_pwd_hash

    # 2. SuperAdmin Fallback
    superadmin = db.query(User).filter((User.email == "admin@bookloop.com") | (User.phone_number == "9999999999")).first()
    if not superadmin:
        superadmin = User(
            full_name="BookLoop SuperAdmin",
            email="admin@bookloop.com",
            phone_number="9999999999",
            hashed_password=default_pwd_hash,
            role=UserRole.ADMIN.value,
            is_verified=True,
            is_active=True
        )
        db.add(superadmin)
    else:
        superadmin.role = UserRole.ADMIN.value
        superadmin.is_active = True

    db.commit()
