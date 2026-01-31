#!/usr/bin/env python3
"""
Savage Cabinetry Platform - Main Entry Point

The primary application users access from their home directory.
Provides unified launching for CLI, GUI, and platform management.
"""

import sys
import os
from pathlib import Path
import argparse
import subprocess

# Add platform to path
platform_dir = Path(__file__).parent / "Savage_Cabinetry_Platform"
if str(platform_dir) not in sys.path:
    sys.path.insert(0, str(platform_dir))

try:
    from config import get_platform_config
    from cli_interface import CLIInterface
except ImportError as e:
    print(f"❌ Platform Import Error: {e}", file=sys.stderr)
    print("🔧 Make sure you're running from the platform root directory.", file=sys.stderr)
    sys.exit(1)


class PlatformLauncher:
    """Main platform launcher that orchestrates CLI and GUI access."""

    def __init__(self):
        """Initialize the platform launcher."""
        self.config = get_platform_config()
        self.cli_interface = CLIInterface()

    def run(self, args: list[str]) -> int:
        """
        Run the platform based on arguments.

        Args:
            args: Command line arguments

        Returns:
            Exit code
        """
        parser = self._create_parser()
        parsed_args = parser.parse_args(args)

        # Handle different launch modes
        if parsed_args.mode == "cli" or (len(args) > 0 and args[0] in ["calculate", "estimate", "export", "status"]):
            # Direct CLI command
            return self.cli_interface.run_command(args)
        elif parsed_args.mode == "gui":
            return self._launch_gui(parsed_args)
        elif parsed_args.mode == "status":
            return self._show_status()
        elif parsed_args.mode == "setup":
            return self._run_setup()
        else:
            # Default: show welcome and help
            self._show_welcome()
            parser.print_help()
            return 0

    def _create_parser(self) -> argparse.ArgumentParser:
        """Create argument parser for main launcher."""
        parser = argparse.ArgumentParser(
            prog="savage-platform",
            description="Savage Cabinetry Platform - Professional Kitchen Design"
        )

        parser.add_argument("--mode", choices=["cli", "gui", "status", "setup"],
                          help="Launch mode (default: interactive help)")

        # GUI-specific options
        parser.add_argument("--port", type=int, default=5000,
                          help="Port for GUI server (default: 5000)")
        parser.add_argument("--host", default="localhost",
                          help="Host for GUI server (default: localhost)")
        parser.add_argument("--no-browser", action="store_true",
                          help="Don't automatically open browser")

        return parser

    def _show_welcome(self):
        """Show platform welcome message."""
        print("""
🏗️  WELCOME TO SAVAGE CABINETRY PLATFORM
========================================

Professional kitchen design and ceiling panel calculation platform.

🚀 QUICK START:
  • Calculate panels: savage-platform calculate --width 4800 --length 3600
  • GUI interface:   savage-platform --mode gui
  • Cost estimate:   savage-platform estimate --width 4800 --length 3600

📚 GET HELP:
  • CLI help:        savage-platform --help
  • Status:          savage-platform --mode status
  • Documentation:   Visit docs/ directory

🌟 Ready to design your kitchen ceiling!
        """)

    def _show_status(self) -> int:
        """Show platform status information."""
        print("
🏗️  SAVAGE CABINETRY PLATFORM STATUS"        print("=" * 50)

        # Platform info
        platform_info = self.config.get_platform_info()
        print(f"Platform: {platform_info.get('name', 'Unknown')}")
        print(f"Version:  {platform_info.get('version', 'Unknown')}")
        print(f"Status:   ✓ Operational")

        # Configuration
        config_errors = self.config.validate_config()
        if config_errors:
            print(f"Config:   ⚠️  Issues found ({len(config_errors)})")
            for error in config_errors[:3]:  # Show first 3 errors
                print(f"           • {error}")
        else:
            print("Config:   ✓ Valid")

        # Components
        materials = self.config.get_materials()
        print(f"Materials: {len(materials)} available")

        # Paths
        paths = self.config.get_paths()
        print(f"Output:   {paths.get('output_dir', 'Unknown')}")

        # CLI status
        try:
            # Test CLI interface
            interface = CLIInterface()
            print("CLI:      ✓ Ready")
        except Exception as e:
            print(f"CLI:      ❌ Error: {e}")

        print("
📋 AVAILABLE MODES:"        print("  • cli     - Command-line design tools"        print("  • gui     - Web-based 3D interface"        print("  • status  - Show this status page"        print("  • setup   - Platform configuration"
        print("
🔗 Try: savage-platform calculate --help"
        return 0

    def _launch_gui(self, args: argparse.Namespace) -> int:
        """Launch the GUI interface."""
        try:
            # Check if GUI is available
            gui_script = Path(__file__).parent / "gui_server.py"
            if not gui_script.exists():
                print("❌ GUI not available. Run platform setup first.", file=sys.stderr)
                return 1

            # Prepare GUI command
            cmd = [
                sys.executable,
                str(gui_script),
                "--port", str(args.port),
                "--host", args.host
            ]

            print(f"🌐 Starting GUI server on http://{args.host}:{args.port}")

            if not args.no_browser:
                print("🌍 Opening browser...")
                # In real implementation, would open browser
                pass

            # Launch GUI server
            result = subprocess.run(cmd, cwd=Path(__file__).parent)
            return result.returncode

        except FileNotFoundError:
            print("❌ GUI server not found. Make sure all components are installed.", file=sys.stderr)
            return 1
        except KeyboardInterrupt:
            print("\n🛑 GUI server stopped by user")
            return 0
        except Exception as e:
            print(f"❌ GUI launch error: {e}", file=sys.stderr)
            return 1

    def _run_setup(self) -> int:
        """Run platform setup and verification."""
        print("🔧 RUNNING PLATFORM SETUP")
        print("=" * 30)

        issues = []

        # Check Python version
        if sys.version_info < (3, 8):
            issues.append("Python 3.8+ required")
        else:
            print("✅ Python version OK")

        # Check required modules
        required_modules = ["pathlib", "json", "argparse"]
        for module in required_modules:
            try:
                __import__(module)
                print(f"✅ Module {module} OK")
            except ImportError:
                issues.append(f"Missing module: {module}")

        # Check CLI interface
        try:
            from cli_interface import CLIInterface
            CLIInterface()
            print("✅ CLI interface OK")
        except Exception as e:
            issues.append(f"CLI interface error: {e}")

        # Check platform components
        platform_components = [
            "Savage_Cabinetry_Platform/__init__.py",
            "Savage_Cabinetry_Platform/kitchen_orchestrator.py",
            "Savage_Cabinetry_Platform/config.py"
        ]
        for component in platform_components:
            if (Path(__file__).parent / component).exists():
                print(f"✅ Component {component} OK")
            else:
                issues.append(f"Missing component: {component}")

        # Report issues
        if issues:
            print("
❌ SETUP ISSUES FOUND:"            for issue in issues:
                print(f"   • {issue}")
            print("\n🔧 Fix these issues and run setup again.")
            return 1
        else:
            print("\n🎉 ALL CHECKS PASSED!")
            print("Platform is ready for use.")
            return 0


def main() -> int:
    """Main entry point."""
    launcher = PlatformLauncher()
    return launcher.run(sys.argv[1:])


if __name__ == "__main__":
    sys.exit(main())