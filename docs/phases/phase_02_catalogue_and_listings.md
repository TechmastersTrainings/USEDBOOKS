# Phase 2: Catalogue & Listings Architecture — Implementation Plan

## 1. Objectives
* Decouple bibliographic catalogue data model from individual seller listings.
* Build category and subcategory navigation endpoints with hierarchical recursion.
* Implement ISBN lookup and external catalogue metadata matcher (Google Books / Open Library adapter with local caching).
* Create seller listing creation workflow with mandatory condition grading (*Like New*, *Very Good*, *Good*, *Acceptable*, *Heavily Used*), defect disclosures, and actual copy photo uploads.
* Support full-text search with filtering by title, author, category, condition, price range, and location (Bidar first).

## 2. API Endpoints
* `GET /api/v1/categories`: Hierarchical category tree.
* `GET /api/v1/categories/{slug}`: Category detail with subcategories and book counts.
* `GET /api/v1/catalog/search`: Search verified bibliographic catalog by ISBN, title, or author.
* `POST /api/v1/catalog`: Admin endpoint to curate/verify bibliographic metadata.
* `POST /api/v1/listings`: Create seller listing (linked to catalogue item or custom bibliographic entry).
* `POST /api/v1/listings/{id}/images`: Upload verified photos of the physical book.
* `GET /api/v1/listings`: Paginated search with filters (sort, condition, price, city).
* `GET /api/v1/listings/{id}`: Detailed listing view with seller profile, condition notes, and pickup locality.
* `PATCH /api/v1/listings/{id}/status`: Seller update status (Active, Paused, Deleted).

## 3. Data Integrity & Moderation
* Anti-piracy rules: Scanned PDFs, loose photocopies, and unauthorized reprints are rejected.
* Mandatory condition checklist: Notes on markings, torn pages, missing covers, or binding issues.
* Physical book verification: Requiring at least 2 distinct photos (front cover and spine/page edges).
