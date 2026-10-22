# BookLoop — Master Development Roadmap

This document outlines the end-to-end phased development plan for the BookLoop peer-to-peer used-book marketplace.

## High-Level Vision & Operating Context
BookLoop enables individuals to sell their read physical books to buyers at accessible rates. Operating initially with a city-first pilot in **Bidar, Karnataka** (PINs 585401, 585403), the architecture decouples bibliographic records from individual physical listings, integrates provider-independent courier logistics, enforces double-entry transaction ledgers with compliant escrow settlements, and provides responsive Web, Mobile (Flutter), and Admin interfaces.

---

## 9-Phase Master Matrix

| Phase | Title | Focus Area | Deliverables | Status |
|---|---|---|---|---|
| **Phase 1** | Foundation & Core Setup | Repository, Monorepo Scaffolding, Core DB, Initial Design System | FastAPI setup, SQLAlchemy 2.x engine, Alembic, Docker, Taxonomies, Web/Mobile scaffolds | **In Progress** |
| **Phase 2** | Catalogue & Listings | Taxonomy, Bibliographic Records, Condition Grading, Listings | Categories API, Book Catalog API, Seller Listing API, S3 photo upload adapter, ISBN search | Queued |
| **Phase 3** | Authentication & Accounts | Identity, OTP Verification, RBAC, Profiles & Addresses | JWT Auth, SMS/Email OTP service adapter, Address book, Buyer/Seller profile management | Queued |
| **Phase 4** | Web & Mobile Experience | Customer Journey, Discovery, Seller Studio | Full responsive React web store, Flutter mobile app, Book discovery, Listing creation wizard | Queued |
| **Phase 5** | Orders & Checkout Engine | Cart, Inventory Reservation, State Machine | Cart service, Checkout pipeline, Order state machine, Inventory locks, Cancellation workflows | Queued |
| **Phase 6** | Payments & Settlements | Gateway Integration, Ledger, Seller Payouts | Gateway adapter (Razorpay/Cashfree sandbox), Signed webhooks, Escrow ledger, Payouts engine | Queued |
| **Phase 7** | Delivery & Logistics | Courier Abstraction, Rate Calculation, Tracking | Delhivery/Local Rider adapter, Volumetric rate calculator, Label generator, Event tracker | Queued |
| **Phase 8** | Administration & Governance | Moderation, Disputes, Analytics, System Rules | Admin dashboard, Listing moderation, Dispute resolution, Commission/GST config manager | Queued |
| **Phase 9** | Quality, Security & Pilot Launch | Automated Testing, Load Testing, Pilot Deployment | End-to-end test suites, Security audit, Windows/Linux deployment guides, Bidar pilot readiness | Queued |
