from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class BookCatalogueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    subtitle: Optional[str] = None
    authors: str = Field(..., min_length=1, max_length=300)
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None
    publisher: Optional[str] = None
    edition: Optional[str] = None
    publication_year: Optional[int] = None
    language: str = "English"
    format: str = "Paperback"
    original_mrp: Optional[float] = None
    page_count: Optional[int] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[str] = None

class BookCatalogueCreate(BookCatalogueBase):
    pass

class BookCatalogueResponse(BookCatalogueBase):
    id: str
    is_verified: bool
    metadata_source: str

    model_config = ConfigDict(from_attributes=True)

class ISBNSearchResult(BaseModel):
    title: str
    authors: str
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    page_count: Optional[int] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    source: str
