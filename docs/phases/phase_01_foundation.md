# Phase 1: Foundation & Core Setup — Implementation Plan

## 1. Objectives
* Establish clean monorepo architecture:
  * `backend/` (FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, PostgreSQL)
  * `apps/web/` (React, Vite, TypeScript, bespoke design system)
  * `apps/mobile/` (Flutter, Dart, cross-platform Android/iOS)
  * `apps/admin/` (Administrative tools foundation)
  * `infrastructure/` (Docker, Docker Compose, Nginx)
  * `docs/` (Comprehensive engineering documentation, plans, registers)
* Implement unified configuration system via Pydantic settings loading from `.env`.
* Construct SQLAlchemy 2.x database models with declarative Base, UUID keys, timestamps, indexes, and constraints.
* Author an automated database migration and taxonomy seed script loading the complete multi-level book category hierarchy (Fiction, Non-fiction, Engineering, Medicine, Competitive Exams like UPSC/KPSC/NEET/JEE, Academic Textbooks, Regional Languages).
* Build modern responsive Web frontend with custom typography, warm bookish aesthetic, design tokens (colors, elevation, spacing, radii), and core UI primitives.
* Build Flutter mobile application foundation with matching theme tokens, responsive layout, and bottom navigation.
* Provide Docker Compose and environment configuration templates.
* Implement health check API (`/api/v1/health`) and initial automated test suite.

## 2. Technical Deliverables
1. `backend/app/core/config.py`: Settings model with DB URI, CORS, security secrets, redis, and file upload settings.
2. `backend/app/core/database.py`: SQLAlchemy engine, session maker, base model with timestamp mixins.
3. `backend/app/models/`: Base entities (User, Address, Category, BookCatalogue, Listing, ListingImage, Order, Payment, Shipment, Ledger).
4. `backend/app/db/seeds/taxonomy_seed.py`: Full hierarchical category seed script covering all prompt-specified domains.
5. `backend/app/api/v1/health.py`: Live database and service health inspection.
6. `apps/web/`: React + Vite + TS app containing:
   - `src/styling/tokens.css`: Color palette (warm cream/paper backgrounds, forest greens, terracotta, warm slate, elegant serif/sans typography).
   - `src/components/ui/`: Button, Card, Badge, Input, Modal, Navbar, Footer.
   - `src/pages/`: Home, Explore, BookDetails, Sell.
7. `apps/mobile/`: Flutter app structure with:
   - `pubspec.yaml`
   - `lib/core/theme/app_theme.dart`
   - `lib/core/constants/colors.dart`
   - `lib/features/home/presentation/home_screen.dart`
   - `lib/main.dart`
8. `docker-compose.yml` and `.env.example`.
9. `README.md` with Windows PowerShell and Unix setup commands.

## 3. Success & Verification Criteria
* Backend server boots cleanly via `uvicorn app.main:app`.
* Database tables and migration scripts initialize without errors.
* Taxonomy seed script populates 50+ categories and subcategories.
* `/api/v1/health` returns `status: ok` and database connection confirmation.
* Web frontend builds cleanly via `npm run build` without TypeScript errors.
* Mobile app structure conforms to production Flutter standards.
