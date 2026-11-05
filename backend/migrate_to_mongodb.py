"""
Data Migration Utility: SQLite / Relational to MongoDB
Copies all structural health inspection records into MongoDB database: 'agile'
"""

import json
import logging
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

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
    get_mongo_client,
    get_mongo_db,
    is_mongo_connected,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MigrateToMongoDB")


def parse_timestamp(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00"))
    except Exception:
        return str(val)


def migrate_sqlite_to_mongodb():
    sqlite_path = ROOT_DIR / "structural_rover.db"
    target_db_name = settings.MONGO_DB or "agile"

    print("==================================================================")
    print(f"      STRUCTURAL ROVER DATABASE MIGRATOR -> MONGODB ('{target_db_name}')")
    print("==================================================================")
    print(f"[*] SQLite Source File:      {sqlite_path}")
    print(f"[*] MongoDB Target URL:      {settings.MONGODB_URL}")
    print(f"[*] Target MongoDB Database: {target_db_name}")

    if not sqlite_path.exists():
        print(f"[!] Warning: SQLite database not found at {sqlite_path}. Nothing to migrate.")
        return False

    client = get_mongo_client()
    if client is None:
        print("[!] Error: Could not establish connection to MongoDB. Please ensure MongoDB is running.")
        return False

    db = get_mongo_db(target_db_name)
    ensure_mongo_indexes()

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    tables_mapping = [
        ("users", COLLECTION_USERS, "id"),
        ("rovers", COLLECTION_ROVERS, "id"),
        ("buildings", COLLECTION_BUILDINGS, "id"),
        ("walls", COLLECTION_WALLS, "id"),
        ("inspections", COLLECTION_INSPECTIONS, "id"),
        ("images", COLLECTION_IMAGES, "id"),
        ("defects", COLLECTION_DEFECTS, "id"),
        ("health_results", COLLECTION_HEALTH_RESULTS, "id"),
        ("rul_predictions", COLLECTION_RUL_PREDICTIONS, "id"),
        ("alerts", COLLECTION_ALERTS, "id"),
    ]

    print("\n[1/2] Migrating relational tables into MongoDB collections...")
    total_migrated_all = 0

    for table_name, coll_name, pk_field in tables_mapping:
        # Check if table exists in SQLite
        sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
        if not sqlite_cur.fetchone():
            print(f"  [-] Table `{table_name}` not in SQLite, skipping.")
            continue

        sqlite_cur.execute(f"SELECT * FROM {table_name};")
        rows = sqlite_cur.fetchall()
        if not rows:
            print(f"  [-] `{table_name}`: 0 rows in source.")
            continue

        columns = [desc[0] for desc in sqlite_cur.description]
        coll = db[coll_name]

        inserted_count = 0
        skipped_count = 0

        for row in rows:
            doc = dict(row)
            pk_val = doc.get(pk_field)

            # Check if document already exists
            if pk_val is not None and coll.find_one({pk_field: pk_val}):
                skipped_count += 1
                continue

            # Convert date/time fields to Python datetime
            for col in columns:
                if col in doc and doc[col] is not None:
                    if "_at" in col or "_date" in col or "start_time" in col or "end_time" in col or "timestamp" in col or "last_seen_at" in col or "evaluated_at" in col or "predicted_at" in col or "acknowledged_at" in col:
                        doc[col] = parse_timestamp(doc[col])

            # Parse JSON text fields if any
            for json_candidate in ["severity_probabilities", "feature_attributions", "telemetry_snapshot"]:
                if json_candidate in doc and isinstance(doc[json_candidate], str):
                    try:
                        doc[json_candidate] = json.loads(doc[json_candidate])
                    except Exception:
                        pass

            # Convert boolean integer fields
            for bool_col in ["is_active", "is_acknowledged", "crack_detected", "aci_224r_compliant"]:
                if bool_col in doc and doc[bool_col] is not None:
                    doc[bool_col] = bool(doc[bool_col])

            coll.insert_one(doc)
            inserted_count += 1

        total_migrated_all += inserted_count
        print(f"  [+] `{table_name}` -> collection `{coll_name}`: {inserted_count} inserted, {skipped_count} already existed.")

    sqlite_conn.close()

    print("\n[2/2] Final Verification of MongoDB 'agile' Database Collections:")
    for coll_name in ALL_COLLECTIONS:
        cnt = db[coll_name].count_documents({})
        print(f"  -> Collection `{coll_name}`: {cnt} documents.")

    print(f"\n[OK] Migration completed! Total newly migrated documents: {total_migrated_all}")
    return True


if __name__ == "__main__":
    success = migrate_sqlite_to_mongodb()
    sys.exit(0 if success else 1)

