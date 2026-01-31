"""
Savage Cabinetry Platform Configuration

Centralized configuration management for all platform components.
Manages paths, defaults, and shared settings across GUI, CLI, and core modules.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
import json


class PlatformConfig:
    """
    Platform configuration management.

    Handles:
    - Path configurations
    - Default values
    - Material definitions
    - Export settings
    """

    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize platform configuration.

        Args:
            config_file: Optional path to custom config file
        """
        self.config_file = config_file or self._get_default_config_path()

        # Core configuration
        self._config = {
            "platform": {
                "version": "1.0.0",
                "name": "Savage Cabinetry Platform",
                "description": "Professional kitchen design and panel calculation platform",
            },
            "paths": {
                "platform_root": str(Path(__file__).parent.parent),
                "output_dir": "output",
                "templates_dir": "templates",
                "config_dir": str(Path.home() / ".savage_cabinetry"),
            },
            "defaults": {
                "material": "standard_tiles",
                "edge_gap_mm": 200,
                "spacing_gap_mm": 50,
                "max_panel_width_mm": 2400,
                "max_panel_length_mm": 2400,
                "waste_factor": 1.15,
            },
            "materials": {
                "standard_tiles": {
                    "name": "Standard Ceiling Tiles",
                    "cost_per_sqm": 25.0,
                    "thickness_mm": 15,
                    "weight_kg_per_sqm": 8.5,
                    "description": "Standard 600x600mm ceiling tiles",
                },
                "acoustic_panels": {
                    "name": "Acoustic Panels",
                    "cost_per_sqm": 45.0,
                    "thickness_mm": 25,
                    "weight_kg_per_sqm": 12.0,
                    "description": "Sound-absorbing acoustic ceiling panels",
                },
                "mineral_fiber": {
                    "name": "Mineral Fiber Tiles",
                    "cost_per_sqm": 35.0,
                    "thickness_mm": 20,
                    "weight_kg_per_sqm": 9.5,
                    "description": "Fire-resistant mineral fiber ceiling tiles",
                },
                "wood_panels": {
                    "name": "Wood Ceiling Panels",
                    "cost_per_sqm": 85.0,
                    "thickness_mm": 18,
                    "weight_kg_per_sqm": 15.0,
                    "description": "Premium wood veneer ceiling panels",
                },
                "led_panels": {
                    "name": "LED Integrated Panels",
                    "cost_per_sqm": 120.0,
                    "thickness_mm": 35,
                    "weight_kg_per_sqm": 18.0,
                    "description": "LED-lit ceiling panels with integrated lighting",
                },
            },
            "export": {
                "default_formats": ["json", "text"],
                "available_formats": ["json", "text", "dxf", "svg", "pdf"],
                "dxf_generator": "builtin",  # or "ezdxf" if available
                "svg_scale": 0.5,
            },
            "ui": {
                "theme": "professional_blue",
                "default_view": "3d_orbit",
                "grid_enabled": True,
                "measurements_visible": True,
            },
            "validation": {
                "min_ceiling_dimension_mm": 100,
                "max_ceiling_dimension_mm": 10000,
                "min_gap_mm": 0,
                "max_gap_mm": 500,
            },
        }

        # Load user configuration if exists
        self._load_user_config()

        # Ensure config directories exist
        self._ensure_directories()

    def _get_default_config_path(self) -> str:
        """Get default configuration file path."""
        config_dir = Path.home() / ".savage_cabinetry"
        return str(config_dir / "config.json")

    def _load_user_config(self):
        """Load user configuration file if it exists."""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    user_config = json.load(f)
                    # Deep merge user config with defaults
                    self._deep_update(self._config, user_config)
            except (json.JSONDecodeError, IOError) as e:
                # Log warning but don't fail
                print(f"Warning: Could not load config file {self.config_file}: {e}")

    def _deep_update(self, base_dict: Dict, update_dict: Dict):
        """Deep update dictionary with another."""
        for key, value in update_dict.items():
            if (
                key in base_dict
                and isinstance(base_dict[key], dict)
                and isinstance(value, dict)
            ):
                self._deep_update(base_dict[key], value)
            else:
                base_dict[key] = value

    def _ensure_directories(self):
        """Ensure required directories exist."""
        dirs_to_create = [
            Path(self._config["paths"]["config_dir"]),
            Path(self._config["paths"]["output_dir"]),
        ]

        for dir_path in dirs_to_create:
            dir_path.mkdir(parents=True, exist_ok=True)

    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value by dot-separated path.

        Args:
            key_path: Dot-separated path (e.g., "defaults.material")
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        keys = key_path.split(".")
        value = self._config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def set(self, key_path: str, value: Any):
        """
        Set configuration value.

        Args:
            key_path: Dot-separated path
            value: Value to set
        """
        keys = key_path.split(".")
        config = self._config

        # Navigate to parent of target key
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]

        # Set the value
        config[keys[-1]] = value

    def save_config(self, filepath: Optional[str] = None):
        """
        Save current configuration to file.

        Args:
            filepath: Optional file path (uses default if not provided)
        """
        save_path = filepath or self.config_file
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)

        with open(save_path, "w") as f:
            json.dump(self._config, f, indent=2)

    def get_materials(self) -> Dict:
        """Get all available materials."""
        return self._config.get("materials", {})

    def get_platform_info(self) -> Dict:
        """Get platform information."""
        return self._config.get("platform", {})

    def get_paths(self) -> Dict:
        """Get path configurations."""
        return self._config.get("paths", {})

    def get_defaults(self) -> Dict:
        """Get default value configurations."""
        return self._config.get("defaults", {})

    def validate_config(self) -> List[str]:
        """
        Validate configuration values.

        Returns:
            List of validation error messages
        """
        errors = []

        # Check required materials
        materials = self.get_materials()
        if not materials:
            errors.append("No materials defined")

        # Check required defaults
        defaults = self.get_defaults()
        required_defaults = ["material", "edge_gap_mm", "spacing_gap_mm"]
        for key in required_defaults:
            if key not in defaults:
                errors.append(f"Missing required default: {key}")

        # Validate paths
        paths = self.get_paths()
        required_paths = ["platform_root"]
        for key in required_paths:
            if key not in paths:
                errors.append(f"Missing required path: {key}")
            elif not os.path.exists(paths[key]):
                errors.append(f"Path does not exist: {paths[key]}")

        return errors

    def reset_to_defaults(self):
        """Reset all configuration to factory defaults."""
        # Reinitialize without loading user config
        self._config = {
            "platform": {
                "version": "1.0.0",
                "name": "Savage Cabinetry Platform",
                "description": "Professional kitchen design and panel calculation platform",
            },
            # ... (rest of defaults as in __init__)
        }
        self._load_user_config()  # This will be empty, so defaults remain


# Global config instance
_config_instance: Optional[PlatformConfig] = None


def get_platform_config() -> PlatformConfig:
    """Get singleton platform configuration instance."""
    global _config_instance
    if _config_instance is None:
        _config_instance = PlatformConfig()
    return _config_instance


def init_platform_config(config_file: Optional[str] = None) -> PlatformConfig:
    """Initialize platform configuration with optional custom config file."""
    global _config_instance
    _config_instance = PlatformConfig(config_file)
    return _config_instance
