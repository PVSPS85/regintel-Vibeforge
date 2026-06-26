from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Convert PostgresDsn to string for SQLAlchemy engine
SQLALCHEMY_DATABASE_URL = str(settings.DATABASE_URL)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,          # Verify connections before checkout
    pool_recycle=280,            # Recycle before Supabase's 300s idle timeout
    pool_size=5,
    max_overflow=10,
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 60,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
