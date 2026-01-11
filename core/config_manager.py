#!/usr/bin/env python3
"""
Configuration Manager for Ceiling Panel Calculator.

Handles loading settings from:
1. JSON config files
2. CLI arguments
3. Interactive prompts
4. Defaults

Provides unified configuration interface for the calculator.
"""

import json
import argparse
from pathlib import Path
from typing import Dict, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class CalculatorConfig:
    """Configuration for ceiling panel calculation"""
    # Ceiling dimensions (mm)
    ceiling_length_mm: float
    ceiling_width_mm: float
    
    # Spacing (mm)
    perimeter_gap_mm: float = 200
    panel_gap_mm: float = 200
    
    # Material
    material_name: str = 'led_panel_white'
    
    # Cost parameters
    waste_factor: float = 0.15
    labor_multiplier: Optional[float] = None
    
    # Export options
    export_dxf: bool = True
    export_svg: bool = True
    export_json: bool = True
    export_report: bool = True
    output_dir: str = '.'
    
    # Algorithm options
    optimization_strategy: str = 'balanced'  # balanced, minimize_seams
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CalculatorConfig':
        """Create config from dictionary"""
        return cls(**data)


class ConfigManager:
    """Manages configuration from multiple sources"""
    
    # Default configuration
    DEFAULT_CONFIG = {
        'ceiling_length_mm': 5000,
        'ceiling_width_mm': 4000,
        'perimeter_gap_mm': 200,
        'panel_gap_mm': 200,
        'material_name': 'led_panel_white',
        'waste_factor': 0.15,
        'labor_multiplier': None,
        'export_dxf': True,
        'export_svg': True,
        'export_json': True,
        'export_report': True,
        'output_dir': '.',
        'optimization_strategy': 'balanced',
    }
    
    def __init__(self):
        """Initialize with defaults"""
        self.config = self.DEFAULT_CONFIG.copy()
    
    def load_json_config(self, config_file: str) -> None:
        """
        Load configuration from JSON file.
        
        Args:
            config_file: Path to JSON configuration file
            
        Raises:
            FileNotFoundError: If config file not found
            json.JSONDecodeError: If config file is invalid JSON
        """
        path = Path(config_file)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {config_file}")
        
        with open(path, 'r') as f:
            file_config = json.load(f)
        
        # Merge with defaults (file config overrides defaults)
        self.config.update(file_config)
    
    def parse_cli_args(self, args: Optional[list] = None) -> None:
        """
        Parse and apply command-line arguments.
        
        Args:
            args: List of CLI arguments (if None, uses sys.argv)
        """
        parser = argparse.ArgumentParser(
            description='Ceiling Panel Calculator - Generate optimized panel layouts',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  # Use defaults (5m × 4m ceiling)
  python ceiling_panel_calc.py
  
  # Specify custom dimensions
  python ceiling_panel_calc.py --length 6000 --width 5000 --perim-gap 300
  
  # Load from config file
  python ceiling_panel_calc.py --config my_project.json
  
  # Add cost parameters
  python ceiling_panel_calc.py --waste 0.20 --labor 0.25
  
  # Interactive mode
  python ceiling_panel_calc.py --interactive
            """
        )
        
        parser.add_argument('--config', type=str,
                          help='Load configuration from JSON file')
        
        # Ceiling dimensions
        parser.add_argument('--length', type=float, dest='ceiling_length_mm',
                          help='Ceiling length in mm (default: 5000)')
        parser.add_argument('--width', type=float, dest='ceiling_width_mm',
                          help='Ceiling width in mm (default: 4000)')
        
        # Spacing
        parser.add_argument('--perim-gap', type=float, dest='perimeter_gap_mm',
                          help='Perimeter gap in mm (default: 200)')
        parser.add_argument('--panel-gap', type=float, dest='panel_gap_mm',
                          help='Gap between panels in mm (default: 200)')
        
        # Material
        parser.add_argument('--material', type=str, dest='material_name',
                          help='Material name (default: led_panel_white)')
        
        # Cost parameters
        parser.add_argument('--waste', type=float, dest='waste_factor',
                          help='Waste factor as decimal (default: 0.15)')
        parser.add_argument('--labor', type=float, dest='labor_multiplier',
                          help='Labor cost multiplier as decimal (default: None)')
        
        # Export options
        parser.add_argument('--no-dxf', action='store_false', dest='export_dxf',
                          help='Skip DXF export')
        parser.add_argument('--no-svg', action='store_false', dest='export_svg',
                          help='Skip SVG export')
        parser.add_argument('--no-json', action='store_false', dest='export_json',
                          help='Skip JSON export')
        parser.add_argument('--no-report', action='store_false', dest='export_report',
                          help='Skip text report')
        parser.add_argument('--output-dir', type=str,
                          help='Output directory for exports (default: current)')
        
        # Algorithm options
        parser.add_argument('--strategy', type=str, dest='optimization_strategy',
                          choices=['balanced', 'minimize_seams'],
                          help='Optimization strategy (default: balanced)')
        
        # Interactive mode
        parser.add_argument('--interactive', '-i', action='store_true',
                          help='Interactive mode - prompt for all settings')
        
        # Parse arguments
        parsed = parser.parse_args(args)
        
        # If config file specified, load it first
        if parsed.config:
            self.load_json_config(parsed.config)
        
        # Apply CLI arguments (only if explicitly provided)
        cli_args = {k: v for k, v in vars(parsed).items() 
                   if v is not None and k != 'config' and k != 'interactive'}
        self.config.update(cli_args)
        
        # Handle interactive mode
        if parsed.interactive:
            self.prompt_interactive()
    
    def prompt_interactive(self) -> None:
        """
        Interactive configuration mode.
        Prompts user for configuration values.
        """
        print("\n" + "="*70)
        print("CEILING PANEL CALCULATOR - INTERACTIVE SETUP")
        print("="*70)
        
        # Ceiling dimensions
        print("\n--- CEILING DIMENSIONS (in millimeters) ---")
        self.config['ceiling_length_mm'] = self._prompt_float(
            "Ceiling length (mm)", self.config['ceiling_length_mm']
        )
        self.config['ceiling_width_mm'] = self._prompt_float(
            "Ceiling width (mm)", self.config['ceiling_width_mm']
        )
        
        # Spacing
        print("\n--- SPACING (in millimeters) ---")
        self.config['perimeter_gap_mm'] = self._prompt_float(
            "Perimeter gap (mm)", self.config['perimeter_gap_mm']
        )
        self.config['panel_gap_mm'] = self._prompt_float(
            "Gap between panels (mm)", self.config['panel_gap_mm']
        )
        
        # Material
        print("\n--- MATERIAL ---")
        print("Available materials: led_panel_white, led_panel_neutral, acoustic, drywall")
        self.config['material_name'] = self._prompt_string(
            "Material name", self.config['material_name']
        )
        
        # Cost parameters
        print("\n--- COST PARAMETERS ---")
        self.config['waste_factor'] = self._prompt_float(
            "Waste factor (0.15 = 15%)", self.config['waste_factor']
        )
        labor_input = self._prompt_string(
            "Labor cost multiplier (None for no labor cost)", 
            str(self.config['labor_multiplier']) if self.config['labor_multiplier'] else "None"
        )
        if labor_input.lower() != 'none':
            try:
                self.config['labor_multiplier'] = float(labor_input)
            except ValueError:
                print(f"Invalid value '{labor_input}', keeping: {self.config['labor_multiplier']}")
        
        # Algorithm options
        print("\n--- ALGORITHM OPTIONS ---")
        print("Strategies: balanced (default), minimize_seams")
        self.config['optimization_strategy'] = self._prompt_string(
            "Optimization strategy", self.config['optimization_strategy']
        )
        
        # Export options
        print("\n--- EXPORT OPTIONS ---")
        self.config['output_dir'] = self._prompt_string(
            "Output directory", self.config['output_dir']
        )
        
        self.config['export_dxf'] = self._prompt_bool(
            "Export DXF", self.config['export_dxf']
        )
        self.config['export_svg'] = self._prompt_bool(
            "Export SVG", self.config['export_svg']
        )
        self.config['export_json'] = self._prompt_bool(
            "Export JSON", self.config['export_json']
        )
        self.config['export_report'] = self._prompt_bool(
            "Export text report", self.config['export_report']
        )
        
        print("\n✓ Configuration complete!\n")
    
    @staticmethod
    def _prompt_string(prompt: str, default: Any) -> str:
        """Prompt for string input"""
        response = input(f"{prompt} [{default}]: ").strip()
        return response if response else str(default)
    
    @staticmethod
    def _prompt_float(prompt: str, default: float) -> float:
        """Prompt for float input"""
        while True:
            try:
                response = input(f"{prompt} [{default}]: ").strip()
                return float(response) if response else default
            except ValueError:
                print(f"Invalid number. Please enter a valid decimal number.")
    
    @staticmethod
    def _prompt_bool(prompt: str, default: bool) -> bool:
        """Prompt for yes/no input"""
        default_str = "Y/n" if default else "y/N"
        response = input(f"{prompt}? ({default_str}): ").strip().lower()
        if response in ('y', 'yes'):
            return True
        elif response in ('n', 'no'):
            return False
        else:
            return default
    
    def get_config(self) -> CalculatorConfig:
        """Get current configuration as CalculatorConfig object"""
        return CalculatorConfig.from_dict(self.config)
    
    def get_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        return self.config.copy()
    
    def save_config(self, output_file: str) -> None:
        """
        Save current configuration to JSON file.
        
        Args:
            output_file: Path where to save config file
        """
        with open(output_file, 'w') as f:
            json.dump(self.config, f, indent=2)
        print(f"✓ Configuration saved to {output_file}")
    
    def print_summary(self) -> None:
        """Print current configuration summary"""
        print("\n" + "="*70)
        print("CURRENT CONFIGURATION")
        print("="*70)
        
        print(f"\nCeiling: {self.config['ceiling_length_mm']:.0f}mm × {self.config['ceiling_width_mm']:.0f}mm")
        print(f"Spacing: {self.config['perimeter_gap_mm']:.0f}mm perimeter, {self.config['panel_gap_mm']:.0f}mm between panels")
        print(f"Material: {self.config['material_name']}")
        print(f"Costs: {self.config['waste_factor']*100:.0f}% waste", end="")
        if self.config['labor_multiplier']:
            print(f", {self.config['labor_multiplier']*100:.0f}% labor")
        else:
            print()
        print(f"Strategy: {self.config['optimization_strategy']}")
        print(f"Export: DXF={self.config['export_dxf']}, SVG={self.config['export_svg']}, JSON={self.config['export_json']}, Report={self.config['export_report']}")
        print(f"Output: {self.config['output_dir']}")
        print("="*70 + "\n")


# Example usage
if __name__ == '__main__':
    # Example 1: Load from CLI
    print("Example 1: Using CLI arguments")
    manager = ConfigManager()
    manager.parse_cli_args(['--length', '6000', '--width', '5000', '--waste', '0.20'])
    manager.print_summary()
    
    # Example 2: Save config
    manager.save_config('example_config.json')
    
    # Example 3: Load from saved config
    print("\nExample 2: Loading from saved config")
    manager2 = ConfigManager()
    manager2.load_json_config('example_config.json')
    manager2.print_summary()
