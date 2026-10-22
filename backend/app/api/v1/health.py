from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.schemas.health import HealthCheckResponse

router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
def get_health(db: Session = Depends(get_db)):
    """Live health probe verifying system status and database connectivity."""
    db_ok = False
    details = {}
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
        details["database"] = "reachable"
    except Exception as e:
        details["database"] = f"unreachable: {str(e)}"

    return HealthCheckResponse(
        status="ok" if db_ok else "degraded",
        app_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        database_connected=db_ok,
        version="1.0.0",
        pilot_city=settings.LAUNCH_CITY,
        pilot_pincodes=settings.LAUNCH_PINCODES,
        details=details
    )
