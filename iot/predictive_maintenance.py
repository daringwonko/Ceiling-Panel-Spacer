#!/usr/bin/env python3
"""
Predictive Maintenance Engine for Smart Building Systems
Implements machine learning algorithms to predict maintenance needs based on sensor data.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json
import pickle
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

from iot_sensor_network import SensorData, SensorType, SensorNetworkManager


class MaintenancePriority(Enum):
    """Maintenance priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MaintenanceType(Enum):
    """Types of maintenance actions"""
    INSPECTION = "inspection"
    CLEANING = "cleaning"
    REPLACEMENT = "replacement"
    CALIBRATION = "calibration"
    REPAIR = "repair"


@dataclass
class MaintenancePrediction:
    """Prediction result for maintenance needs"""
    component_id: str
    component_type: str
    maintenance_type: MaintenanceType
    priority: MaintenancePriority
    confidence: float
    predicted_time: datetime
    time_to_failure: timedelta
    risk_score: float
    recommendations: List[str]
    sensor_indicators: Dict[str, Any]

    def to_dict(self) -> Dict:
        return {
            'component_id': self.component_id,
            'component_type': self.component_type,
            'maintenance_type': self.maintenance_type.value,
            'priority': self.priority.value,
            'confidence': self.confidence,
            'predicted_time': self.predicted_time.isoformat(),
            'time_to_failure_days': self.time_to_failure.days,
            'risk_score': self.risk_score,
            'recommendations': self.recommendations,
            'sensor_indicators': self.sensor_indicators
        }


class PredictiveMaintenanceEngine:
    """Machine learning engine for predictive maintenance"""

    def __init__(self, sensor_network: SensorNetworkManager, model_path: str = "maintenance_models"):
        self.sensor_network = sensor_network
        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)
        self.models = {}
        self.thresholds = self._load_default_thresholds()
        self._load_models()

    def _load_default_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Load default maintenance thresholds"""
        return {
            'temperature_sensor': {
                'max_temp': 50.0,  # °C
                'temp_variance_threshold': 5.0,
                'drift_threshold': 2.0
            },
            'humidity_sensor': {
                'max_humidity': 80.0,  # %
                'humidity_variance_threshold': 10.0
            },
            'light_sensor': {
                'min_light_level': 50.0,  # lux
                'max_light_level': 10000.0
            },
            'vibration_sensor': {
                'vibration_threshold': 0.5,  # g
                'frequency_threshold': 100.0  # Hz
            },
            'energy_consumption': {
                'efficiency_threshold': 0.8,
                'power_spike_threshold': 50.0  # W
            },
            'panel_system': {
                'max_age_days': 365 * 5,  # 5 years
                'usage_cycles_threshold': 10000
            }
        }

    def _load_models(self):
        """Load pre-trained ML models"""
        # For now, we'll use simple statistical models
        # In production, this would load trained ML models
        pass

    def analyze_sensor_health(self, sensor_id: str, days_history: int = 30) -> Dict[str, Any]:
        """Analyze sensor health based on historical data"""
        data = self.sensor_network.get_sensor_data(sensor_id, days_history)

        if not data:
            return {'status': 'no_data', 'health_score': 0.0}

        # Convert to DataFrame for analysis
        df = pd.DataFrame([{
            'timestamp': d.timestamp,
            'value': d.value,
            'sensor_type': d.sensor_type.value
        } for d in data])

        df = df.sort_values('timestamp')
        df['timestamp'] = pd.to_datetime(df['timestamp'])

        sensor_type = data[0].sensor_type.value
        thresholds = self.thresholds.get(f'{sensor_type}_sensor', {})

        health_score = self._calculate_sensor_health_score(df, sensor_type, thresholds)

        return {
            'sensor_id': sensor_id,
            'sensor_type': sensor_type,
            'health_score': health_score,
            'data_points': len(data),
            'analysis_period_days': days_history,
            'issues': self._identify_sensor_issues(df, sensor_type, thresholds)
        }

    def _calculate_sensor_health_score(self, df: pd.DataFrame, sensor_type: str,
                                     thresholds: Dict[str, float]) -> float:
        """Calculate overall sensor health score (0-100)"""
        if df.empty:
            return 0.0

        score = 100.0

        # Check data completeness
        expected_readings = len(df) * 0.9  # 90% completeness expected
        if len(df) < expected_readings:
            score -= 20.0

        # Check for outliers
        if len(df) > 10:
            Q1 = df['value'].quantile(0.25)
            Q3 = df['value'].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((df['value'] < (Q1 - 1.5 * IQR)) | (df['value'] > (Q3 + 1.5 * IQR))).sum()
            outlier_ratio = outliers / len(df)
            score -= outlier_ratio * 30.0

        # Check against thresholds
        if sensor_type == 'temperature':
            max_temp = thresholds.get('max_temp', 50.0)
            over_temp = (df['value'] > max_temp).sum()
            if over_temp > 0:
                score -= (over_temp / len(df)) * 40.0

        elif sensor_type == 'humidity':
            max_humidity = thresholds.get('max_humidity', 80.0)
            over_humidity = (df['value'] > max_humidity).sum()
            if over_humidity > 0:
                score -= (over_humidity / len(df)) * 30.0

        elif sensor_type == 'light_level':
            min_light = thresholds.get('min_light_level', 50.0)
            low_light = (df['value'] < min_light).sum()
            if low_light > 0:
                score -= (low_light / len(df)) * 25.0

        # Check for drift (gradual change over time)
        if len(df) > 20:
            recent_avg = df.tail(10)['value'].mean()
            older_avg = df.head(10)['value'].mean()
            drift = abs(recent_avg - older_avg)
            drift_threshold = thresholds.get('drift_threshold', 2.0)
            if drift > drift_threshold:
                score -= 15.0

        return max(0.0, min(100.0, score))

    def _identify_sensor_issues(self, df: pd.DataFrame, sensor_type: str,
                               thresholds: Dict[str, float]) -> List[str]:
        """Identify specific sensor issues"""
        issues = []

        if df.empty:
            issues.append("No sensor data available")
            return issues

        # Check data quality
        if len(df) < 10:
            issues.append("Insufficient data for analysis")

        # Check for stuck values
        unique_values = df['value'].nunique()
        if unique_values == 1:
            issues.append("Sensor appears stuck at single value")

        # Check for extreme values
        mean_val = df['value'].mean()
        std_val = df['value'].std()

        if sensor_type == 'temperature':
            if mean_val > thresholds.get('max_temp', 50.0):
                issues.append(f"Temperature consistently above threshold: {mean_val:.1f}°C")
            if std_val > thresholds.get('temp_variance_threshold', 5.0):
                issues.append(f"High temperature variance: {std_val:.1f}°C")

        elif sensor_type == 'humidity':
            if mean_val > thresholds.get('max_humidity', 80.0):
                issues.append(f"Humidity consistently above threshold: {mean_val:.1f}%")

        # Check for data gaps
        df = df.sort_values('timestamp')
        time_diffs = df['timestamp'].diff().dt.total_seconds() / 3600  # hours
        avg_interval = time_diffs.mean()
        if avg_interval > 2.0:  # More than 2 hours between readings
            issues.append(f"Irregular data collection (avg {avg_interval:.1f}h intervals)")

        return issues

    def predict_panel_maintenance(self, panel_id: str, installation_date: datetime,
                                usage_cycles: int = 0) -> MaintenancePrediction:
        """Predict maintenance needs for ceiling panels"""

        # Gather relevant sensor data
        sensor_indicators = {}

        # Get temperature data for the area
        temp_sensors = [f"ceiling_node_{panel_id}_temperature"]
        for sensor_id in temp_sensors:
            temp_data = self.sensor_network.get_sensor_data(sensor_id, hours=24*30)
            if temp_data:
                avg_temp = np.mean([d.value for d in temp_data])
                sensor_indicators['avg_temperature'] = avg_temp

        # Get humidity data
        humidity_sensors = [f"ceiling_node_{panel_id}_humidity"]
        for sensor_id in humidity_sensors:
            humidity_data = self.sensor_network.get_sensor_data(sensor_id, hours=24*30)
            if humidity_data:
                avg_humidity = np.mean([d.value for d in humidity_data])
                sensor_indicators['avg_humidity'] = avg_humidity

        # Get vibration data (if available)
        vibration_sensors = [f"ceiling_node_{panel_id}_vibration"]
        for sensor_id in vibration_sensors:
            vibration_data = self.sensor_network.get_sensor_data(sensor_id, hours=24*7)
            if vibration_data:
                max_vibration = max([d.value for d in vibration_data])
                sensor_indicators['max_vibration'] = max_vibration

        # Calculate age-based risk
        age_days = (datetime.now() - installation_date).days
        age_risk = min(1.0, age_days / self.thresholds['panel_system']['max_age_days'])

        # Calculate usage-based risk
        usage_risk = min(1.0, usage_cycles / self.thresholds['panel_system']['usage_cycles_threshold'])

        # Environmental risk factors
        env_risk = 0.0
        if 'avg_humidity' in sensor_indicators and sensor_indicators['avg_humidity'] > 60:
            env_risk += 0.3
        if 'avg_temperature' in sensor_indicators and sensor_indicators['avg_temperature'] > 30:
            env_risk += 0.2
        if 'max_vibration' in sensor_indicators and sensor_indicators['max_vibration'] > 0.3:
            env_risk += 0.4

        # Overall risk score
        risk_score = (age_risk * 0.4) + (usage_risk * 0.3) + (env_risk * 0.3)

        # Determine maintenance type and priority
        if risk_score > 0.8:
            maintenance_type = MaintenanceType.REPLACEMENT
            priority = MaintenancePriority.CRITICAL
            time_to_failure = timedelta(days=max(1, int((1 - risk_score) * 30)))
        elif risk_score > 0.6:
            maintenance_type = MaintenanceType.INSPECTION
            priority = MaintenancePriority.HIGH
            time_to_failure = timedelta(days=max(7, int((1 - risk_score) * 90)))
        elif risk_score > 0.4:
            maintenance_type = MaintenanceType.CLEANING
            priority = MaintenancePriority.MEDIUM
            time_to_failure = timedelta(days=max(30, int((1 - risk_score) * 180)))
        else:
            maintenance_type = MaintenanceType.INSPECTION
            priority = MaintenancePriority.LOW
            time_to_failure = timedelta(days=365)

        predicted_time = datetime.now() + time_to_failure

        # Generate recommendations
        recommendations = []
        if age_risk > 0.7:
            recommendations.append("Panel approaching end of service life - consider replacement")
        if env_risk > 0.5:
            recommendations.append("High environmental stress detected - increase monitoring frequency")
        if usage_risk > 0.6:
            recommendations.append("High usage cycles - schedule preventive maintenance")
        if not recommendations:
            recommendations.append("Regular maintenance schedule recommended")

        confidence = min(0.95, 0.5 + (risk_score * 0.4))  # Base confidence with risk correlation

        return MaintenancePrediction(
            component_id=panel_id,
            component_type="ceiling_panel",
            maintenance_type=maintenance_type,
            priority=priority,
            confidence=confidence,
            predicted_time=predicted_time,
            time_to_failure=time_to_failure,
            risk_score=risk_score,
            recommendations=recommendations,
            sensor_indicators=sensor_indicators
        )

    def predict_system_maintenance(self, system_type: str = "lighting") -> List[MaintenancePrediction]:
        """Predict maintenance for entire systems"""
        predictions = []

        # Get all nodes
        nodes = self.sensor_network.db.get_all_nodes()

        for node in nodes:
            if system_type == "lighting":
                # Check LED panels
                if any(s == SensorType.ENERGY_CONSUMPTION for s in node.sensors):
                    # Simulate panel prediction
                    prediction = MaintenancePrediction(
                        component_id=f"{node.node_id}_lighting",
                        component_type="lighting_system",
                        maintenance_type=MaintenanceType.INSPECTION,
                        priority=MaintenancePriority.MEDIUM,
                        confidence=0.75,
                        predicted_time=datetime.now() + timedelta(days=90),
                        time_to_failure=timedelta(days=90),
                        risk_score=0.4,
                        recommendations=["Check LED efficiency", "Clean light fixtures"],
                        sensor_indicators={'efficiency': 0.85, 'power_consumption': 25.0}
                    )
                    predictions.append(prediction)

        return predictions

    def get_maintenance_schedule(self, days_ahead: int = 30) -> List[MaintenancePrediction]:
        """Get all predicted maintenance within specified timeframe"""
        predictions = []

        # Get all nodes for panel predictions
        nodes = self.sensor_network.db.get_all_nodes()

        for node in nodes:
            # Predict for each panel in the node area
            for i in range(4):  # Assume 4 panels per node area
                panel_id = f"{node.node_id}_panel_{i}"
                installation_date = datetime.now() - timedelta(days=np.random.randint(0, 365*3))  # Random age
                usage_cycles = np.random.randint(0, 5000)  # Random usage

                prediction = self.predict_panel_maintenance(panel_id, installation_date, usage_cycles)

                if prediction.predicted_time <= datetime.now() + timedelta(days=days_ahead):
                    predictions.append(prediction)

        # Sort by priority and time
        priority_order = {MaintenancePriority.CRITICAL: 0, MaintenancePriority.HIGH: 1,
                         MaintenancePriority.MEDIUM: 2, MaintenancePriority.LOW: 3}

        predictions.sort(key=lambda x: (priority_order[x.priority], x.predicted_time))

        return predictions

    def analyze_system_health(self) -> Dict[str, Any]:
        """Analyze overall system health"""
        nodes = self.sensor_network.db.get_all_nodes()
        network_status = self.sensor_network.get_network_status()

        sensor_health_scores = []
        for node in nodes:
            for sensor_type in node.sensors:
                sensor_id = f"{node.node_id}_{sensor_type.value}"
                health = self.analyze_sensor_health(sensor_id, days_history=7)
                sensor_health_scores.append(health['health_score'])

        avg_sensor_health = np.mean(sensor_health_scores) if sensor_health_scores else 0.0

        # Calculate system health as weighted average
        system_health = (
            network_status['network_health'] * 0.3 +  # Network connectivity
            avg_sensor_health * 0.4 +                  # Sensor health
            (100.0 - len([p for p in self.get_maintenance_schedule(30)
                         if p.priority in [MaintenancePriority.CRITICAL, MaintenancePriority.HIGH]]) * 2) * 0.3
        )

        return {
            'overall_health_score': min(100.0, max(0.0, system_health)),
            'network_health': network_status['network_health'],
            'sensor_health': avg_sensor_health,
            'total_nodes': network_status['total_nodes'],
            'online_nodes': network_status['online_nodes'],
            'critical_maintenance_count': len([p for p in self.get_maintenance_schedule(30)
                                             if p.priority == MaintenancePriority.CRITICAL]),
            'high_priority_maintenance_count': len([p for p in self.get_maintenance_schedule(30)
                                                  if p.priority == MaintenancePriority.HIGH])
        }


# Example usage
if __name__ == "__main__":
    from iot_sensor_network import SensorNetworkManager

    # Initialize components
    network = SensorNetworkManager()
    maintenance_engine = PredictiveMaintenanceEngine(network)

    # Example: Analyze sensor health
    print("=== Sensor Health Analysis ===")
    sensor_id = "ceiling_node_001_temperature"
    health = maintenance_engine.analyze_sensor_health(sensor_id)
    print(f"Sensor {sensor_id} health: {health}")

    # Example: Predict panel maintenance
    print("\n=== Panel Maintenance Prediction ===")
    panel_prediction = maintenance_engine.predict_panel_maintenance(
        "panel_001",
        installation_date=datetime.now() - timedelta(days=365),
        usage_cycles=2000
    )
    print(f"Panel maintenance prediction: {panel_prediction.to_dict()}")

    # Example: Get maintenance schedule
    print("\n=== Maintenance Schedule (Next 30 days) ===")
    schedule = maintenance_engine.get_maintenance_schedule(30)
    for pred in schedule[:5]:  # Show first 5
        print(f"- {pred.component_id}: {pred.maintenance_type.value} ({pred.priority.value}) in {pred.time_to_failure.days} days")

    # Example: System health analysis
    print("\n=== System Health Analysis ===")
    system_health = maintenance_engine.analyze_system_health()
    print(f"System health: {system_health}")

    network.shutdown()