#!/usr/bin/env python3
"""
MEP Systems Engine (Mechanical, Electrical, Plumbing)
=====================================================
Optimizes HVAC, electrical, and plumbing systems for buildings.

Features:
- HVAC load calculation and duct sizing
- Electrical circuit design and load balancing
- Plumbing pipe sizing and fixture placement
- Energy optimization
- System cost estimation
"""

import math
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum


class HVACType(Enum):
    """HVAC system types"""
    SPLIT_SYSTEM = "split_system"
    VRF = "vrf"
    CHILLED_WATER = "chilled_water"
    PACKAGE_UNIT = "package_unit"


class ElectricalPhase(Enum):
    """Electrical phases"""
    SINGLE_PHASE = "single_phase"
    THREE_PHASE = "three_phase"


class PlumbingFixture(Enum):
    """Plumbing fixture types"""
    TOILET = "toilet"
    SINK = "sink"
    SHOWER = "shower"
    BATHTUB = "bathtub"
    URINAL = "urinal"


@dataclass
class Room:
    """Room definition for MEP calculations"""
    name: str
    area: float  # m²
    volume: float  # m³
    occupancy: int
    has_window: bool


@dataclass
class HVACDesign:
    """HVAC system design"""
    system_type: HVACType
    cooling_capacity: float  # kW
    heating_capacity: float  # kW
    duct_size: Tuple[float, float]  # (width, height) in mm
    airflow: float  # L/s
    energy_efficiency: float  # COP/EER
    cost: float  # $


@dataclass
class ElectricalDesign:
    """Electrical system design"""
    phase: ElectricalPhase
    total_load: float  # kW
    main_breaker: float  # A
    circuits: List[Tuple[str, float]]  # (circuit_name, amperage)
    wire_gauge: str  # AWG
    cost: float  # $


@dataclass
class PlumbingDesign:
    """Plumbing system design"""
    fixture_count: Dict[str, int]
    pipe_sizes: Dict[str, float]  # pipe diameter in mm
    flow_rate: float  # L/min
    pump_power: float  # kW
    cost: float  # $


class MEPSystemEngine:
    """
    MEP Systems Optimization Engine
    Designs HVAC, electrical, and plumbing systems
    """
    
    # Standard values
    HVAC_EFFICIENCY = {
        "split_system": 3.5,  # COP
        "vrf": 4.2,
        "chilled_water": 5.0,
        "package_unit": 3.2,
    }
    
    # Fixture water consumption (L/min)
    FIXTURE_FLOW = {
        "toilet": 6.0,
        "sink": 4.0,
        "shower": 12.0,
        "bathtub": 15.0,
        "urinal": 3.0,
    }
    
    # Electrical load per area (W/m²)
    ELECTRICAL_LOAD_DENSITY = {
        "residential": 50,
        "office": 80,
        "commercial": 120,
        "industrial": 150,
    }
    
    def __init__(self):
        self.hvac_designs = []
        self.electrical_designs = []
        self.plumbing_designs = []
    
    def design_hvac(self,
                   rooms: List[Room],
                   system_type: HVACType = HVACType.VRF,
                   outdoor_temp: float = 35.0,  # °C
                   indoor_temp: float = 24.0) -> HVACDesign:
        """
        Design HVAC system based on room loads.
        
        Args:
            rooms: List of rooms
            system_type: HVAC system type
            outdoor_temp: Design outdoor temperature
            indoor_temp: Design indoor temperature
        
        Returns:
            HVAC system design
        """
        print(f"🔧 MEP Engine: Designing HVAC system ({system_type.value})...")
        
        # Calculate total cooling load
        total_cooling = 0.0
        total_volume = 0.0
        
        for room in rooms:
            # Simplified cooling load calculation
            # Q = U * A * ΔT + internal gains
            area_load = room.area * 150  # W/m² (simplified)
            occupancy_load = room.occupancy * 100  # W/person
            window_load = 500 if room.has_window else 0  # W
            
            room_load = (area_load + occupancy_load + window_load) / 1000  # kW
            total_cooling += room_load
            total_volume += room.volume
        
        # Add 20% safety margin
        cooling_capacity = total_cooling * 1.2
        
        # Heating capacity (typically 70% of cooling for residential)
        heating_capacity = cooling_capacity * 0.7
        
        # Airflow calculation (simplified: 1 L/s per m²)
        airflow = sum(room.area for room in rooms) * 1.0
        
        # Duct sizing (based on airflow)
        # Velocity 3-5 m/s, use 4 m/s
        duct_area = (airflow / 1000) / 4  # m² (airflow in m³/s)
        
        # Assume rectangular duct with 2:1 aspect ratio
        duct_height = math.sqrt(duct_area / 2) * 1000  # mm
        duct_width = duct_height * 2
        
        # Round to standard sizes
        duct_width = round(duct_width / 50) * 50
        duct_height = round(duct_height / 50) * 50
        
        # Energy efficiency
        efficiency = self.HVAC_EFFICIENCY[system_type.value]
        
        # Cost estimation (simplified: $500 per kW cooling)
        cost = cooling_capacity * 500 * (1 + (efficiency - 3.5) * 0.2)
        
        hvac = HVACDesign(
            system_type=system_type,
            cooling_capacity=cooling_capacity,
            heating_capacity=heating_capacity,
            duct_size=(duct_width, duct_height),
            airflow=airflow,
            energy_efficiency=efficiency,
            cost=cost
        )
        
        self.hvac_designs.append(hvac)
        return hvac
    
    def design_electrical(self,
                         rooms: List[Room],
                         building_type: str = "residential",
                         phase: ElectricalPhase = ElectricalPhase.SINGLE_PHASE) -> ElectricalDesign:
        """
        Design electrical system.
        
        Args:
            rooms: List of rooms
            building_type: Type of building
            phase: Electrical phase
        
        Returns:
            Electrical system design
        """
        print(f"🔧 MEP Engine: Designing electrical system ({phase.value})...")
        
        # Calculate total load
        total_area = sum(room.area for room in rooms)
        load_density = self.ELECTRICAL_LOAD_DENSITY.get(building_type, 50)
        
        total_load = (total_area * load_density) / 1000  # kW
        
        # Add diversity factor
        if building_type == "residential":
            diversity = 0.7
        elif building_type == "office":
            diversity = 0.8
        else:
            diversity = 0.9
        
        design_load = total_load * diversity
        
        # Main breaker sizing (A = kW / V * pf)
        # For single phase: 230V, pf=0.9
        # For three phase: 400V, pf=0.9
        
        if phase == ElectricalPhase.SINGLE_PHASE:
            voltage = 230
            power_factor = 0.9
            main_breaker = (design_load * 1000) / (voltage * power_factor)
            wire_gauge = self._select_wire_gauge(main_breaker)
        else:
            voltage = 400
            power_factor = 0.9
            main_breaker = (design_load * 1000) / (voltage * power_factor * math.sqrt(3))
            wire_gauge = self._select_wire_gauge(main_breaker * 0.5)  # Per phase
        
        # Create circuit list
        circuits = []
        circuit_count = max(1, int(len(rooms) / 2))
        
        for i in range(circuit_count):
            circuit_load = design_load / circuit_count
            circuit_amps = (circuit_load * 1000) / (voltage * power_factor)
            circuits.append((f"Circuit {i+1}", circuit_amps))
        
        # Cost estimation: $100 per kW + $50 per circuit
        cost = design_load * 100 + len(circuits) * 50
        
        electrical = ElectricalDesign(
            phase=phase,
            total_load=design_load,
            main_breaker=main_breaker,
            circuits=circuits,
            wire_gauge=wire_gauge,
            cost=cost
        )
        
        self.electrical_designs.append(electrical)
        return electrical
    
    def design_plumbing(self,
                       rooms: List[Room],
                       fixtures: Dict[str, int]) -> PlumbingDesign:
        """
        Design plumbing system.
        
        Args:
            rooms: List of rooms
            fixtures: Dictionary of fixture counts
        
        Returns:
            Plumbing system design
        """
        print(f"🔧 MEP Engine: Designing plumbing system...")
        
        # Calculate total flow rate
        total_flow = 0.0
        for fixture_type, count in fixtures.items():
            flow_per_fixture = self.FIXTURE_FLOW.get(fixture_type, 4.0)
            total_flow += flow_per_fixture * count
        
        # Add simultaneous use factor
        simultaneous_factor = 0.6 if len(rooms) > 5 else 0.8
        design_flow = total_flow * simultaneous_factor
        
        # Pipe sizing (simplified)
        # Main supply: based on flow rate
        if design_flow > 20:
            main_pipe = 32  # mm
        elif design_flow > 10:
            main_pipe = 25  # mm
        else:
            main_pipe = 20  # mm
        
        # Branch pipes
        pipe_sizes = {
            "main": main_pipe,
            "hot": max(15, main_pipe - 5),
            "cold": main_pipe,
            "drain": main_pipe + 5,
        }
        
        # Pump sizing (if needed)
        pump_power = 0.0
        if design_flow > 15:
            # Assume 20m head
            pump_power = (9.81 * 1000 * design_flow / 60 * 20) / 1000  # kW
        
        # Cost estimation
        fixture_cost = sum(count * 150 for count in fixtures.values())  # $150 per fixture
        pipe_cost = main_pipe * 5  # $5 per mm of main pipe
        pump_cost = pump_power * 2000 if pump_power > 0 else 0  # $2000 per kW
        
        cost = fixture_cost + pipe_cost + pump_cost
        
        plumbing = PlumbingDesign(
            fixture_count=fixtures,
            pipe_sizes=pipe_sizes,
            flow_rate=design_flow,
            pump_power=pump_power,
            cost=cost
        )
        
        self.plumbing_designs.append(plumbing)
        return plumbing
    
    def _select_wire_gauge(self, amperage: float) -> str:
        """Select appropriate wire gauge based on current"""
        if amperage <= 15:
            return "14 AWG"
        elif amperage <= 20:
            return "12 AWG"
        elif amperage <= 30:
            return "10 AWG"
        elif amperage <= 40:
            return "8 AWG"
        elif amperage <= 55:
            return "6 AWG"
        elif amperage <= 70:
            return "4 AWG"
        elif amperage <= 95:
            return "2 AWG"
        else:
            return "1/0 AWG"
    
    def calculate_total_cost(self) -> float:
        """Calculate total MEP cost"""
        hvac_cost = sum(design.cost for design in self.hvac_designs)
        electrical_cost = sum(design.cost for design in self.electrical_designs)
        plumbing_cost = sum(design.cost for design in self.plumbing_designs)
        return hvac_cost + electrical_cost + plumbing_cost
    
    def generate_report(self) -> str:
        """Generate MEP systems report"""
        report = ["MEP SYSTEMS REPORT", "=" * 50]
        
        if self.hvac_designs:
            report.append("\nHVAC SYSTEMS")
            for i, design in enumerate(self.hvac_designs, 1):
                report.append(f"  System {i}: {design.system_type.value}")
                report.append(f"    Cooling: {design.cooling_capacity:.2f} kW")
                report.append(f"    Heating: {design.heating_capacity:.2f} kW")
                report.append(f"    Duct: {design.duct_size[0]}×{design.duct_size[1]} mm")
                report.append(f"    Airflow: {design.airflow:.1f} L/s")
                report.append(f"    Efficiency: COP {design.energy_efficiency:.1f}")
                report.append(f"    Cost: ${design.cost:.2f}")
        
        if self.electrical_designs:
            report.append("\nELECTRICAL SYSTEMS")
            for i, design in enumerate(self.electrical_designs, 1):
                report.append(f"  System {i}: {design.phase.value}")
                report.append(f"    Total Load: {design.total_load:.2f} kW")
                report.append(f"    Main Breaker: {design.main_breaker:.1f} A")
                report.append(f"    Wire Gauge: {design.wire_gauge}")
                report.append(f"    Circuits: {len(design.circuits)}")
                report.append(f"    Cost: ${design.cost:.2f}")
        
        if self.plumbing_designs:
            report.append("\nPLUMBING SYSTEMS")
            for i, design in enumerate(self.plumbing_designs, 1):
                report.append(f"  System {i}")
                report.append(f"    Fixtures: {sum(design.fixture_count.values())}")
                report.append(f"    Flow Rate: {design.flow_rate:.1f} L/min")
                report.append(f"    Pipe Sizes: {design.pipe_sizes}")
                if design.pump_power > 0:
                    report.append(f"    Pump Power: {design.pump_power:.2f} kW")
                report.append(f"    Cost: ${design.cost:.2f}")
        
        report.append(f"\n{'='*50}")
        report.append(f"TOTAL MEP COST: ${self.calculate_total_cost():.2f}")
        
        return "\n".join(report)


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_mep_engine():
    """Demonstrate MEP systems capabilities"""
    print("\n" + "="*80)
    print("MEP SYSTEMS ENGINE DEMONSTRATION")
    print("="*80)
    
    engine = MEPSystemEngine()
    
    # Create sample rooms for a 6m x 4m house
    rooms = [
        Room(name="Living Room", area=16.0, volume=48.0, occupancy=4, has_window=True),
        Room(name="Kitchen", area=8.0, volume=24.0, occupancy=2, has_window=True),
        Room(name="Bedroom 1", area=12.0, volume=36.0, occupancy=2, has_window=True),
        Room(name="Bedroom 2", area=10.0, volume=30.0, occupancy=2, has_window=True),
        Room(name="Bathroom", area=4.0, volume=12.0, occupancy=1, has_window=False),
    ]
    
    print("\n1. HVAC SYSTEM DESIGN")
    print("-" * 50)
    
    hvac = engine.design_hvac(rooms, system_type=HVACType.VRF)
    print(f"✓ HVAC designed: {hvac.system_type.value}")
    print(f"  Cooling: {hvac.cooling_capacity:.2f} kW")
    print(f"  Heating: {hvac.heating_capacity:.2f} kW")
    print(f"  Duct: {hvac.duct_size[0]}×{hvac.duct_size[1]} mm")
    print(f"  Efficiency: COP {hvac.energy_efficiency:.1f}")
    print(f"  Cost: ${hvac.cost:.2f}")
    
    print("\n2. ELECTRICAL SYSTEM DESIGN")
    print("-" * 50)
    
    electrical = engine.design_electrical(rooms, building_type="residential")
    print(f"✓ Electrical designed: {electrical.phase.value}")
    print(f"  Total Load: {electrical.total_load:.2f} kW")
    print(f"  Main Breaker: {electrical.main_breaker:.1f} A")
    print(f"  Wire Gauge: {electrical.wire_gauge}")
    print(f"  Circuits: {len(electrical.circuits)}")
    print(f"  Cost: ${electrical.cost:.2f}")
    
    print("\n3. PLUMBING SYSTEM DESIGN")
    print("-" * 50)
    
    fixtures = {
        "toilet": 3,
        "sink": 4,
        "shower": 2,
        "bathtub": 1,
    }
    
    plumbing = engine.design_plumbing(rooms, fixtures)
    print(f"✓ Plumbing designed")
    print(f"  Fixtures: {sum(plumbing.fixture_count.values())}")
    print(f"  Flow Rate: {plumbing.flow_rate:.1f} L/min")
    print(f"  Pipe Sizes: {plumbing.pipe_sizes}")
    if plumbing.pump_power > 0:
        print(f"  Pump Power: {plumbing.pump_power:.2f} kW")
    print(f"  Cost: ${plumbing.cost:.2f}")
    
    print("\n4. MEP SYSTEMS REPORT")
    print("-" * 50)
    report = engine.generate_report()
    print(report)
    
    print("\n" + "="*80)
    print("MEP SYSTEMS COMPLETE")
    print("Ready for multi-story building integration!")
    print("="*80)


if __name__ == "__main__":
    demonstrate_mep_engine()