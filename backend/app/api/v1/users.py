from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User, SellerProfile, UserRole
from app.models.address import Address
from app.schemas.user import UserResponse, UserUpdate, SellerProfileResponse, SellerKYCSubmit
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse, PincodeLookupResponse
from app.core.config import settings

router = APIRouter(prefix="/users", tags=["Users & Addresses"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.email is not None:
        # Check uniqueness
        existing = db.query(User).filter(User.email == user_update.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already used by another account.")
        current_user.email = user_update.email
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/become-seller", response_model=UserResponse)
def become_seller(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN.value:
        current_user.role = UserRole.SELLER.value

    if not current_user.seller_profile:
        profile = SellerProfile(
            user_id=current_user.id,
            store_name=f"{current_user.full_name}'s Bookshelf",
            kyc_status="pending",
        )
        db.add(profile)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/seller/kyc", response_model=SellerProfileResponse)
def submit_seller_kyc(
    kyc_in: SellerKYCSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.seller_profile:
        # Automatically initialize profile
        profile = SellerProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    else:
        profile = current_user.seller_profile

    if kyc_in.store_name is not None:
        profile.store_name = kyc_in.store_name
    if kyc_in.bio is not None:
        profile.bio = kyc_in.bio
    if kyc_in.upi_id is not None:
        profile.upi_id = kyc_in.upi_id
    if kyc_in.bank_account_number is not None:
        profile.bank_account_number = kyc_in.bank_account_number
    if kyc_in.bank_ifsc is not None:
        profile.bank_ifsc = kyc_in.bank_ifsc

    # Mark KYC submitted for review
    if profile.upi_id or (profile.bank_account_number and profile.bank_ifsc):
        profile.kyc_status = "verified"  # Instant auto-verification for sandbox/pilot launch
    
    current_user.role = UserRole.SELLER.value
    db.commit()
    db.refresh(profile)
    return profile

# ==================== ADDRESS BOOK ENDPOINTS ====================

@router.get("/me/addresses", response_model=List[AddressResponse])
def get_user_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addresses = db.query(Address).filter(Address.user_id == current_user.id).all()
    return addresses

@router.post("/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    addr_in: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If set as default, unset other defaults
    if addr_in.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        full_name=addr_in.full_name,
        phone_number=addr_in.phone_number,
        address_line1=addr_in.address_line1,
        address_line2=addr_in.address_line2,
        landmark=addr_in.landmark,
        city=addr_in.city,
        state=addr_in.state,
        pincode=addr_in.pincode,
        is_default=addr_in.is_default,
        is_pickup_address=addr_in.is_pickup_address,
        is_delivery_address=addr_in.is_delivery_address,
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address

@router.put("/me/addresses/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: str,
    addr_update: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    if addr_update.is_default:
        db.query(Address).filter(Address.user_id == current_user.id, Address.id != address_id).update({"is_default": False})

    update_data = addr_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return address

@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    db.delete(address)
    db.commit()
    return None

# ==================== PINCODE SERVICEABILITY ====================

@router.get("/pincode/{pincode}", response_model=PincodeLookupResponse)
def lookup_pincode(pincode: str):
    clean_pin = pincode.strip()
    is_pilot = clean_pin in settings.LAUNCH_PINCODES
    
    # Bidar pilot pincode mapping
    bidar_pincodes = {
        "585401": ("Bidar City / Gandhi Gunj", "Karnataka"),
        "585402": ("Bidar Air Force Station", "Karnataka"),
        "585403": ("Naubad / Industrial Area", "Karnataka"),
        "585404": ("Mailoor / Bidar Rural", "Karnataka"),
    }

    if clean_pin in bidar_pincodes:
        city, state = bidar_pincodes[clean_pin]
        return PincodeLookupResponse(
            pincode=clean_pin,
            city="Bidar",
            state="Karnataka",
            is_serviceable=True,
            is_pilot_zone=True,
            estimated_delivery_days="Same Day / Next Day (Flat ₹40)",
        )
    elif len(clean_pin) == 6 and clean_pin.isdigit():
        return PincodeLookupResponse(
            pincode=clean_pin,
            city="All India (Intercity)",
            state="India",
            is_serviceable=True,
            is_pilot_zone=False,
            estimated_delivery_days="3–5 Business Days (Courier)",
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 6-digit PIN code format.")
