from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.catalogue_service import CatalogueService
from app.schemas.book_catalogue import BookCatalogueResponse, BookCatalogueCreate

router = APIRouter()

@router.get("/catalog/search", response_model=List[BookCatalogueResponse], tags=["Catalogue"])
def search_catalog(
    q: str = Query(..., min_length=2, description="Search term for title, author, or ISBN"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search authoritative book catalogue records."""
    return CatalogueService.search_local(db, q, limit)

@router.get("/catalog/isbn/{isbn}", response_model=BookCatalogueResponse, tags=["Catalogue"])
async def get_by_isbn(
    isbn: str,
    db: Session = Depends(get_db)
):
    """Lookup bibliographic record by ISBN with live external API resolution."""
    book = await CatalogueService.find_or_fetch_by_isbn(db, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book with this ISBN could not be found")
    return book

@router.post("/catalog", response_model=BookCatalogueResponse, status_code=201, tags=["Catalogue"])
def create_catalog_entry(
    payload: BookCatalogueCreate,
    db: Session = Depends(get_db)
):
    """Add or curate a verified bibliographic record."""
    return CatalogueService.create_book(db, payload)
