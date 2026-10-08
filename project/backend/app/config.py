from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_secret: str = "dev-secret-not-for-production"
    database_url: str = "sqlite:///./litekiz.db"
    code_price: float = 0.61

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    db_wait_seconds: int = 30

    demo_seed_on_start: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
