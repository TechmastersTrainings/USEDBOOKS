import enum
from sqlalchemy import Column, String, Float, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class ConditionGrade(str, enum.Enum):
    LIKE_NEW = "like_new"
    VERY_GOOD = "very_good"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    HEAVILY_USED = "heavily_used"

class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_MODERATION = "pending_moderation"
    ACTIVE = "active"
    RESERVED = "reserved"
    SOLD = "sold"
    PAUSED = "paused"
    REJECTED = "rejected"

class Listing(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "listings"

    seller_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_catalogue_id = Column(String(36), ForeignKey("book_catalogue.id", ondelete="SET NULL"), nullable=True, index=True)
    custom_title = Column(String(300), nullable=True)  # Used when unlinked to catalogue
    custom_authors = Column(String(300), nullable=True)
    asking_price = Column(Float, nullable=False, index=True)
    condition_grade = Column(String(50), nullable=False)  # ConditionGrade enum
    missing_pages_defect = Column(Boolean, default=False, nullable=False)
    has_annotations_highlighting = Column(Boolean, default=False, nullable=False)
    defect_description = Column(Text, nullable=True)
    status = Column(String(50), default=ListingStatus.ACTIVE.value, nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    pickup_address_id = Column(String(36), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    relist_count = Column(Integer, default=0)

    # Relationships
    seller = relationship("User", back_populates="listings")
    book_catalogue = relationship("BookCatalogue", back_populates="listings")
    pickup_address = relationship("Address")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="listing")

class ListingImage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "listing_images"

    listing_id = Column(String(36), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    caption = Column(String(100), nullable=True)  # e.g., "Front Cover", "Spine", "Defect Detail"
    sort_order = Column(Integer, default=0)

    listing = relationship("Listing", back_populates="images")
