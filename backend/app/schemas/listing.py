from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.listing import ConditionGrade, ListingStatus
from app.schemas.book_catalogue import BookCatalogueResponse

class ListingImageResponse(BaseModel):
    id: str
    image_url: str
    is_primary: bool
    caption: Optional[str] = None
    sort_order: int

    model_config = ConfigDict(from_attributes=True)

class ListingCreate(BaseModel):
    book_catalogue_id: Optional[str] = None
    custom_title: Optional[str] = None
    custom_authors: Optional[str] = None
    asking_price: float = Field(..., gt=0, description="Asking price in INR")
    condition_grade: ConditionGrade
    missing_pages_defect: bool = Field(default=False, description="Disclose whether pages are missing")
    has_annotations_highlighting: bool = Field(default=False, description="Disclose pen/pencil annotations")
    defect_description: Optional[str] = None
    pickup_address_id: str
    quantity: int = Field(default=1, ge=1)

class ListingStatusUpdate(BaseModel):
    status: ListingStatus

class ListingUpdate(BaseModel):
    asking_price: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    defect_description: Optional[str] = None

class ListingResponse(BaseModel):
    id: str
    seller_id: str
    book_catalogue_id: Optional[str] = None
    custom_title: Optional[str] = None
    custom_authors: Optional[str] = None
    asking_price: float
    condition_grade: str
    missing_pages_defect: bool
    has_annotations_highlighting: bool
    defect_description: Optional[str] = None
    status: str
    quantity: int
    pickup_address_id: str
    book_catalogue: Optional[BookCatalogueResponse] = None
    images: List[ListingImageResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PaginatedListingsResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ListingResponse]
