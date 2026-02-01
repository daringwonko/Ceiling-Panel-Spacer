"""
Savage Cabinetry Platform - CLI Interface

Command-line interface for the Savage Cabinetry design platform.
Provides full access to design capabilities through terminal commands.
"""

import argparse
import sys
from pathlib import Path
from typing import Optional, List

try:
    # Try relative import first (when used as module)
    from .kitchen_orchestrator import (
        KitchenDesignOrchestrator,
        DesignParameters,
        KitchenDesignException,
    )
except ImportError:
    # Fall back to absolute import (when running directly)
    from kitchen_orchestrator import (
        KitchenDesignOrchestrator,
        DesignParameters,
        KitchenDesignException,
    )


class CLIInterface:
    """
    Command-line interface for Savage Cabinetry platform.

    Provides commands for:
    - calculate: Panel layout calculations
    - estimate: Quick cost estimates
    - export: Generate export files
    - status: Show current platform status
    """

    def __init__(self, orchestrator: Optional[KitchenDesignOrchestrator] = None):
        """
        Initialize CLI interface.

        Args:
            orchestrator: Pre-configured orchestrator instance
        """
        self.orchestrator = orchestrator or KitchenDesignOrchestrator()
        self.results_cache: Optional[dict] = None  # Cache last calculation results

    def run_command(self, args: List[str]) -> int:
        """
        Execute CLI command.

        Args:
            args: Command line arguments

        Returns:
            Exit code (0 for success)
        """
        parser = self._create_parser()
        parsed_args = parser.parse_args(args)

        if len(args) == 0:
            parser.print_help()
            return 0

        try:
            if parsed_args.command == "calculate":
                return self._cmd_calculate(parsed_args)
            elif parsed_args.command == "estimate":
                return self._cmd_estimate(parsed_args)
            elif parsed_args.command == "export":
                return self._cmd_export(parsed_args)
            elif parsed_args.command == "status":
                return self._cmd_status(parsed_args)
            else:
                parser.print_help()
                return 1
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            return 130
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1

    def _create_parser(self) -> argparse.ArgumentParser:
        """Create argument parser with all commands."""
        parser = argparse.ArgumentParser(
            prog="savage-cli",
            description="Savage Cabinetry Platform - Professional Kitchen Design CLI",
        )

        subparsers = parser.add_subparsers(dest="command", help="Available commands")

        # Calculate command
        calc_parser = subparsers.add_parser(
            "calculate", help="Calculate ceiling panel layout"
        )
        calc_parser.add_argument(
            "--width",
            "-w",
            type=int,
            required=True,
            help="Ceiling width in millimeters",
        )
        calc_parser.add_argument(
            "--length",
            "-l",
            type=int,
            required=True,
            help="Ceiling length in millimeters",
        )
        calc_parser.add_argument(
            "--material",
            "-m",
            default="standard_tiles",
            choices=["standard_tiles", "acoustic_panels"],
            help="Material type (default: standard_tiles)",
        )
        calc_parser.add_argument(
            "--edge-gap",
            type=int,
            default=200,
            help="Edge gap in millimeters (default: 200)",
        )
        calc_parser.add_argument(
            "--spacing-gap",
            type=int,
            default=50,
            help="Spacing gap in millimeters (default: 50)",
        )
        calc_parser.add_argument(
            "--format",
            "-f",
            choices=["text", "json"],
            default="text",
            help="Output format (default: text)",
        )

        # Estimate command
        est_parser = subparsers.add_parser("estimate", help="Quick cost estimate")
        est_parser.add_argument(
            "--width",
            "-w",
            type=int,
            required=True,
            help="Ceiling width in millimeters",
        )
        est_parser.add_argument(
            "--length",
            "-l",
            type=int,
            required=True,
            help="Ceiling length in millimeters",
        )
        est_parser.add_argument(
            "--material",
            "-m",
            default="standard_tiles",
            choices=["standard_tiles", "acoustic_panels"],
            help="Material type (default: standard_tiles)",
        )
        est_parser.add_argument(
            "--edge-gap",
            type=int,
            default=200,
            help="Edge gap in millimeters (default: 200)",
        )

        # Export command
        exp_parser = subparsers.add_parser("export", help="Export design files")
        exp_parser.add_argument(
            "formats",
            nargs="+",
            choices=["json", "text", "dxf", "svg"],
            help="Export formats (can specify multiple)",
        )
        exp_parser.add_argument(
            "--output-dir",
            "-o",
            default=".",
            help="Output directory (default: current directory)",
        )
        exp_parser.add_argument(
            "--use-cache",
            action="store_true",
            help="Use results from last calculate command",
        )

        # Status command
        status_parser = subparsers.add_parser("status", help="Show platform status")

        return parser

    def _cmd_calculate(self, args: argparse.Namespace) -> int:
        """Handle calculate command."""
        params = DesignParameters(
            ceiling_width_mm=args.width,
            ceiling_length_mm=args.length,
            material_type=args.material,
            gap_edge_mm=args.edge_gap,
            gap_spacing_mm=args.spacing_gap,
        )

        try:
            result = self.orchestrator.calculate_ceiling_panels(params)

            # Cache results for export command
            self.results_cache = {"params": params, "result": result}

            if args.format == "json":
                output = self.orchestrator.generate_panel_layout(params, result, "json")
                print(output)
            else:
                output = self.orchestrator.generate_panel_layout(params, result, "text")
                print(output)

                if result.warnings:
                    print("\n⚠️  WARNINGS:")
                    for warning in result.warnings:
                        print(f"   • {warning}")

        except KitchenDesignException as e:
            print(f"❌ Design Error: {e}", file=sys.stderr)
            return 1

        return 0

    def _cmd_estimate(self, args: argparse.Namespace) -> int:
        """Handle estimate command."""
        params = DesignParameters(
            ceiling_width_mm=args.width,
            ceiling_length_mm=args.length,
            material_type=args.material,
            gap_edge_mm=args.edge_gap,
        )

        try:
            # Validate parameters first
            issues = self.orchestrator.validate_design_parameters(params)
            if issues:
                print(f"❌ Invalid parameters: {'; '.join(issues)}", file=sys.stderr)
                return 1

            estimate = self.orchestrator.get_cost_estimate(params)

            print("\n💰 COST ESTIMATE")
            print("=" * 30)
            print(
                f"Ceiling: {args.width}mm × {args.length}mm ({estimate['area_sqm']} sqm)"
            )
            print(f"Material: {estimate['material']}")
            print(f"Total Material Cost: ${estimate['total_estimated_cost']:.2f}")
            print(f"Waste Allowance (15%): ${estimate['waste_allowance']:.2f}")
            print(f"\n📝 This is a rough estimate including 15% waste allowance.")

        except KitchenDesignException as e:
            print(f"❌ Design Error: {e}", file=sys.stderr)
            return 1

        return 0

    def _cmd_export(self, args: argparse.Namespace) -> int:
        """Handle export command."""
        if not self.results_cache:
            print(
                "❌ No calculation results to export. Run 'calculate' command first, or use --use-cache if you have results.",
                file=sys.stderr,
            )
            return 1

        params = self.results_cache["params"]
        result = self.results_cache["result"]

        try:
            Path(args.output_dir).mkdir(exist_ok=True)

            exported = self.orchestrator.export_design(
                params, result, args.formats, args.output_dir
            )

            print("\n📁 EXPORT COMPLETE")
            print("=" * 30)
            for fmt, path in exported.items():
                if fmt in ["dxf", "svg", "json"]:
                    print(f"📄 {fmt.upper()}: {path}")
                else:
                    print(f"📝 {fmt.upper()}: Generated")

        except Exception as e:
            print(f"❌ Export Error: {e}", file=sys.stderr)
            return 1

        return 0

    def _cmd_status(self, args: argparse.Namespace) -> int:
        """Handle status command."""
        print("\n🏗️  SAVAGE CABINETRY PLATFORM STATUS")
        print("=" * 40)
        print("Platform: Savage Cabinetry v1.0.0")
        print("Status: ✓ Operational")
        print("Orchestrator: ✓ Initialized")
        print(f"Materials: {len(self.orchestrator.materials)} loaded")
        print(f"Cache: {'✓' if self.results_cache else '✗'} Ready")
        print("\n📋 Available Commands:")
        print("  • calculate - Panel layout calculations")
        print("  • estimate  - Quick cost estimates")
        print("  • export    - Generate design files")
        print("  • status    - Show this information")
        print("\n🌟 Ready for design work!")

        return 0


def main() -> int:
    """Main CLI entry point."""
    interface = CLIInterface()
    return interface.run_command(sys.argv[1:])


if __name__ == "__main__":
    sys.exit(main())
