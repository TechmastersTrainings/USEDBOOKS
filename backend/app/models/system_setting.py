from sqlalchemy import Column, String, Text, Boolean
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin

class SystemSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "system_settings"

    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)  # If exposed to public frontend clients
