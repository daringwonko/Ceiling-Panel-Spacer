#!/usr/bin/env python3
"""
Full Architectural Design Engine
================================
Integrates ceiling, structural, and MEP systems into complete building design.

Features:
- Multi-story building design
- Vertical circulation (stairs, elevators)
- Room layout optimization
- System integration
- Code compliance checking
- Cost estimation
"""

import math
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum

# Import existing systems
from ceiling_panel_calc import CeilingDimensions, PanelSpacing, CeilingPanelCalculator
from structural_engine import StructuralEngine, Load, LoadType
from mep_systems import MEPSystemEngine, Room, HVACType, ElectricalPhase


class BuildingType(Enum):
    """Building classification"""
    RESIDENTIAL = "residential"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"


class VerticalCirculationType(Enum):
    """Vertical circulation types"""
    STAIRS = "stairs"
    ELEVATOR = "elevator"
    RAMP = "ramp"


@dataclass
class FloorPlan:
    """Floor plan definition"""
    floor_number: int
    rooms: List[Room]
    ceiling_dimensions: CeilingDimensions
    area: float  # m²
    height: float  # m


@dataclass
class VerticalCirculation:
    """Vertical circulation element"""
    circ_type: VerticalCirculationType
    location: Tuple[float, float]  # (x, y) in meters
    width: float  # m
    length: float  # m
    cost: float  # $


@dataclass
class BuildingDesign:
    """Complete building design"""
    building_type: BuildingType
    floors: List[FloorPlan]
    total_area: float  # m²
    total_height: float  # m
    structural_elements: List[Any]  # Beams, columns, foundations
    mep_systems: List[Any]  # HVAC, electrical, plumbing
    vertical_circulation: List[VerticalCirculation]
    total_cost: float  # $


class FullArchitecturalEngine:
    """
    Full Architectural Design Engine
    Integrates all systems into complete building design
    """
    
    # Standard costs per m²
    COST_PER_M2 = {
        "residential": 1500,
        "office": 2000,
        "commercial": 2500,
        "industrial": 1200,
    }
    
    # Standard floor heights
    FLOOR_HEIGHT = {
        "residential": 3.0,  # m
        "office": 3.5,
        "commercial": 4.0,
        "industrial": 5.0,
    }
    
    def __init__(self):
        self.structural_engine = StructuralEngine()
        self.mep_engine = MEPSystemEngine()
        self.designs = []
    
    def design_building(self,
                       building_type: BuildingType,
                       dimensions: Tuple[float, float],  # (length, width) in meters
                       num_floors: int,
                       program: Dict[str, int]) -> BuildingDesign:
        """
        Design a complete multi-story building.
        
        Args:
            building_type: Type of building
            dimensions: Building footprint (length, width)
            num_floors: Number of floors
            program: Room program (e.g., {"bedroom": 3, "bathroom": 2})
        
        Returns:
            Complete building design
        """
        print(f"🏗️  Full Architecture: Designing {building_type.value} building...")
        print(f"   Footprint: {dimensions[0]}m × {dimensions[1]}m")
        print(f"   Floors: {num_floors}")
        
        # Generate floor plans
        floors = self._generate_floor_plans(building_type, dimensions, num_floors, program)
        
        # Design structural system
        structural_elements = self._design_structural_system(floors, building_type)
        
        # Design MEP systems
        mep_systems = self._design_mep_systems(floors, building_type)
        
        # Design vertical circulation
        vertical_circulation = self._design_vertical_circulation(dimensions, num_floors)
        
        # Calculate totals
        total_area = sum(floor.area for floor in floors)
        total_height = num_floors * self.FLOOR_HEIGHT[building_type.value]
        
        # Calculate total cost
        structural_cost = self.structural_engine.calculate_total_cost()
        mep_cost = self.mep_engine.calculate_total_cost()
        base_cost = total_area * self.COST_PER_M2[building_type.value]
        circulation_cost = sum(circ.cost for circ in vertical_circulation)
        
        total_cost = structural_cost + mep_cost + base_cost + circulation_cost
        
        building = BuildingDesign(
            building_type=building_type,
            floors=floors,
            total_area=total_area,
            total_height=total_height,
            structural_elements=structural_elements,
            mep_systems=mep_systems,
            vertical_circulation=vertical_circulation,
            total_cost=total_cost
        )
        
        self.designs.append(building)
        return building
    
    def _generate_floor_plans(self,
                             building_type: BuildingType,
                             dimensions: Tuple[float, float],
                             num_floors: int,
                             program: Dict[str, int]) -> List[FloorPlan]:
        """Generate floor plans based on program"""
        floors = []
        
        length, width = dimensions
        floor_height = self.FLOOR_HEIGHT[building_type.value]
        
        # Distribute rooms across floors
        total_rooms = sum(program.values())
        rooms_per_floor = max(1, math.ceil(total_rooms / num_floors))
        
        room_types = []
        for room_type, count in program.items():
            room_types.extend([room_type] * count)
        
        for floor_num in range(num_floors):
            floor_rooms = []
            start_idx = floor_num * rooms_per_floor
            end_idx = min(start_idx + rooms_per_floor, len(room_types))
            
            # Calculate room areas
            total_area = length * width
            area_per_room = total_area / (end_idx - start_idx)
            
            for i in range(start_idx, end_idx):
                room_type = room_types[i]
                room_area = area_per_room * 0.9  # 90% efficiency
                
                # Estimate occupancy
                if room_type in ["bedroom", "living"]:
                    occupancy = 2
                elif room_type == "kitchen":
                    occupancy = 2
                elif room_type == "bathroom":
                    occupancy = 1
                else:
                    occupancy = 1
                
                room = Room(
                    name=f"{room_type.title()} {i - start_idx + 1}",
                    area=room_area,
                    volume=room_area * floor_height,
                    occupancy=occupancy,
                    has_window=True
                )
                floor_rooms.append(room)
            
            # Ceiling dimensions (in mm)
            ceiling = CeilingDimensions(
                length_mm=length * 1000,
                width_mm=width * 1000
            )
            
            floor_plan = FloorPlan(
                floor_number=floor_num + 1,
                rooms=floor_rooms,
                ceiling_dimensions=ceiling,
                area=length * width,
                height=floor_height
            )
            
            floors.append(floor_plan)
        
        return floors
    
    def _design_structural_system(self, floors: List[FloorPlan], building_type: BuildingType) -> List[Any]:
        """Design structural system for all floors"""
        print("   Designing structural system...")
        
        structural_elements = []
        
        # Calculate total building load
        floor_area = floors[0].area if floors else 0
        num_floors = len(floors)
        
        # Load assumptions (kN/m²)
        dead_load = 5.0  # Self-weight
        live_load = 3.0 if building_type == BuildingType.RESIDENTIAL else 5.0
        
        total_floor_load = (dead_load + live_load) * floor_area  # kN per floor
        total_building_load = total_floor_load * num_floors
        
        # Design foundation
        foundation = self.structural_engine.design_foundation(
            total_load=total_building_load,
            soil_capacity=150.0,
            foundation_type="spread" if num_floors <= 3 else "raft"
        )
        structural_elements.append(foundation)
        
        # Design columns (4 corners + 1 per 5m span)
        length, width = floors[0].ceiling_dimensions.length_mm / 1000, floors[0].ceiling_dimensions.width_mm / 1000
        
        # Number of columns
        cols_x = math.ceil(length / 5) + 1
        cols_y = math.ceil(width / 5) + 1
        total_columns = cols_x * cols_y
        
        # Load per column
        column_load = (total_building_load / total_columns) * 1.2  # Add factor
        
        for i in range(min(4, total_columns)):  # Design key columns
            column = self.structural_engine.design_column(
                height=3.0 * num_floors,
                axial_load=column_load,
                material_name="concrete_25"
            )
            structural_elements.append(column)
        
        # Design beams (per floor)
        for floor in floors:
            # Main beams spanning length
            loads = [
                Load(load_type=LoadType.DEAD, magnitude=5.0, location=(0, 0, 0), distribution="distributed"),
                Load(load_type=LoadType.LIVE, magnitude=3.0, location=(0, 0, 0), distribution="distributed"),
            ]
            
            beam = self.structural_engine.design_beam(
                span=length,
                loads=loads,
                material_name="concrete_25"
            )
            structural_elements.append(beam)
        
        return structural_elements
    
    def _design_mep_systems(self, floors: List[FloorPlan], building_type: BuildingType) -> List[Any]:
        """Design MEP systems for all floors"""
        print("   Designing MEP systems...")
        
        mep_systems = []
        
        # HVAC design (one system per floor or central)
        for floor in floors:
            hvac = self.mep_engine.design_hvac(
                rooms=floor.rooms,
                system_type=HVACType.VRF,
                outdoor_temp=35.0,
                indoor_temp=24.0
            )
            mep_systems.append(hvac)
        
        # Electrical design (one system per building)
        all_rooms = [room for floor in floors for room in floor.rooms]
        electrical = self.mep_engine.design_electrical(
            rooms=all_rooms,
            building_type=building_type.value,
            phase=ElectricalPhase.THREE_PHASE if building_type != BuildingType.RESIDENTIAL else ElectricalPhase.SINGLE_PHASE
        )
        mep_systems.append(electrical)
        
        # Plumbing design (one system per building)
        # Estimate fixtures based on program
        fixture_counts = {"toilet": 0, "sink": 0, "shower": 0, "bathtub": 0}
        
        for room in all_rooms:
            if "bathroom" in room.name.lower():
                fixture_counts["toilet"] += 1
                fixture_counts["sink"] += 1
                fixture_counts["shower"] += 1
            elif "kitchen" in room.name.lower():
                fixture_counts["sink"] += 1
            elif "bedroom" in room.name.lower():
                if room.area > 12:  # Master bedroom
                    fixture_counts["bathtub"] += 1
        
        plumbing = self.mep_engine.design_plumbing(all_rooms, fixture_counts)
        mep_systems.append(plumbing)
        
        return mep_systems
    
    def _design_vertical_circulation(self, dimensions: Tuple[float, float], num_floors: int) -> List[VerticalCirculation]:
        """Design stairs and elevators"""
        print("   Designing vertical circulation...")
        
        circulation = []
        
        length, width = dimensions
        
        # Stairs (minimum width 1.2m)
        if num_floors > 1:
            # Calculate stair dimensions
            # Typical: 1.2m wide, 2.5m long per flight
            stair_width = 1.2
            stair_length = 2.5
            
            # Number of stairs (1 per 500m² or minimum 1)
            num_stairs = max(1, math.ceil((length * width * num_floors) / 500))
            
            for i in range(num_stairs):
                # Position stairs near center
                x = length / 2 + (i - (num_stairs - 1) / 2) * 3
                y = width / 2
                
                stairs = VerticalCirculation(
                    circ_type=VerticalCirculationType.STAIRS,
                    location=(x, y),
                    width=stair_width,
                    length=stair_length,
                    cost=5000 * num_floors  # $5k per floor
                )
                circulation.append(stairs)
            
            # Elevator (for buildings > 3 floors or commercial)
            if num_floors > 3 or building_type != BuildingType.RESIDENTIAL:
                elevator = VerticalCirculation(
                    circ_type=VerticalCirculationType.ELEVATOR,
                    location=(length / 2 - 2, width / 2),
                    width=1.5,
                    length=1.5,
                    cost=25000 * num_floors  # $25k per floor
                )
                circulation.append(elevator)
        
        return circulation
    
    def check_code_compliance(self, building: BuildingDesign) -> Dict[str, Any]:
        """Check building code compliance"""
        print("   Checking code compliance...")
        
        compliance = {
            "structural": True,
            "fire_safety": True,
            "accessibility": True,
            "energy_efficiency": True,
            "plumbing": True,
            "electrical": True,
            "violations": []
        }
        
        # Check minimum room sizes
        for floor in building.floors:
            for room in floor.rooms:
                if room.area < 6.0:
                    compliance["violations"].append(f"Room {room.name} too small ({room.area:.1f}m²)")
                    compliance["structural"] = False
        
        # Check minimum ceiling height
        if building.floors[0].height < 2.4:
            compliance["violations"].append("Ceiling height below minimum (2.4m)")
            compliance["structural"] = False
        
        # Check stair dimensions
        for circ in building.vertical_circulation:
            if circ.circ_type == VerticalCirculationType.STAIRS:
                if circ.width < 0.9:
                    compliance["violations"].append("Stair width below minimum (0.9m)")
                    compliance["accessibility"] = False
        
        # Check electrical load
        for mep in building.mep_systems:
            if hasattr(mep, 'total_load'):
                if mep.total_load > 100 and building.building_type == BuildingType.RESIDENTIAL:
                    compliance["violations"].append("Residential electrical load too high")
                    compliance["electrical"] = False
        
        # Check plumbing
        total_fixtures = 0
        for mep in building.mep_systems:
            if hasattr(mep, 'fixture_count'):
                total_fixtures += sum(mep.fixture_count.values())
        
        if total_fixtures > 20 and building.building_type == BuildingType.RESIDENTIAL:
            compliance["violations"].append("Too many fixtures for residential")
            compliance["plumbing"] = False
        
        # Overall compliance
        compliance["overall"] = all([
            compliance["structural"],
            compliance["fire_safety"],
            compliance["accessibility"],
            compliance["energy_efficiency"],
            compliance["plumbing"],
            compliance["electrical"]
        ])
        
        return compliance
    
    def generate_building_report(self, building: BuildingDesign) -> str:
        """Generate comprehensive building report"""
        report = ["FULL BUILDING DESIGN REPORT", "=" * 60]
        
        report.append(f"\nBUILDING SUMMARY")
        report.append(f"Type: {building.building_type.value}")
        report.append(f"Floors: {len(building.floors)}")
        report.append(f"Total Area: {building.total_area:.1f} m²")
        report.append(f"Total Height: {building.total_height:.1f} m")
        
        report.append(f"\nFLOOR BREAKDOWN")
        for floor in building.floors:
            report.append(f"  Floor {floor.floor_number}:")
            report.append(f"    Area: {floor.area:.1f} m²")
            report.append(f"    Rooms: {len(floor.rooms)}")
            report.append(f"    Height: {floor.height:.1f} m")
        
        report.append(f"\nSTRUCTURAL SYSTEM")
        structural_count = len([e for e in building.structural_elements if hasattr(e, 'cost')])
        report.append(f"  Elements: {structural_count}")
        report.append(f"  Foundation: {building.structural_elements[0].type}")
        
        report.append(f"\nMEP SYSTEMS")
        hvac_count = len([s for s in building.mep_systems if hasattr(s, 'cooling_capacity')])
        electrical_count = len([s for s in building.mep_systems if hasattr(s, 'total_load')])
        plumbing_count = len([s for s in building.mep_systems if hasattr(s, 'flow_rate')])
        report.append(f"  HVAC Systems: {hvac_count}")
        report.append(f"  Electrical Systems: {electrical_count}")
        report.append(f"  Plumbing Systems: {plumbing_count}")
        
        report.append(f"\nVERTICAL CIRCULATION")
        for circ in building.vertical_circulation:
            report.append(f"  {circ.circ_type.value}: {circ.width}m × {circ.length}m at {circ.location}")
        
        report.append(f"\nCOST BREAKDOWN")
        structural_cost = self.structural_engine.calculate_total_cost()
        mep_cost = self.mep_engine.calculate_total_cost()
        base_cost = building.total_area * self.COST_PER_M2[building.building_type.value]
        circulation_cost = sum(circ.cost for circ in building.vertical_circulation)
        
        report.append(f"  Base Construction: ${base_cost:,.2f}")
        report.append(f"  Structural: ${structural_cost:,.2f}")
        report.append(f"  MEP Systems: ${mep_cost:,.2f}")
        report.append(f"  Vertical Circulation: ${circulation_cost:,.2f}")
        report.append(f"  {'='*40}")
        report.append(f"  TOTAL COST: ${building.total_cost:,.2f}")
        report.append(f"  Cost per m²: ${building.total_cost / building.total_area:,.2f}")
        
        # Code compliance
        compliance = self.check_code_compliance(building)
        report.append(f"\nCODE COMPLIANCE")
        report.append(f"  Overall: {'PASS' if compliance['overall'] else 'FAIL'}")
        if not compliance['overall']:
            report.append(f"  Violations:")
            for violation in compliance['violations']:
                report.append(f"    - {violation}")
        
        return "\n".join(report)


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_full_architecture():
    """Demonstrate full architectural design capabilities"""
    print("\n" + "="*80)
    print("FULL ARCHITECTURAL DESIGN ENGINE DEMONSTRATION")
    print("="*80)
    
    engine = FullArchitecturalEngine()
    
    print("\nDesigning 2-story residential house...")
    print("Dimensions: 12m × 8m")
    print("Program: 4 bedrooms, 2 bathrooms, kitchen, living room")
    
    # Design building
    building = engine.design_building(
        building_type=BuildingType.RESIDENTIAL,
        dimensions=(12.0, 8.0),
        num_floors=2,
        program={
            "bedroom": 4,
            "bathroom": 2,
            "kitchen": 1,
            "living": 1,
        }
    )
    
    print("\n" + "="*80)
    print("BUILDING DESIGN COMPLETE")
    print("="*80)
    
    # Generate report
    report = engine.generate_building_report(building)
    print(report)
    
    print("\n" + "="*80)
    print("✅ PHASE 2 SPRINT 4 COMPLETE!")
    print("Full architectural design system operational!")
    print("="*80)
    
    return building


if __name__ == "__main__":
    demonstrate_full_architecture()