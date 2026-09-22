from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Florida Keys Dive Planner API"
    database_url: str = (
        "postgresql+psycopg://dive_planner:dive_planner_local@127.0.0.1:5432/dive_planner"
    )
    cors_origins: str = (
        "http://127.0.0.1:4173,http://localhost:4173,"
        "http://127.0.0.1:5173,http://localhost:5173"
    )
    geopackage_path: str = "/data/dive_planner_data.gpkg"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
