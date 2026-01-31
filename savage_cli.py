#!/usr/bin/env python3
"""
Savage Cabinetry Platform - Main CLI Entry Point

Professional kitchen design and ceiling panel calculation platform.
Unified command-line interface for all platform features.
"""

import sys
from pathlib import Path

# Add the platform to Python path for imports
platform_dir = Path(__file__).parent / "Savage_Cabinetry_Platform"
if platform_dir not in sys.path:
    sys.path.insert(0, str(platform_dir))

try:
    from cli_interface import main
except ImportError as e:
    print(f"❌ Import Error: {e}", file=sys.stderr)
    print(
        "💡 Make sure you're running from the platform root directory.", file=sys.stderr
    )
    print(
        "   Or use: python -m Savage_Cabinetry_Platform.cli_interface", file=sys.stderr
    )
    sys.exit(1)

if __name__ == "__main__":
    sys.exit(main())
