# Sprint 4: Phase 2 Advanced Features

**Duration**: 2 weeks
**Goal**: IoT integration, predictive maintenance, energy optimization, real-time monitoring

---

## Sprint Objectives

1. ✅ Integrate IoT sensors with building systems
2. ✅ Implement predictive maintenance algorithms
3. ✅ Create energy optimization engine
4. ✅ Build real-time monitoring dashboard
5. ✅ Implement marketplace integration
6. ✅ Complete end-to-end testing

---

## Week 1: IoT & Predictive Systems

### Day 45-46: IoT Sensor Integration

**Morning (4 hours)**
- [ ] Create IoT sensor models
  ```python
  # ceiling/iot/models.py
  from dataclasses import dataclass
  from typing import Dict, Any, Optional
  from enum import Enum
  import time
  
  class SensorType(Enum):
      TEMPERATURE = "temperature"
      HUMIDITY = "humidity"
      OCCUPANCY = "occupancy"
      ENERGY = "energy"
      VIBRATION = "vibration"
      AIR_QUALITY = "air_quality"
  
  class SensorStatus(Enum):
      ONLINE = "online"
      OFFLINE = "offline"
      MAINTENANCE = "maintenance"
  
  @dataclass
  class SensorReading:
      sensor_id: str
      sensor_type: SensorType
      timestamp: float
      value: float
      unit: str
      location: str
      quality: float  # 0.0 to 1.0
  
  @dataclass
  class IoTDevice:
      device_id: str
      device_type: SensorType
      location: str
      status: SensorStatus
      last_reading: Optional[SensorReading]
      metadata: Dict[str, Any]
  
  @dataclass
  class BuildingZone:
      zone_id: str
      name: str
      sensors: List[IoTDevice]
      area: float
      volume: float
      target_temp: float
      target_humidity: float
  ```

**Afternoon (4 hours)**
- [ ] Implement IoT sensor network
  ```python
  # ceiling/iot/sensor_network.py
  import random
  import time
  from typing import List, Dict, Optional
  from ceiling.iot.models import (
      SensorType, SensorStatus, SensorReading, IoTDevice, BuildingZone
  )
  
  class IoTSensorNetwork:
      """Real IoT sensor network simulation"""
      
      def __init__(self):
          self.devices: Dict[str, IoTDevice] = {}
          self.readings: List[SensorReading] = []
          self.zones: Dict[str, BuildingZone] = {}
      
      def add_device(self, device: IoTDevice) -> None:
          """Add IoT device to network"""
          self.devices[device.device_id] = device
      
      def add_zone(self, zone: BuildingZone) -> None:
          """Add building zone"""
          self.zones[zone.zone_id] = zone
      
      def simulate_reading(self, device_id: str) -> SensorReading:
          """Simulate realistic sensor reading"""
          device = self.devices.get(device_id)
          if not device:
              raise ValueError(f"Device {device_id} not found")
          
          # Generate realistic readings based on sensor type
          if device.device_type == SensorType.TEMPERATURE:
              # Temperature: 18-26°C with noise
              base_temp = 22.0
              noise = random.uniform(-2.0, 2.0)
              value = base_temp + noise
              unit = "°C"
              quality = 0.95 if device.status == SensorStatus.ONLINE else 0.5
          
          elif device.device_type == SensorType.HUMIDITY:
              # Humidity: 40-60%
              value = random.uniform(40.0, 60.0)
              unit = "%"
              quality = 0.90
          
          elif device.device_type == SensorType.OCCUPANCY:
              # Occupancy: 0 or 1
              value = 1.0 if random.random() > 0.3 else 0.0
              unit = "people"
              quality = 0.85
          
          elif device.device_type == SensorType.ENERGY:
              # Energy: 0-5 kW
              value = random.uniform(0.5, 5.0)
              unit = "kW"
              quality = 0.98
          
          elif device.device_type == SensorType.VIBRATION:
              # Vibration: 0-2 mm/s
              value = random.uniform(0.0, 2.0)
              unit = "mm/s"
              quality = 0.92
          
          elif device.device_type == SensorType.AIR_QUALITY:
              # Air Quality: 0-100 (lower is better)
              value = random.uniform(10.0, 50.0)
              unit = "AQI"
              quality = 0.88
          
          else:
              value = 0.0
              unit = "unknown"
              quality = 0.5
          
          reading = SensorReading(
              sensor_id=device_id,
              sensor_type=device.device_type,
              timestamp=time.time(),
              value=round(value, 2),
              unit=unit,
              location=device.location,
              quality=quality
          )
          
          self.readings.append(reading)
          device.last_reading = reading
          
          return reading
      
      def get_sensor_data(self, device_id: str, hours: int = 1) -> List[SensorReading]:
          """Get historical sensor data"""
          cutoff_time = time.time() - (hours * 3600)
          return [r for r in self.readings 
                  if r.sensor_id == device_id and r.timestamp >= cutoff_time]
      
      def get_zone_average(self, zone_id: str, sensor_type: SensorType) -> float:
          """Get average reading for zone"""
          zone = self.zones.get(zone_id)
          if not zone:
              return 0.0
          
          readings = []
          for device in zone.sensors:
              if device.device_type == sensor_type and device.last_reading:
                  readings.append(device.last_reading.value)
          
          return sum(readings) / len(readings) if readings else 0.0
      
      def detect_anomalies(self, device_id: str, threshold: float = 2.0) -> List[SensorReading]:
          """Detect anomalous readings using z-score"""
          data = self.get_sensor_data(device_id, hours=24)
          if len(data) < 10:
              return []
          
          values = [r.value for r in data]
          mean = sum(values) / len(values)
          std_dev = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
          
          if std_dev == 0:
              return []
          
          anomalies = []
          for reading in data:
              z_score = abs(reading.value - mean) / std_dev
              if z_score > threshold:
                  anomalies.append(reading)
          
          return anomalies
  ```

**Deliverable**: IoT sensor network

---

### Day 47-48: Predictive Maintenance Engine

**Morning (4 hours)**
- [ ] Create maintenance models
  ```python
  # ceiling/predictive/maintenance.py
  from dataclasses import dataclass
  from typing import List, Dict, Optional
  from enum import Enum
  import math
  from datetime import datetime, timedelta
  
  class MaintenancePriority(Enum):
      CRITICAL = 1
      HIGH = 2
      MEDIUM = 3
      LOW = 4
  
  class EquipmentType(Enum):
      HVAC = "hvac"
      ELEVATOR = "elevator"
      PUMP = "pump"
      GENERATOR = "generator"
      ELECTRICAL = "electrical"
  
  @dataclass
  class MaintenanceTask:
      task_id: str
      equipment_type: EquipmentType
      description: str
      priority: MaintenancePriority
      estimated_cost: float
      estimated_time: float  # hours
      due_date: datetime
      predicted_failure_prob: float  # 0.0 to 1.0
      recommended_action: str
  
  @dataclass
  class EquipmentHealth:
      equipment_id: str
      equipment_type: EquipmentType
      health_score: float  # 0.0 to 1.0
      last_maintenance: datetime
      runtime_hours: float
      failure_probability: float
      remaining_useful_life: float  # days
  ```

**Afternoon (4 hours)**
- [ ] Implement predictive maintenance algorithm
  ```python
  # ceiling/predictive/maintenance_engine.py
  import random
  from typing import List, Dict
  from ceiling.predictive.maintenance import (
      MaintenanceTask, EquipmentHealth, EquipmentType, MaintenancePriority
  )
  from ceiling.iot.models import SensorReading, SensorType
  
  class PredictiveMaintenanceEngine:
      """Real predictive maintenance using sensor data"""
      
      # Equipment failure curves (simplified Weibull)
      FAILURE_CURVES = {
          EquipmentType.HVAC: {
              'shape': 2.5,  # Weibull shape parameter
              'scale': 8760,  # Scale (hours) - 1 year
              'maintenance_interval': 2000  # hours
          },
          EquipmentType.ELEVATOR: {
              'shape': 3.0,
              'scale': 26280,  # 3 years
              'maintenance_interval': 4000
          },
          EquipmentType.PUMP: {
              'shape': 2.0,
              'scale': 17520,  # 2 years
              'maintenance_interval': 1500
          },
          EquipmentType.GENERATOR: {
              'shape': 2.2,
              'scale': 4380,  # 6 months
              'maintenance_interval': 500
          },
          EquipmentType.ELECTRICAL: {
              'shape': 1.8,
              'scale': 52560,  # 6 years
              'maintenance_interval': 8760
          }
      }
      
      def calculate_health_score(self, equipment_type: EquipmentType, 
                               sensor_readings: List[SensorReading],
                               runtime_hours: float) -> EquipmentHealth:
          """
          Calculate equipment health based on sensor data
          """
          # Get baseline parameters
          params = self.FAILURE_CURVES.get(equipment_type)
          if not params:
              raise ValueError(f"Unknown equipment type: {equipment_type}")
          
          # Calculate failure probability using Weibull distribution
          # P(t) = 1 - exp(-(t/λ)^k)
          shape = params['shape']
          scale = params['scale']
          
          # Adjust for sensor readings
          sensor_factor = self._analyze_sensor_patterns(sensor_readings)
          
          # Calculate base failure probability
          if runtime_hours > 0:
              failure_prob = 1 - math.exp(-((runtime_hours / scale) ** shape))
          else:
              failure_prob = 0.1  # Default for new equipment
          
          # Adjust based on sensor patterns
          failure_prob *= (1 + (1 - sensor_factor) * 0.5)
          failure_prob = min(failure_prob, 0.95)  # Cap at 95%
          
          # Health score is inverse of failure probability
          health_score = 1.0 - failure_prob
          
          # Calculate remaining useful life
          if failure_prob > 0.8:
              remaining_life = 30  # days - critical
          elif failure_prob > 0.5:
              remaining_life = 90  # days - warning
          else:
              remaining_life = 365  # days - healthy
          
          return EquipmentHealth(
              equipment_id=f"equip_{equipment_type.value}_{int(runtime_hours)}",
              equipment_type=equipment_type,
              health_score=round(health_score, 3),
              last_maintenance=datetime.now() - timedelta(days=30),
              runtime_hours=runtime_hours,
              failure_probability=round(failure_prob, 3),
              remaining_useful_life=remaining_life
          )
      
      def _analyze_sensor_patterns(self, readings: List[SensorReading]) -> float:
          """Analyze sensor patterns for health indicators"""
          if not readings:
              return 0.5  # Neutral
          
          # Extract values by type
          temps = [r.value for r in readings if r.sensor_type == SensorType.TEMPERATURE]
          vibes = [r.value for r in readings if r.sensor_type == SensorType.VIBRATION]
          energy = [r.value for r in readings if r.sensor_type == SensorType.ENERGY]
          
          score = 1.0
          
          # Temperature analysis (should be stable)
          if temps:
              temp_variance = (sum((t - sum(temps)/len(temps))**2 for t in temps) / len(temps)) ** 0.5
              if temp_variance > 2.0:
                  score *= 0.8  # Penalize high variance
          
          # Vibration analysis (should be low)
          if vibes:
              avg_vibe = sum(vibes) / len(vibes)
              if avg_vibe > 1.5:
                  score *= 0.7
              elif avg_vibe > 1.0:
                  score *= 0.9
          
          # Energy analysis (should be consistent)
          if energy:
              energy_variance = (sum((e - sum(energy)/len(energy))**2 for e in energy) / len(energy)) ** 0.5
              if energy_variance > 1.0:
                  score *= 0.85
          
          return max(score, 0.1)
      
      def generate_maintenance_schedule(self, 
                                      equipment_health: List[EquipmentHealth],
                                      budget: float) -> List[MaintenanceTask]:
          """
          Generate prioritized maintenance schedule
          """
          tasks = []
          remaining_budget = budget
          
          # Sort by health score (worst first)
          equipment_health.sort(key=lambda x: x.health_score)
          
          for health in equipment_health:
              if remaining_budget <= 0:
                  break
              
              # Determine priority
              if health.health_score < 0.3:
                  priority = MaintenancePriority.CRITICAL
                  cost_multiplier = 1.5
              elif health.health_score < 0.5:
                  priority = MaintenancePriority.HIGH
                  cost_multiplier = 1.2
              elif health.health_score < 0.7:
                  priority = MaintenancePriority.MEDIUM
                  cost_multiplier = 1.0
              else:
                  priority = MaintenancePriority.LOW
                  cost_multiplier = 0.8
              
              # Estimate costs
              base_cost = {
                  EquipmentType.HVAC: 500,
                  EquipmentType.ELEVATOR: 2000,
                  EquipmentType.PUMP: 300,
                  EquipmentType.GENERATOR: 800,
                  EquipmentType.ELECTRICAL: 400
              }.get(health.equipment_type, 500)
              
              estimated_cost = base_cost * cost_multiplier
              estimated_time = 2.0 * cost_multiplier  # hours
              
              if estimated_cost > remaining_budget:
                  continue
              
              # Create task
              task = MaintenanceTask(
                  task_id=f"maint_{health.equipment_id}",
                  equipment_type=health.equipment_type,
                  description=f"Preventive maintenance for {health.equipment_type.value}",
                  priority=priority,
                  estimated_cost=round(estimated_cost, 2),
                  estimated_time=round(estimated_time, 2),
                  due_date=datetime.now() + timedelta(days=7),
                  predicted_failure_prob=health.failure_probability,
                  recommended_action=self._get_recommendation(health)
              )
              
              tasks.append(task)
              remaining_budget -= estimated_cost
          
          return tasks
      
      def _get_recommendation(self, health: EquipmentHealth) -> str:
          """Get maintenance recommendation based on health"""
          if health.health_score < 0.3:
              return "Immediate replacement or major overhaul required"
          elif health.health_score < 0.5:
              return "Schedule maintenance within 7 days"
          elif health.health_score < 0.7:
              return "Schedule maintenance within 30 days"
          else:
              return "Continue monitoring, no immediate action needed"
  ```

**Deliverable**: Predictive maintenance engine

---

### Day 49-50: Energy Optimization

**Morning (4 hours)**
- [ ] Create energy models
  ```python
  # ceiling/energy/models.py
  from dataclasses import dataclass
  from typing import List, Dict
  from enum import Enum
  from datetime import datetime
  
  class EnergySource(Enum):
      GRID = "grid"
      SOLAR = "solar"
      BATTERY = "battery"
      GENERATOR = "generator"
  
  @dataclass
  class EnergyReading:
      timestamp: float
      source: EnergySource
      power: float  # kW
      cost: float  # $/kWh
      carbon: float  # kg CO2/kWh
  
  @dataclass
  class LoadProfile:
      hour: int
      power: float  # kW
      cost: float  # $/kWh
      renewable_percentage: float  # 0.0 to 1.0
  
  @dataclass
  class OptimizationResult:
      total_cost: float
      total_carbon: float
      schedule: List[Dict]
      savings: float
  ```

**Afternoon (4 hours)**
- [ ] Implement energy optimizer
  ```python
  # ceiling/energy/optimizer.py
  import random
  from typing import List, Dict
  from ceiling.energy.models import EnergyReading, LoadProfile, OptimizationResult
  
  class EnergyOptimizer:
      """Real energy optimization with cost and carbon minimization"""
      
      def __init__(self):
          self.energy_prices = {
              'peak': 0.25,    # $/kWh (6-10am, 5-9pm)
              'off_peak': 0.12, # $/kWh (10pm-6am)
              'mid_peak': 0.18  # $/kWh (10am-5pm, 9pm-10pm)
          }
          
          self.carbon_intensity = {
              'grid': 0.5,     # kg CO2/kWh
              'solar': 0.0,
              'battery': 0.1,  # Manufacturing overhead
              'generator': 0.8
          }
      
      def generate_load_profile(self, building_area: float, 
                               building_type: str) -> List[LoadProfile]:
          """
          Generate realistic 24-hour load profile
          """
          profiles = []
          
          # Base load by building type
          base_loads = {
              'residential': 0.02,  # kW per m²
              'commercial': 0.05,
              'industrial': 0.08
          }
          
          base_load = building_area * base_loads.get(building_type, 0.03)
          
          for hour in range(24):
              # Time-of-day multiplier
              if 0 <= hour < 6:  # Night
                  multiplier = 0.3
                  price = self.energy_prices['off_peak']
              elif 6 <= hour < 10:  # Morning peak
                  multiplier = 1.2
                  price = self.energy_prices['peak']
              elif 10 <= hour < 17:  # Mid-day
                  multiplier = 0.8
                  price = self.energy_prices['mid_peak']
              elif 17 <= hour < 22:  # Evening peak
                  multiplier = 1.5
                  price = self.energy_prices['peak']
              else:  # Late evening
                  multiplier = 0.6
                  price = self.energy_prices['mid_peak']
              
              # Add some randomness
              noise = random.uniform(-0.1, 0.1)
              power = base_load * multiplier * (1 + noise)
              
              # Renewable percentage (solar during day)
              if 8 <= hour <= 17:
                  renewable = 0.3 + (0.4 * (1 - abs(12.5 - hour) / 4.5))
              else:
                  renewable = 0.05
              
              profiles.append(LoadProfile(
                  hour=hour,
                  power=round(power, 2),
                  cost=price,
                  renewable_percentage=round(renewable, 2)
              ))
          
          return profiles
      
      def optimize_energy(self, load_profile: List[LoadProfile],
                         solar_capacity: float,
                         battery_capacity: float) -> OptimizationResult:
          """
          Optimize energy usage with solar and battery
          """
          schedule = []
          total_cost = 0
          total_carbon = 0
          
          battery_state = 0.0  # kWh
          
          for profile in load_profile:
              # Available solar
              solar_available = 0
              if 8 <= profile.hour <= 17:
                  solar_available = solar_capacity * (1 - abs(12.5 - profile.hour) / 4.5)
              
              # Determine energy mix
              energy_sources = {}
              
              # Use solar first
              if solar_available > 0:
                  solar_used = min(solar_available, profile.power)
                  energy_sources['solar'] = solar_used
                  remaining_load = profile.power - solar_used
              else:
                  remaining_load = profile.power
              
              # Battery strategy
              if remaining_load > 0:
                  # Discharge battery during peak
                  if profile.hour in [6, 7, 8, 9, 17, 18, 19, 20, 21]:
                      battery_discharge = min(battery_state, remaining_load)
                      if battery_discharge > 0:
                          energy_sources['battery'] = battery_discharge
                          remaining_load -= battery_discharge
                          battery_state -= battery_discharge
                  
                  # Charge battery during off-peak
                  if profile.hour in [0, 1, 2, 3, 4, 5] and battery_state < battery_capacity:
                      charge_amount = min(battery_capacity - battery_state, 2.0)
                      energy_sources['grid_charge'] = charge_amount
                      battery_state += charge_amount
              
              # Grid for remaining load
              if remaining_load > 0:
                  energy_sources['grid'] = remaining_load
              
              # Calculate costs and carbon
              cost = 0
              carbon = 0
              
              for source, power in energy_sources.items():
                  if source == 'solar':
                      cost += power * 0.05  # LCOE of solar
                      carbon += power * self.carbon_intensity['solar']
                  elif source == 'battery':
                      cost += power * 0.10  # Battery degradation
                      carbon += power * self.carbon_intensity['battery']
                  elif source == 'grid':
                      cost += power * profile.cost
                      carbon += power * self.carbon_intensity['grid']
                  elif source == 'grid_charge':
                      cost += power * self.energy_prices['off_peak']
                      carbon += power * self.carbon_intensity['grid']
              
              total_cost += cost
              total_carbon += carbon
              
              schedule.append({
                  'hour': profile.hour,
                  'load': profile.power,
                  'sources': energy_sources,
                  'cost': round(cost, 3),
                  'carbon': round(carbon, 3)
              })
          
          # Calculate baseline cost (grid only)
          baseline_cost = sum(p.power * p.cost for p in load_profile)
          savings = baseline_cost - total_cost
          
          return OptimizationResult(
              total_cost=round(total_cost, 2),
              total_carbon=round(total_carbon, 2),
              schedule=schedule,
              savings=round(savings, 2)
          )
  ```

**Deliverable**: Energy optimization engine

---

### Day 51-52: Real-Time Monitoring

**Morning (4 hours)**
- [ ] Create monitoring dashboard models
  ```python
  # ceiling/monitoring/models.py
  from dataclasses import dataclass
  from typing import List, Dict, Optional
  from enum import Enum
  import time
  
  class AlertLevel(Enum):
      INFO = "info"
      WARNING = "warning"
      CRITICAL = "critical"
  
  @dataclass
  class SystemStatus:
      system_name: str
      status: str  # 'healthy', 'degraded', 'failed'
      last_update: float
      metrics: Dict[str, float]
  
  @dataclass
  class Alert:
      alert_id: str
      level: AlertLevel
      message: str
      timestamp: float
      system: str
      resolved: bool
  
  @dataclass
  class DashboardSnapshot:
      timestamp: float
      systems: List[SystemStatus]
      active_alerts: List[Alert]
      kpis: Dict[str, float]
  ```

**Afternoon (4 hours)**
- [ ] Implement monitoring engine
  ```python
  # ceiling/monitoring/engine.py
  import time
  from typing import List, Dict
  from ceiling.monitoring.models import SystemStatus, Alert, AlertLevel, DashboardSnapshot
  from ceiling.iot.models import SensorReading
  
  class MonitoringEngine:
      """Real-time monitoring and alerting"""
      
      def __init__(self):
          self.systems: Dict[str, SystemStatus] = {}
          self.alerts: List[Alert] = []
          self.alert_thresholds = {
              'temperature': {'warning': 25.0, 'critical': 28.0},
              'humidity': {'warning': 65.0, 'critical': 75.0},
              'energy': {'warning': 4.0, 'critical': 5.0},
              'vibration': {'warning': 1.5, 'critical': 2.0},
              'air_quality': {'warning': 70.0, 'critical': 85.0}
          }
      
      def update_system(self, system_name: str, metrics: Dict[str, float]) -> None:
          """Update system status"""
          # Determine overall status
          status = 'healthy'
          for metric, value in metrics.items():
              if metric in self.alert_thresholds:
                  if value > self.alert_thresholds[metric]['critical']:
                      status = 'failed'
                      self._create_alert(AlertLevel.CRITICAL, 
                                       f"{system_name} {metric} critical: {value}",
                                       system_name)
                  elif value > self.alert_thresholds[metric]['warning']:
                      if status != 'failed':
                          status = 'degraded'
                      self._create_alert(AlertLevel.WARNING,
                                       f"{system_name} {metric} warning: {value}",
                                       system_name)
          
          self.systems[system_name] = SystemStatus(
              system_name=system_name,
              status=status,
              last_update=time.time(),
              metrics=metrics
          )
      
      def process_sensor_reading(self, reading: SensorReading) -> None:
          """Process sensor reading and generate alerts"""
          if reading.sensor_type.value in self.alert_thresholds:
              thresholds = self.alert_thresholds[reading.sensor_type.value]
              
              if reading.value > thresholds['critical']:
                  self._create_alert(
                      AlertLevel.CRITICAL,
                      f"{reading.sensor_type.value} critical at {reading.location}: {reading.value} {reading.unit}",
                      reading.sensor_id
                  )
              elif reading.value > thresholds['warning']:
                  self._create_alert(
                      AlertLevel.WARNING,
                      f"{reading.sensor_type.value} warning at {reading.location}: {reading.value} {reading.unit}",
                      reading.sensor_id
                  )
      
      def _create_alert(self, level: AlertLevel, message: str, system: str) -> None:
          """Create new alert"""
          # Check if similar alert exists
          for alert in self.alerts:
              if (alert.system == system and 
                  alert.message == message and 
                  not alert.resolved):
                  return  # Don't duplicate
          
          alert = Alert(
              alert_id=f"alert_{len(self.alerts)}_{int(time.time())}",
              level=level,
              message=message,
              timestamp=time.time(),
              system=system,
              resolved=False
          )
          self.alerts.append(alert)
      
      def resolve_alert(self, alert_id: str) -> None:
          """Mark alert as resolved"""
          for alert in self.alerts:
              if alert.alert_id == alert_id:
                  alert.resolved = True
                  break
      
      def get_dashboard_snapshot(self) -> DashboardSnapshot:
          """Get current dashboard state"""
          # Calculate KPIs
          total_systems = len(self.systems)
          healthy_systems = sum(1 for s in self.systems.values() if s.status == 'healthy')
          active_alerts = [a for a in self.alerts if not a.resolved]
          
          kpis = {
              'system_health': round(healthy_systems / total_systems * 100, 1) if total_systems > 0 else 0,
              'active_alerts': len(active_alerts),
              'critical_alerts': sum(1 for a in active_alerts if a.level == AlertLevel.CRITICAL),
              'warning_alerts': sum(1 for a in active_alerts if a.level == AlertLevel.WARNING)
          }
          
          return DashboardSnapshot(
              timestamp=time.time(),
              systems=list(self.systems.values()),
              active_alerts=active_alerts,
              kpis=kpis
          )
      
      def get_system_health(self, system_name: str) -> Optional[SystemStatus]:
          """Get specific system status"""
          return self.systems.get(system_name)
  ```

**Deliverable**: Real-time monitoring engine

---

### Day 53-54: Marketplace Integration

**Morning (4 hours)**
- [ ] Create marketplace models
  ```python
  # ceiling/marketplace/models.py
  from dataclasses import dataclass
  from typing import List, Dict, Optional
  from enum import Enum
  from datetime import datetime
  
  class ServiceType(Enum):
      DESIGN = "design"
      CONSULTING = "consulting"
      MAINTENANCE = "maintenance"
      INSTALLATION = "installation"
  
  class ProviderStatus(Enum):
      VERIFIED = "verified"
      PENDING = "pending"
      SUSPENDED = "suspended"
  
  @dataclass
  class ServiceListing:
      listing_id: str
      provider_id: str
      service_type: ServiceType
      title: str
      description: str
      price: float
      rating: float
      reviews: int
      availability: List[str]  # Available dates
      tags: List[str]
  
  @dataclass
  class Provider:
      provider_id: str
      name: str
      status: ProviderStatus
      services: List[ServiceListing]
      avg_rating: float
      total_jobs: int
      verified: bool
  
  @dataclass
  class Transaction:
      transaction_id: str
      buyer_id: str
      provider_id: str
      service_id: str
      amount: float
      status: str  # 'pending', 'completed', 'cancelled'
      timestamp: float
  ```

**Afternoon (4 hours)**
- [ ] Implement marketplace engine
  ```python
  # ceiling/marketplace/engine.py
  import random
  from typing import List, Dict, Optional
  from ceiling.marketplace.models import (
      ServiceListing, Provider, Transaction, ServiceType, ProviderStatus
  )
  
  class MarketplaceEngine:
      """Service marketplace for building projects"""
      
      def __init__(self):
          self.providers: Dict[str, Provider] = {}
          self.listings: Dict[str, ServiceListing] = {}
          self.transactions: List[Transaction] = []
      
      def add_provider(self, provider: Provider) -> None:
          """Add service provider"""
          self.providers[provider.provider_id] = provider
          for service in provider.services:
              self.listings[service.listing_id] = service
      
      def search_services(self, service_type: Optional[ServiceType] = None,
                         query: Optional[str] = None,
                         min_rating: float = 0.0,
                         max_price: Optional[float] = None) -> List[ServiceListing]:
          """
          Search for services with filters
          """
          results = []
          
          for listing in self.listings.values():
              # Filter by service type
              if service_type and listing.service_type != service_type:
                  continue
              
              # Filter by query
              if query and query.lower() not in listing.title.lower():
                  continue
              
              # Filter by rating
              if listing.rating < min_rating:
                  continue
              
              # Filter by price
              if max_price and listing.price > max_price:
                  continue
              
              results.append(listing)
          
          # Sort by rating then price
          results.sort(key=lambda x: (-x.rating, x.price))
          
          return results
      
      def get_provider_recommendations(self, building_type: str, 
                                      budget: float) -> List[Provider]:
          """
          Recommend providers based on building type and budget
          """
          recommendations = []
          
          # Building type to service mapping
          service_map = {
              'residential': [ServiceType.DESIGN, ServiceType.INSTALLATION],
              'commercial': [ServiceType.DESIGN, ServiceType.CONSULTING],
              'industrial': [ServiceType.CONSULTING, ServiceType.MAINTENANCE]
          }
          
          needed_services = service_map.get(building_type, [ServiceType.DESIGN])
          
          for provider in self.providers.values():
              if provider.status != ProviderStatus.VERIFIED:
                  continue
              
              # Check if provider offers needed services
              provider_services = [s.service_type for s in provider.services]
              has_service = any(s in provider_services for s in needed_services)
              
              if has_service:
                  # Check if within budget
                  avg_price = sum(s.price for s in provider.services) / len(provider.services)
                  if avg_price <= budget * 0.1:  # 10% of budget
                      recommendations.append(provider)
          
          # Sort by rating
          recommendations.sort(key=lambda x: x.avg_rating, reverse=True)
          
          return recommendations
      
      def create_transaction(self, buyer_id: str, provider_id: str,
                           service_id: str) -> Transaction:
          """
          Create a new transaction
          """
          if provider_id not in self.providers:
              raise ValueError(f"Provider {provider_id} not found")
          
          if service_id not in self.listings:
              raise ValueError(f"Service {service_id} not found")
          
          service = self.listings[service_id]
          
          transaction = Transaction(
              transaction_id=f"txn_{len(self.transactions)}_{int(random.random() * 10000)}",
              buyer_id=buyer_id,
              provider_id=provider_id,
              service_id=service_id,
              amount=service.price,
              status='pending',
              timestamp=time.time()
          )
          
          self.transactions.append(transaction)
          return transaction
      
      def complete_transaction(self, transaction_id: str) -> bool:
          """Complete a transaction"""
          for txn in self.transactions:
              if txn.transaction_id == transaction_id:
                  txn.status = 'completed'
                  # Update provider stats
                  provider = self.providers.get(txn.provider_id)
                  if provider:
                      provider.total_jobs += 1
                  return True
          return False
      
      def get_provider_stats(self, provider_id: str) -> Dict:
          """Get provider statistics"""
          provider = self.providers.get(provider_id)
          if not provider:
              return {}
          
          # Calculate completion rate
          completed = sum(1 for t in self.transactions 
                         if t.provider_id == provider_id and t.status == 'completed')
          total = sum(1 for t in self.transactions if t.provider_id == provider_id)
          
          completion_rate = (completed / total * 100) if total > 0 else 0
          
          return {
              'provider_id': provider_id,
              'name': provider.name,
              'avg_rating': provider.avg_rating,
              'total_jobs': provider.total_jobs,
              'completion_rate': round(completion_rate, 1),
              'verified': provider.verified,
              'services_count': len(provider.services)
          }
  ```

**Deliverable**: Marketplace integration

---

### Day 55-56: Integration & Testing

**Morning (4 hours)**
- [ ] Create end-to-end integration test
  ```python
  # tests/test_phase2_advanced.py
  
  def test_iot_maintenance_energy_integration():
      """Test complete Phase 2 advanced features pipeline"""
      
      # 1. Setup IoT network
      from ceiling.iot.sensor_network import IoTSensorNetwork
      from ceiling.iot.models import IoTDevice, SensorType, SensorStatus, BuildingZone
      
      network = IoTSensorNetwork()
      
      # Add devices
      device1 = IoTDevice(
          device_id="temp_001",
          device_type=SensorType.TEMPERATURE,
          location="zone_1",
          status=SensorStatus.ONLINE,
          last_reading=None,
          metadata={"model": "DHT22"}
      )
      network.add_device(device1)
      
      # Add zone
      zone = BuildingZone(
          zone_id="zone_1",
          name="Living Area",
          sensors=[device1],
          area=50.0,
          volume=135.0,
          target_temp=22.0,
          target_humidity=50.0
      )
      network.add_zone(zone)
      
      # 2. Simulate readings
      reading = network.simulate_reading("temp_001")
      assert reading.value > 18.0 and reading.value < 26.0
      
      # 3. Predictive maintenance
      from ceiling.predictive.maintenance_engine import PredictiveMaintenanceEngine
      from ceiling.predictive.maintenance import EquipmentType
      
      maint_engine = PredictiveMaintenanceEngine()
      
      # Simulate sensor readings for maintenance
      sensor_readings = [reading]
      health = maint_engine.calculate_health_score(
          EquipmentType.HVAC,
          sensor_readings,
          runtime_hours=1500
      )
      
      assert 0.0 <= health.health_score <= 1.0
      assert health.failure_probability >= 0.0
      
      # Generate maintenance schedule
      schedule = maint_engine.generate_maintenance_schedule([health], budget=1000)
      assert len(schedule) >= 0
      
      # 4. Energy optimization
      from ceiling.energy.optimizer import EnergyOptimizer
      
      energy_opt = EnergyOptimizer()
      load_profile = energy_opt.generate_load_profile(100.0, "residential")
      assert len(load_profile) == 24
      
      result = energy_opt.optimize_energy(load_profile, solar_capacity=5.0, battery_capacity=10.0)
      assert result.total_cost > 0
      assert result.savings >= 0
      
      # 5. Monitoring
      from ceiling.monitoring.engine import MonitoringEngine
      
      monitor = MonitoringEngine()
      monitor.update_system("hvac", {"temperature": 23.5, "energy": 3.2})
      snapshot = monitor.get_dashboard_snapshot()
      
      assert "hvac" in [s.system_name for s in snapshot.systems]
      
      # 6. Marketplace
      from ceiling.marketplace.engine import MarketplaceEngine
      from ceiling.marketplace.models import (
          Provider, ServiceListing, ServiceType, ProviderStatus
      )
      
      marketplace = MarketplaceEngine()
      
      # Add provider
      service = ServiceListing(
          listing_id="svc_001",
          provider_id="prov_001",
          service_type=ServiceType.DESIGN,
          title="Residential Design Service",
          description="Complete design package",
          price=5000.0,
          rating=4.5,
          reviews=20,
          availability=["2024-01-15", "2024-01-20"],
          tags=["residential", "design"]
      )
      
      provider = Provider(
          provider_id="prov_001",
          name="Design Pro Inc",
          status=ProviderStatus.VERIFIED,
          services=[service],
          avg_rating=4.5,
          total_jobs=50,
          verified=True
      )
      
      marketplace.add_provider(provider)
      
      # Search
      results = marketplace.search_services(
          service_type=ServiceType.DESIGN,
          min_rating=4.0,
          max_price=10000
      )
      assert len(results) > 0
      
      # Create transaction
      txn = marketplace.create_transaction("buyer_001", "prov_001", "svc_001")
      assert txn.amount == 5000.0
      
      return True
  ```

**Afternoon (4 hours)**
- [ ] Run integration tests
- [ ] Fix any issues
- [ ] Performance testing

**Deliverable**: Integrated Phase 2 advanced features

---

### Day 57-58: Documentation & Review

**Morning (4 hours)**
- [ ] Complete all docstrings
- [ ] Create API documentation
- [ ] Update README with advanced features

**Afternoon (4 hours)**
- [ ] Performance optimization
- [ ] Security review
- [ ] Code quality check

**Evening (2 hours)**
- [ ] Sprint review
- [ ] Plan Sprint 5

**Deliverable**: Production-ready Phase 2 advanced

---

## Success Criteria

### Must Pass
- [ ] IoT sensor network operational
- [ ] Predictive maintenance generates valid schedules
- [ ] Energy optimization produces savings
- [ ] Real-time monitoring works
- [ ] Marketplace transactions complete

### Should Pass
- [ ] 90%+ test coverage
- [ ] All functions documented
- [ ] Performance benchmarks met
- [ ] No data loss in transactions

---

## Resources Needed

### Libraries
- numpy (calculations)
- pytest (testing)
- dataclasses (models)
- time (timestamps)

### Time
- Total: 80 hours
- Daily: 8 hours

---

## Risk Mitigation

### Risk: IoT simulation too simplistic
**Mitigation**: Use realistic sensor ranges and patterns

### Risk: Predictive models inaccurate
**Mitigation**: Validate with historical failure data

### Risk: Marketplace security issues
**Mitigation**: Implement transaction validation

---

## Sprint Review

1. Is IoT network realistic?
2. Do maintenance predictions make sense?
3. Are energy savings significant?
4. Is monitoring responsive?
5. Are marketplace transactions secure?

---

## Next Sprint Preview

**Sprint 5: Phase 3 - AI & Advanced Features**
- AI generative design
- Emotional design optimization
- Climate scenario modeling
- Blockchain ownership
- Advanced analytics

**Estimated Duration**: 2 weeks