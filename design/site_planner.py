#!/usr/bin/env python3
"""
Site Planning and Zoning Module for Ceiling Panel Calculator.

Provides comprehensive site analysis including:
- Zoning compliance
- Setback calculations
- Parking requirements
- Site coverage analysis
- Green space calculations
- Utility planning
"""

import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
from datetime import datetime


class ZoningType(Enum):
    """Zoning classifications."""
    RESIDENTIAL_LOW = "R1"
    RESIDENTIAL_MEDIUM = "R2"
    RESIDENTIAL_HIGH = "R3"
    COMMERCIAL = "C"
    MIXED_USE = "MU"
    INDUSTRIAL = "I"
    OFFICE = "O"
    SPECIAL = "S"


class ParkingType(Enum):
    """Parking types."""
    SURFACE = "surface"
    STRUCTURED = "structured"
    UNDERGROUND = "underground"
    MECHANICAL = "mechanical"


@dataclass
class SetbackRequirements:
    """Setback distances from property lines."""
    front_m: float
    rear_m: float
    side_left_m: float
    side_right_m: float

    @property
    def total_area_lost_sqm(self) -> float:
        """Approximate area lost to setbacks for a rectangular site."""
        # This is a simplified calculation
        return 0.0  # Computed based on actual site geometry


@dataclass
class ZoningRegulation:
    """Zoning regulation parameters."""
    zone_type: ZoningType
    max_far: float  # Floor Area Ratio
    max_height_m: float
    max_coverage_pct: float
    min_parking_ratio: float  # spaces per 100 sqm
    min_green_space_pct: float
    setbacks: SetbackRequirements
    allowed_uses: List[str]


@dataclass
class SiteCharacteristics:
    """Physical site characteristics."""
    total_area_sqm: float
    frontage_m: float
    depth_m: float
    slope_pct: float = 0.0
    soil_bearing_capacity_kpa: float = 150.0
    water_table_depth_m: float = 5.0
    existing_trees: int = 0
    has_easements: bool = False


@dataclass
class ParkingDesign:
    """Parking area design."""
    parking_type: ParkingType
    total_spaces: int
    regular_spaces: int
    accessible_spaces: int
    ev_charging_spaces: int
    area_sqm: float
    levels: int = 1


@dataclass
class SiteAnalysisResult:
    """Result of site analysis."""
    buildable_area_sqm: float
    max_building_footprint_sqm: float
    max_gross_floor_area_sqm: float
    max_building_height_m: float
    required_parking_spaces: int
    required_green_space_sqm: float
    zoning_compliance: bool
    issues: List[str]


class SitePlanner:
    """
    Comprehensive site planning and zoning compliance.
    """

    # Default zoning regulations by type
    DEFAULT_REGULATIONS = {
        ZoningType.RESIDENTIAL_LOW: ZoningRegulation(
            zone_type=ZoningType.RESIDENTIAL_LOW,
            max_far=0.5,
            max_height_m=10,
            max_coverage_pct=40,
            min_parking_ratio=2.0,  # per unit
            min_green_space_pct=40,
            setbacks=SetbackRequirements(6, 6, 3, 3),
            allowed_uses=['single_family', 'duplex']
        ),
        ZoningType.RESIDENTIAL_MEDIUM: ZoningRegulation(
            zone_type=ZoningType.RESIDENTIAL_MEDIUM,
            max_far=1.5,
            max_height_m=20,
            max_coverage_pct=50,
            min_parking_ratio=1.5,
            min_green_space_pct=30,
            setbacks=SetbackRequirements(5, 5, 3, 3),
            allowed_uses=['apartment', 'townhouse', 'condo']
        ),
        ZoningType.RESIDENTIAL_HIGH: ZoningRegulation(
            zone_type=ZoningType.RESIDENTIAL_HIGH,
            max_far=4.0,
            max_height_m=50,
            max_coverage_pct=60,
            min_parking_ratio=1.0,
            min_green_space_pct=20,
            setbacks=SetbackRequirements(6, 6, 5, 5),
            allowed_uses=['high_rise_residential', 'apartment']
        ),
        ZoningType.COMMERCIAL: ZoningRegulation(
            zone_type=ZoningType.COMMERCIAL,
            max_far=3.0,
            max_height_m=35,
            max_coverage_pct=70,
            min_parking_ratio=4.0,  # per 100 sqm
            min_green_space_pct=15,
            setbacks=SetbackRequirements(0, 5, 0, 0),
            allowed_uses=['retail', 'restaurant', 'service', 'office']
        ),
        ZoningType.OFFICE: ZoningRegulation(
            zone_type=ZoningType.OFFICE,
            max_far=6.0,
            max_height_m=75,
            max_coverage_pct=65,
            min_parking_ratio=3.0,
            min_green_space_pct=20,
            setbacks=SetbackRequirements(6, 8, 5, 5),
            allowed_uses=['office', 'financial', 'professional']
        ),
        ZoningType.MIXED_USE: ZoningRegulation(
            zone_type=ZoningType.MIXED_USE,
            max_far=5.0,
            max_height_m=60,
            max_coverage_pct=70,
            min_parking_ratio=3.0,
            min_green_space_pct=15,
            setbacks=SetbackRequirements(3, 5, 3, 3),
            allowed_uses=['retail', 'office', 'residential', 'restaurant']
        ),
        ZoningType.INDUSTRIAL: ZoningRegulation(
            zone_type=ZoningType.INDUSTRIAL,
            max_far=1.0,
            max_height_m=15,
            max_coverage_pct=60,
            min_parking_ratio=1.0,
            min_green_space_pct=20,
            setbacks=SetbackRequirements(10, 10, 5, 5),
            allowed_uses=['manufacturing', 'warehouse', 'distribution']
        ),
    }

    # Parking space sizes
    PARKING_DIMENSIONS = {
        'regular': {'width': 2.5, 'length': 5.0, 'aisle': 6.0},
        'accessible': {'width': 3.6, 'length': 5.0, 'aisle': 6.0},
        'compact': {'width': 2.3, 'length': 4.5, 'aisle': 5.5},
    }

    def __init__(self):
        self.site: Optional[SiteCharacteristics] = None
        self.zoning: Optional[ZoningRegulation] = None
        self.parking: Optional[ParkingDesign] = None

    def set_site(self, site: SiteCharacteristics) -> None:
        """Set site characteristics."""
        self.site = site

    def set_zoning(self, zone_type: ZoningType,
                   custom_regulation: Optional[ZoningRegulation] = None) -> None:
        """Set zoning regulation."""
        if custom_regulation:
            self.zoning = custom_regulation
        else:
            self.zoning = self.DEFAULT_REGULATIONS.get(zone_type)

    def analyze_site(self, proposed_gfa_sqm: float,
                    proposed_height_m: float,
                    proposed_footprint_sqm: float) -> SiteAnalysisResult:
        """
        Analyze site for zoning compliance and building potential.

        Args:
            proposed_gfa_sqm: Proposed gross floor area
            proposed_height_m: Proposed building height
            proposed_footprint_sqm: Proposed building footprint

        Returns:
            SiteAnalysisResult with analysis and compliance status
        """
        if not self.site or not self.zoning:
            raise ValueError("Site and zoning must be set before analysis")

        issues = []

        # Calculate buildable area (after setbacks)
        setbacks = self.zoning.setbacks
        buildable_width = max(0, self.site.frontage_m - setbacks.side_left_m - setbacks.side_right_m)
        buildable_depth = max(0, self.site.depth_m - setbacks.front_m - setbacks.rear_m)
        buildable_area = buildable_width * buildable_depth

        # Maximum footprint based on coverage
        max_footprint = self.site.total_area_sqm * (self.zoning.max_coverage_pct / 100)

        # Maximum GFA based on FAR
        max_gfa = self.site.total_area_sqm * self.zoning.max_far

        # Maximum height
        max_height = self.zoning.max_height_m

        # Required parking
        required_parking = math.ceil((proposed_gfa_sqm / 100) * self.zoning.min_parking_ratio)

        # Required green space
        required_green = self.site.total_area_sqm * (self.zoning.min_green_space_pct / 100)

        # Check compliance
        compliance = True

        if proposed_footprint_sqm > max_footprint:
            issues.append(f"Footprint exceeds max coverage: {proposed_footprint_sqm:.0f} > {max_footprint:.0f} sqm")
            compliance = False

        if proposed_footprint_sqm > buildable_area:
            issues.append(f"Footprint exceeds buildable area: {proposed_footprint_sqm:.0f} > {buildable_area:.0f} sqm")
            compliance = False

        if proposed_gfa_sqm > max_gfa:
            issues.append(f"GFA exceeds FAR limit: {proposed_gfa_sqm:.0f} > {max_gfa:.0f} sqm")
            compliance = False

        if proposed_height_m > max_height:
            issues.append(f"Height exceeds limit: {proposed_height_m:.0f} > {max_height:.0f} m")
            compliance = False

        # Check remaining area for parking and green space
        remaining = self.site.total_area_sqm - proposed_footprint_sqm
        parking_area_needed = self.calculate_parking_area(required_parking, ParkingType.SURFACE)

        if remaining < required_green + parking_area_needed:
            issues.append("Insufficient area for parking and green space")
            compliance = False

        return SiteAnalysisResult(
            buildable_area_sqm=round(buildable_area, 2),
            max_building_footprint_sqm=round(min(max_footprint, buildable_area), 2),
            max_gross_floor_area_sqm=round(max_gfa, 2),
            max_building_height_m=max_height,
            required_parking_spaces=required_parking,
            required_green_space_sqm=round(required_green, 2),
            zoning_compliance=compliance,
            issues=issues
        )

    def calculate_parking_area(self, spaces: int, parking_type: ParkingType) -> float:
        """Calculate parking area required."""
        dims = self.PARKING_DIMENSIONS['regular']

        if parking_type == ParkingType.SURFACE:
            # Surface parking with drive aisles
            area_per_space = dims['width'] * dims['length'] + (dims['width'] * dims['aisle'] / 2)
            return spaces * area_per_space * 1.15  # 15% for circulation

        elif parking_type == ParkingType.STRUCTURED:
            # Structured parking is more efficient
            area_per_space = 30  # sqm per space including ramps
            return spaces * area_per_space

        elif parking_type == ParkingType.UNDERGROUND:
            # Underground same as structured
            return spaces * 30

        else:  # Mechanical
            return spaces * 15  # Most efficient

    def design_parking(
        self,
        required_spaces: int,
        parking_type: ParkingType,
        ev_percentage: float = 0.1
    ) -> ParkingDesign:
        """Design parking area."""
        # Accessible spaces (typically 2% or 1 minimum)
        accessible = max(1, math.ceil(required_spaces * 0.02))

        # EV charging spaces
        ev_spaces = math.ceil(required_spaces * ev_percentage)

        # Regular spaces
        regular = required_spaces - accessible

        # Calculate area
        area = self.calculate_parking_area(required_spaces, parking_type)

        # Levels for structured/underground
        levels = 1
        if parking_type in [ParkingType.STRUCTURED, ParkingType.UNDERGROUND]:
            max_per_level = 150  # Typical max per level
            levels = math.ceil(required_spaces / max_per_level)

        self.parking = ParkingDesign(
            parking_type=parking_type,
            total_spaces=required_spaces,
            regular_spaces=regular,
            accessible_spaces=accessible,
            ev_charging_spaces=ev_spaces,
            area_sqm=round(area, 2),
            levels=levels
        )

        return self.parking

    def calculate_landscape_requirements(self) -> Dict[str, Any]:
        """Calculate landscaping requirements."""
        if not self.site or not self.zoning:
            return {}

        min_green = self.site.total_area_sqm * (self.zoning.min_green_space_pct / 100)

        # Tree requirements (typical: 1 tree per 500 sqm)
        required_trees = max(self.site.existing_trees, math.ceil(self.site.total_area_sqm / 500))

        return {
            'minimum_green_space_sqm': round(min_green, 2),
            'required_trees': required_trees,
            'existing_trees': self.site.existing_trees,
            'trees_to_plant': max(0, required_trees - self.site.existing_trees),
            'recommended_features': [
                'bioswale_drainage',
                'native_plantings',
                'shade_trees_parking',
                'permeable_paving'
            ]
        }

    def calculate_utility_requirements(self, gfa_sqm: float, occupancy: int) -> Dict[str, Any]:
        """Estimate utility requirements."""
        return {
            'electrical': {
                'estimated_load_kw': round(gfa_sqm * 0.05 + occupancy * 0.5, 2),
                'service_size_amps': 400 if gfa_sqm < 2000 else 800,
                'transformer_required': gfa_sqm > 5000
            },
            'water': {
                'estimated_daily_gal': round(occupancy * 25, 0),
                'service_size_inch': 2 if occupancy < 100 else 4,
                'fire_flow_gpm': max(1500, occupancy * 3)
            },
            'sewer': {
                'estimated_daily_gal': round(occupancy * 20, 0),
                'service_size_inch': 6 if occupancy < 200 else 8
            },
            'gas': {
                'estimated_cfh': round(gfa_sqm * 0.3, 0),
                'service_size_inch': 2
            },
            'telecom': {
                'fiber_required': gfa_sqm > 1000,
                'conduit_size_inch': 4
            }
        }

    def generate_site_plan_data(self) -> Dict[str, Any]:
        """Generate data for site plan drawing."""
        if not self.site or not self.zoning:
            return {}

        setbacks = self.zoning.setbacks

        return {
            'site': {
                'total_area_sqm': self.site.total_area_sqm,
                'frontage_m': self.site.frontage_m,
                'depth_m': self.site.depth_m
            },
            'setbacks': {
                'front_m': setbacks.front_m,
                'rear_m': setbacks.rear_m,
                'left_m': setbacks.side_left_m,
                'right_m': setbacks.side_right_m
            },
            'buildable_envelope': {
                'width_m': self.site.frontage_m - setbacks.side_left_m - setbacks.side_right_m,
                'depth_m': self.site.depth_m - setbacks.front_m - setbacks.rear_m,
                'offset_x': setbacks.side_left_m,
                'offset_y': setbacks.front_m
            },
            'zoning': {
                'type': self.zoning.zone_type.value,
                'max_far': self.zoning.max_far,
                'max_height_m': self.zoning.max_height_m,
                'max_coverage_pct': self.zoning.max_coverage_pct
            },
            'parking': self.parking.__dict__ if self.parking else None
        }


def demonstrate_site_planner():
    """Demonstrate site planning capabilities."""
    print("="*80)
    print("SITE PLANNING AND ZONING MODULE")
    print("="*80)

    planner = SitePlanner()

    # Define site
    print("\n1. Defining Site Characteristics...")
    site = SiteCharacteristics(
        total_area_sqm=5000,
        frontage_m=50,
        depth_m=100,
        slope_pct=2,
        soil_bearing_capacity_kpa=200,
        water_table_depth_m=8,
        existing_trees=5
    )
    planner.set_site(site)
    print(f"  Site Area: {site.total_area_sqm} sqm")
    print(f"  Dimensions: {site.frontage_m}m x {site.depth_m}m")

    # Set zoning
    print("\n2. Setting Zoning (Office Zone)...")
    planner.set_zoning(ZoningType.OFFICE)
    print(f"  Max FAR: {planner.zoning.max_far}")
    print(f"  Max Height: {planner.zoning.max_height_m}m")
    print(f"  Max Coverage: {planner.zoning.max_coverage_pct}%")

    # Analyze proposed development
    print("\n3. Analyzing Proposed Development...")
    result = planner.analyze_site(
        proposed_gfa_sqm=15000,
        proposed_height_m=45,
        proposed_footprint_sqm=2500
    )

    print(f"  Buildable Area: {result.buildable_area_sqm} sqm")
    print(f"  Max Footprint: {result.max_building_footprint_sqm} sqm")
    print(f"  Max GFA Allowed: {result.max_gross_floor_area_sqm} sqm")
    print(f"  Required Parking: {result.required_parking_spaces} spaces")
    print(f"  Required Green Space: {result.required_green_space_sqm} sqm")
    print(f"  Zoning Compliance: {'PASS' if result.zoning_compliance else 'FAIL'}")

    if result.issues:
        print("\n  Issues:")
        for issue in result.issues:
            print(f"    - {issue}")

    # Design parking
    print("\n4. Designing Parking...")
    parking = planner.design_parking(
        required_spaces=result.required_parking_spaces,
        parking_type=ParkingType.UNDERGROUND,
        ev_percentage=0.15
    )
    print(f"  Type: {parking.parking_type.value}")
    print(f"  Total Spaces: {parking.total_spaces}")
    print(f"  Regular: {parking.regular_spaces}")
    print(f"  Accessible: {parking.accessible_spaces}")
    print(f"  EV Charging: {parking.ev_charging_spaces}")
    print(f"  Levels: {parking.levels}")

    # Landscaping
    print("\n5. Landscape Requirements...")
    landscape = planner.calculate_landscape_requirements()
    print(f"  Min Green Space: {landscape['minimum_green_space_sqm']} sqm")
    print(f"  Required Trees: {landscape['required_trees']}")
    print(f"  Trees to Plant: {landscape['trees_to_plant']}")

    # Utilities
    print("\n6. Utility Requirements...")
    utilities = planner.calculate_utility_requirements(15000, 500)
    print(f"  Electrical Load: {utilities['electrical']['estimated_load_kw']} kW")
    print(f"  Water Service: {utilities['water']['service_size_inch']}\" pipe")
    print(f"  Daily Water: {utilities['water']['estimated_daily_gal']} gal")

    print("\n" + "="*80)
    print("SITE PLANNING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_site_planner()
