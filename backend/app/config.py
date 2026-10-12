import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Settings:
    PROJECT_NAME: str = "Structural Health & Crack Detection Rover System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agile_structural_rover_crack_detection_jwt_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database URL - supports SQLite by default, switchable to PostgreSQL or MySQL via env
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR.parent / 'structural_rover.db'}"
    )

    # Directories
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    REPORT_DIR: Path = STORAGE_DIR / "reports"

    # Rover & Camera Calibration Defaults
    DEFAULT_PIXELS_PER_MM: float = 2.5  # 1 mm = 2.5 pixels (standard 25cm standoff)
    CRACK_SEVERITY_THRESHOLDS = {
        "LOW": {"max_width_mm": 0.5, "max_length_mm": 50.0},
        "MODERATE": {"max_width_mm": 2.0, "max_length_mm": 150.0},
        "HIGH": {"max_width_mm": 5.0, "max_length_mm": 300.0},
        "CRITICAL": {"max_width_mm": 999.0, "max_length_mm": 9999.0}
    }

    # SHI Classification Thresholds
    SHI_HEALTHY_MIN: float = 80.0
    SHI_MODERATE_MIN: float = 50.0

settings = Settings()

# Ensure directories exist
for folder in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.REPORT_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
