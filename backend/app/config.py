import os
from pathlib import Path
from urllib.parse import quote_plus

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables from .env files with fallback
try:
    from dotenv import load_dotenv
    for env_candidate in [ROOT_DIR / ".env", BASE_DIR / ".env", ROOT_DIR.parent / ".env"]:
        if env_candidate.exists():
            load_dotenv(env_candidate)
            break
except ImportError:
    for env_candidate in [ROOT_DIR / ".env", BASE_DIR / ".env", ROOT_DIR.parent / ".env"]:
        if env_candidate.exists():
            try:
                with open(env_candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
                break
            except Exception:
                pass

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
    
    # Database Settings - Supports MongoDB, MySQL, and SQLite via env
    DB_TYPE: str = os.getenv("DB_TYPE", "mongodb")  # "mongodb", "mysql", or "sqlite"

    # MongoDB Settings - Primary Target Database name: agile
    MONGO_HOST: str = os.getenv("MONGO_HOST", "127.0.0.1")
    MONGO_PORT: int = int(os.getenv("MONGO_PORT", "27017"))
    MONGO_USER: str = os.getenv("MONGO_USER", "")
    MONGO_PASSWORD: str = os.getenv("MONGO_PASSWORD", "")
    MONGO_DB: str = os.getenv("MONGO_DB", "agile")
    MONGO_URI: str = os.getenv("MONGO_URI", "")

    # MySQL Settings - Fallback/Alternative
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "structural_rover")

    # Scala 3 / Pekko Reactive Telemetry Stream Engine
    SCALA_TELEMETRY_HOST: str = os.getenv("SCALA_TELEMETRY_HOST", "127.0.0.1")
    SCALA_TELEMETRY_PORT: int = int(os.getenv("SCALA_TELEMETRY_PORT", "8090"))
    SCALA_TELEMETRY_URL: str = os.getenv("SCALA_TELEMETRY_URL", f"http://{SCALA_TELEMETRY_HOST}:{SCALA_TELEMETRY_PORT}")

    @property
    def MONGODB_URL(self) -> str:
        """Returns the fully qualified MongoDB connection URI for database 'agile'."""
        if self.MONGO_URI:
            return self.MONGO_URI
        auth_part = ""
        if self.MONGO_USER:
            pwd_part = f":{quote_plus(self.MONGO_PASSWORD)}" if self.MONGO_PASSWORD else ""
            auth_part = f"{quote_plus(self.MONGO_USER)}{pwd_part}@"
        return f"mongodb://{auth_part}{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DB}"

    @property
    def DATABASE_URL(self) -> str:
        # If DATABASE_URL is explicitly set, honor it
        explicit_url = os.getenv("DATABASE_URL")
        if explicit_url:
            return explicit_url
        
        if self.DB_TYPE.lower() == "mongodb":
            return self.MONGODB_URL

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
