from sqlalchemy import Column, String, Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class BookCatalogue(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "book_catalogue"

    title = Column(String(300), nullable=False, index=True)
    subtitle = Column(String(300), nullable=True)
    authors = Column(String(300), nullable=False, index=True)
    isbn_10 = Column(String(20), nullable=True, index=True)
    isbn_13 = Column(String(20), nullable=True, unique=True, index=True)
    publisher = Column(String(200), nullable=True, index=True)
    edition = Column(String(100), nullable=True)
    publication_year = Column(Integer, nullable=True)
    language = Column(String(50), default="English", nullable=False)
    format = Column(String(50), default="Paperback")
    original_mrp = Column(Float, nullable=True)
    page_count = Column(Integer, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    tags = Column(String(500), nullable=True)  # Comma-separated or JSON string
    is_verified = Column(Boolean, default=False)
    metadata_source = Column(String(50), default="manual")  # manual, google_books, open_library

    # Relationships
    category = relationship("Category", back_populates="books")
    listings = relationship("Listing", back_populates="book_catalogue")
