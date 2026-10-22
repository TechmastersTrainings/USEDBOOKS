from typing import Dict
from pydantic import BaseModel

class HealthCheckResponse(BaseModel):
    status: str
    app_name: str
    environment: str
    database_connected: bool
    version: str
    pilot_city: str
    pilot_pincodes: list[str]
    details: Dict[str, str]
