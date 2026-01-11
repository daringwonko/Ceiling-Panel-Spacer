#!/usr/bin/env python3
"""
Multi-Story Building Designer for Ceiling Panel Calculator.

Enables design of multi-floor buildings with:
- Floor plan management
- Vertical circulation (stairs, elevators)
- Structural continuity
- MEP riser coordination
- Building code compliance
"""

import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
from datetime import datetime
import json


class SpaceType(Enum):
    """Types of spaces in a building."""
    OFFICE = "office"
    RESIDENTIAL = "residential"
    RETAIL = "retail"
    INDUSTRIAL = "industrial"
    PARKING = "parking"
    MECHANICAL = "mechanical"
    CIRCULATION = "circulation"
    COMMON = "common"


class VerticalTransportType(Enum):
    """Vertical circulation types."""
    STAIRS = "stairs"
    ELEVATOR = "elevator"
    ESCALATOR = "escalator"
    RAMP = "ramp"


@dataclass
class Space:
    """Individual space within a floor."""
    id: str
    name: str
    space_type: SpaceType
    area_sqm: float
    occupancy: int
    ceiling_height_m: float = 3.0
    requires_hvac: bool = True
    requires_sprinkler: bool = True
    position_x: float = 0.0
    position_y: float = 0.0
    width: float = 0.0
    length: float = 0.0

    @property
    def volume_m3(self) -> float:
        return self.area_sqm * self.ceiling_height_m


@dataclass
class VerticalTransport:
    """Vertical circulation element."""
    id: str
    transport_type: VerticalTransportType
    capacity: int  # persons per trip
    serves_floors: List[int]
    position_x: float
    position_y: float
    width: float
    length: float
    speed_mps: float = 2.0  # m/s for elevators

    @property
    def area_sqm(self) -> float:
        return self.width * self.length


@dataclass
class StructuralElement:
    """Structural element spanning multiple floors."""
    id: str
    element_type: str  # 'column', 'shear_wall', 'core'
    position_x: float
    position_y: float
    width: float
    length: float
    serves_floors: List[int]
    material: str = "concrete"
    load_capacity_kn: float = 0.0


@dataclass
class MEPRiser:
    """Vertical MEP riser."""
    id: str
    riser_type: str  # 'hvac_duct', 'electrical', 'plumbing', 'fire_protection'
    position_x: float
    position_y: float
    width: float
    length: float
    serves_floors: List[int]


@dataclass
class Floor:
    """Single floor in a building."""
    level: int  # 0 = ground, -1 = basement
    name: str
    floor_to_floor_height_m: float = 4.0
    spaces: List[Space] = field(default_factory=list)
    gross_area_sqm: float = 0.0
    net_area_sqm: float = 0.0

    def add_space(self, space: Space) -> None:
        self.spaces.append(space)
        self.net_area_sqm += space.area_sqm

    @property
    def total_occupancy(self) -> int:
        return sum(s.occupancy for s in self.spaces)

    @property
    def efficiency(self) -> float:
        """Net to gross area ratio."""
        if self.gross_area_sqm > 0:
            return self.net_area_sqm / self.gross_area_sqm
        return 0.0


@dataclass
class BuildingStats:
    """Building statistics and metrics."""
    total_floors: int
    total_gross_area_sqm: float
    total_net_area_sqm: float
    total_occupancy: int
    building_height_m: float
    efficiency_ratio: float
    floor_area_ratio: float  # FAR
    parking_ratio: float
    elevator_count: int
    stair_count: int


class MultiStoryDesigner:
    """
    Designs multi-story buildings with proper coordination.
    """

    # Building code minimums
    CODES = {
        'min_stair_width_m': 1.1,
        'min_elevator_count_per_occupancy': 200,  # 1 elevator per 200 people
        'max_travel_distance_m': 45,  # to exit
        'min_ceiling_height_m': 2.7,
        'min_corridor_width_m': 1.5,
        'parking_ratio_office': 1/30,  # spaces per sqm
        'parking_ratio_residential': 1.0,  # spaces per unit
    }

    def __init__(self):
        self.floors: List[Floor] = []
        self.vertical_transports: List[VerticalTransport] = []
        self.structural_elements: List[StructuralElement] = []
        self.mep_risers: List[MEPRiser] = []
        self.site_area_sqm: float = 0.0
        self.building_footprint_sqm: float = 0.0

    def set_site(self, site_area_sqm: float, footprint_sqm: float) -> None:
        """Set site parameters."""
        self.site_area_sqm = site_area_sqm
        self.building_footprint_sqm = footprint_sqm

    def add_floor(
        self,
        level: int,
        name: str,
        floor_to_floor_height_m: float = 4.0,
        gross_area_sqm: Optional[float] = None
    ) -> Floor:
        """Add a floor to the building."""
        floor = Floor(
            level=level,
            name=name,
            floor_to_floor_height_m=floor_to_floor_height_m,
            gross_area_sqm=gross_area_sqm or self.building_footprint_sqm
        )
        self.floors.append(floor)
        self.floors.sort(key=lambda f: f.level)
        return floor

    def add_space_to_floor(
        self,
        floor_level: int,
        space_id: str,
        name: str,
        space_type: SpaceType,
        area_sqm: float,
        occupancy: int,
        ceiling_height_m: float = 3.0
    ) -> Space:
        """Add a space to a specific floor."""
        floor = self._get_floor(floor_level)
        if not floor:
            raise ValueError(f"Floor {floor_level} not found")

        space = Space(
            id=space_id,
            name=name,
            space_type=space_type,
            area_sqm=area_sqm,
            occupancy=occupancy,
            ceiling_height_m=ceiling_height_m
        )
        floor.add_space(space)
        return space

    def add_vertical_transport(
        self,
        transport_id: str,
        transport_type: VerticalTransportType,
        serves_floors: List[int],
        capacity: int,
        position: Tuple[float, float],
        size: Tuple[float, float]
    ) -> VerticalTransport:
        """Add vertical circulation element."""
        vt = VerticalTransport(
            id=transport_id,
            transport_type=transport_type,
            capacity=capacity,
            serves_floors=serves_floors,
            position_x=position[0],
            position_y=position[1],
            width=size[0],
            length=size[1]
        )
        self.vertical_transports.append(vt)
        return vt

    def add_structural_element(
        self,
        element_id: str,
        element_type: str,
        serves_floors: List[int],
        position: Tuple[float, float],
        size: Tuple[float, float],
        load_capacity_kn: float = 5000
    ) -> StructuralElement:
        """Add structural element spanning floors."""
        se = StructuralElement(
            id=element_id,
            element_type=element_type,
            serves_floors=serves_floors,
            position_x=position[0],
            position_y=position[1],
            width=size[0],
            length=size[1],
            load_capacity_kn=load_capacity_kn
        )
        self.structural_elements.append(se)
        return se

    def add_mep_riser(
        self,
        riser_id: str,
        riser_type: str,
        serves_floors: List[int],
        position: Tuple[float, float],
        size: Tuple[float, float]
    ) -> MEPRiser:
        """Add MEP riser."""
        riser = MEPRiser(
            id=riser_id,
            riser_type=riser_type,
            serves_floors=serves_floors,
            position_x=position[0],
            position_y=position[1],
            width=size[0],
            length=size[1]
        )
        self.mep_risers.append(riser)
        return riser

    def calculate_required_elevators(self) -> int:
        """Calculate required elevators based on occupancy."""
        total_occupancy = sum(f.total_occupancy for f in self.floors)
        return max(1, math.ceil(total_occupancy / self.CODES['min_elevator_count_per_occupancy']))

    def calculate_required_stairs(self) -> int:
        """Calculate required stairs based on travel distance and occupancy."""
        # Simplified: at least 2 stairs for egress, more for larger buildings
        if not self.floors:
            return 0

        max_area = max(f.gross_area_sqm for f in self.floors)

        # Assume roughly square floor
        floor_dimension = math.sqrt(max_area)

        # Need stairs such that travel distance < max
        stair_coverage = self.CODES['max_travel_distance_m'] * 2
        required_stairs = max(2, math.ceil(floor_dimension / stair_coverage))

        return required_stairs

    def get_building_stats(self) -> BuildingStats:
        """Calculate building statistics."""
        if not self.floors:
            return BuildingStats(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

        total_gross = sum(f.gross_area_sqm for f in self.floors)
        total_net = sum(f.net_area_sqm for f in self.floors)
        total_occupancy = sum(f.total_occupancy for f in self.floors)

        # Calculate height
        height = sum(f.floor_to_floor_height_m for f in self.floors if f.level >= 0)

        # FAR (Floor Area Ratio)
        far = total_gross / self.site_area_sqm if self.site_area_sqm > 0 else 0

        # Count vertical transport by type
        elevator_count = len([v for v in self.vertical_transports
                            if v.transport_type == VerticalTransportType.ELEVATOR])
        stair_count = len([v for v in self.vertical_transports
                         if v.transport_type == VerticalTransportType.STAIRS])

        # Parking (assume basement levels)
        parking_floors = [f for f in self.floors if f.level < 0]
        parking_area = sum(f.gross_area_sqm for f in parking_floors)
        parking_spaces = parking_area / 25  # ~25 sqm per space

        return BuildingStats(
            total_floors=len(self.floors),
            total_gross_area_sqm=round(total_gross, 2),
            total_net_area_sqm=round(total_net, 2),
            total_occupancy=total_occupancy,
            building_height_m=round(height, 2),
            efficiency_ratio=round(total_net / total_gross if total_gross > 0 else 0, 3),
            floor_area_ratio=round(far, 2),
            parking_ratio=round(parking_spaces / total_occupancy if total_occupancy > 0 else 0, 2),
            elevator_count=elevator_count,
            stair_count=stair_count
        )

    def check_code_compliance(self) -> List[Dict[str, Any]]:
        """Check building code compliance."""
        issues = []
        stats = self.get_building_stats()

        # Check elevator count
        required_elevators = self.calculate_required_elevators()
        if stats.elevator_count < required_elevators:
            issues.append({
                'code': 'ELEVATOR_COUNT',
                'severity': 'error',
                'message': f'Insufficient elevators: {stats.elevator_count} provided, {required_elevators} required',
                'required': required_elevators,
                'provided': stats.elevator_count
            })

        # Check stair count
        required_stairs = self.calculate_required_stairs()
        if stats.stair_count < required_stairs:
            issues.append({
                'code': 'STAIR_COUNT',
                'severity': 'error',
                'message': f'Insufficient stairs: {stats.stair_count} provided, {required_stairs} required',
                'required': required_stairs,
                'provided': stats.stair_count
            })

        # Check floor efficiency
        for floor in self.floors:
            if floor.efficiency < 0.7:
                issues.append({
                    'code': 'FLOOR_EFFICIENCY',
                    'severity': 'warning',
                    'message': f'Floor {floor.name} has low efficiency: {floor.efficiency:.1%}',
                    'floor': floor.name,
                    'efficiency': floor.efficiency
                })

            # Check ceiling heights
            for space in floor.spaces:
                if space.ceiling_height_m < self.CODES['min_ceiling_height_m']:
                    issues.append({
                        'code': 'CEILING_HEIGHT',
                        'severity': 'error',
                        'message': f'Space {space.name} ceiling too low: {space.ceiling_height_m}m',
                        'space': space.name,
                        'height': space.ceiling_height_m,
                        'minimum': self.CODES['min_ceiling_height_m']
                    })

        return issues

    def generate_cost_estimate(self, cost_per_sqm: float = 2000) -> Dict[str, Any]:
        """Generate building cost estimate."""
        stats = self.get_building_stats()

        # Base construction cost
        base_cost = stats.total_gross_area_sqm * cost_per_sqm

        # Adjustments
        height_factor = 1 + (stats.total_floors - 5) * 0.03 if stats.total_floors > 5 else 1.0
        elevator_cost = stats.elevator_count * 150000  # $150k per elevator
        stair_cost = stats.stair_count * 50000  # $50k per stair

        # MEP (typically 30-40% of construction)
        mep_cost = base_cost * 0.35

        # Site work (5-10%)
        site_cost = base_cost * 0.08

        total = (base_cost * height_factor) + elevator_cost + stair_cost + mep_cost + site_cost

        return {
            'base_construction': round(base_cost * height_factor, 2),
            'vertical_transport': round(elevator_cost + stair_cost, 2),
            'mep_systems': round(mep_cost, 2),
            'site_work': round(site_cost, 2),
            'total_estimate': round(total, 2),
            'cost_per_sqm': round(total / stats.total_gross_area_sqm if stats.total_gross_area_sqm > 0 else 0, 2)
        }

    def _get_floor(self, level: int) -> Optional[Floor]:
        """Get floor by level."""
        for floor in self.floors:
            if floor.level == level:
                return floor
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Export building design to dictionary."""
        return {
            'site_area_sqm': self.site_area_sqm,
            'building_footprint_sqm': self.building_footprint_sqm,
            'floors': [
                {
                    'level': f.level,
                    'name': f.name,
                    'floor_to_floor_height_m': f.floor_to_floor_height_m,
                    'gross_area_sqm': f.gross_area_sqm,
                    'net_area_sqm': f.net_area_sqm,
                    'spaces': [
                        {
                            'id': s.id,
                            'name': s.name,
                            'type': s.space_type.value,
                            'area_sqm': s.area_sqm,
                            'occupancy': s.occupancy
                        }
                        for s in f.spaces
                    ]
                }
                for f in self.floors
            ],
            'vertical_transports': [
                {
                    'id': v.id,
                    'type': v.transport_type.value,
                    'serves_floors': v.serves_floors,
                    'capacity': v.capacity
                }
                for v in self.vertical_transports
            ],
            'statistics': self.get_building_stats().__dict__
        }


def demonstrate_multi_story_designer():
    """Demonstrate multi-story building design."""
    print("="*80)
    print("MULTI-STORY BUILDING DESIGNER")
    print("="*80)

    designer = MultiStoryDesigner()

    # Set site
    designer.set_site(site_area_sqm=2000, footprint_sqm=800)

    print("\n1. Creating Building Floors...")

    # Add basement parking
    designer.add_floor(-1, "Basement Parking", floor_to_floor_height_m=3.5)
    designer.add_space_to_floor(-1, "P01", "Parking Area", SpaceType.PARKING, 700, 0)

    # Add ground floor retail
    designer.add_floor(0, "Ground Floor", floor_to_floor_height_m=4.5)
    designer.add_space_to_floor(0, "G01", "Retail Space", SpaceType.RETAIL, 400, 50)
    designer.add_space_to_floor(0, "G02", "Lobby", SpaceType.CIRCULATION, 150, 20)

    # Add office floors
    for i in range(1, 6):
        designer.add_floor(i, f"Office Floor {i}", floor_to_floor_height_m=4.0)
        designer.add_space_to_floor(i, f"O{i}01", f"Open Office {i}", SpaceType.OFFICE, 500, 50)
        designer.add_space_to_floor(i, f"O{i}02", f"Meeting Rooms {i}", SpaceType.OFFICE, 100, 20)

    # Add roof mechanical
    designer.add_floor(6, "Mechanical Penthouse", floor_to_floor_height_m=5.0)
    designer.add_space_to_floor(6, "M01", "Mechanical Room", SpaceType.MECHANICAL, 200, 2)

    print(f"  Created {len(designer.floors)} floors")

    print("\n2. Adding Vertical Circulation...")

    # Add elevators
    all_floors = list(range(-1, 7))
    designer.add_vertical_transport("E01", VerticalTransportType.ELEVATOR, all_floors, 15, (5, 5), (2.5, 2.5))
    designer.add_vertical_transport("E02", VerticalTransportType.ELEVATOR, all_floors, 15, (8, 5), (2.5, 2.5))

    # Add stairs
    designer.add_vertical_transport("S01", VerticalTransportType.STAIRS, all_floors, 100, (0, 0), (4, 3))
    designer.add_vertical_transport("S02", VerticalTransportType.STAIRS, all_floors, 100, (25, 0), (4, 3))

    print(f"  Added 2 elevators, 2 stairs")

    print("\n3. Building Statistics:")
    stats = designer.get_building_stats()
    print(f"  Total Floors: {stats.total_floors}")
    print(f"  Building Height: {stats.building_height_m}m")
    print(f"  Gross Area: {stats.total_gross_area_sqm:,.0f} sqm")
    print(f"  Net Area: {stats.total_net_area_sqm:,.0f} sqm")
    print(f"  Efficiency: {stats.efficiency_ratio:.1%}")
    print(f"  Total Occupancy: {stats.total_occupancy} persons")
    print(f"  Floor Area Ratio: {stats.floor_area_ratio}")

    print("\n4. Code Compliance Check:")
    issues = designer.check_code_compliance()
    if issues:
        for issue in issues:
            print(f"  [{issue['severity'].upper()}] {issue['message']}")
    else:
        print("  All code requirements satisfied!")

    print("\n5. Cost Estimate:")
    cost = designer.generate_cost_estimate(cost_per_sqm=2500)
    print(f"  Base Construction: ${cost['base_construction']:,.0f}")
    print(f"  Vertical Transport: ${cost['vertical_transport']:,.0f}")
    print(f"  MEP Systems: ${cost['mep_systems']:,.0f}")
    print(f"  Site Work: ${cost['site_work']:,.0f}")
    print(f"  TOTAL: ${cost['total_estimate']:,.0f}")
    print(f"  Cost/sqm: ${cost['cost_per_sqm']:,.0f}")

    print("\n" + "="*80)
    print("MULTI-STORY DESIGN COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_multi_story_designer()
