import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: f"user_{uuid.uuid4().hex[:12]}")
    full_name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    gender = Column(String(32), nullable=True, default="Male")
    mobile_number = Column(String(32), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(64), nullable=True)
    avatar_id = Column(String(64), nullable=True, default="owl_avatar_1")
    avatar_uri = Column(String(512), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
