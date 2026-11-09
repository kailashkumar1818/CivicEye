import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    ai_service_api_key: str = "dev_ai_api_key_secret_12345"
    allowed_origins: str = "http://localhost:5000,http://localhost:5173"
    model_path: str = "models/civiceye-yolov8n.pt"
    confidence_threshold: float = 0.4
    device: str = "cpu"
    environment: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

settings = Settings()

