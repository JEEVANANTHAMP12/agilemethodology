import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables from .env files
for env_candidate in [ROOT_DIR / ".env", BASE_DIR / ".env", ROOT_DIR.parent / ".env"]:
    if env_candidate.exists():
        load_dotenv(env_candidate)
        break

class Settings:
    PROJECT_NAME: str = "Structural Health & Crack Detection Rover System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agile_structural_rover_crack_detection_jwt_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    
    # CORS Origins - comma separated or wildcard
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "*").split(",")
        if o.strip()
    ]
    
    # Database Settings - MySQL by default, switchable to SQLite or custom URL via env
    DB_TYPE: str = os.getenv("DB_TYPE", "mysql")  # "mysql" or "sqlite"
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "structural_rover")

    @property
    def DATABASE_URL(self) -> str:
        # If DATABASE_URL is explicitly set, honor it
        explicit_url = os.getenv("DATABASE_URL")
        if explicit_url:
            return explicit_url
        
        if self.DB_TYPE.lower() == "mysql":
            pwd_part = f":{quote_plus(self.MYSQL_PASSWORD)}" if self.MYSQL_PASSWORD else ""
            return f"mysql+pymysql://{self.MYSQL_USER}{pwd_part}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}?charset=utf8mb4"
        return f"sqlite:///{BASE_DIR.parent / 'structural_rover.db'}"

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
