from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategorySchema

router = APIRouter()

@router.get("/categories", response_model=List[CategorySchema], tags=["Taxonomy"])
def list_categories(db: Session = Depends(get_db)):
    """Retrieve full hierarchical category tree with root and subcategories."""
    roots = (
        db.query(Category)
        .filter(Category.parent_id == None, Category.is_active == True)
        .order_by(Category.sort_order.asc())
        .all()
    )
    return roots
