#!/usr/bin/env python3
"""
Unified Logging Configuration for Ceiling Panel Calculator.

Provides consistent logging across all modules with support for:
- Console output
- File logging with rotation
- Different log levels per module
- Structured logging for machine parsing
"""

import logging
import logging.handlers
import sys
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any


class JsonFormatter(logging.Formatter):
    """Formats log records as JSON for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as JSON."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add any extra fields
        if hasattr(record, "extra_data"):
            log_entry["extra"] = record.extra_data

        return json.dumps(log_entry)


class CeilingLogger:
    """
    Centralized logging configuration for the Ceiling Panel Calculator.

    Usage:
        from logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("Processing calculation")
    """

    _instance = None
    _loggers: Dict[str, logging.Logger] = {}

    # Default configuration
    DEFAULT_CONFIG = {
        "log_level": "INFO",
        "log_dir": "logs",
        "max_file_size_mb": 10,
        "backup_count": 5,
        "console_enabled": True,
        "file_enabled": True,
        "json_format": False,
    }

    def __new__(cls):
        """Singleton pattern to ensure single configuration."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize logging configuration."""
        if self._initialized:
            return

        self.config = self.DEFAULT_CONFIG.copy()
        self._setup_root_logger()
        self._initialized = True

    def _setup_root_logger(self) -> None:
        """Configure the root logger."""
        root_logger = logging.getLogger("ceiling")
        root_logger.setLevel(getattr(logging, self.config["log_level"]))

        # Clear any existing handlers
        root_logger.handlers = []

        # Console handler
        if self.config["console_enabled"]:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.DEBUG)

            if self.config["json_format"]:
                console_handler.setFormatter(JsonFormatter())
            else:
                console_fmt = logging.Formatter(
                    "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d - %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S"
                )
                console_handler.setFormatter(console_fmt)

            root_logger.addHandler(console_handler)

        # File handler
        if self.config["file_enabled"]:
            log_dir = Path(self.config["log_dir"])
            log_dir.mkdir(parents=True, exist_ok=True)

            log_file = log_dir / f"ceiling_{datetime.now().strftime('%Y%m%d')}.log"

            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=self.config["max_file_size_mb"] * 1024 * 1024,
                backupCount=self.config["backup_count"]
            )
            file_handler.setLevel(logging.DEBUG)

            if self.config["json_format"]:
                file_handler.setFormatter(JsonFormatter())
            else:
                file_fmt = logging.Formatter(
                    "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S"
                )
                file_handler.setFormatter(file_fmt)

            root_logger.addHandler(file_handler)

    def configure(self, **kwargs) -> None:
        """
        Update logging configuration.

        Args:
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_dir: Directory for log files
            max_file_size_mb: Maximum log file size in MB
            backup_count: Number of backup files to keep
            console_enabled: Enable console logging
            file_enabled: Enable file logging
            json_format: Use JSON format for logs
        """
        self.config.update(kwargs)
        self._setup_root_logger()

    def get_logger(self, name: str) -> logging.Logger:
        """
        Get or create a logger for the specified module.

        Args:
            name: Logger name (usually __name__)

        Returns:
            Configured logger instance
        """
        if name not in self._loggers:
            # Create child logger under ceiling namespace
            full_name = f"ceiling.{name}" if not name.startswith("ceiling") else name
            logger = logging.getLogger(full_name)
            self._loggers[name] = logger

        return self._loggers[name]


# Module-level functions for easy access
_logger_manager = CeilingLogger()


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger for the specified module.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance

    Usage:
        from logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("Message")
    """
    return _logger_manager.get_logger(name)


def configure_logging(**kwargs) -> None:
    """
    Configure global logging settings.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        max_file_size_mb: Maximum log file size in MB
        backup_count: Number of backup files to keep
        console_enabled: Enable console logging
        file_enabled: Enable file logging
        json_format: Use JSON format for logs
    """
    _logger_manager.configure(**kwargs)


# Exception classes for the project
class CeilingCalculatorError(Exception):
    """Base exception for Ceiling Calculator errors."""
    pass


class ValidationError(CeilingCalculatorError):
    """Raised when input validation fails."""
    pass


class ConfigurationError(CeilingCalculatorError):
    """Raised when configuration is invalid."""
    pass


class CalculationError(CeilingCalculatorError):
    """Raised when calculation fails."""
    pass


class ExportError(CeilingCalculatorError):
    """Raised when export fails."""
    pass


class IOTError(CeilingCalculatorError):
    """Raised when IoT operations fail."""
    pass


class SecurityError(CeilingCalculatorError):
    """Raised when security operations fail."""
    pass


# Validation utilities
def validate_positive(value: float, name: str) -> float:
    """Validate that value is positive."""
    if not isinstance(value, (int, float)):
        raise ValidationError(f"{name} must be a number, got {type(value).__name__}")
    if value <= 0:
        raise ValidationError(f"{name} must be positive, got {value}")
    return float(value)


def validate_non_negative(value: float, name: str) -> float:
    """Validate that value is non-negative."""
    if not isinstance(value, (int, float)):
        raise ValidationError(f"{name} must be a number, got {type(value).__name__}")
    if value < 0:
        raise ValidationError(f"{name} must be non-negative, got {value}")
    return float(value)


def validate_range(value: float, name: str, min_val: float, max_val: float) -> float:
    """Validate that value is within range."""
    if not isinstance(value, (int, float)):
        raise ValidationError(f"{name} must be a number, got {type(value).__name__}")
    if value < min_val or value > max_val:
        raise ValidationError(f"{name} must be between {min_val} and {max_val}, got {value}")
    return float(value)


def validate_string(value: str, name: str, allowed: Optional[list] = None) -> str:
    """Validate string value."""
    if not isinstance(value, str):
        raise ValidationError(f"{name} must be a string, got {type(value).__name__}")
    if allowed and value not in allowed:
        raise ValidationError(f"{name} must be one of {allowed}, got '{value}'")
    return value


# Example usage and testing
if __name__ == "__main__":
    # Configure logging
    configure_logging(log_level="DEBUG", console_enabled=True, file_enabled=False)

    # Get logger
    logger = get_logger(__name__)

    # Test logging
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")

    # Test validation
    print("\nTesting validation:")
    try:
        validate_positive(100, "length")
        print("  validate_positive(100): PASS")
    except ValidationError as e:
        print(f"  validate_positive(100): FAIL - {e}")

    try:
        validate_positive(-5, "width")
        print("  validate_positive(-5): FAIL - should have raised error")
    except ValidationError as e:
        print(f"  validate_positive(-5): PASS - caught error: {e}")

    try:
        validate_range(50, "percentage", 0, 100)
        print("  validate_range(50, 0, 100): PASS")
    except ValidationError as e:
        print(f"  validate_range(50, 0, 100): FAIL - {e}")

    print("\nLogging configuration complete!")
