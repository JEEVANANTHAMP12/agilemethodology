from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Building, Wall, Rover, Inspection, Image, Defect, HealthResult, RulPrediction, Alert
from app.core.security import hash_password
from app.services.rover_service import RoverService

# Import API Routers
from app.api.auth_routes import router as auth_router
from app.api.rover_routes import router as rover_router
from app.api.inspection_routes import router as inspection_router
from app.api.image_routes import router as image_router
from app.api.defect_routes import router as defect_router
from app.api.shi_routes import router as shi_router
from app.api.rul_routes import router as rul_router
from app.api.alert_routes import router as alert_router
from app.api.report_routes import router as report_router
from app.api.structure_routes import router as structure_router
from app.api.dashboard_routes import router as dashboard_router

def seed_initial_data():
    db = SessionLocal()
    try:
        # 1. Create tables
        Base.metadata.create_all(bind=engine)

        # 2. Check default inspector user
        admin = db.query(User).filter(User.username == "inspector").first()
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

    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Rover Inspection, Crack Detection & Structural Health Index System",
    version="2.4.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Mount static directory for backend assets if present
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

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
        "endpoints": f"{settings.API_V1_STR}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
