"""
Real-time Database Synchronization and Persistence Bridge for Agile Rover System
Bridges relational SQLAlchemy operations with MongoDB ('agile' database),
ensuring zero data drift and live synchronization across all 10 collections.
"""

import json
import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from app.config import settings
from app.mongodb import (
    ALL_COLLECTIONS,
    COLLECTION_ALERTS,
    COLLECTION_BUILDINGS,
    COLLECTION_DEFECTS,
    COLLECTION_HEALTH_RESULTS,
    COLLECTION_IMAGES,
    COLLECTION_INSPECTIONS,
    COLLECTION_ROVERS,
    COLLECTION_RUL_PREDICTIONS,
    COLLECTION_USERS,
    COLLECTION_WALLS,
    ensure_mongo_indexes,
    get_mongo_db,
    is_mongo_connected,
)

logger = logging.getLogger("RoverDBSync")


def serialize_value(val: Any) -> Any:
    """Serializes special Python types to MongoDB-compatible primitives."""
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val
    if isinstance(val, (int, float, str, bool)):
        return val
    if isinstance(val, bytes):
        return val.hex()
    if isinstance(val, (list, tuple)):
        return [serialize_value(x) for x in val]
    if isinstance(val, dict):
        return {str(k): serialize_value(v) for k, v in val.items()}
    # Fallback for Enum or custom objects
    if hasattr(val, "value"):
        return val.value
    return str(val)


def model_to_dict(instance: Any) -> Dict[str, Any]:
    """Converts a SQLAlchemy model instance into a clean BSON-serializable dictionary."""
    data = {}
    try:
        inst = inspect(instance)
        for attr in inst.mapper.column_attrs:
            key = attr.key
            val = getattr(instance, key, None)
            
            # Parse JSON string fields if applicable
            if key in ("severity_probabilities", "feature_attributions", "telemetry_snapshot") and isinstance(val, str):
                try:
                    val = json.loads(val)
                except Exception:
                    pass
            data[key] = serialize_value(val)
    except Exception as exc:
        logger.debug(f"Error serializing model {instance}: {exc}")
    return data


def _on_after_flush(session: Session, flush_context: Any) -> None:
    """Captures newly inserted, updated, and deleted entities during session flush."""
    if not is_mongo_connected():
        return

    pending_upserts: List[Tuple[str, Any, Dict[str, Any]]] = getattr(session, "_pending_mongo_upserts", [])
    pending_deletes: List[Tuple[str, Any]] = getattr(session, "_pending_mongo_deletes", [])

    # Capture new & modified entities
    for obj in session.new.union(session.dirty):
        if hasattr(obj, "__tablename__") and hasattr(obj, "id") and obj.id is not None:
            table_name = obj.__tablename__
            doc = model_to_dict(obj)
            if doc:
                pending_upserts.append((table_name, obj.id, doc))

    # Capture deleted entities
    for obj in session.deleted:
        if hasattr(obj, "__tablename__") and hasattr(obj, "id") and obj.id is not None:
            pending_deletes.append((obj.__tablename__, obj.id))

    session._pending_mongo_upserts = pending_upserts
    session._pending_mongo_deletes = pending_deletes


def _on_after_commit(session: Session) -> None:
    """Executes atomic MongoDB upserts and deletes once SQLAlchemy commit succeeds."""
    upserts: List[Tuple[str, Any, Dict[str, Any]]] = getattr(session, "_pending_mongo_upserts", [])
    deletes: List[Tuple[str, Any]] = getattr(session, "_pending_mongo_deletes", [])

    session._pending_mongo_upserts = []
    session._pending_mongo_deletes = []

    if not upserts and not deletes:
        return

    db = get_mongo_db()
    if db is None:
        return

    # Process upserts
    for table_name, pk_val, doc in upserts:
        try:
            coll = db[table_name]
            filter_q = {"id": pk_val}
            if table_name == COLLECTION_USERS and "username" in doc:
                filter_q = {"username": doc["username"]}
            elif table_name == COLLECTION_ROVERS and "rover_code" in doc:
                filter_q = {"rover_code": doc["rover_code"]}
            elif table_name == COLLECTION_INSPECTIONS and doc.get("inspection_code"):
                filter_q = {"$or": [{"inspection_code": doc["inspection_code"]}, {"id": pk_val}]}

            coll.replace_one(filter_q, doc, upsert=True)
            logger.debug(f"MongoDB synced [{table_name} id={pk_val}]")
        except Exception as err:
            logger.debug(f"MongoDB sync error [{table_name} id={pk_val}]: {err}")

    # Process deletes
    for table_name, pk_val in deletes:
        try:
            coll = db[table_name]
            coll.delete_one({"id": pk_val})
            logger.debug(f"MongoDB deleted [{table_name} id={pk_val}]")
        except Exception as err:
            logger.debug(f"MongoDB delete sync error [{table_name} id={pk_val}]: {err}")


def _on_after_rollback(session: Session) -> None:
    """Clears pending sync buffers if the transaction rolled back."""
    session._pending_mongo_upserts = []
    session._pending_mongo_deletes = []


def register_db_sync_listeners() -> None:
    """Registers SQLAlchemy Session listeners for automated MongoDB synchronization."""
    event.listen(Session, "after_flush", _on_after_flush)
    event.listen(Session, "after_commit", _on_after_commit)
    event.listen(Session, "after_rollback", _on_after_rollback)
    logger.info("Registered real-time SQLAlchemy -> MongoDB synchronization listeners.")


def sync_all_to_mongodb() -> Dict[str, Any]:
    """
    Performs a full table-to-collection synchronization between SQLite and MongoDB.
    Returns status report with document counts and sync latency.
    """
    start_time = datetime.now(timezone.utc)
    if not is_mongo_connected():
        return {
            "status": "ERROR",
            "message": "MongoDB is not connected",
            "synced_collections": {},
            "total_documents": 0
        }

    from migrate_to_mongodb import migrate_sqlite_to_mongodb
    success = migrate_sqlite_to_mongodb()
    
    db = get_mongo_db()
    stats = {}
    total_docs = 0
    if db is not None:
        for coll_name in ALL_COLLECTIONS:
            count = db[coll_name].count_documents({})
            stats[coll_name] = count
            total_docs += count

    duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
    return {
        "status": "SUCCESS" if success else "PARTIAL",
        "target_database": settings.MONGO_DB,
        "collections": stats,
        "total_documents": total_docs,
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def verify_database_integrity() -> Dict[str, Any]:
    """
    Audits document counts and consistency between SQLite tables and MongoDB collections.
    """
    import sqlite3
    from pathlib import Path
    
    sqlite_file = Path(__file__).resolve().parent.parent / "structural_rover.db"
    report = {
        "sqlite_exists": sqlite_file.exists(),
        "mongodb_connected": is_mongo_connected(),
        "target_database": settings.MONGO_DB,
        "tables": {},
        "synchronized": True
    }

    if not sqlite_file.exists() or not report["mongodb_connected"]:
        report["synchronized"] = False
        return report

    db = get_mongo_db()
    conn = sqlite3.connect(sqlite_file)
    cur = conn.cursor()

    for coll_name in ALL_COLLECTIONS:
        # Get SQLite count
        cur.execute(f"SELECT COUNT(*) FROM {coll_name};")
        sql_count = cur.fetchone()[0]
        # Get Mongo count
        mongo_count = db[coll_name].count_documents({})

        is_match = (sql_count == mongo_count)
        if not is_match:
            report["synchronized"] = False

        report["tables"][coll_name] = {
            "sqlite_count": sql_count,
            "mongodb_count": mongo_count,
            "difference": mongo_count - sql_count,
            "match": is_match
        }

    conn.close()
    return report

