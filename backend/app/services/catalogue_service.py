from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.book_catalogue import BookCatalogue
from app.schemas.book_catalogue import BookCatalogueCreate, ISBNSearchResult
from app.integrations.isbn_lookup import ISBNLookupService

class CatalogueService:
    @staticmethod
    def search_local(db: Session, query: str, limit: int = 20) -> List[BookCatalogue]:
        term = f"%{query}%"
        return db.query(BookCatalogue).filter(
            or_(
                BookCatalogue.title.ilike(term),
                BookCatalogue.authors.ilike(term),
                BookCatalogue.isbn_10.ilike(term),
                BookCatalogue.isbn_13.ilike(term),
                BookCatalogue.publisher.ilike(term),
            )
        ).limit(limit).all()

    @staticmethod
    async def find_or_fetch_by_isbn(db: Session, isbn: str) -> Optional[BookCatalogue]:
        clean_isbn = isbn.replace("-", "").replace(" ", "").strip()
        # 1. Search local DB
        local = db.query(BookCatalogue).filter(
            or_(
                BookCatalogue.isbn_13 == clean_isbn,
                BookCatalogue.isbn_10 == clean_isbn
            )
        ).first()
        if local:
            return local

        # 2. Query external provider
        external = await ISBNLookupService.lookup(clean_isbn)
        if external:
            new_book = BookCatalogue(
                title=external.title,
                authors=external.authors,
                isbn_10=external.isbn_10,
                isbn_13=external.isbn_13,
                publisher=external.publisher,
                publication_year=external.publication_year,
                page_count=external.page_count,
                cover_image_url=external.cover_image_url,
                description=external.description,
                metadata_source=external.source,
                is_verified=False
            )
            db.add(new_book)
            db.commit()
            db.refresh(new_book)
            return new_book

        return None

    @staticmethod
    def create_book(db: Session, payload: BookCatalogueCreate, source: str = "manual") -> BookCatalogue:
        book = BookCatalogue(
            **payload.model_dump(),
            metadata_source=source,
            is_verified=True
        )
        db.add(book)
        db.commit()
        db.refresh(book)
        return book
