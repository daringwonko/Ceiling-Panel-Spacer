"""
IoT module for Ceiling Panel Calculator.

Contains IoT sensor network management, security,
monitoring dashboard, and predictive maintenance.
"""

from .iot_sensor_network import (
    SensorNetworkManager,
    SensorData,
    Sensor,
    SensorType,
)

from .iot_security import (
    IoTSecurityManager,
    require_auth,
    DeviceCredentials,
)

from .iot_integration import (
    IoTIntegrationManager,
    DeviceRegistry,
)

from .monitoring_dashboard import (
    MonitoringDashboard,
    Alert,
    SystemHealth,
    MetricType,
    SensorReading,
)

from .predictive_maintenance import (
    PredictiveMaintenanceEngine,
    MaintenanceSchedule,
    FailurePrediction,
)

__all__ = [
    # Sensor network
    'SensorNetworkManager',
    'SensorData',
    'Sensor',
    'SensorType',
    # Security
    'IoTSecurityManager',
    'require_auth',
    'DeviceCredentials',
    # Integration
    'IoTIntegrationManager',
    'DeviceRegistry',
    # Monitoring
    'MonitoringDashboard',
    'Alert',
    'SystemHealth',
    'MetricType',
    'SensorReading',
    # Maintenance
    'PredictiveMaintenanceEngine',
    'MaintenanceSchedule',
    'FailurePrediction',
]
