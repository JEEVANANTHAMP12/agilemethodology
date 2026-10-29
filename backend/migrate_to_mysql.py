"""
Data Migration Utility: SQLite to MySQL
Copies all records from local SQLite (structural_rover.db) into MySQL database.
"""

import sqlite3
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

import sqlalchemy as sa
from app.database import Base, engine


def migrate_sqlite_to_mysql():
    sqlite_path = ROOT_DIR / "structural_rover.db"
    if not sqlite_path.exists():
        print(f"[!] SQLite source database not found at {sqlite_path}")
        return

    print("==================================================")
    print("      STRUCTURAL ROVER SQLITE -> MYSQL MIGRATOR    ")
    print("==================================================")
    print(f"[*] SQLite Source: {sqlite_path}")
    print(f"[*] MySQL Target Engine: {engine.url}")

    # 1. Ensure all MySQL tables are created
    print("\n[1/3] Ensuring MySQL schema tables exist...")
    Base.metadata.create_all(bind=engine)
    print("  -> Tables verified successfully.")

    # 2. Open SQLite connection
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # Tables in order of dependencies
    tables_in_order = [
        "users",
        "rovers",
        "buildings",
        "walls",
        "inspections",
        "images",
        "defects",
        "health_results",
        "rul_predictions",
        "alerts"
    ]

    # 3. Copy records table by table
    print("\n[2/3] Migrating tables...")
    total_migrated = 0

    with engine.begin() as mysql_conn:
        # Disable foreign key checks for clean bulk loading
        if "mysql" in engine.dialect.name:
            mysql_conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 0;"))

        for table_name in tables_in_order:
            # Check if source table exists in SQLite
            sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
            if not sqlite_cur.fetchone():
                continue

            # Fetch all rows from SQLite
            sqlite_cur.execute(f"SELECT * FROM {table_name};")
            rows = sqlite_cur.fetchall()
            if not rows:
                print(f"  - `{table_name}`: 0 rows (skipped)")
                continue

            columns = [desc[0] for desc in sqlite_cur.description]
            
            # Check if MySQL table already has data
            existing_count = mysql_conn.execute(sa.text(f"SELECT COUNT(*) FROM `{table_name}`;")).scalar()
            if existing_count > 0:
                print(f"  - `{table_name}`: Already has {existing_count} records in MySQL (skipping to avoid duplicates)")
                continue

            # Construct INSERT statement
            col_names_escaped = ", ".join([f"`{c}`" for c in columns])
            placeholders = ", ".join([f":{c}" for c in columns])
            insert_stmt = sa.text(f"INSERT INTO `{table_name}` ({col_names_escaped}) VALUES ({placeholders})")

            # Convert rows to dicts
            data_dicts = []
            for row in rows:
                d = dict(row)
                # Parse ISO date strings if needed
                for k, v in d.items():
                    if isinstance(v, str) and ("_at" in k or "_date" in k or "last_ping" in k):
                        if v:
                            try:
                                d[k] = datetime.fromisoformat(v.replace("Z", "+00:00"))
                            except Exception:
                                pass
                data_dicts.append(d)

            # Execute batch insert
            mysql_conn.execute(insert_stmt, data_dicts)
            print(f"  + `{table_name}`: Migrated {len(data_dicts)} rows")
            total_migrated += len(data_dicts)

        if "mysql" in engine.dialect.name:
            mysql_conn.execute(sa.text("SET FOREIGN_KEY_CHECKS = 1;"))

    sqlite_conn.close()

    print("\n[3/3] Migration Summary:")
    print(f"  -> Total records migrated to MySQL: {total_migrated}")
    print("==================================================")
    print("Migration finished successfully!")

if __name__ == "__main__":
    migrate_sqlite_to_mysql()
