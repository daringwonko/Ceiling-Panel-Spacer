"""Custom exceptions for BuildScale platform."""

from typing import Dict, Any, Optional


class BuildScaleError(Exception):
    """Base exception for all BuildScale errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "details": self.details,
        }


class ValidationError(BuildScaleError):
    """Raised when input validation fails."""

    pass


class CalculationError(BuildScaleError):
    """Raised when panel calculation fails."""

    pass


class ExportError(BuildScaleError):
    """Raised when file export fails."""

    pass


class ConfigurationError(BuildScaleError):
    """Raised when configuration is invalid or missing."""

    pass
