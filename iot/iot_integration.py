#!/usr/bin/env python3
"""
IoT Integration Engine
======================
Smart building IoT sensor network design and optimization.

Features:
- Sensor network placement optimization
- MQTT/CoAP protocol support
- Real-time data processing
- Energy optimization
- Predictive maintenance integration
"""

import math
import json
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum
from datetime import datetime

from iot_sensor_network import SensorType, SensorData, SensorNetworkManager


@dataclass
class SensorPlacement:
    """Optimized sensor placement"""
    sensor_type: SensorType
    location: Tuple[float, float, float]  # (x, y, z) in meters
    optimal_coverage: float  # m²
    cost: float  # $


@dataclass
class NetworkConfig:
    """IoT network configuration"""
    protocol: str  # "MQTT" or "CoAP"
    broker_address: str
    port: int
    security: str  # "TLS", "None"
    data_rate: float  # messages/second


@dataclass
class EnergyOptimization:
    """Energy optimization result"""
    savings_percentage: float
    optimized_schedule: Dict[str, Any]
    roi_months: float
    implementation_cost: float


class IoTIntegrationEngine:
    """
    IoT Integration Engine
    Designs and optimizes smart building sensor networks
    """
    
    # Sensor coverage ranges (m²)
    SENSOR_COVERAGE = {
        SensorType.TEMPERATURE: 25.0,
        SensorType.HUMIDITY: 25.0,
        SensorType.LIGHT_LEVEL: 30.0,
        SensorType.OCCUPANCY: 50.0,
        SensorType.ENERGY_CONSUMPTION: 100.0,
        SensorType.AIR_QUALITY: 20.0,
    }
    
    # Sensor costs ($)
    SENSOR_COST = {
        SensorType.TEMPERATURE: 25,
        SensorType.HUMIDITY: 30,
        SensorType.LIGHT_LEVEL: 35,
        SensorType.OCCUPANCY: 50,
        SensorType.ENERGY_CONSUMPTION: 80,
        SensorType.AIR_QUALITY: 100,
        SensorType.PANEL_STATUS: 40,
    }
    
    def __init__(self):
        self.sensor_network = SensorNetworkManager()
        self.placements: List[SensorPlacement] = []
        self.network_configs: List[NetworkConfig] = []
    
    def optimize_sensor_placement(self,
                                 building_area: float,
                                 building_type: str,
                                 sensor_types: List[SensorType]) -> List[SensorPlacement]:
        """
        Optimize sensor placement for maximum coverage with minimum cost.
        
        Args:
            building_area: Total building area in m²
            building_type: Type of building
            sensor_types: List of sensor types to deploy
        
        Returns:
            List of optimized sensor placements
        """
        print(f"📡 IoT Engine: Optimizing sensor placement for {building_area}m² building...")
        
        placements = []
        
        for sensor_type in sensor_types:
            coverage = self.SENSOR_COVERAGE[sensor_type]
            cost = self.SENSOR_COST[sensor_type]
            
            # Calculate number of sensors needed
            # Add 20% overlap for reliability
            num_sensors = math.ceil(building_area / (coverage * 0.8))
            
            # Optimize placement using grid pattern
            grid_size = math.sqrt(num_sensors)
            grid_x = math.ceil(grid_size)
            grid_y = math.ceil(num_sensors / grid_x)
            
            # Calculate spacing
            spacing_x = building_area / (grid_x * 2) if grid_x > 0 else 0
            spacing_y = building_area / (grid_y * 2) if grid_y > 0 else 0
            
            # Generate placements
            for i in range(num_sensors):
                row = i // grid_x
                col = i % grid_x
                
                # Position sensors in grid with slight random offset for robustness
                x = (col + 0.5) * (building_area / grid_x) + (building_area / grid_x) * 0.1
                y = (row + 0.5) * (building_area / grid_y) + (building_area / grid_y) * 0.1
                z = 2.5  # Ceiling height
                
                placement = SensorPlacement(
                    sensor_type=sensor_type,
                    location=(x, y, z),
                    optimal_coverage=coverage,
                    cost=cost
                )
                
                placements.append(placement)
        
        self.placements = placements
        return placements
    
    def configure_network(self,
                         protocol: str = "MQTT",
                         broker_address: str = "localhost",
                         security: str = "TLS") -> NetworkConfig:
        """
        Configure IoT network protocol.
        
        Args:
            protocol: "MQTT" or "CoAP"
            broker_address: Broker IP/hostname
            security: Security level
        
        Returns:
            Network configuration
        """
        print(f"📡 IoT Engine: Configuring {protocol} network...")
        
        port = 1883 if protocol == "MQTT" else 5683
        
        config = NetworkConfig(
            protocol=protocol,
            broker_address=broker_address,
            port=port,
            security=security,
            data_rate=10.0  # messages per second per sensor
        )
        
        self.network_configs.append(config)
        return config
    
    def optimize_energy_consumption(self,
                                   building_area: float,
                                   occupancy_patterns: Dict[str, List[int]],
                                   current_energy_cost: float) -> EnergyOptimization:
        """
        Optimize energy consumption based on occupancy and sensor data.
        
        Args:
            building_area: Building area in m²
            occupancy_patterns: Hourly occupancy (0-23)
            current_energy_cost: Current monthly energy cost
        
        Returns:
            Energy optimization results
        """
        print(f"📡 IoT Engine: Optimizing energy consumption...")
        
        # Calculate potential savings
        # With occupancy-based control: 25-40% savings
        # With daylight harvesting: 15-25% savings
        # With predictive maintenance: 5-10% savings
        
        base_savings = 0.30  # 30% base savings
        
        # Adjust based on occupancy patterns
        peak_hours = sum(1 for hour in range(24) if occupancy_patterns.get("weekday", [0]*24)[hour] > 0)
        if peak_hours > 12:
            base_savings += 0.05  # More savings for high occupancy buildings
        
        # Adjust based on building type
        if building_area > 500:
            base_savings += 0.05  # Larger buildings have more optimization potential
        
        total_savings = base_savings
        
        # Create optimized schedule
        optimized_schedule = {
            "lighting": {
                "occupancy_based": True,
                "daylight_harvesting": True,
                "dimming_schedule": occupancy_patterns
            },
            "hvac": {
                "setback_schedule": occupancy_patterns,
                "zoned_control": True,
                "predictive_preconditioning": True
            },
            "equipment": {
                "standby_management": True,
                "scheduled_shutdown": True
            }
        }
        
        # Calculate ROI
        monthly_savings = current_energy_cost * total_savings
        implementation_cost = building_area * 15  # $15 per m²
        roi_months = implementation_cost / monthly_savings if monthly_savings > 0 else 999
        
        result = EnergyOptimization(
            savings_percentage=total_savings * 100,
            optimized_schedule=optimized_schedule,
            roi_months=roi_months,
            implementation_cost=implementation_cost
        )
        
        return result
    
    def calculate_network_cost(self) -> float:
        """Calculate total IoT network cost"""
        sensor_cost = sum(self.SENSOR_COST[p.sensor_type] for p in self.placements)
        infrastructure_cost = len(self.network_configs) * 500  # $500 per network
        installation_cost = len(self.placements) * 50  # $50 per sensor installation
        
        return sensor_cost + infrastructure_cost + installation_cost
    
    def generate_iot_report(self) -> str:
        """Generate IoT integration report"""
        report = ["IOT INTEGRATION REPORT", "=" * 50]
        
        if self.placements:
            report.append("\nSENSOR NETWORK")
            report.append(f"Total Sensors: {len(self.placements)}")
            
            # Group by type
            by_type = {}
            for placement in self.placements:
                sensor_type = placement.sensor_type.value
                by_type[sensor_type] = by_type.get(sensor_type, 0) + 1
            
            for sensor_type, count in by_type.items():
                report.append(f"  {sensor_type}: {count} units")
        
        if self.network_configs:
            report.append("\nNETWORK CONFIGURATION")
            for config in self.network_configs:
                report.append(f"  Protocol: {config.protocol}")
                report.append(f"  Broker: {config.broker_address}:{config.port}")
                report.append(f"  Security: {config.security}")
                report.append(f"  Data Rate: {config.data_rate} msg/s")
        
        report.append(f"\nCOST ANALYSIS")
        total_cost = self.calculate_network_cost()
        report.append(f"  Sensor Cost: ${sum(self.SENSOR_COST[p.sensor_type] for p in self.placements):.2f}")
        report.append(f"  Infrastructure: ${len(self.network_configs) * 500:.2f}")
        report.append(f"  Installation: ${len(self.placements) * 50:.2f}")
        report.append(f"  {'='*30}")
        report.append(f"  TOTAL: ${total_cost:.2f}")
        
        return "\n".join(report)


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_iot_integration():
    """Demonstrate IoT integration capabilities"""
    print("\n" + "="*80)
    print("IOT INTEGRATION ENGINE DEMONSTRATION")
    print("="*80)
    
    engine = IoTIntegrationEngine()
    
    # Optimize sensor placement
    print("\n1. SENSOR PLACEMENT OPTIMIZATION")
    print("-" * 50)
    
    sensor_types = [
        SensorType.TEMPERATURE,
        SensorType.HUMIDITY,
        SensorType.LIGHT_LEVEL,
        SensorType.OCCUPANCY,
        SensorType.ENERGY_CONSUMPTION,
    ]
    
    placements = engine.optimize_sensor_placement(
        building_area=192.0,  # 12m x 8m x 2 floors
        building_type="residential",
        sensor_types=sensor_types
    )
    
    print(f"✓ Optimized {len(placements)} sensor placements")
    by_type = {}
    for p in placements:
        by_type[p.sensor_type.value] = by_type.get(p.sensor_type.value, 0) + 1
    for sensor_type, count in by_type.items():
        print(f"  {sensor_type}: {count} units")
    
    # Configure network
    print("\n2. NETWORK CONFIGURATION")
    print("-" * 50)
    
    config = engine.configure_network(
        protocol="MQTT",
        broker_address="192.168.1.100",
        security="TLS"
    )
    
    print(f"✓ Network configured: {config.protocol}")
    print(f"  Broker: {config.broker_address}:{config.port}")
    print(f"  Security: {config.security}")
    
    # Optimize energy
    print("\n3. ENERGY OPTIMIZATION")
    print("-" * 50)
    
    occupancy = {
        "weekday": [0, 0, 0, 0, 0, 1, 3, 5, 4, 2, 2, 2, 2, 2, 3, 4, 5, 4, 3, 2, 1, 0, 0, 0],
        "weekend": [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0]
    }
    
    energy_opt = engine.optimize_energy_consumption(
        building_area=192.0,
        occupancy_patterns=occupancy,
        current_energy_cost=500.0  # $500/month
    )
    
    print(f"✓ Energy optimization complete")
    print(f"  Savings: {energy_opt.savings_percentage:.1f}%")
    print(f"  Implementation Cost: ${energy_opt.implementation_cost:.2f}")
    print(f"  ROI: {energy_opt.roi_months:.1f} months")
    
    # Generate report
    print("\n4. IOT REPORT")
    print("-" * 50)
    
    report = engine.generate_iot_report()
    print(report)
    
    print("\n" + "="*80)
    print("IOT INTEGRATION COMPLETE")
    print("Ready for predictive maintenance!")
    print("="*80)


if __name__ == "__main__":
    demonstrate_iot_integration()