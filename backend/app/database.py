import logging
from urllib.parse import urlparse

from app.config import BASE_DIR, ROOT_DIR, settings
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("RoverDatabase")

def ensure_mysql_database(db_url: str):
    """Ensure the target MySQL database exists before SQLAlchemy connects."""
    if not (db_url.startswith("mysql://") or db_url.startswith("mysql+pymysql://")):
        return
    try:
        import pymysql
        parsed = urlparse(db_url)
        db_name = parsed.path.lstrip("/")
        if not db_name:
            return
        
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 3306
        user = parsed.username or "root"
        password = parsed.password or ""

        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connect_timeout=4,
            autocommit=True
        )
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()
        logger.info(f"Verified/Created MySQL database `{db_name}` on {host}:{port}")
    except Exception as e:
        logger.warning(f"Notice on MySQL auto-create: {e}")

# Verify database connectivity and configure target engine
db_type = settings.DB_TYPE.lower()

if db_type == "mongodb":
    logger.info(f"Target Primary Database Engine: MongoDB (Database: '{settings.MONGO_DB}')")
    try:
        from app.mongodb import ensure_mongo_indexes, get_mongo_client, is_mongo_connected
        if is_mongo_connected():
            logger.info(f"Connected to MongoDB server. Primary database '{settings.MONGO_DB}' is verified and active.")
            ensure_mongo_indexes()
        else:
            logger.warning(f"Notice: MongoDB server at {settings.MONGO_HOST}:{settings.MONGO_PORT} is not yet reached.")
    except Exception as mongo_err:
        logger.warning(f"MongoDB initialization notice: {mongo_err}")

    # Initialize local SQLite engine for SQLAlchemy compatibility layer
    sqlite_path = ROOT_DIR / "structural_rover.db"
    engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
elif db_type == "mysql":
    db_url = settings.DATABASE_URL
    ensure_mysql_database(db_url)
    # Test if connection can actually be established
    try:
        test_eng = create_engine(db_url, connect_args={"connect_timeout": 2})
        with test_eng.connect() as test_conn:
            pass
        test_eng.dispose()
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_recycle=3600,
            pool_pre_ping=True
        )
        logger.info(f"Connected to primary MySQL database at {settings.MYSQL_HOST}:{settings.MYSQL_PORT}")
    except Exception as eng_err:
        logger.warning(f"MySQL connection failed ({eng_err}). Falling back to local SQLite engine (structural_rover.db)...")
        sqlite_path = ROOT_DIR / "structural_rover.db"
        engine = create_engine(
            f"sqlite:///{sqlite_path}",
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )
else:
    engine = create_engine(
        f"sqlite:///{ROOT_DIR / 'structural_rover.db'}",
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
