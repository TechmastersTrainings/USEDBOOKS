from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class SubcategorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    sort_order: int
    is_active: bool

class CategorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int
    is_active: bool
    subcategories: List[SubcategorySchema] = []
