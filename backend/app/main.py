import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.api.alert_routes import router as alert_router

# Import API Routers
from app.api.auth_routes import router as auth_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.defect_routes import router as defect_router
from app.api.image_routes import router as image_router
from app.api.inspection_routes import router as inspection_router
from app.api.report_routes import router as report_router
from app.api.rover_routes import router as rover_router
from app.api.rul_routes import router as rul_router
from app.api.shi_routes import router as shi_router
from app.api.structure_routes import router as structure_router
from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine, get_db
from app.models import (
    Building,
    Inspection,
    Rover,
    User,
    Wall,
)
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

# Configure Structured Logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("RoverBackend")

def seed_initial_data():
    """Initializes tables and seeds baseline records if needed."""
    db = SessionLocal()
    try:
        # 1. Create tables
        Base.metadata.create_all(bind=engine)

        # 2. Check default inspector user or auto-migrate existing SQLite data
        admin = db.query(User).filter(User.username == "inspector").first()
        if not admin:
            sqlite_file = Path(__file__).resolve().parent.parent / "structural_rover.db"
            if sqlite_file.exists() and "mysql" in engine.dialect.name:
                try:
                    from migrate_to_mysql import migrate_sqlite_to_mysql
                    logger.info("Existing SQLite database detected. Auto-migrating records into MySQL...")
                    migrate_sqlite_to_mysql()
                    admin = db.query(User).filter(User.username == "inspector").first()
                except Exception as mig_err:
                    logger.warning(f"Auto-migration notice: {mig_err}")

        if not admin:
            admin = User(
                username="inspector",
                email="inspector@rover-agile.org",
                hashed_password=hash_password("admin123"),
                full_name="Jeeva - Chief Structural Engineer",
                role="engineer",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Default inspector profile created.")

        # 3. Check default Rover
        rover = db.query(Rover).filter(Rover.rover_code == "ROVER-01").first()
        if not rover:
            rover = Rover(
                rover_code="ROVER-01",
                name="ESP32 Wall Crawler Alpha",
                ip_address="192.168.4.1",
                port=8080,
                battery_percentage=94.5,
                status="CONNECTED",
                wifi_signal_dbm=-52,
                firmware_version="v2.4.1-ESP32-CAM"
            )
            db.add(rover)
            db.commit()
            db.refresh(rover)
            logger.info("Default Rover ROVER-01 registered.")

        # 4. Check default Building & Wall
        building = db.query(Building).first()
        if not building:
            building = Building(
                user_id=admin.id,
                name="Aerospace Structural Testing Bay",
                address="Sector 7, North Campus",
                construction_year=2012,
                structural_type="Reinforced Concrete Frame"
            )
            db.add(building)
            db.commit()
            db.refresh(building)

        wall = db.query(Wall).first()
        if not wall:
            wall = Wall(
                building_id=building.id,
                wall_code="WALL-NORTH-01",
                name="North Bearing Facade",
                orientation="North",
                material="C35 High-Strength Concrete",
                surface_area_sqm=28.0,
                height_m=3.2,
                width_m=8.75
            )
            db.add(wall)
            db.commit()
            db.refresh(wall)

        # Check if an initial inspection exists
        insp = db.query(Inspection).first()
        if not insp:
            from app.api.dashboard_routes import simulate_rover_scan
            simulate_rover_scan(crack_severity="MODERATE", wall_id=wall.id, db=db)
            logger.info("Initial simulated inspection created.")

    except Exception as e:
        logger.error(f"Error during seeding: {e}", exc_info=True)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables and baseline seed
    logger.info(f"Starting {settings.PROJECT_NAME} on engine: {engine.url.drivername}")
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield
    # Shutdown
    logger.info("Shutting down backend service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Rover Inspection, Crack Detection & Structural Health Index System",
    version="2.4.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Diagnostic Middleware
@app.middleware("http")
async def add_process_time_and_log(request: Request, call_next):
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        if request.url.path.startswith("/api"):
            logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({process_time_ms:.1f}ms)")
        return response
    except Exception as exc:
        process_time_ms = (time.perf_counter() - start_time) * 1000
        logger.error(f"{request.method} {request.url.path} failed after {process_time_ms:.1f}ms: {exc}", exc_info=True)
        raise exc

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "detail": exc.detail
        }
    )

@app.exception_handler(Exception)
async def custom_global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": 500,
            "detail": "Internal server error"
        }
    )

# Mount Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(rover_router, prefix=settings.API_V1_STR)
app.include_router(inspection_router, prefix=settings.API_V1_STR)
app.include_router(image_router, prefix=settings.API_V1_STR)
app.include_router(defect_router, prefix=settings.API_V1_STR)
app.include_router(shi_router, prefix=settings.API_V1_STR)
app.include_router(rul_router, prefix=settings.API_V1_STR)
app.include_router(alert_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)
app.include_router(structure_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

# System Health Check Endpoint
@app.get("/health", tags=["System"])
@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    Production Health & Readiness Check:
    Verifies database connectivity, storage directories, and rover subsystem state.
    """
    db_ok = True
    db_msg = "Connected"
    try:
        db.execute(text("SELECT 1")).scalar()
    except Exception as e:
        db_ok = False
        db_msg = str(e)

    storage_ok = all(
        p.exists() and p.is_dir()
        for p in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORT_DIR]
    )

    rover = db.query(Rover).first()

    return {
        "status": "ONLINE" if (db_ok and storage_ok) else "DEGRADED",
        "system": settings.PROJECT_NAME,
        "version": "2.4.0",
        "database": {
            "status": "HEALTHY" if db_ok else "UNHEALTHY",
            "dialect": engine.dialect.name,
            "detail": db_msg
        },
        "storage": {
            "status": "HEALTHY" if storage_ok else "ERROR",
            "uploads_dir": str(settings.UPLOAD_DIR),
            "processed_dir": str(settings.PROCESSED_DIR),
            "reports_dir": str(settings.REPORT_DIR)
        },
        "rover": {
            "rover_code": rover.rover_code if rover else "ROVER-01",
            "status": rover.status if rover else "DISCONNECTED",
            "battery_percentage": rover.battery_percentage if rover else 0.0
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Mount static directory for backend assets if present
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Serve built frontend for production deployment (Render & unified single-port hosting)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        favicon_path = frontend_dist / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(favicon_path, media_type="image/x-icon")
        static_fav = Path(__file__).parent / "static" / "favicon.ico"
        if static_fav.exists():
            return FileResponse(static_fav, media_type="image/x-icon")
        return Response(status_code=204)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("health"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        favicon_path = Path(__file__).parent / "static" / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(favicon_path, media_type="image/x-icon")
        return Response(status_code=204)

    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "status": "ONLINE",
            "api_docs": "/docs",
            "health": f"{settings.API_V1_STR}/health",
            "endpoints": f"{settings.API_V1_STR}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
