from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    internal_token: str = ""
    redis_url: str = "redis://localhost:6379"
    laravel_url: str = "http://localhost:8000"
    env: str = "production"

    class Config:
        env_prefix = "FASTAPI_"
        env_file = ".env"


settings = Settings()
