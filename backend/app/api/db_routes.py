"""
Database Integration, Health & Collection Management API Router
Provides endpoints to monitor, audit, synchronize, and query the MongoDB 'agile' database.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.config import settings
from app.db_sync import sync_all_to_mongodb, verify_database_integrity
from app.mongodb import (
    ALL_COLLECTIONS,
    get_mongo_client,
    get_mongo_db,
    is_mongo_connected,
)

logger = logging.getLogger("DBRoutes")
router = APIRouter(prefix="/db", tags=["Database Integration & Management"])


def json_serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Converts MongoDB BSON types (like ObjectId and datetime) to JSON-serializable primitives."""
    if not isinstance(doc, dict):
        return doc
    clean = {}
    for k, v in doc.items():
        if k == "_id":
            clean["_id"] = str(v)
        elif hasattr(v, "isoformat"):
            clean[k] = v.isoformat()
        elif isinstance(v, list):
            clean[k] = [json_serialize_doc(x) if isinstance(x, dict) else x for x in v]
        elif isinstance(v, dict):
            clean[k] = json_serialize_doc(v)
        else:
            clean[k] = v
    return clean


@router.get("/status")
def get_db_status():
    """
    Returns runtime database health, configuration, collection counts,
    and two-way consistency audit between SQLite and MongoDB.
    """
    mongo_ok = is_mongo_connected()
    db = get_mongo_db()
    collections_stat = {}
    total_docs = 0

    if mongo_ok and db is not None:
        try:
            for c in ALL_COLLECTIONS:
                cnt = db[c].count_documents({})
                collections_stat[c] = cnt
                total_docs += cnt
        except Exception as e:
            logger.debug(f"Error reading collection counts: {e}")

    integrity = verify_database_integrity()

    return {
        "status": "ONLINE" if mongo_ok else "DEGRADED",
        "configured_engine": settings.DB_TYPE,
        "database_name": settings.MONGO_DB or "agile",
        "mongodb": {
            "connected": mongo_ok,
            "host": f"{settings.MONGO_HOST}:{settings.MONGO_PORT}",
            "target_database": settings.MONGO_DB or "agile",
            "total_documents": total_docs,
            "collections": collections_stat,
        },
        "integrity": {
            "synchronized": integrity.get("synchronized", False),
            "table_audit": integrity.get("tables", {})
        }
    }


@router.get("/integrity")
def get_db_integrity():
    """Audits record counts and consistency across all 10 tables/collections."""
    return verify_database_integrity()


@router.post("/sync")
def trigger_full_sync():
    """Triggers an on-demand full sync of all relational records to MongoDB."""
    result = sync_all_to_mongodb()
    if result.get("status") == "ERROR":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result.get("message", "Database synchronization failed")
        )
    return result


@router.get("/collections")
def list_collections():
    """Lists all active MongoDB collections, their document count, and index count."""
    if not is_mongo_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB server is not reachable"
        )
    db = get_mongo_db()
    summary = []
    for c_name in ALL_COLLECTIONS:
        coll = db[c_name]
        try:
            indexes = [idx["name"] for idx in coll.list_indexes()]
        except Exception:
            indexes = []
        summary.append({
            "name": c_name,
            "count": coll.count_documents({}),
            "indexes": indexes
        })
    return {"database": db.name, "collections": summary}


@router.get("/collections/{collection_name}")
def get_collection_documents(
    collection_name: str,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """Fetches documents directly from the specified MongoDB collection."""
    if collection_name not in ALL_COLLECTIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_name}' not found. Available: {ALL_COLLECTIONS}"
        )
    if not is_mongo_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB server is not reachable"
        )

    db = get_mongo_db()
    coll = db[collection_name]
    cursor = coll.find({}).skip(skip).limit(limit)
    docs = [json_serialize_doc(doc) for doc in cursor]

    return {
        "database": db.name,
        "collection": collection_name,
        "total": coll.count_documents({}),
        "limit": limit,
        "skip": skip,
        "data": docs
    }

