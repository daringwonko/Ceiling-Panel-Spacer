#!/usr/bin/env python3
"""
Real-Time Monitoring Dashboard for Ceiling Panel Systems.

Provides comprehensive monitoring including:
- Sensor data aggregation
- Alert management
- Performance metrics
- System health monitoring
- Historical data analysis
"""

import time
import json
import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum
from collections import deque
import threading


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class MetricType(Enum):
    """Types of monitored metrics."""
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    LIGHT_LEVEL = "light_level"
    OCCUPANCY = "occupancy"
    ENERGY_USAGE = "energy_usage"
    AIR_QUALITY = "air_quality"
    VIBRATION = "vibration"
    ACOUSTIC = "acoustic"


@dataclass
class SensorReading:
    """Individual sensor reading."""
    sensor_id: str
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    quality: float = 1.0  # Data quality 0-1


@dataclass
class Alert:
    """System alert."""
    alert_id: str
    severity: AlertSeverity
    source: str
    message: str
    timestamp: datetime
    acknowledged: bool = False
    resolved: bool = False
    resolution_time: Optional[datetime] = None


@dataclass
class SystemHealth:
    """System health metrics."""
    overall_status: str  # 'healthy', 'degraded', 'critical'
    active_sensors: int
    offline_sensors: int
    active_alerts: int
    cpu_usage_pct: float
    memory_usage_pct: float
    network_status: str
    last_update: datetime


@dataclass
class PerformanceMetric:
    """Performance metric with statistics."""
    metric_type: MetricType
    current_value: float
    min_value: float
    max_value: float
    avg_value: float
    std_deviation: float
    sample_count: int
    time_range_minutes: int


class MetricBuffer:
    """Circular buffer for metric history."""

    def __init__(self, max_size: int = 1000):
        self.buffer = deque(maxlen=max_size)
        self.max_size = max_size

    def add(self, reading: SensorReading) -> None:
        self.buffer.append(reading)

    def get_recent(self, count: int = 100) -> List[SensorReading]:
        return list(self.buffer)[-count:]

    def get_by_time_range(self, minutes: int) -> List[SensorReading]:
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [r for r in self.buffer if r.timestamp >= cutoff]

    def compute_statistics(self, minutes: int = 60) -> Dict[str, float]:
        readings = self.get_by_time_range(minutes)
        if not readings:
            return {'count': 0}

        values = [r.value for r in readings]
        import statistics
        return {
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': statistics.mean(values),
            'std': statistics.stdev(values) if len(values) > 1 else 0
        }


class MonitoringDashboard:
    """
    Comprehensive monitoring dashboard for building systems.
    """

    # Default thresholds for alerts
    DEFAULT_THRESHOLDS = {
        MetricType.TEMPERATURE: {'min': 18, 'max': 28, 'critical_min': 15, 'critical_max': 32},
        MetricType.HUMIDITY: {'min': 30, 'max': 60, 'critical_min': 20, 'critical_max': 80},
        MetricType.LIGHT_LEVEL: {'min': 300, 'max': 800, 'critical_min': 100, 'critical_max': 1200},
        MetricType.AIR_QUALITY: {'min': 0, 'max': 100, 'critical_min': 0, 'critical_max': 150},
        MetricType.OCCUPANCY: {'min': 0, 'max': 100, 'critical_min': 0, 'critical_max': 150},
    }

    def __init__(self):
        self.sensors: Dict[str, Dict[str, Any]] = {}
        self.metric_buffers: Dict[str, MetricBuffer] = {}
        self.alerts: List[Alert] = []
        self.thresholds: Dict[MetricType, Dict[str, float]] = self.DEFAULT_THRESHOLDS.copy()
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        self._alert_counter = 0
        self._running = False

    def register_sensor(
        self,
        sensor_id: str,
        name: str,
        metric_type: MetricType,
        location: str,
        unit: str
    ) -> None:
        """Register a sensor for monitoring."""
        self.sensors[sensor_id] = {
            'id': sensor_id,
            'name': name,
            'metric_type': metric_type,
            'location': location,
            'unit': unit,
            'status': 'online',
            'last_reading': None,
            'last_update': datetime.now()
        }
        self.metric_buffers[sensor_id] = MetricBuffer()

    def ingest_reading(self, reading: SensorReading) -> None:
        """Ingest a sensor reading."""
        if reading.sensor_id not in self.sensors:
            return

        # Store reading
        self.metric_buffers[reading.sensor_id].add(reading)

        # Update sensor status
        sensor = self.sensors[reading.sensor_id]
        sensor['last_reading'] = reading.value
        sensor['last_update'] = reading.timestamp
        sensor['status'] = 'online'

        # Check thresholds
        self._check_thresholds(reading)

    def _check_thresholds(self, reading: SensorReading) -> None:
        """Check if reading exceeds thresholds."""
        thresholds = self.thresholds.get(reading.metric_type)
        if not thresholds:
            return

        value = reading.value

        # Check critical thresholds first
        if value < thresholds.get('critical_min', float('-inf')):
            self._create_alert(
                AlertSeverity.CRITICAL,
                reading.sensor_id,
                f"CRITICAL LOW: {reading.metric_type.value} = {value} (below {thresholds['critical_min']})"
            )
        elif value > thresholds.get('critical_max', float('inf')):
            self._create_alert(
                AlertSeverity.CRITICAL,
                reading.sensor_id,
                f"CRITICAL HIGH: {reading.metric_type.value} = {value} (above {thresholds['critical_max']})"
            )
        # Check warning thresholds
        elif value < thresholds.get('min', float('-inf')):
            self._create_alert(
                AlertSeverity.WARNING,
                reading.sensor_id,
                f"Warning: {reading.metric_type.value} = {value} (below {thresholds['min']})"
            )
        elif value > thresholds.get('max', float('inf')):
            self._create_alert(
                AlertSeverity.WARNING,
                reading.sensor_id,
                f"Warning: {reading.metric_type.value} = {value} (above {thresholds['max']})"
            )

    def _create_alert(self, severity: AlertSeverity, source: str, message: str) -> Alert:
        """Create and store an alert."""
        self._alert_counter += 1
        alert = Alert(
            alert_id=f"ALT-{self._alert_counter:06d}",
            severity=severity,
            source=source,
            message=message,
            timestamp=datetime.now()
        )
        self.alerts.append(alert)

        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception:
                pass

        return alert

    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert."""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.acknowledged = True
                return True
        return False

    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert."""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                alert.resolution_time = datetime.now()
                return True
        return False

    def get_active_alerts(self) -> List[Alert]:
        """Get all active (unresolved) alerts."""
        return [a for a in self.alerts if not a.resolved]

    def get_system_health(self) -> SystemHealth:
        """Get current system health status."""
        now = datetime.now()

        # Count sensor statuses
        online = 0
        offline = 0
        stale_threshold = now - timedelta(minutes=5)

        for sensor in self.sensors.values():
            if sensor['last_update'] < stale_threshold:
                sensor['status'] = 'offline'
                offline += 1
            else:
                online += 1

        # Determine overall status
        active_alerts = len(self.get_active_alerts())
        critical_alerts = len([a for a in self.get_active_alerts()
                              if a.severity in [AlertSeverity.CRITICAL, AlertSeverity.EMERGENCY]])

        if critical_alerts > 0 or offline > len(self.sensors) * 0.3:
            status = 'critical'
        elif active_alerts > 5 or offline > 0:
            status = 'degraded'
        else:
            status = 'healthy'

        return SystemHealth(
            overall_status=status,
            active_sensors=online,
            offline_sensors=offline,
            active_alerts=active_alerts,
            cpu_usage_pct=random.uniform(10, 50),  # Simulated
            memory_usage_pct=random.uniform(30, 60),  # Simulated
            network_status='connected',
            last_update=now
        )

    def get_performance_metrics(self, minutes: int = 60) -> List[PerformanceMetric]:
        """Get performance metrics for all sensors."""
        metrics = []

        for sensor_id, buffer in self.metric_buffers.items():
            sensor = self.sensors.get(sensor_id)
            if not sensor:
                continue

            stats = buffer.compute_statistics(minutes)
            if stats['count'] == 0:
                continue

            metrics.append(PerformanceMetric(
                metric_type=sensor['metric_type'],
                current_value=sensor['last_reading'] or 0,
                min_value=stats['min'],
                max_value=stats['max'],
                avg_value=stats['avg'],
                std_deviation=stats['std'],
                sample_count=stats['count'],
                time_range_minutes=minutes
            ))

        return metrics

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get all dashboard data for display."""
        health = self.get_system_health()
        metrics = self.get_performance_metrics()
        alerts = self.get_active_alerts()

        return {
            'timestamp': datetime.now().isoformat(),
            'health': {
                'status': health.overall_status,
                'active_sensors': health.active_sensors,
                'offline_sensors': health.offline_sensors,
                'active_alerts': health.active_alerts
            },
            'sensors': [
                {
                    'id': s['id'],
                    'name': s['name'],
                    'type': s['metric_type'].value,
                    'location': s['location'],
                    'status': s['status'],
                    'value': s['last_reading'],
                    'unit': s['unit']
                }
                for s in self.sensors.values()
            ],
            'metrics': [
                {
                    'type': m.metric_type.value,
                    'current': round(m.current_value, 2),
                    'min': round(m.min_value, 2),
                    'max': round(m.max_value, 2),
                    'avg': round(m.avg_value, 2)
                }
                for m in metrics
            ],
            'alerts': [
                {
                    'id': a.alert_id,
                    'severity': a.severity.value,
                    'message': a.message,
                    'time': a.timestamp.isoformat(),
                    'acknowledged': a.acknowledged
                }
                for a in alerts[:10]  # Last 10 alerts
            ]
        }

    def set_threshold(
        self,
        metric_type: MetricType,
        min_val: Optional[float] = None,
        max_val: Optional[float] = None,
        critical_min: Optional[float] = None,
        critical_max: Optional[float] = None
    ) -> None:
        """Set or update thresholds for a metric type."""
        if metric_type not in self.thresholds:
            self.thresholds[metric_type] = {}

        t = self.thresholds[metric_type]
        if min_val is not None:
            t['min'] = min_val
        if max_val is not None:
            t['max'] = max_val
        if critical_min is not None:
            t['critical_min'] = critical_min
        if critical_max is not None:
            t['critical_max'] = critical_max

    def register_alert_callback(self, callback: Callable[[Alert], None]) -> None:
        """Register a callback for new alerts."""
        self.alert_callbacks.append(callback)


def demonstrate_monitoring():
    """Demonstrate monitoring dashboard."""
    print("="*80)
    print("REAL-TIME MONITORING DASHBOARD")
    print("="*80)

    dashboard = MonitoringDashboard()

    # Register sensors
    print("\n1. Registering Sensors...")
    sensors_config = [
        ("TEMP-01", "Office Temperature", MetricType.TEMPERATURE, "Floor 1", "°C"),
        ("TEMP-02", "Server Room Temp", MetricType.TEMPERATURE, "Basement", "°C"),
        ("HUM-01", "Office Humidity", MetricType.HUMIDITY, "Floor 1", "%"),
        ("LIGHT-01", "Office Light", MetricType.LIGHT_LEVEL, "Floor 1", "lux"),
        ("AQ-01", "Air Quality", MetricType.AIR_QUALITY, "Floor 1", "AQI"),
        ("OCC-01", "Occupancy Sensor", MetricType.OCCUPANCY, "Floor 1", "count"),
    ]

    for sid, name, mtype, loc, unit in sensors_config:
        dashboard.register_sensor(sid, name, mtype, loc, unit)
        print(f"  ✓ Registered: {name}")

    # Simulate sensor readings
    print("\n2. Simulating Sensor Readings...")
    now = datetime.now()

    for i in range(50):
        timestamp = now - timedelta(minutes=50-i)

        # Normal readings
        dashboard.ingest_reading(SensorReading("TEMP-01", MetricType.TEMPERATURE,
                                              22 + random.uniform(-2, 2), "°C", timestamp))
        dashboard.ingest_reading(SensorReading("HUM-01", MetricType.HUMIDITY,
                                              45 + random.uniform(-5, 5), "%", timestamp))
        dashboard.ingest_reading(SensorReading("LIGHT-01", MetricType.LIGHT_LEVEL,
                                              500 + random.uniform(-100, 100), "lux", timestamp))

        # Server room - occasional high temps
        temp = 24 + random.uniform(-2, 4) if i < 40 else 33  # Critical temp
        dashboard.ingest_reading(SensorReading("TEMP-02", MetricType.TEMPERATURE,
                                              temp, "°C", timestamp))

    print(f"  Ingested 200 readings")

    # Get system health
    print("\n3. System Health:")
    health = dashboard.get_system_health()
    print(f"  Status: {health.overall_status.upper()}")
    print(f"  Active Sensors: {health.active_sensors}")
    print(f"  Offline Sensors: {health.offline_sensors}")
    print(f"  Active Alerts: {health.active_alerts}")

    # Get active alerts
    print("\n4. Active Alerts:")
    alerts = dashboard.get_active_alerts()
    for alert in alerts[:5]:
        print(f"  [{alert.severity.value.upper()}] {alert.message}")

    # Get metrics
    print("\n5. Performance Metrics (last 60 min):")
    metrics = dashboard.get_performance_metrics(60)
    for m in metrics:
        print(f"  {m.metric_type.value}: current={m.current_value:.1f}, "
              f"avg={m.avg_value:.1f}, range=[{m.min_value:.1f}, {m.max_value:.1f}]")

    # Get dashboard data
    print("\n6. Dashboard Data Export...")
    data = dashboard.get_dashboard_data()
    print(f"  Exported {len(data['sensors'])} sensors, {len(data['alerts'])} alerts")

    print("\n" + "="*80)
    print("MONITORING DASHBOARD COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_monitoring()
