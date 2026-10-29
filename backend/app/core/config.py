# Application configuration

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./jalswaraj.db"
    SECRET_KEY: str
    ACCESS_TOKEN_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"
    COOKIE_SECURE: bool = False

    # Alert thresholds (configurable)
    UNACCOUNTED_ALERT_PCT: float = 15.0
    SUDDEN_INCREASE_PCT: float = 25.0
    LATE_REPORT_DAYS: int = 45

    # Scoring weights (must sum to 1) - documented in docs/
    W_EFFICIENCY: float = 0.50
    W_IMPROVEMENT: float = 0.30
    W_ACCOUNTABILITY: float = 0.20

    # Efficiency reference band (litres/person/day). These are configurable
    # scoring bounds, NOT an official standard.
    LPCD_BEST: float = 40.0     # at or below -> 100 points
    LPCD_WORST: float = 200.0   # at or above -> 0 points
    LPCD_MIN_PLAUSIBLE: float = 15.0  # below this -> not rewarded, needs review


settings = Settings()