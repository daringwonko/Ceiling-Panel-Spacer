# Sprint 3: Phase 2 - Full Architectural Design

**Duration**: 2 weeks
**Goal**: Implement complete architectural design capabilities (structural, MEP, multi-story)

---

## Sprint Objectives

1. ✅ Implement structural engineering engine (beams, columns, foundations)
2. ✅ Create MEP systems design (HVAC, electrical, plumbing)
3. ✅ Build multi-story building designer
4. ✅ Add site planning and zoning
5. ✅ Implement building code compliance
6. ✅ Complete cost estimation system

---

## Week 1: Structural & MEP Systems

### Day 29-30: Structural Engineering Engine

**Morning (4 hours)**
- [ ] Research structural engineering principles
  - [ ] Beam load calculations
  - [ ] Column buckling
  - [ ] Foundation bearing capacity
  - [ ] Safety factors

- [ ] Create structural models
  ```python
  # ceiling/structural/models.py
  from dataclasses import dataclass
  from typing import List, Tuple, Optional
  from enum import Enum
  
  class LoadType(Enum):
      DEAD = "dead"  # Permanent load
      LIVE = "live"  # Temporary load
      WIND = "wind"  # Environmental load
      SEISMIC = "seismic"  # Seismic load
  
  @dataclass
  class Load:
      load_type: LoadType
      magnitude: float  # kN
      location: Tuple[float, float, float]  # x, y, z
      distribution: str  # 'point', 'distributed'
  
  @dataclass
  class BeamDesign:
      width: float  # mm
      depth: float  # mm
      length: float  # m
      material: str
      safety_factor: float
      cost_per_m: float
  
  @dataclass
  class ColumnDesign:
      diameter: float  # mm
      height: float  # m
      material: str
      safety_factor: float
      cost_per_m: float
  
  @dataclass
  class FoundationDesign:
      type: str  # 'strip', 'raft', 'pile'
      width: float  # m
      depth: float  # m
      area: float  # m²
      cost_per_m2: float
  ```

**Afternoon (4 hours)**
- [ ] Implement beam design algorithm
  ```python
  # ceiling/structural/beam_design.py
  import math
  
  class BeamDesigner:
      """Real beam design with structural calculations"""
      
      MATERIAL_PROPERTIES = {
          'concrete_25': {
              'fck': 25,  # MPa
              'fy': 500,  # MPa
              'density': 2400,  # kg/m³
              'cost_per_m3': 150  # $
          },
          'steel': {
              'fck': 355,  # MPa
              'fy': 460,  # MPa
              'density': 7850,
              'cost_per_m3': 800
          }
      }
      
      def design_beam(self, span: float, loads: List[Load], 
                     material_name: str) -> BeamDesign:
          """
          Design beam based on span and loads
          Uses bending moment and shear force calculations
          """
          # Calculate total load
          total_load = sum(l.magnitude for l in loads)
          
          # Calculate maximum bending moment (simply supported)
          max_moment = (total_load * span) / 8  # kNm
          
          # Calculate required section modulus
          material = self.MATERIAL_PROPERTIES[material_name]
          fck = material['fck']
          
          # Using M_u = 0.36 * fck * x * (d - 0.42x)
          # Simplified: Z_req = M / (0.87 * fy)
          required_section_modulus = max_moment * 1000 / (0.87 * material['fy'])  # mm³
          
          # Assume width = depth / 2 for rectangular section
          # Z = b*d²/6, with b = d/2 => Z = d³/12
          required_depth = (12 * required_section_modulus) ** (1/3)
          required_width = required_depth / 2
          
          # Apply safety factor
          safety_factor = 1.5
          design_width = required_width * safety_factor
          design_depth = required_depth * safety_factor
          
          # Check deflection (simplified)
          deflection_limit = span * 1000 / 300  # mm
          actual_deflection = (5 * total_load * (span * 1000)**4) / \
                             (384 * material['fck'] * design_width * design_depth**3)
          
          if actual_deflection > deflection_limit:
              design_depth *= 1.2  # Increase depth
          
          # Calculate cost
          volume = (design_width / 1000) * (design_depth / 1000) * span  # m³
          cost = volume * material['cost_per_m3']
          
          return BeamDesign(
              width=round(design_width, 0),
              depth=round(design_depth, 0),
              length=span,
              material=material_name,
              safety_factor=safety_factor,
              cost_per_m=cost / span
          )
  ```

**Evening (2 hours)**
- [ ] Implement column design
  ```python
  # ceiling/structural/column_design.py
  
  class ColumnDesigner:
      """Real column design with buckling analysis"""
      
      def design_column(self, height: float, axial_load: float, 
                       material_name: str) -> ColumnDesign:
          """
          Design column with buckling check
          """
          material = BeamDesigner.MATERIAL_PROPERTIES[material_name]
          
          # Calculate required area
          required_area = axial_load * 1000 / (0.4 * material['fck'])  # mm²
          
          # Assume circular column
          required_diameter = math.sqrt(4 * required_area / math.pi)
          
          # Check slenderness ratio
          slenderness = height * 1000 / (required_diameter / 2)
          
          if slenderness > 50:
              # Increase diameter for buckling
              required_diameter *= 1.5
          
          # Apply safety factor
          safety_factor = 2.0
          design_diameter = required_diameter * safety_factor
          
          # Calculate cost
          volume = math.pi * (design_diameter/2000)**2 * height  # m³
          cost = volume * material['cost_per_m3']
          
          return ColumnDesign(
              diameter=round(design_diameter, 0),
              height=height,
              material=material_name,
              safety_factor=safety_factor,
              cost_per_m=cost / height
          )
  ```

**Deliverable**: Working structural engineering engine

---

### Day 31-32: MEP Systems Design

**Morning (4 hours)**
- [ ] Create MEP models
  ```python
  # ceiling/mep/models.py
  from dataclasses import dataclass
  from typing import List, Tuple
  from enum import Enum
  
  class HVACType(Enum):
      SPLIT = "split"
      VRF = "vrf"
      CENTRAL = "central"
  
  class ElectricalPhase(Enum):
      SINGLE = "single"
      THREE = "three"
  
  @dataclass
  class Room:
      name: str
      area: float  # m²
      volume: float  # m³
      occupancy: int
      has_window: bool
  
  @dataclass
  class HVACDesign:
      system_type: HVACType
      cooling_capacity: float  # kW
      heating_capacity: float  # kW
      duct_size: Tuple[float, float]  # width, height (mm)
      energy_efficiency: float  # COP
      cost: float
  
  @dataclass
  class ElectricalDesign:
      total_load: float  # kW
      main_breaker: float  # A
      circuits: List[Tuple[str, float]]  # (circuit_name, amperage)
      cost: float
  
  @dataclass
  class PlumbingDesign:
      flow_rate: float  # L/min
      pipe_diameter: float  # mm
      fixture_count: dict
      cost: float
  ```

**Afternoon (4 hours)**
- [ ] Implement HVAC design
  ```python
  # ceiling/mep/hvac_design.py
  
  class HVACDesigner:
      """Real HVAC design with load calculations"""
      
      def design_hvac(self, rooms: List[Room], system_type: HVACType) -> HVACDesign:
          """
          Calculate cooling/heating loads and design HVAC system
          """
          total_area = sum(r.area for r in rooms)
          total_volume = sum(r.volume for r in rooms)
          total_occupancy = sum(r.occupancy for r in rooms)
          
          # Cooling load calculation (simplified)
          # Base load: 100 W/m²
          # Occupancy: 100 W/person
          # Window gain: 200 W/window
          
          base_load = total_area * 100  # W
          occupancy_load = total_occupancy * 100  # W
          window_load = sum(1 for r in rooms if r.has_window) * 200  # W
          
          total_cooling_w = base_load + occupancy_load + window_load
          total_cooling_kw = total_cooling_w / 1000
          
          # Add safety factor
          design_cooling = total_cooling_kw * 1.2
          
          # Heating load (simplified: 50 W/m³)
          design_heating = total_volume * 50 / 1000  # kW
          
          # Duct sizing (simplified: 150 L/s per 10 kW)
          airflow = design_cooling * 15  # L/s
          duct_width = airflow * 2  # mm (simplified)
          duct_height = duct_width * 0.6
          
          # Energy efficiency based on system type
          efficiency_map = {
              HVACType.SPLIT: 3.2,
              HVACType.VRF: 4.0,
              HVACType.CENTRAL: 3.5
          }
          
          # Cost calculation
          cost_per_kw = 500  # $/kW
          total_cost = design_cooling * cost_per_kw
          
          return HVACDesign(
              system_type=system_type,
              cooling_capacity=round(design_cooling, 1),
              heating_capacity=round(design_heating, 1),
              duct_size=(round(duct_width, 0), round(duct_height, 0)),
              energy_efficiency=efficiency_map[system_type],
              cost=round(total_cost, 2)
          )
  ```

**Evening (4 hours)**
- [ ] Implement electrical design
  ```python
  # ceiling/mep/electrical_design.py
  
  class ElectricalDesigner:
      """Real electrical design with load calculations"""
      
      def design_electrical(self, rooms: List[Room], building_type: str) -> ElectricalDesign:
          """
          Calculate electrical loads and design distribution
          """
          # Load calculations by room type
          load_factors = {
              'living': 1000,  # W per room
              'bedroom': 500,
              'kitchen': 2000,
              'bathroom': 1000,
              'commercial': 50  # W per m²
          }
          
          total_load_w = 0
          circuits = []
          
          if building_type == "residential":
              # Calculate by room
              for room in rooms:
                  room_type = room.name.lower()
                  load = room.area * 50  # Base W/m²
                  
                  if 'kitchen' in room_type:
                      load += 1500
                  if 'bathroom' in room_type:
                      load += 1000
                  if 'living' in room_type:
                      load += 500
                  
                  total_load_w += load
                  
                  # Create circuits (10A per circuit)
                  circuits.append((f"{room.name}_circuit", 10))
          
          else:  # Commercial
              total_load_w = total_area * load_factors['commercial']
              # Create zone circuits
              circuits.append(("Zone_1", 16))
              circuits.append(("Zone_2", 16))
              circuits.append(("Lighting", 10))
          
          # Convert to kW and apply diversity factor
          total_load_kw = (total_load_w / 1000) * 0.8  # 80% diversity
          
          # Main breaker sizing (A = kW / V / pf)
          # Assuming 230V, 0.95 pf
          main_amps = (total_load_kw * 1000) / (230 * 0.95)
          main_breaker = math.ceil(main_amps / 10) * 10  # Round up to nearest 10A
          
          # Cost: $100 per circuit + $50 per kW
          cost = len(circuits) * 100 + total_load_kw * 50
          
          return ElectricalDesign(
              total_load=round(total_load_kw, 2),
              main_breaker=main_breaker,
              circuits=circuits,
              cost=round(cost, 2)
          )
  ```

**Deliverable**: MEP systems design engine

---

### Day 33-34: Plumbing & Integration

**Morning (4 hours)**
- [ ] Implement plumbing design
  ```python
  # ceiling/mep/plumbing_design.py
  
  class PlumbingDesigner:
      """Real plumbing design with fixture units"""
      
      def design_plumbing(self, rooms: List[Room], fixtures: dict) -> PlumbingDesign:
          """
          Design plumbing based on fixture count and usage
          """
          # Fixture unit values (simplified)
          fixture_units = {
              'toilet': 3,
              'sink': 1,
              'shower': 2,
              'bathtub': 2
          }
          
          # Calculate total fixture units
          total_units = sum(
              count * fixture_units.get(fix, 1) 
              for fix, count in fixtures.items()
          )
          
          # Flow rate calculation (L/min)
          # Based on Hunter's curve (simplified)
          if total_units < 10:
              flow_rate = 20
          elif total_units < 20:
              flow_rate = 35
          else:
              flow_rate = 50
          
          # Pipe sizing (simplified)
          pipe_diameter = 25  # mm (1 inch)
          if total_units > 15:
              pipe_diameter = 32  # mm (1.25 inch)
          if total_units > 30:
              pipe_diameter = 40  # mm (1.5 inch)
          
          # Cost: $50 per fixture + $20 per meter of pipe
          fixture_cost = sum(fixtures.values()) * 50
          pipe_cost = len(rooms) * 5 * 20  # Assume 5m per room
          total_cost = fixture_cost + pipe_cost
          
          return PlumbingDesign(
              flow_rate=flow_rate,
              pipe_diameter=pipe_diameter,
              fixture_count=fixtures,
              cost=total_cost
          )
  ```

**Afternoon (4 hours)**
- [ ] Create MEP integration engine
  ```python
  # ceiling/mep/integration.py
  
  class MEPSystemEngine:
      """Complete MEP system design and integration"""
      
      def __init__(self):
          self.hvac_designer = HVACDesigner()
          self.electrical_designer = ElectricalDesigner()
          self.plumbing_designer = PlumbingDesigner()
          self.total_cost = 0
      
      def design_hvac(self, rooms: List[Room], system_type: HVACType) -> HVACDesign:
          design = self.hvac_designer.design_hvac(rooms, system_type)
          self.total_cost += design.cost
          return design
      
      def design_electrical(self, rooms: List[Room], building_type: str) -> ElectricalDesign:
          design = self.electrical_designer.design_electrical(rooms, building_type)
          self.total_cost += design.cost
          return design
      
      def design_plumbing(self, rooms: List[Room], fixtures: dict) -> PlumbingDesign:
          design = self.plumbing_designer.design_plumbing(rooms, fixtures)
          self.total_cost += design.cost
          return design
      
      def calculate_total_cost(self) -> float:
          return self.total_cost
      
      def generate_report(self) -> str:
          """Generate comprehensive MEP report"""
          report = []
          report.append("=" * 60)
          report.append("MEP SYSTEMS REPORT")
          report.append("=" * 60)
          report.append(f"Total MEP Cost: ${self.total_cost:,.2f}")
          report.append("")
          return "\n".join(report)
  ```

**Evening (2 hours)**
- [ ] Write MEP tests
- [ ] Verify calculations

**Deliverable**: Complete MEP integration

---

### Day 35: Multi-Story Building Designer

**Full Day (8 hours)**

**Morning: Building Models (4 hours)**
```python
# ceiling/building/models.py
from dataclasses import dataclass
from typing import List, Dict, Any
from ceiling.mep.models import Room, HVACDesign, ElectricalDesign, PlumbingDesign
from ceiling.structural.models import BeamDesign, ColumnDesign, FoundationDesign

@dataclass
class Floor:
    number: int
    rooms: List[Room]
    ceiling_height: float
    structural_elements: List[Any]
    mep_systems: Dict[str, Any]
    area: float

@dataclass
class Building:
    name: str
    floors: List[Floor]
    total_area: float
    total_height: float
    structural_elements: List[Any]
    mep_systems: Dict[str, Any]
    vertical_circulation: List[Dict]  # Stairs, elevators
    total_cost: float
```

**Afternoon: Building Designer (4 hours)**
```python
# ceiling/building/designer.py

class BuildingDesigner:
    """Design complete multi-story buildings"""
    
    def __init__(self):
        self.structural_engine = StructuralEngine()
        self.mep_engine = MEPSystemEngine()
    
    def design_building(self, building_type: str, dimensions: Tuple[float, float],
                       num_floors: int, program: Dict[str, int]) -> Building:
        """
        Design complete building from program
        """
        width, length = dimensions
        floor_area = width * length
        
        floors = []
        structural_elements = []
        mep_systems = {}
        vertical_circulation = []
        total_cost = 0
        
        # Design each floor
        for floor_num in range(num_floors):
            # Create rooms from program
            rooms = self._create_rooms(program, floor_area)
            
            # Design structure
            loads = self._calculate_floor_loads(floor_area, floor_num)
            beams = self.structural_engine.design_beams(width, length, loads)
            columns = self.structural_engine.design_columns(height=3.0, loads=loads)
            
            # Design MEP
            hvac = self.mep_engine.design_hvac(rooms, HVACType.VRF)
            electrical = self.mep_engine.design_electrical(rooms, building_type)
            plumbing = self.mep_engine.design_plumbing(rooms, program)
            
            # Create floor
            floor = Floor(
                number=floor_num + 1,
                rooms=rooms,
                ceiling_height=2.7,
                structural_elements=beams + columns,
                mep_systems={
                    'hvac': hvac,
                    'electrical': electrical,
                    'plumbing': plumbing
                },
                area=floor_area
            )
            
            floors.append(floor)
            structural_elements.extend(beams + columns)
            total_cost += hvac.cost + electrical.cost + plumbing.cost
        
        # Design foundation
        total_load = self._calculate_total_load(floors)
        foundation = self.structural_engine.design_foundation(
            total_load=total_load,
            soil_capacity=150
        )
        structural_elements.append(foundation)
        total_cost += foundation.cost_per_m2 * foundation.area
        
        # Design vertical circulation
        if num_floors > 1:
            vertical_circulation = [
                {"type": "stair", "width": 1.2, "cost": 5000},
                {"type": "elevator", "capacity": 6, "cost": 25000}
            ]
            total_cost += 30000
        
        # Calculate totals
        total_area = floor_area * num_floors
        total_height = num_floors * 3.0 + 1.0  # Include roof
        
        return Building(
            name=f"{building_type}_building",
            floors=floors,
            total_area=total_area,
            total_height=total_height,
            structural_elements=structural_elements,
            mep_systems=mep_systems,
            vertical_circulation=vertical_circulation,
            total_cost=total_cost
        )
    
    def _create_rooms(self, program: Dict[str, int], floor_area: float) -> List[Room]:
        """Create room objects from program"""
        rooms = []
        area_per_room = floor_area / sum(program.values())
        
        for room_type, count in program.items():
            for i in range(count):
                rooms.append(Room(
                    name=f"{room_type}_{i+1}",
                    area=area_per_room,
                    volume=area_per_room * 2.7,
                    occupancy=2 if room_type in ['bedroom', 'living'] else 1,
                    has_window=True
                ))
        
        return rooms
    
    def _calculate_floor_loads(self, floor_area: float, floor_num: int) -> List[Load]:
        """Calculate structural loads for floor"""
        dead_load = floor_area * 3.0  # 3 kN/m²
        live_load = floor_area * 2.0  # 2 kN/m²
        
        return [
            Load(LoadType.DEAD, dead_load, (0, 0, 0), 'distributed'),
            Load(LoadType.LIVE, live_load, (0, 0, 0), 'distributed')
        ]
    
    def _calculate_total_load(self, floors: List[Floor]) -> float:
        """Calculate total building load for foundation"""
        total = 0
        for floor in floors:
            for element in floor.structural_elements:
                if hasattr(element, 'cost_per_m'):  # Beam/Column
                    total += element.length * 10  # Approximate load
        return total
```

**Deliverable**: Multi-story building designer

---

## Week 2: Site Planning & Compliance

### Day 36-37: Site Planning & Zoning

**Morning (4 hours)**
- [ ] Create site planning models
  ```python
  # ceiling/site/models.py
  from dataclasses import dataclass
  from typing import Dict, Tuple, Optional
  
  @dataclass
  class SitePlan:
      setbacks: Dict[str, float]  # front, rear, side
      zoning_compliance: bool
      topography_score: float
      sun_exposure: float
      total_site_area: float
      buildable_area: float
  
  @dataclass
  class ZoningRequirement:
      jurisdiction: str
      min_setback_front: float
      min_setback_rear: float
      min_setback_side: float
      max_height: float
      max_coverage: float
      allowed_uses: List[str]
  ```

**Afternoon (4 hours)**
- [ ] Implement site planner
  ```python
  # ceiling/site/planner.py
  
  class SitePlanner:
      """Real site planning with zoning analysis"""
      
      ZONING_DATABASE = {
          'residential_R1': ZoningRequirement(
              jurisdiction='residential_R1',
              min_setback_front=6.0,
              min_setback_rear=7.5,
              min_setback_side=3.0,
              max_height=12.0,
              max_coverage=0.4,
              allowed_uses=['single_family', 'duplex']
          ),
          'commercial_C1': ZoningRequirement(
              jurisdiction='commercial_C1',
              min_setback_front=3.0,
              min_setback_rear=4.5,
              min_setback_side=2.0,
              max_height=24.0,
              max_coverage=0.6,
              allowed_uses=['office', 'retail', 'restaurant']
          )
      }
      
      def plan_site(self, building_dims: Tuple[float, float], 
                   site_dims: Tuple[float, float],
                   zoning_type: str) -> SitePlan:
          """
          Analyze site and calculate buildable area
          """
          site_width, site_length = site_dims
          building_width, building_length = building_dims
          
          # Get zoning requirements
          zoning = self.ZONING_DATABASE.get(zoning_type)
          if not zoning:
              raise ValueError(f"Unknown zoning type: {zoning_type}")
          
          # Calculate setbacks
          setbacks = {
              'front': zoning.min_setback_front,
              'rear': zoning.min_setback_rear,
              'side': zoning.min_setback_side
          }
          
          # Calculate buildable area
          buildable_width = site_width - (2 * setbacks['side'])
          buildable_length = site_length - setbacks['front'] - setbacks['rear']
          
          buildable_area = buildable_width * buildable_length
          building_area = building_width * building_length
          
          # Check compliance
          zoning_compliance = True
          violations = []
          
          if building_width > buildable_width:
              zoning_compliance = False
              violations.append("Building width exceeds buildable width")
          
          if building_length > buildable_length:
              zoning_compliance = False
              violations.append("Building length exceeds buildable length")
          
          coverage_ratio = building_area / (site_width * site_length)
          if coverage_ratio > zoning.max_coverage:
              zoning_compliance = False
              violations.append(f"Coverage ratio {coverage_ratio:.2f} exceeds limit {zoning.max_coverage}")
          
          # Calculate topography score (simplified)
          # Assume flat site = 1.0, sloped = 0.7
          topography_score = 1.0
          
          # Calculate sun exposure (simplified)
          # South facing = 1.0, North = 0.8
          sun_exposure = 1.0
          
          return SitePlan(
              setbacks=setbacks,
              zoning_compliance=zoning_compliance,
              topography_score=topography_score,
              sun_exposure=sun_exposure,
              total_site_area=site_width * site_length,
              buildable_area=buildable_area
          )
  ```

**Deliverable**: Site planning engine

---

### Day 38-39: Building Code Compliance

**Morning (4 hours)**
- [ ] Create compliance checker
  ```python
  # ceiling/compliance/checker.py
  from typing import List, Dict, Any
  from dataclasses import dataclass
  
  @dataclass
  class ComplianceReport:
      jurisdiction: str
      violations: List[str]
      warnings: List[str]
      passed: bool
  
  class CodeComplianceChecker:
      """Building code compliance verification"""
      
      CODES = {
          'IBC_2021': {
              'min_corridor_width': 1.2,
              'max_stair_rise': 0.19,
              'min_stair_tread': 0.28,
              'min_ceiling_height': 2.3,
              'max_travel_distance': 60,
              'fire_rating': 1.0
          },
          'residential': {
              'min_room_area': 6.0,
              'min_bathroom_area': 3.0,
              'min_kitchen_area': 5.0,
              'min_ceiling_height': 2.3,
              'natural_light_ratio': 0.08
          }
      }
      
      def check_compliance(self, building: Any, jurisdiction: str) -> ComplianceReport:
          """
          Check building against code requirements
          """
          violations = []
          warnings = []
          
          code = self.CODES.get(jurisdiction, self.CODES['IBC_2021'])
          
          # Check floor heights
          for floor in building.floors:
              if floor.ceiling_height < code['min_ceiling_height']:
                  violations.append(
                      f"Floor {floor.number}: Ceiling height {floor.ceiling_height}m "
                      f"below minimum {code['min_ceiling_height']}m"
                  )
              
              # Check room areas
              for room in floor.rooms:
                  if room.area < 6.0 and 'bathroom' not in room.name.lower():
                      warnings.append(
                          f"Room {room.name} area {room.area}m² is small"
                      )
          
          # Check vertical circulation
          if building.vertical_circulation:
              for circ in building.vertical_circulation:
                  if circ['type'] == 'stair':
                      if circ['width'] < 1.0:
                          violations.append(f"Stair width {circ['width']}m below minimum 1.0m")
          
          # Check overall building
          if building.total_height > 12.0 and jurisdiction == 'residential':
              warnings.append("Building height exceeds typical residential limits")
          
          passed = len(violations) == 0
          
          return ComplianceReport(
              jurisdiction=jurisdiction,
              violations=violations,
              warnings=warnings,
              passed=passed
          )
  ```

**Afternoon (4 hours)**
- [ ] Integrate with building designer
  ```python
  # ceiling/building/designer.py (add method)
  
  def check_code_compliance(self, building: Building) -> Dict[str, Any]:
      """Check building compliance"""
      checker = CodeComplianceChecker()
      report = checker.check_compliance(building, 'IBC_2021')
      
      return {
          'overall': report.passed,
          'violations': report.violations,
          'warnings': report.warnings,
          'jurisdiction': report.jurisdiction
      }
  ```

**Deliverable**: Code compliance system

---

### Day 40-41: Cost Estimation & Reporting

**Morning (4 hours)**
- [ ] Create comprehensive cost calculator
  ```python
  # ceiling/costing/calculator.py
  from typing import Dict, Any
  from dataclasses import dataclass
  
  @dataclass
  class CostBreakdown:
      structural: float
      mep: float
      finishes: float
      site_work: float
      overhead: float
      total: float
  
  class CostEstimator:
      """Real cost estimation with detailed breakdown"""
      
      UNIT_COSTS = {
          'structural': {
              'concrete_beam': 150,  # $ per linear meter
              'steel_beam': 300,
              'concrete_column': 200,  # $ per meter
              'foundation_strip': 500,  # $ per meter
              'foundation_raft': 300   # $ per m²
          },
          'mep': {
              'hvac_per_kw': 500,
              'electrical_per_kw': 200,
              'plumbing_per_fixture': 150
          },
          'finishes': {
              'flooring_per_m2': 50,
              'wall_finish_per_m2': 30,
              'ceiling_per_m2': 40
          },
          'site_work': {
              'excavation_per_m3': 20,
              'backfill_per_m3': 10,
              'grading_per_m2': 5
          }
      }
      
      def calculate_breakdown(self, building: Any) -> CostBreakdown:
          """Calculate detailed cost breakdown"""
          
          # Structural costs
          structural_cost = 0
          for element in building.structural_elements:
              if hasattr(element, 'cost_per_m'):
                  structural_cost += element.cost_per_m * element.length
              elif hasattr(element, 'cost_per_m2'):
                  structural_cost += element.cost_per_m2 * element.area
          
          # MEP costs
          mep_cost = 0
          for floor in building.floors:
              for system in floor.mep_systems.values():
                  mep_cost += system.cost
          
          # Finishes (simplified: $120/m²)
          finishes_cost = building.total_area * 120
          
          # Site work (simplified: 5% of building cost)
          site_work_cost = (structural_cost + mep_cost) * 0.05
          
          # Overhead and profit (20%)
          subtotal = structural_cost + mep_cost + finishes_cost + site_work_cost
          overhead = subtotal * 0.20
          
          total = subtotal + overhead
          
          return CostBreakdown(
              structural=round(structural_cost, 2),
              mep=round(mep_cost, 2),
              finishes=round(finishes_cost, 2),
              site_work=round(site_work_cost, 2),
              overhead=round(overhead, 2),
              total=round(total, 2)
          )
  ```

**Afternoon (4 hours)**
- [ ] Create comprehensive report generator
  ```python
  # ceiling/reports/generator.py
  
  class BuildingReportGenerator:
      """Generate comprehensive building design reports"""
      
      def generate_building_report(self, building: Any) -> str:
          """Generate full building report"""
          lines = []
          lines.append("=" * 80)
          lines.append("FULL BUILDING DESIGN REPORT")
          lines.append("=" * 80)
          lines.append("")
          
          # Building summary
          lines.append("BUILDING SUMMARY")
          lines.append("-" * 40)
          lines.append(f"Name: {building.name}")
          lines.append(f"Type: {building.floors[0].rooms[0].name.split('_')[0] if building.floors else 'Unknown'}")
          lines.append(f"Total Floors: {len(building.floors)}")
          lines.append(f"Total Area: {building.total_area:.1f} m²")
          lines.append(f"Total Height: {building.total_height:.1f} m")
          lines.append("")
          
          # Floor details
          lines.append("FLOOR DETAILS")
          lines.append("-" * 40)
          for floor in building.floors:
              lines.append(f"Floor {floor.number}:")
              lines.append(f"  Area: {floor.area:.1f} m²")
              lines.append(f"  Rooms: {len(floor.rooms)}")
              lines.append(f"  Structural Elements: {len(floor.structural_elements)}")
              lines.append(f"  MEP Systems: {len(floor.mep_systems)}")
          lines.append("")
          
          # Structural elements
          lines.append("STRUCTURAL ELEMENTS")
          lines.append("-" * 40)
          for i, element in enumerate(building.structural_elements[:5], 1):
              lines.append(f"{i}. {type(element).__name__}")
          lines.append("")
          
          # Vertical circulation
          if building.vertical_circulation:
              lines.append("VERTICAL CIRCULATION")
              lines.append("-" * 40)
              for circ in building.vertical_circulation:
                  lines.append(f"{circ['type'].title()}: ${circ['cost']:,.0f}")
          lines.append("")
          
          # Cost breakdown
          lines.append("COST BREAKDOWN")
          lines.append("-" * 40)
          lines.append(f"Total Cost: ${building.total_cost:,.2f}")
          lines.append("")
          
          lines.append("=" * 80)
          return "\n".join(lines)
  ```

**Evening (2 hours)**
- [ ] Write integration tests
- [ ] Verify all calculations

**Deliverable**: Complete cost estimation and reporting

---

### Day 42: Integration & Testing

**Full Day (8 hours)**

**Morning: Integration (4 hours)**
- [ ] Create full integration test
  ```python
  # tests/test_phase2_integration.py
  
  def test_complete_building_design():
      """Test complete Phase 2 pipeline"""
      
      # 1. Design building
      designer = BuildingDesigner()
      building = designer.design_building(
          building_type='residential',
          dimensions=(12.0, 8.0),
          num_floors=2,
          program={'bedroom': 4, 'bathroom': 2, 'kitchen': 1, 'living': 1}
      )
      
      assert building.total_area > 0
      assert len(building.floors) == 2
      assert building.total_cost > 0
      
      # 2. Check compliance
      compliance = designer.check_code_compliance(building)
      assert 'overall' in compliance
      
      # 3. Generate report
      generator = BuildingReportGenerator()
      report = generator.generate_building_report(building)
      assert "BUILDING DESIGN REPORT" in report
      assert "TOTAL COST" in report
      
      return True
  ```

**Afternoon: Testing (4 hours)**
- [ ] Run all Phase 2 tests
- [ ] Measure coverage
- [ ] Fix any issues

**Deliverable**: Integrated Phase 2 system

---

### Day 43-44: Documentation & Review

**Morning (4 hours)**
- [ ] Complete all docstrings
- [ ] Create API documentation
- [ ] Update README

**Afternoon (4 hours)**
- [ ] Performance testing
- [ ] Security review
- [ ] Code quality check

**Evening (2 hours)**
- [ ] Sprint review
- [ ] Plan Sprint 4

**Deliverable**: Production-ready Phase 2

---

## Success Criteria

### Must Pass
- [ ] All structural calculations verified
- [ ] MEP systems properly integrated
- [ ] Multi-story design works
- [ ] Code compliance checking functional
- [ ] Cost estimation accurate

### Should Pass
- [ ] 90%+ test coverage
- [ ] All functions documented
- [ ] Performance benchmarks met
- [ ] No hardcoded values

---

## Resources Needed

### Libraries
- numpy (for calculations)
- pytest (for testing)
- dataclasses (for models)

### Time
- Total: 80 hours
- Daily: 8 hours

---

## Risk Mitigation

### Risk: Structural calculations too complex
**Mitigation**: Use simplified formulas, validate with known examples

### Risk: MEP integration fails
**Mitigation**: Test each system independently first

### Risk: Code compliance too restrictive
**Mitigation**: Start with basic checks, add complexity gradually

---

## Sprint Review

1. Are structural calculations accurate?
2. Do MEP systems integrate properly?
3. Can multi-story buildings be designed?
4. Is code compliance working?
5. Are cost estimates realistic?

---

## Next Sprint Preview

**Sprint 4: Phase 2 Advanced Features**
- IoT integration with building systems
- Predictive maintenance
- Energy optimization
- Real-time monitoring
- Marketplace integration

**Estimated Duration**: 2 weeks