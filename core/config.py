"""Application configuration with environment variable loading."""

import os
from typing import Optional
from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from core.exceptions import ConfigurationError


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # JWT Settings (REQUIRED in production)
    jwt_secret: SecretStr = SecretStr("CHANGE-ME-IN-PRODUCTION")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # Application secrets
    secret_key: SecretStr = SecretStr("CHANGE-ME-IN-PRODUCTION")

    # Database (optional for now)
    database_url: str = "sqlite:///./buildscale.db"

    # Application settings
    debug: bool = False
    log_level: str = "INFO"

    # Algorithm defaults
    max_panel_dimension_mm: float = 2400
    min_panel_dimension_mm: float = 300

    @field_validator("jwt_secret", "secret_key", mode="after")
    @classmethod
    def warn_default_secrets(cls, v: SecretStr) -> SecretStr:
        """Warn if using default secrets."""
        if v.get_secret_value() == "CHANGE-ME-IN-PRODUCTION":
            import warnings

            warnings.warn(
                "Using default secret - set JWT_SECRET and SECRET_KEY environment variables!",
                UserWarning,
            )
        return v

    def validate_production(self) -> None:
        """Validate settings are production-ready."""
        issues = []

        if self.jwt_secret.get_secret_value() == "CHANGE-ME-IN-PRODUCTION":
            issues.append("JWT_SECRET not configured")
        if self.secret_key.get_secret_value() == "CHANGE-ME-IN-PRODUCTION":
            issues.append("SECRET_KEY not configured")

        if issues and not self.debug:
            raise ConfigurationError(
                "Production configuration incomplete", details={"missing": issues}
            )


# Global settings instance (lazy loaded)
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get application settings (singleton)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Convenience alias
settings = get_settings()
