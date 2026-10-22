import httpx
from typing import Optional, Dict, Any
from app.schemas.book_catalogue import ISBNSearchResult

class ISBNLookupService:
    """Service to look up bibliographic data by ISBN from public APIs (Open Library / Google Books)."""

    @staticmethod
    async def lookup(isbn: str) -> Optional[ISBNSearchResult]:
        clean_isbn = isbn.replace("-", "").replace(" ", "").strip()
        if not clean_isbn:
            return None

        # 1. Try Google Books API
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"https://www.googleapis.com/books/v1/volumes?q=isbn:{clean_isbn}"
                )
                if res.status_code == 200:
                    data = res.json()
                    if data.get("totalItems", 0) > 0:
                        item = data["items"][0]["volumeInfo"]
                        authors_list = item.get("authors", ["Unknown Author"])
                        authors_str = ", ".join(authors_list)
                        
                        cover_url = None
                        if "imageLinks" in item:
                            cover_url = item["imageLinks"].get("thumbnail") or item["imageLinks"].get("smallThumbnail")
                            if cover_url and cover_url.startswith("http://"):
                                cover_url = cover_url.replace("http://", "https://")

                        return ISBNSearchResult(
                            title=item.get("title", "Untitled"),
                            authors=authors_str,
                            isbn_13=clean_isbn if len(clean_isbn) == 13 else None,
                            isbn_10=clean_isbn if len(clean_isbn) == 10 else None,
                            publisher=item.get("publisher"),
                            publication_year=int(item.get("publishedDate", "0")[:4]) if item.get("publishedDate") and item.get("publishedDate")[:4].isdigit() else None,
                            page_count=item.get("pageCount"),
                            cover_image_url=cover_url,
                            description=item.get("description"),
                            source="google_books"
                        )
        except Exception:
            pass

        # 2. Try Open Library API fallback
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{clean_isbn}&format=json&jscmd=data"
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    key = f"ISBN:{clean_isbn}"
                    if key in data:
                        book = data[key]
                        authors = ", ".join([a.get("name", "") for a in book.get("authors", [])]) or "Unknown Author"
                        cover = book.get("cover", {}).get("large") or book.get("cover", {}).get("medium")
                        
                        return ISBNSearchResult(
                            title=book.get("title", "Untitled"),
                            authors=authors,
                            isbn_13=clean_isbn if len(clean_isbn) == 13 else None,
                            isbn_10=clean_isbn if len(clean_isbn) == 10 else None,
                            publisher=", ".join([p.get("name", "") for p in book.get("publishers", [])]) or None,
                            publication_year=int(book.get("publish_date", "0")[-4:]) if book.get("publish_date") and book.get("publish_date")[-4:].isdigit() else None,
                            page_count=book.get("number_of_pages"),
                            cover_image_url=cover,
                            description=book.get("notes") or None,
                            source="open_library"
                        )
        except Exception:
            pass

        return None
