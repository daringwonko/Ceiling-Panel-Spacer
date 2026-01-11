#!/usr/bin/env python3
"""
Energy Optimization Engine for Smart Buildings
Analyzes energy consumption patterns and provides optimization recommendations.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json
from pathlib import Path

from iot_sensor_network import SensorData, SensorType, SensorNetworkManager


class EnergyOptimizationType(Enum):
    """Types of energy optimization actions"""
    LIGHTING_SCHEDULE = "lighting_schedule"
    DIMMING_CONTROL = "dimming_control"
    OCCUPANCY_BASED = "occupancy_based"
    DAYLIGHT_HARVESTING = "daylight_harvesting"
    LOAD_SHEDDING = "load_shedding"
    PEAK_DEMAND_MANAGEMENT = "peak_demand_management"


class OptimizationPriority(Enum):
    """Optimization priority levels"""
    HIGH_IMPACT = "high_impact"
    MEDIUM_IMPACT = "medium_impact"
    LOW_IMPACT = "low_impact"


@dataclass
class EnergyConsumption:
    """Energy consumption data point"""
    timestamp: datetime
    consumption_watts: float
    location: str
    system_type: str
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'consumption_watts': self.consumption_watts,
            'location': self.location,
            'system_type': self.system_type,
            'metadata': self.metadata or {}
        }


@dataclass
class EnergyOptimization:
    """Energy optimization recommendation"""
    optimization_id: str
    optimization_type: EnergyOptimizationType
    priority: OptimizationPriority
    location: str
    system_type: str
    current_consumption: float
    projected_savings: float
    savings_percentage: float
    implementation_cost: float
    payback_period_months: float
    description: str
    actions_required: List[str]
    expected_roi: float
    confidence_score: float

    def to_dict(self) -> Dict:
        return {
            'optimization_id': self.optimization_id,
            'optimization_type': self.optimization_type.value,
            'priority': self.priority.value,
            'location': self.location,
            'system_type': self.system_type,
            'current_consumption': self.current_consumption,
            'projected_savings': self.projected_savings,
            'savings_percentage': self.savings_percentage,
            'implementation_cost': self.implementation_cost,
            'payback_period_months': self.payback_period_months,
            'description': self.description,
            'actions_required': self.actions_required,
            'expected_roi': self.expected_roi,
            'confidence_score': self.confidence_score
        }


class EnergyOptimizationEngine:
    """Engine for analyzing and optimizing building energy consumption"""

    def __init__(self, sensor_network: SensorNetworkManager):
        self.sensor_network = sensor_network
        self.baseline_period_days = 30
        self.optimization_history = []
        self.energy_rates = self._load_energy_rates()

    def _load_energy_rates(self) -> Dict[str, float]:
        """Load energy rates by time of day ($/kWh)"""
        return {
            'peak': 0.25,      # 6AM-6PM weekdays
            'off_peak': 0.15,  # 6PM-6AM weekdays, all weekend
            'super_peak': 0.35 # Peak demand periods
        }

    def analyze_energy_consumption(self, location: str = None, days: int = 30) -> Dict[str, Any]:
        """Analyze energy consumption patterns"""
        # Get energy consumption data
        energy_data = []
        nodes = self.sensor_network.db.get_all_nodes()

        for node in nodes:
            if location and not node.location.get('zone') == location:
                continue

            sensor_id = f"{node.node_id}_energy_consumption"
            data = self.sensor_network.get_sensor_data(sensor_id, hours=24*days)

            for d in data:
                energy_data.append(EnergyConsumption(
                    timestamp=d.timestamp,
                    consumption_watts=d.value,
                    location=f"{node.location.get('x', 0)},{node.location.get('y', 0)}",
                    system_type="lighting",  # Assume lighting for now
                    metadata=d.metadata
                ))

        if not energy_data:
            return {'status': 'no_data', 'total_consumption': 0, 'analysis': {}}

        # Convert to DataFrame for analysis
        df = pd.DataFrame([{
            'timestamp': e.timestamp,
            'consumption': e.consumption_watts,
            'hour': e.timestamp.hour,
            'day_of_week': e.timestamp.weekday(),
            'is_weekend': e.timestamp.weekday() >= 5
        } for e in energy_data])

        df = df.sort_values('timestamp')

        # Calculate key metrics
        total_consumption = df['consumption'].sum()
        avg_consumption = df['consumption'].mean()
        peak_consumption = df['consumption'].max()

        # Hourly patterns
        hourly_avg = df.groupby('hour')['consumption'].mean()

        # Peak vs off-peak analysis
        peak_hours = df[(df['hour'] >= 6) & (df['hour'] <= 18) & (~df['is_weekend'])]
        off_peak_hours = df[~((df['hour'] >= 6) & (df['hour'] <= 18) & (~df['is_weekend']))]

        peak_avg = peak_hours['consumption'].mean() if not peak_hours.empty else 0
        off_peak_avg = off_peak_hours['consumption'].mean() if not off_peak_hours.empty else 0

        # Calculate costs
        total_cost = self._calculate_energy_cost(df)

        return {
            'total_consumption_kwh': total_consumption / 1000,  # Convert W to kWh
            'average_consumption_watts': avg_consumption,
            'peak_consumption_watts': peak_consumption,
            'total_cost_usd': total_cost,
            'hourly_pattern': hourly_avg.to_dict(),
            'peak_avg_consumption': peak_avg,
            'off_peak_avg_consumption': off_peak_avg,
            'efficiency_score': self._calculate_efficiency_score(df),
            'waste_percentage': self._calculate_energy_waste(df),
            'analysis_period_days': days,
            'data_points': len(energy_data)
        }

    def _calculate_energy_cost(self, df: pd.DataFrame) -> float:
        """Calculate energy cost based on time-of-use rates"""
        total_cost = 0.0

        for _, row in df.iterrows():
            hour = row['hour']
            is_weekend = row['is_weekend']
            consumption_kwh = row['consumption'] / 1000  # Convert to kWh

            # Determine rate
            if is_weekend:
                rate = self.energy_rates['off_peak']
            elif 6 <= hour <= 18:
                rate = self.energy_rates['peak']
            else:
                rate = self.energy_rates['off_peak']

            total_cost += consumption_kwh * rate

        return total_cost

    def _calculate_efficiency_score(self, df: pd.DataFrame) -> float:
        """Calculate energy efficiency score (0-100)"""
        if df.empty:
            return 0.0

        # Base score on consumption patterns
        score = 100.0

        # Penalize high peak consumption
        peak_consumption = df['consumption'].max()
        avg_consumption = df['consumption'].mean()
        peak_ratio = peak_consumption / avg_consumption if avg_consumption > 0 else 1.0

        if peak_ratio > 3.0:
            score -= 20.0
        elif peak_ratio > 2.0:
            score -= 10.0

        # Reward consistent usage patterns
        std_dev = df['consumption'].std()
        cv = std_dev / avg_consumption if avg_consumption > 0 else 1.0  # Coefficient of variation

        if cv < 0.3:
            score += 10.0
        elif cv > 0.8:
            score -= 15.0

        # Check for off-peak usage
        off_peak_usage = df[~((df['hour'] >= 6) & (df['hour'] <= 18) & (~df['is_weekend']))]
        if not off_peak_usage.empty:
            off_peak_ratio = off_peak_usage['consumption'].mean() / avg_consumption
            if off_peak_ratio > 0.6:  # Good off-peak usage
                score += 5.0

        return max(0.0, min(100.0, score))

    def _calculate_energy_waste(self, df: pd.DataFrame) -> float:
        """Estimate percentage of energy waste"""
        if df.empty:
            return 0.0

        # Simple waste estimation based on patterns
        waste_factors = []

        # High consumption during unoccupied hours
        unoccupied_hours = df[(df['hour'] >= 18) | (df['hour'] <= 6)]
        if not unoccupied_hours.empty:
            unoccupied_avg = unoccupied_hours['consumption'].mean()
            overall_avg = df['consumption'].mean()
            if overall_avg > 0:
                waste_factors.append(min(0.3, unoccupied_avg / overall_avg * 0.2))

        # Excessive peak consumption
        peak_consumption = df['consumption'].max()
        avg_consumption = df['consumption'].mean()
        if avg_consumption > 0:
            peak_ratio = peak_consumption / avg_consumption
            waste_factors.append(min(0.2, (peak_ratio - 1) * 0.1))

        # Weekend vs weekday differences
        weekday_data = df[~df['is_weekend']]
        weekend_data = df[df['is_weekend']]

        if not weekday_data.empty and not weekend_data.empty:
            weekday_avg = weekday_data['consumption'].mean()
            weekend_avg = weekend_data['consumption'].mean()
            if weekday_avg > weekend_avg * 1.5:  # Much higher weekday usage
                waste_factors.append(0.1)

        return min(50.0, sum(waste_factors) * 100)  # Cap at 50%

    def generate_optimization_recommendations(self, location: str = None) -> List[EnergyOptimization]:
        """Generate energy optimization recommendations"""
        optimizations = []

        # Analyze current consumption
        analysis = self.analyze_energy_consumption(location, days=30)

        if analysis['status'] == 'no_data':
            return optimizations

        current_consumption = analysis['total_consumption_kwh']
        current_cost = analysis['total_cost_usd']
        efficiency_score = analysis['efficiency_score']
        waste_percentage = analysis['waste_percentage']

        # 1. Lighting Schedule Optimization
        if efficiency_score < 80:
            savings_percentage = min(0.25, (100 - efficiency_score) / 100 * 0.3)
            projected_savings = current_cost * savings_percentage

            optimization = EnergyOptimization(
                optimization_id=f"lighting_schedule_{location or 'building'}",
                optimization_type=EnergyOptimizationType.LIGHTING_SCHEDULE,
                priority=OptimizationPriority.HIGH_IMPACT,
                location=location or "building",
                system_type="lighting",
                current_consumption=current_consumption,
                projected_savings=projected_savings,
                savings_percentage=savings_percentage * 100,
                implementation_cost=500.0,  # Cost of smart controls
                payback_period_months=500.0 / (projected_savings / 12) if projected_savings > 0 else 999,
                description="Implement automated lighting schedules based on occupancy and daylight",
                actions_required=[
                    "Install occupancy sensors",
                    "Configure automated schedules",
                    "Set up daylight harvesting"
                ],
                expected_roi=projected_savings * 5 / 500.0,  # 5-year ROI
                confidence_score=0.85
            )
            optimizations.append(optimization)

        # 2. Occupancy-Based Controls
        if waste_percentage > 15:
            savings_percentage = min(0.20, waste_percentage / 100 * 0.8)
            projected_savings = current_cost * savings_percentage

            optimization = EnergyOptimization(
                optimization_id=f"occupancy_control_{location or 'building'}",
                optimization_type=EnergyOptimizationType.OCCUPANCY_BASED,
                priority=OptimizationPriority.HIGH_IMPACT,
                location=location or "building",
                system_type="lighting",
                current_consumption=current_consumption,
                projected_savings=projected_savings,
                savings_percentage=savings_percentage * 100,
                implementation_cost=300.0,
                payback_period_months=300.0 / (projected_savings / 12) if projected_savings > 0 else 999,
                description="Turn off lights when spaces are unoccupied",
                actions_required=[
                    "Install occupancy sensors in all zones",
                    "Configure timeout settings",
                    "Test sensor coverage"
                ],
                expected_roi=projected_savings * 5 / 300.0,
                confidence_score=0.90
            )
            optimizations.append(optimization)

        # 3. Daylight Harvesting
        daylight_savings = current_cost * 0.15  # Assume 15% savings potential

        optimization = EnergyOptimization(
            optimization_id=f"daylight_harvesting_{location or 'building'}",
            optimization_type=EnergyOptimizationType.DAYLIGHT_HARVESTING,
            priority=OptimizationPriority.MEDIUM_IMPACT,
            location=location or "building",
            system_type="lighting",
            current_consumption=current_consumption,
            projected_savings=daylight_savings,
            savings_percentage=15.0,
            implementation_cost=800.0,
            payback_period_months=800.0 / (daylight_savings / 12) if daylight_savings > 0 else 999,
            description="Use natural daylight to reduce artificial lighting needs",
            actions_required=[
                "Install daylight sensors",
                "Configure dimming controls",
                "Calibrate light levels"
            ],
            expected_roi=daylight_savings * 5 / 800.0,
            confidence_score=0.75
        )
        optimizations.append(optimization)

        # 4. Peak Demand Management
        peak_savings = current_cost * 0.10  # Assume 10% peak shaving potential

        optimization = EnergyOptimization(
            optimization_id=f"peak_demand_{location or 'building'}",
            optimization_type=EnergyOptimizationType.PEAK_DEMAND_MANAGEMENT,
            priority=OptimizationPriority.MEDIUM_IMPACT,
            location=location or "building",
            system_type="all",
            current_consumption=current_consumption,
            projected_savings=peak_savings,
            savings_percentage=10.0,
            implementation_cost=1000.0,
            payback_period_months=1000.0 / (peak_savings / 12) if peak_savings > 0 else 999,
            description="Reduce energy consumption during peak demand periods",
            actions_required=[
                "Implement demand response controls",
                "Set up peak shaving schedules",
                "Monitor demand charges"
            ],
            expected_roi=peak_savings * 5 / 1000.0,
            confidence_score=0.70
        )
        optimizations.append(optimization)

        # Sort by potential savings
        optimizations.sort(key=lambda x: x.projected_savings, reverse=True)

        return optimizations

    def implement_optimization(self, optimization_id: str) -> bool:
        """Implement an energy optimization (simulation)"""
        # In a real system, this would send commands to building systems
        print(f"Implementing optimization: {optimization_id}")

        # Record implementation
        self.optimization_history.append({
            'optimization_id': optimization_id,
            'implemented_at': datetime.now(),
            'status': 'implemented'
        })

        return True

    def monitor_optimization_effectiveness(self, optimization_id: str, days: int = 30) -> Dict[str, Any]:
        """Monitor the effectiveness of implemented optimizations"""
        # Compare before/after implementation
        implementation_time = None
        for opt in self.optimization_history:
            if opt['optimization_id'] == optimization_id:
                implementation_time = opt['implemented_at']
                break

        if not implementation_time:
            return {'status': 'not_implemented'}

        # Get data before and after
        before_data = self.analyze_energy_consumption(days=30)
        after_data = self.analyze_energy_consumption(days=days)

        if before_data['status'] == 'no_data' or after_data['status'] == 'no_data':
            return {'status': 'insufficient_data'}

        # Calculate improvement
        cost_savings = before_data['total_cost_usd'] - after_data['total_cost_usd']
        savings_percentage = (cost_savings / before_data['total_cost_usd']) * 100 if before_data['total_cost_usd'] > 0 else 0

        return {
            'optimization_id': optimization_id,
            'monitoring_period_days': days,
            'cost_before': before_data['total_cost_usd'],
            'cost_after': after_data['total_cost_usd'],
            'actual_savings': cost_savings,
            'savings_percentage': savings_percentage,
            'efficiency_improvement': after_data['efficiency_score'] - before_data['efficiency_score'],
            'status': 'monitoring'
        }

    def get_energy_dashboard_data(self) -> Dict[str, Any]:
        """Get data for energy dashboard"""
        analysis = self.analyze_energy_consumption(days=7)  # Last week
        optimizations = self.generate_optimization_recommendations()

        # Calculate quick stats
        total_savings_potential = sum(opt.projected_savings for opt in optimizations)
        avg_efficiency = analysis.get('efficiency_score', 0)
        waste_percentage = analysis.get('waste_percentage', 0)

        return {
            'current_consumption': analysis.get('total_consumption_kwh', 0),
            'current_cost': analysis.get('total_cost_usd', 0),
            'efficiency_score': avg_efficiency,
            'waste_percentage': waste_percentage,
            'savings_potential': total_savings_potential,
            'top_optimizations': [opt.to_dict() for opt in optimizations[:3]],
            'alerts': self._generate_energy_alerts(analysis, optimizations)
        }

    def _generate_energy_alerts(self, analysis: Dict, optimizations: List[EnergyOptimization]) -> List[Dict]:
        """Generate energy-related alerts"""
        alerts = []

        if analysis.get('efficiency_score', 100) < 60:
            alerts.append({
                'type': 'warning',
                'message': 'Energy efficiency is critically low',
                'priority': 'high'
            })

        if analysis.get('waste_percentage', 0) > 25:
            alerts.append({
                'type': 'warning',
                'message': f'High energy waste detected: {analysis["waste_percentage"]:.1f}%',
                'priority': 'medium'
            })

        high_impact_opts = [opt for opt in optimizations if opt.priority == OptimizationPriority.HIGH_IMPACT]
        if high_impact_opts:
            alerts.append({
                'type': 'info',
                'message': f'{len(high_impact_opts)} high-impact optimizations available',
                'priority': 'low'
            })

        return alerts


# Example usage
if __name__ == "__main__":
    from iot_sensor_network import SensorNetworkManager

    # Initialize components
    network = SensorNetworkManager()
    energy_engine = EnergyOptimizationEngine(network)

    # Example: Analyze energy consumption
    print("=== Energy Consumption Analysis ===")
    analysis = energy_engine.analyze_energy_consumption(days=7)
    print(f"Energy analysis: {analysis}")

    # Example: Generate optimization recommendations
    print("\n=== Energy Optimization Recommendations ===")
    optimizations = energy_engine.generate_optimization_recommendations()
    for opt in optimizations[:3]:  # Show top 3
        print(f"- {opt.optimization_type.value}: ${opt.projected_savings:.2f}/year savings ({opt.savings_percentage:.1f}%)")

    # Example: Get dashboard data
    print("\n=== Energy Dashboard Data ===")
    dashboard = energy_engine.get_energy_dashboard_data()
    print(f"Dashboard: {dashboard}")

    network.shutdown()