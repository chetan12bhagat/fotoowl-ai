"""
FotoOwl AI — SQLite to PostgreSQL Data Migration Script
Copies existing registered user records from local SQLite to production PostgreSQL.
Usage:
    export DATABASE_URL="postgresql://user:password@hostname:5432/fotoowl"
    python backend/scripts/migrate_to_postgres.py
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.otp import EmailOTP
from app.database import Base

SQLITE_PATH = BASE_DIR.parent / "fotoowl.db"
SQLITE_URL = f"sqlite:///{SQLITE_PATH}"

PG_URL = os.environ.get("DATABASE_URL")
if not PG_URL or PG_URL.startswith("sqlite"):
    print("[ERROR] Please set production DATABASE_URL environment variable.")
    print("Example: export DATABASE_URL=\"postgresql://user:pass@host:5432/fotoowl\"")
    sys.exit(1)

if PG_URL.startswith("postgres://"):
    PG_URL = PG_URL.replace("postgres://", "postgresql://", 1)

print(f"[*] Reading source database: {SQLITE_URL}")
print(f"[*] Target production database: {PG_URL.split('@')[-1]}")

sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SqliteSession = sessionmaker(bind=sqlite_engine)

pg_engine = create_engine(PG_URL, pool_pre_ping=True)
PgSession = sessionmaker(bind=pg_engine)

# Ensure tables exist in target PostgreSQL
print("[*] Ensuring tables exist in PostgreSQL...")
Base.metadata.create_all(bind=pg_engine)

src_db = SqliteSession()
dst_db = PgSession()

try:
    src_users = src_db.query(User).all()
    print(f"[*] Found {len(src_users)} users in SQLite database.")

    migrated_users = 0
    for u in src_users:
        existing = dst_db.query(User).filter_by(email=u.email).first()
        if not existing:
            new_u = User(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                password_hash=u.password_hash,
                gender=u.gender,
                mobile_number=u.mobile_number,
                address=u.address,
                city=u.city,
                avatar_id=u.avatar_id,
                avatar_uri=u.avatar_uri,
                is_verified=u.is_verified,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
            dst_db.add(new_u)
            migrated_users += 1
        else:
            print(f"    - Skipping already existing user: {u.email}")

    dst_db.commit()
    print(f"[✓] Successfully migrated {migrated_users} users to production PostgreSQL!")
except Exception as e:
    dst_db.rollback()
    print(f"[!] Migration failed: {e}")
    sys.exit(1)
finally:
    src_db.close()
    dst_db.close()
