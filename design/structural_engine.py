#!/usr/bin/env python3
"""
Structural Engineering Engine
=============================
Implements structural analysis for beams, columns, foundations, and load calculations.

Features:
- Beam sizing and optimization
- Column load calculations
- Foundation design
- Load distribution analysis
- Material strength calculations
"""

import math
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum


class MaterialType(Enum):
    """Construction materials"""
    CONCRETE = "concrete"
    STEEL = "steel"
    WOOD = "wood"
    COMPOSITE = "composite"


class LoadType(Enum):
    """Types of structural loads"""
    DEAD = "dead_load"           # Permanent loads (self-weight)
    LIVE = "live_load"           # Temporary loads (people, furniture)
    WIND = "wind_load"           # Environmental loads
    SEISMIC = "seismic_load"     # Earthquake loads
    SNOW = "snow_load"           # Environmental loads


@dataclass
class MaterialProperties:
    """Material strength and properties"""
    name: str
    material_type: MaterialType
    compressive_strength: float  # MPa
    tensile_strength: float      # MPa
    density: float               # kg/m³
    modulus_of_elasticity: float # GPa
    cost_per_unit: float         # $/kg or $/m³


@dataclass
class Load:
    """Structural load definition"""
    load_type: LoadType
    magnitude: float  # kN
    location: Tuple[float, float, float]  # (x, y, z) in meters
    distribution: str  # "point", "distributed", "uniform"


@dataclass
class BeamDesign:
    """Optimized beam design"""
    material: MaterialProperties
    width: float  # mm
    depth: float  # mm
    length: float  # m
    max_moment: float  # kN·m
    safety_factor: float
    cost: float  # $
    deflection: float  # mm


@dataclass
class ColumnDesign:
    """Optimized column design"""
    material: MaterialProperties
    diameter: float  # mm (for circular) or width (for rectangular)
    height: float  # m
    axial_load: float  # kN
    buckling_load: float  # kN
    safety_factor: float
    cost: float  # $


@dataclass
class FoundationDesign:
    """Foundation design"""
    type: str  # "strip", "raft", "pile", "spread"
    width: float  # m
    depth: float  # m
    area: float  # m²
    soil_bearing_capacity: float  # kPa
    total_load: float  # kN
    cost: float  # $


class StructuralEngine:
    """
    Structural Engineering Analysis Engine
    Performs beam, column, and foundation calculations
    """
    
    # Standard material library
    MATERIALS = {
        "concrete_25": MaterialProperties(
            name="Concrete C25/30",
            material_type=MaterialType.CONCRETE,
            compressive_strength=25.0,
            tensile_strength=2.5,
            density=2400,
            modulus_of_elasticity=30.0,
            cost_per_unit=0.12  # $/kg
        ),
        "concrete_35": MaterialProperties(
            name="Concrete C35/45",
            material_type=MaterialType.CONCRETE,
            compressive_strength=35.0,
            tensile_strength=3.5,
            density=2400,
            modulus_of_elasticity=32.0,
            cost_per_unit=0.15
        ),
        "steel_s275": MaterialProperties(
            name="Steel S275",
            material_type=MaterialType.STEEL,
            compressive_strength=275.0,
            tensile_strength=275.0,
            density=7850,
            modulus_of_elasticity=210.0,
            cost_per_unit=0.85
        ),
        "steel_s355": MaterialProperties(
            name="Steel S355",
            material_type=MaterialType.STEEL,
            compressive_strength=355.0,
            tensile_strength=355.0,
            density=7850,
            modulus_of_elasticity=210.0,
            cost_per_unit=1.05
        ),
        "wood_spruce": MaterialProperties(
            name="Spruce Wood",
            material_type=MaterialType.WOOD,
            compressive_strength=35.0,
            tensile_strength=60.0,
            density=450,
            modulus_of_elasticity=10.0,
            cost_per_unit=0.35
        ),
    }
    
    def __init__(self):
        self.designs = []
    
    def design_beam(self, 
                   span: float, 
                   loads: List[Load],
                   material_name: str = "concrete_25",
                   min_safety_factor: float = 1.5) -> BeamDesign:
        """
        Design an optimized beam for given span and loads.
        
        Args:
            span: Beam span in meters
            loads: List of loads acting on beam
            material_name: Material to use
            min_safety_factor: Minimum safety factor
        
        Returns:
            Optimized beam design
        """
        print(f"🔧 Structural Engine: Designing beam (span: {span}m)...")
        
        material = self.MATERIALS[material_name]
        
        # Calculate total load and maximum moment
        total_load = sum(load.magnitude for load in loads)
        max_moment = (total_load * span) / 8  # Simply supported beam
        
        # Initial sizing (based on moment capacity)
        # M = f * S, where S = (b * h²) / 6
        # For rectangular section: h ≈ 2b
        
        # Start with minimum practical dimensions
        b = 200  # mm (initial width)
        h = 400  # mm (initial depth)
        
        # Iterate to find optimal dimensions
        for iteration in range(20):
            # Section modulus
            S = (b * h * h) / 6  # mm³
            
            # Moment capacity
            moment_capacity = (material.compressive_strength * S) / 1000000  # kN·m
            
            # Safety factor
            safety_factor = moment_capacity / max_moment if max_moment > 0 else 999
            
            if safety_factor >= min_safety_factor:
                break
            
            # Increase dimensions
            if h < b * 3:  # Limit aspect ratio
                h += 50
            else:
                b += 25
                h += 25
        
        # Calculate deflection (simplified)
        E = material.modulus_of_elasticity * 1000  # MPa
        I = (b * h * h * h) / 12  # mm⁴
        deflection = (5 * total_load * (span * 1000) ** 3) / (384 * E * I)
        
        # Calculate cost
        volume = (b / 1000) * (h / 1000) * span  # m³
        mass = volume * material.density  # kg
        cost = mass * material.cost_per_unit
        
        beam = BeamDesign(
            material=material,
            width=b,
            depth=h,
            length=span,
            max_moment=max_moment,
            safety_factor=safety_factor,
            cost=cost,
            deflection=deflection
        )
        
        self.designs.append(beam)
        return beam
    
    def design_column(self,
                     height: float,
                     axial_load: float,
                     material_name: str = "concrete_25",
                     min_safety_factor: float = 2.0) -> ColumnDesign:
        """
        Design a column for given height and axial load.
        
        Args:
            height: Column height in meters
            axial_load: Axial load in kN
            material_name: Material to use
            min_safety_factor: Minimum safety factor
        
        Returns:
            Optimized column design
        """
        print(f"🔧 Structural Engine: Designing column (height: {height}m, load: {axial_load}kN)...")
        
        material = self.MATERIALS[material_name]
        
        # Start with minimum diameter
        diameter = 200  # mm
        
        # Iterate to find optimal size
        for iteration in range(20):
            # Cross-sectional area
            area = (math.pi * diameter * diameter) / 4  # mm²
            
            # Load capacity
            capacity = (material.compressive_strength * area) / 1000  # kN
            
            # Safety factor
            safety_factor = capacity / axial_load if axial_load > 0 else 999
            
            if safety_factor >= min_safety_factor:
                break
            
            # Check buckling (simplified Euler buckling)
            radius_of_gyration = diameter / 4  # mm
            slenderness_ratio = (height * 1000) / radius_of_gyration
            
            if slenderness_ratio > 50:
                # Slender column - increase diameter more
                diameter += 50
            else:
                diameter += 25
        
        # Calculate buckling load
        E = material.modulus_of_elasticity * 1000  # MPa
        I = (math.pi * diameter ** 4) / 64  # mm⁴
        buckling_load = (math.pi ** 2 * E * I) / ((height * 1000) ** 2)  # kN
        
        # Calculate cost
        volume = (math.pi * (diameter / 1000) ** 2 / 4) * height  # m³
        mass = volume * material.density  # kg
        cost = mass * material.cost_per_unit
        
        column = ColumnDesign(
            material=material,
            diameter=diameter,
            height=height,
            axial_load=axial_load,
            buckling_load=buckling_load,
            safety_factor=safety_factor,
            cost=cost
        )
        
        self.designs.append(column)
        return column
    
    def design_foundation(self,
                         total_load: float,
                         soil_capacity: float = 150.0,  # kPa
                         foundation_type: str = "spread",
                         material_name: str = "concrete_25") -> FoundationDesign:
        """
        Design foundation based on total building load.
        
        Args:
            total_load: Total building load in kN
            soil_capacity: Soil bearing capacity in kPa
            foundation_type: Type of foundation
            material_name: Concrete material
        
        Returns:
            Foundation design
        """
        print(f"🔧 Structural Engine: Designing foundation (load: {total_load}kN)...")
        
        # Required area (kN / kPa = m²)
        required_area = total_load / soil_capacity
        
        # Add safety margin
        design_area = required_area * 1.2
        
        # Determine dimensions based on type
        if foundation_type == "spread":
            width = math.sqrt(design_area)
            depth = 0.5  # m
            width = max(width, 1.0)  # Minimum 1m
            
        elif foundation_type == "strip":
            width = 0.6  # Typical strip width
            length = design_area / width
            depth = 0.4
            width = max(width, 0.4)
            
        elif foundation_type == "raft":
            width = math.sqrt(design_area)
            depth = 0.3
            width = max(width, 3.0)  # Minimum 3m for raft
            
        else:
            width = math.sqrt(design_area)
            depth = 0.5
        
        # Calculate cost (simplified)
        material = self.MATERIALS[material_name]
        volume = design_area * depth
        mass = volume * material.density
        cost = mass * material.cost_per_unit * 0.8  # Cheaper than beams
        
        foundation = FoundationDesign(
            type=foundation_type,
            width=width,
            depth=depth,
            area=design_area,
            soil_bearing_capacity=soil_capacity,
            total_load=total_load,
            cost=cost
        )
        
        self.designs.append(foundation)
        return foundation
    
    def calculate_total_cost(self) -> float:
        """Calculate total cost of all designs"""
        return sum(design.cost for design in self.designs)
    
    def generate_report(self) -> str:
        """Generate structural engineering report"""
        report = ["STRUCTURAL ENGINEERING REPORT", "=" * 50]
        
        for i, design in enumerate(self.designs, 1):
            report.append(f"\nDesign {i}: {type(design).__name__}")
            if isinstance(design, BeamDesign):
                report.append(f"  Beam: {design.width}mm × {design.depth}mm × {design.length}m")
                report.append(f"  Material: {design.material.name}")
                report.append(f"  Max Moment: {design.max_moment:.2f} kN·m")
                report.append(f"  Safety Factor: {design.safety_factor:.2f}")
                report.append(f"  Deflection: {design.deflection:.2f} mm")
                report.append(f"  Cost: ${design.cost:.2f}")
            elif isinstance(design, ColumnDesign):
                report.append(f"  Column: Ø{design.diameter}mm × {design.height}m")
                report.append(f"  Material: {design.material.name}")
                report.append(f"  Axial Load: {design.axial_load:.2f} kN")
                report.append(f"  Buckling Load: {design.buckling_load:.2f} kN")
                report.append(f"  Safety Factor: {design.safety_factor:.2f}")
                report.append(f"  Cost: ${design.cost:.2f}")
            elif isinstance(design, FoundationDesign):
                report.append(f"  Foundation: {design.type}")
                report.append(f"  Size: {design.width:.2f}m × {design.depth:.2f}m")
                report.append(f"  Area: {design.area:.2f} m²")
                report.append(f"  Total Load: {design.total_load:.2f} kN")
                report.append(f"  Cost: ${design.cost:.2f}")
        
        report.append(f"\n{'='*50}")
        report.append(f"TOTAL STRUCTURAL COST: ${self.calculate_total_cost():.2f}")
        
        return "\n".join(report)


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_structural_engine():
    """Demonstrate structural engineering capabilities"""
    print("\n" + "="*80)
    print("STRUCTURAL ENGINEERING ENGINE DEMONSTRATION")
    print("="*80)
    
    engine = StructuralEngine()
    
    # Example: Design structural elements for a 6m x 4m house
    
    print("\n1. BEAM DESIGN")
    print("-" * 50)
    
    # Loads on a beam spanning 6m
    loads = [
        Load(load_type=LoadType.DEAD, magnitude=5.0, location=(0, 0, 0), distribution="distributed"),
        Load(load_type=LoadType.LIVE, magnitude=3.0, location=(0, 0, 0), distribution="distributed"),
    ]
    
    beam = engine.design_beam(span=6.0, loads=loads, material_name="concrete_25")
    print(f"✓ Beam designed: {beam.width}mm × {beam.depth}mm")
    print(f"  Safety factor: {beam.safety_factor:.2f}")
    print(f"  Cost: ${beam.cost:.2f}")
    
    print("\n2. COLUMN DESIGN")
    print("-" * 50)
    
    # Column supporting 2 floors
    column = engine.design_column(height=3.0, axial_load=450.0, material_name="concrete_25")
    print(f"✓ Column designed: Ø{column.diameter}mm × {column.height}m")
    print(f"  Safety factor: {column.safety_factor:.2f}")
    print(f"  Cost: ${column.cost:.2f}")
    
    print("\n3. FOUNDATION DESIGN")
    print("-" * 50)
    
    # Foundation for total building load
    foundation = engine.design_foundation(
        total_load=1800.0,  # kN
        soil_capacity=150.0,  # kPa
        foundation_type="spread"
    )
    print(f"✓ Foundation designed: {foundation.type}")
    print(f"  Size: {foundation.width:.2f}m × {foundation.depth:.2f}m")
    print(f"  Cost: ${foundation.cost:.2f}")
    
    print("\n4. STRUCTURAL REPORT")
    print("-" * 50)
    report = engine.generate_report()
    print(report)
    
    print("\n" + "="*80)
    print("STRUCTURAL ENGINEERING COMPLETE")
    print("Ready for MEP systems integration!")
    print("="*80)


if __name__ == "__main__":
    demonstrate_structural_engine()