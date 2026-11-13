"""
MongoDB Database Interface for Agile Structural Health & Crack Detection Rover System
Primary Target Database: 'agile'
Manages connection pooling, index definitions, document schemas, and lifecycle hooks.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger("RoverMongoDB")

_mongo_client: Optional[Any] = None
_mongo_db: Optional[Any] = None

# Collection Names for database 'agile'
COLLECTION_USERS = "users"
COLLECTION_ROVERS = "rovers"
COLLECTION_BUILDINGS = "buildings"
COLLECTION_WALLS = "walls"
COLLECTION_INSPECTIONS = "inspections"
COLLECTION_IMAGES = "images"
COLLECTION_DEFECTS = "defects"
COLLECTION_HEALTH_RESULTS = "health_results"
COLLECTION_RUL_PREDICTIONS = "rul_predictions"
COLLECTION_ALERTS = "alerts"

ALL_COLLECTIONS = [
    COLLECTION_USERS,
    COLLECTION_ROVERS,
    COLLECTION_BUILDINGS,
    COLLECTION_WALLS,
    COLLECTION_INSPECTIONS,
    COLLECTION_IMAGES,
    COLLECTION_DEFECTS,
    COLLECTION_HEALTH_RESULTS,
    COLLECTION_RUL_PREDICTIONS,
    COLLECTION_ALERTS,
]


def get_mongo_client(server_timeout_ms: int = 2000):
    """
    Initializes and returns a singleton MongoClient connected to the configured MongoDB instance.
    """
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client

    try:
        from pymongo import MongoClient
        mongo_url = settings.MONGODB_URL
        logger.info(f"Connecting to MongoDB at {settings.MONGO_HOST}:{settings.MONGO_PORT} (target db: '{settings.MONGO_DB}')")
        
        _mongo_client = MongoClient(
            mongo_url,
            serverSelectionTimeoutMS=server_timeout_ms,
            connectTimeoutMS=server_timeout_ms,
            maxPoolSize=50,
            minPoolSize=5
        )
        # Verify connection immediately via ping
        _mongo_client.admin.command("ping")
        logger.info(f"Successfully connected to MongoDB server. Database '{settings.MONGO_DB}' is ready.")
        return _mongo_client
    except Exception as exc:
        logger.warning(f"MongoDB connection attempt to {settings.MONGO_HOST}:{settings.MONGO_PORT} failed or offline: {exc}")
        return None


def get_mongo_db(db_name: Optional[str] = None):
    """
    Returns the database handle for 'agile' (or custom overridden db_name).
    """
    global _mongo_db
    target_name = db_name or settings.MONGO_DB or "agile"
    if _mongo_db is not None and _mongo_db.name == target_name:
        return _mongo_db

    client = get_mongo_client()
    if client is not None:
        _mongo_db = client[target_name]
        return _mongo_db
    return None


_last_mongo_check_time = 0.0
_mongo_connected_cached = False

def is_mongo_connected() -> bool:
    """Returns True if the MongoDB instance is live and responsive (cached for 10s to avoid blocking)."""
    global _last_mongo_check_time, _mongo_connected_cached
    import time
    now = time.time()
    if now - _last_mongo_check_time < 10.0:
        return _mongo_connected_cached
    _last_mongo_check_time = now
    try:
        client = get_mongo_client(server_timeout_ms=300)
        if client is None:
            _mongo_connected_cached = False
            return False
        client.admin.command("ping")
        _mongo_connected_cached = True
        return True
    except Exception:
        _mongo_connected_cached = False
        return False


def ensure_mongo_indexes():
    """
    Creates indexes across all collections in the 'agile' MongoDB database
    for optimal query performance and uniqueness guarantees.
    """
    db = get_mongo_db()
    if db is None:
        logger.warning("MongoDB is offline; skipping index verification.")
        return False

    try:
        from pymongo import ASCENDING, DESCENDING

        # Users: unique username and email
        db[COLLECTION_USERS].create_index([("username", ASCENDING)], unique=True, sparse=True)
        db[COLLECTION_USERS].create_index([("email", ASCENDING)], unique=True, sparse=True)

        # Rovers: unique rover_code
        db[COLLECTION_ROVERS].create_index([("rover_code", ASCENDING)], unique=True, sparse=True)
        db[COLLECTION_ROVERS].create_index([("status", ASCENDING)])

        # Buildings: name
        db[COLLECTION_BUILDINGS].create_index([("name", ASCENDING)])

        # Walls: wall_code and building_id
        db[COLLECTION_WALLS].create_index([("wall_code", ASCENDING)])
        db[COLLECTION_WALLS].create_index([("building_id", ASCENDING)])

        # Inspections: inspection_code unique, wall_id, rover_code, status
        db[COLLECTION_INSPECTIONS].create_index([("inspection_code", ASCENDING)], unique=True, sparse=True)
        db[COLLECTION_INSPECTIONS].create_index([("wall_id", ASCENDING)])
        db[COLLECTION_INSPECTIONS].create_index([("rover_code", ASCENDING)])
        db[COLLECTION_INSPECTIONS].create_index([("status", ASCENDING)])
        db[COLLECTION_INSPECTIONS].create_index([("start_time", DESCENDING)])

        # Images: inspection_id, timestamp
        db[COLLECTION_IMAGES].create_index([("inspection_id", ASCENDING)])
        db[COLLECTION_IMAGES].create_index([("timestamp", DESCENDING)])

        # Defects: inspection_id, image_id, severity
        db[COLLECTION_DEFECTS].create_index([("inspection_id", ASCENDING)])
        db[COLLECTION_DEFECTS].create_index([("image_id", ASCENDING)])
        db[COLLECTION_DEFECTS].create_index([("severity", ASCENDING)])

        # Health Results: inspection_id unique
        db[COLLECTION_HEALTH_RESULTS].create_index([("inspection_id", ASCENDING)], unique=True, sparse=True)
        db[COLLECTION_HEALTH_RESULTS].create_index([("evaluated_at", DESCENDING)])

        # RUL Predictions: health_result_id, inspection_id
        db[COLLECTION_RUL_PREDICTIONS].create_index([("health_result_id", ASCENDING)])
        db[COLLECTION_RUL_PREDICTIONS].create_index([("inspection_id", ASCENDING)])

        # Alerts: inspection_id, severity, is_acknowledged
        db[COLLECTION_ALERTS].create_index([("inspection_id", ASCENDING)])
        db[COLLECTION_ALERTS].create_index([("severity", ASCENDING)])
        db[COLLECTION_ALERTS].create_index([("is_acknowledged", ASCENDING)])
        db[COLLECTION_ALERTS].create_index([("created_at", DESCENDING)])

        logger.info(f"Verified and configured MongoDB indexes for database '{db.name}'.")
        return True
    except Exception as err:
        logger.warning(f"Error ensuring MongoDB indexes: {err}")
        return False


def seed_mongo_data():
    """
    Initializes default seed documents in MongoDB 'agile' database:
    - Default inspector engineer user
    - Autonomous ESP32-CAM Rover ('ROVER-01')
    - Default structure / building and wall
    """
    db = get_mongo_db()
    if db is None:
        logger.warning("Cannot seed MongoDB: server not connected.")
        return False

    try:
        from app.core.security import hash_password
        now = datetime.now(timezone.utc)

        # 1. Default Inspector User (only if users collection is empty)
        if db[COLLECTION_USERS].count_documents({}) == 0:
            default_user = {
                "id": 1,
                "username": "inspector",
                "email": "inspector@rover-agile.org",
                "hashed_password": hash_password("admin123"),
                "full_name": "Jeeva - Chief Structural Engineer",
                "role": "engineer",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            db[COLLECTION_USERS].insert_one(default_user)
            logger.info(f"MongoDB '{db.name}': Created baseline inspector user.")

        # 2. Default Registered Rover (only if rovers collection is empty)
        if db[COLLECTION_ROVERS].count_documents({}) == 0:
            default_rover = {
                "id": 1,
                "rover_code": "ROVER-01",
                "name": "Autonomous ESP32-CAM Crawler V1",
                "ip_address": "192.168.4.1",
                "port": 8080,
                "battery_percentage": 94.5,
                "status": "READY",
                "wifi_signal_dbm": -52,
                "firmware_version": "v2.4.1-ESP32-CAM",
                "last_seen_at": now,
                "created_at": now,
                "updated_at": now
            }
            db[COLLECTION_ROVERS].insert_one(default_rover)
            logger.info(f"MongoDB '{db.name}': Registered default rover (ROVER-01).")

        # 3. Default Building (only if buildings collection is empty)
        if db[COLLECTION_BUILDINGS].count_documents({}) == 0:
            default_building = {
                "id": 1,
                "name": "Main Engineering Complex - Block A",
                "address": "Structural Health Test Facility, Bay 4",
                "construction_year": 2012,
                "structural_type": "Reinforced Concrete Frame",
                "total_floors": 4,
                "notes": "Primary baseline testing facility for autonomous robotic crack detection.",
                "created_at": now,
                "updated_at": now
            }
            db[COLLECTION_BUILDINGS].insert_one(default_building)
            logger.info(f"MongoDB '{db.name}': Configured baseline building.")

        # 4. Default Wall (only if walls collection is empty)
        if db[COLLECTION_WALLS].count_documents({}) == 0:
            default_wall = {
                "id": 1,
                "building_id": 1,
                "wall_code": "W-01-NORTH",
                "orientation": "North",
                "surface_material": "Cast-in-Place Concrete",
                "height_m": 4.5,
                "width_m": 12.0,
                "notes": "External perimeter shear wall with calibrated sub-pixel metric markings.",
                "created_at": now,
                "updated_at": now
            }
            db[COLLECTION_WALLS].insert_one(default_wall)
            logger.info(f"MongoDB '{db.name}': Configured baseline wall.")

        return True
    except Exception as exc:
        logger.warning(f"Error seeding MongoDB '{db.name}': {exc}")
        return False

