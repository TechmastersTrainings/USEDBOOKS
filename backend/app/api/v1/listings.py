from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.listing_service import ListingService
from app.schemas.listing import (
    ListingCreate,
    ListingResponse,
    PaginatedListingsResponse,
    ListingStatusUpdate,
    ListingImageResponse
)

router = APIRouter()

@router.get("/listings", response_model=PaginatedListingsResponse, tags=["Listings"])
def list_listings(
    q: Optional[str] = Query(None, description="Search keyword in title, author, or ISBN"),
    condition: Optional[str] = Query(None, description="Condition grade filter"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    city: Optional[str] = Query(None, description="Filter by seller city e.g. Bidar"),
    sort: str = Query("newest", pattern="^(newest|price_low|price_high|relevance)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search and browse active seller listings with faceted filters."""
    total, items = ListingService.search_listings(
        db,
        query=q,
        condition_grade=condition,
        min_price=min_price,
        max_price=max_price,
        city=city,
        sort_by=sort,
        page=page,
        limit=limit
    )
    return PaginatedListingsResponse(total=total, page=page, limit=limit, items=items)

@router.get("/listings/{listing_id}", response_model=ListingResponse, tags=["Listings"])
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed listing view including verified photos and condition notes."""
    listing = ListingService.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

from fastapi.security import HTTPAuthorizationCredentials
from app.api.deps import get_db, security
from app.core.security import decode_token

@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, tags=["Listings"])
def create_listing(
    payload: ListingCreate,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    seller_id: Optional[str] = Query(None, description="Seller ID context (auto-extracted from token if provided)"),
    db: Session = Depends(get_db)
):
    """Create a new physical book listing with condition disclosure."""
    actual_seller_id = seller_id
    if auth_header and auth_header.credentials:
        token_payload = decode_token(auth_header.credentials)
        if token_payload and token_payload.get("sub"):
            actual_seller_id = token_payload.get("sub")
    if not actual_seller_id:
        actual_seller_id = "dev-seller-id"

    return ListingService.create_listing(db, actual_seller_id, payload)

@router.patch("/listings/{listing_id}/status", response_model=ListingResponse, tags=["Listings"])
def update_listing_status(
    listing_id: str,
    payload: ListingStatusUpdate,
    seller_id: str = Query("dev-seller-id", description="Seller ID context"),
    db: Session = Depends(get_db)
):
    """Pause, resume, or remove a seller listing."""
    return ListingService.update_status(db, listing_id, seller_id, payload.status)

@router.post("/listings/{listing_id}/images", response_model=ListingImageResponse, tags=["Listings"])
def upload_listing_image(
    listing_id: str,
    image_url: str = Query(..., description="Image URL or S3 storage path"),
    is_primary: bool = Query(False),
    caption: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Attach photographic evidence of actual physical copy to a listing."""
    listing = ListingService.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingService.attach_image(db, listing_id, image_url, is_primary, caption)
