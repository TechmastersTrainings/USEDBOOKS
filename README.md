# BookLoop — Peer-to-Peer Used-Book Marketplace (India)

**BookLoop** is an online marketplace enabling readers and students across India to sell their used physical books directly to buyers at affordable prices, starting with a city-first launch in **Bidar, Karnataka (PINs: 585401, 585403)**.

---

## 🏛️ System Architecture Overview

```
book-marketplace/
├── apps/
│   ├── web/                     # React + Vite + TypeScript (Bespoke Warm Editorial Design System)
│   ├── mobile/                  # Flutter (Dart) cross-platform app (Android & iOS)
│   └── admin/                   # Administrative portal foundation
├── backend/
│   ├── app/
│   │   ├── api/v1/              # Health & modular controllers
│   │   ├── core/                # Config (pydantic-settings), database engine, security
│   │   ├── models/              # SQLAlchemy 2.x models (Users, Addresses, Catalogue, Listings, Orders, Shipments, Ledger)
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   └── db/seeds/            # Hierarchical taxonomy seeder (50+ categories)
│   ├── migrations/              # Alembic migration environment
│   └── tests/                   # Pytest test suite
├── infrastructure/
│   ├── docker/                  # Backend & Frontend Dockerfiles
│   └── nginx/                   # Reverse proxy configuration
├── docs/                        # Complete project documentation & phase implementation plans
│   ├── master_roadmap.md        # 9-Phase Master Plan
│   ├── ASSUMPTIONS.md           # Commercial, tax (GST HSN 4901), and legal register
│   ├── PROGRESS.md              # Phased progress tracker
│   ├── phases/                  # Detailed per-phase engineering specifications (Phase 1 to 9)
│   └── architecture/            # Architecture diagrams, ERD, and state machines
├── docker-compose.yml           # Local dev cluster (Postgres, Redis, Backend, Web)
├── .env.example                 # Configuration template
└── README.md                    # Setup and runbook
```

---

## 🚀 Quickstart Guide (Windows 11 PowerShell)

### 1. Prerequisites
* **Python**: 3.10+ (Installed with PATH enabled)
* **Node.js**: v18+ & **npm**
* **Git**
* *(Optional)* Docker Desktop & Flutter SDK

---

### 2. Backend Setup (PowerShell)

Open PowerShell in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip & install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Create .env from template
Copy-Item ..\.env.example .env

# Run database migrations and seed taxonomy (50+ categories)
python -m app.db.seeds.taxonomy_seed

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

* **API Root**: [http://localhost:8000](http://localhost:8000)
* **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 3. Web Application Setup (PowerShell)

In a second PowerShell window:

```powershell
# Navigate to web application directory
cd apps\web

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

* **Web Storefront**: [http://localhost:5173](http://localhost:5173)

---

### 4. Running Backend Tests (PowerShell)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

---

### 5. Running with Docker Compose (All Platforms)

```bash
docker-compose up --build -d
```

---

## 📑 Detailed Documentation Index
All engineering documents, phase plans, and compliance registers are stored inside the [`docs/`](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs) directory:
* [Master Development Roadmap](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/master_roadmap.md)
* [Phase 1: Foundation & Core Setup](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_01_foundation.md)
* [Phase 2: Catalogue & Listings](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_02_catalogue_and_listings.md)
* [Phase 3: Authentication & Accounts](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_03_authentication_and_accounts.md)
* [Phase 4: Web & Mobile Experience](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_04_website_and_mobile_experience.md)
* [Phase 5: Orders & Checkout Engine](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_05_orders_and_checkout.md)
* [Phase 6: Payments & Settlements](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_06_payments_and_settlements.md)
* [Phase 7: Delivery & Logistics](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_07_delivery_and_logistics.md)
* [Phase 8: Administration & Governance](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_08_administration_and_governance.md)
* [Phase 9: Quality & Pilot Launch](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/phases/phase_09_quality_and_pilot_launch.md)
* [Assumptions Register](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/ASSUMPTIONS.md)
* [Implementation Progress](file:///Volumes/SHIV%20BHALKE/TECHMASTER/USEDBOOK%20PROJECT/docs/PROGRESS.md)
