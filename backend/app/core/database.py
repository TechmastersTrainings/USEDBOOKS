from typing import Any, Dict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# 1. Normalize database URL for PostgreSQL compatibility
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    # SQLAlchemy 1.4+ and 2.0+ require 'postgresql://' instead of legacy 'postgres://'
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# 2. Configure engine parameters based on dialect
engine_kwargs: Dict[str, Any] = {
    "echo": False,
    "future": True,
}

if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool settings:
    # pool_pre_ping: tests liveness with a quick ping, automatically reconnecting dropped sockets
    # pool_recycle: rotates connections after 5 minutes, preventing stale server drops on cloud DBs (Render/Neon/Supabase)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()

def get_db():
    """Dependency that provides an isolated database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
