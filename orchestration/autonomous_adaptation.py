#!/usr/bin/env python3
"""
Autonomous Adaptation System for Smart Buildings
Automatically adjusts building systems based on sensor data, predictions, and optimization goals.
"""

import threading
import time
import json
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import logging

from iot_sensor_network import SensorNetworkManager, SensorType, SensorData
from predictive_maintenance import PredictiveMaintenanceEngine
from energy_optimization import EnergyOptimizationEngine


class AdaptationAction(Enum):
    """Types of autonomous adaptation actions"""
    LIGHTING_ADJUSTMENT = "lighting_adjustment"
    HVAC_OPTIMIZATION = "hvac_optimization"
    ENERGY_LOAD_SHEDDING = "energy_load_shedding"
    MAINTENANCE_TRIGGER = "maintenance_trigger"
    SECURITY_ALERT = "security_alert"
    ENVIRONMENTAL_CONTROL = "environmental_control"
    SYSTEM_CALIBRATION = "system_calibration"


class AdaptationPriority(Enum):
    """Priority levels for adaptation actions"""
    CRITICAL = "critical"      # Immediate safety/security issues
    HIGH = "high"             # Significant efficiency/optimization opportunities
    MEDIUM = "medium"         # Moderate adjustments needed
    LOW = "low"              # Minor optimizations
    INFORMATIONAL = "informational"  # Logging/notifications only


@dataclass
class AdaptationRule:
    """Rule for autonomous adaptation"""
    rule_id: str
    name: str
    description: str
    trigger_conditions: Dict[str, Any]
    actions: List[Dict[str, Any]]
    priority: AdaptationPriority
    cooldown_minutes: int
    enabled: bool
    last_triggered: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            'rule_id': self.rule_id,
            'name': self.name,
            'description': self.description,
            'trigger_conditions': self.trigger_conditions,
            'actions': self.actions,
            'priority': self.priority.value,
            'cooldown_minutes': self.cooldown_minutes,
            'enabled': self.enabled,
            'last_triggered': self.last_triggered.isoformat() if self.last_triggered else None
        }


@dataclass
class AdaptationEvent:
    """Record of an autonomous adaptation action"""
    event_id: str
    timestamp: datetime
    rule_id: str
    action_type: AdaptationAction
    priority: AdaptationPriority
    description: str
    sensor_data: Dict[str, Any]
    actions_taken: List[Dict[str, Any]]
    outcome: str
    confidence_score: float

    def to_dict(self) -> Dict:
        return {
            'event_id': self.event_id,
            'timestamp': self.timestamp.isoformat(),
            'rule_id': self.rule_id,
            'action_type': self.action_type.value,
            'priority': self.priority.value,
            'description': self.description,
            'sensor_data': self.sensor_data,
            'actions_taken': self.actions_taken,
            'outcome': self.outcome,
            'confidence_score': self.confidence_score
        }


class AutonomousAdaptationSystem:
    """Main autonomous adaptation system"""

    def __init__(self, sensor_network: SensorNetworkManager,
                 maintenance_engine: PredictiveMaintenanceEngine,
                 energy_engine: EnergyOptimizationEngine):
        self.sensor_network = sensor_network
        self.maintenance_engine = maintenance_engine
        self.energy_engine = energy_engine

        self.rules: Dict[str, AdaptationRule] = {}
        self.event_history: List[AdaptationEvent] = []
        self.is_running = False
        self.monitoring_thread = None

        # Setup logging
        self.logger = logging.getLogger('AutonomousAdaptation')
        self.logger.setLevel(logging.INFO)

        # Load default adaptation rules
        self._load_default_rules()

        # Register sensor data callbacks
        self.sensor_network.register_data_callback(self._handle_sensor_data)

    def _load_default_rules(self):
        """Load default autonomous adaptation rules"""

        # Rule 1: High temperature alert
        self.rules['high_temperature'] = AdaptationRule(
            rule_id='high_temperature',
            name='High Temperature Alert',
            description='Trigger when temperature exceeds safe thresholds',
            trigger_conditions={
                'sensor_type': 'temperature',
                'threshold': 35.0,  # °C
                'duration_minutes': 5,
                'consecutive_readings': 3
            },
            actions=[
                {
                    'type': 'notification',
                    'message': 'High temperature detected - check HVAC system'
                },
                {
                    'type': 'hvac_adjustment',
                    'parameter': 'cooling',
                    'value': 'increase'
                }
            ],
            priority=AdaptationPriority.HIGH,
            cooldown_minutes=30,
            enabled=True
        )

        # Rule 2: Energy waste detection
        self.rules['energy_waste'] = AdaptationRule(
            rule_id='energy_waste',
            name='Energy Waste Detection',
            description='Detect and correct energy waste in unoccupied areas',
            trigger_conditions={
                'sensor_type': 'occupancy',
                'occupancy_state': False,
                'energy_threshold': 50.0,  # Watts
                'duration_minutes': 10
            },
            actions=[
                {
                    'type': 'lighting_control',
                    'action': 'dim_to_minimum'
                },
                {
                    'type': 'energy_optimization',
                    'action': 'implement_occupancy_based_control'
                }
            ],
            priority=AdaptationPriority.MEDIUM,
            cooldown_minutes=15,
            enabled=True
        )

        # Rule 3: Predictive maintenance trigger
        self.rules['predictive_maintenance'] = AdaptationRule(
            rule_id='predictive_maintenance',
            name='Predictive Maintenance Alert',
            description='Trigger maintenance based on sensor predictions',
            trigger_conditions={
                'maintenance_priority': 'critical',
                'time_to_failure_days': 7
            },
            actions=[
                {
                    'type': 'maintenance_notification',
                    'message': 'Critical maintenance required'
                },
                {
                    'type': 'system_shutdown',
                    'component': 'affected_system',
                    'duration_minutes': 60
                }
            ],
            priority=AdaptationPriority.CRITICAL,
            cooldown_minutes=60,
            enabled=True
        )

        # Rule 4: Lighting optimization
        self.rules['lighting_optimization'] = AdaptationRule(
            rule_id='lighting_optimization',
            name='Lighting Optimization',
            description='Optimize lighting based on natural light and occupancy',
            trigger_conditions={
                'sensor_type': 'light_level',
                'natural_light_available': True,
                'occupancy': True,
                'energy_savings_potential': 0.15  # 15% savings
            },
            actions=[
                {
                    'type': 'lighting_control',
                    'action': 'adjust_brightness',
                    'reduction_percentage': 30
                },
                {
                    'type': 'daylight_harvesting',
                    'action': 'enable'
                }
            ],
            priority=AdaptationPriority.LOW,
            cooldown_minutes=5,
            enabled=True
        )

        # Rule 5: System health monitoring
        self.rules['system_health'] = AdaptationRule(
            rule_id='system_health',
            name='System Health Monitoring',
            description='Monitor overall system health and trigger diagnostics',
            trigger_conditions={
                'system_health_score': {'operator': '<', 'value': 70.0},
                'sensor_failure_rate': {'operator': '>', 'value': 0.1}
            },
            actions=[
                {
                    'type': 'diagnostic_run',
                    'systems': ['sensors', 'network', 'controls']
                },
                {
                    'type': 'notification',
                    'message': 'System health degraded - diagnostics initiated'
                }
            ],
            priority=AdaptationPriority.HIGH,
            cooldown_minutes=120,
            enabled=True
        )

    def add_adaptation_rule(self, rule: AdaptationRule):
        """Add a new adaptation rule"""
        self.rules[rule.rule_id] = rule
        self.logger.info(f"Added adaptation rule: {rule.rule_id}")

    def enable_rule(self, rule_id: str, enabled: bool = True):
        """Enable or disable an adaptation rule"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = enabled
            status = "enabled" if enabled else "disabled"
            self.logger.info(f"Rule {rule_id} {status}")

    def _handle_sensor_data(self, sensor_data: SensorData):
        """Handle incoming sensor data and check adaptation rules"""
        if not self.is_running:
            return

        # Check all enabled rules
        for rule in self.rules.values():
            if not rule.enabled:
                continue

            # Check cooldown period
            if rule.last_triggered and \
               (datetime.now() - rule.last_triggered).total_seconds() < (rule.cooldown_minutes * 60):
                continue

            # Evaluate rule conditions
            if self._evaluate_rule_conditions(rule, sensor_data):
                self._execute_adaptation_rule(rule, sensor_data)

    def _evaluate_rule_conditions(self, rule: AdaptationRule, sensor_data: SensorData) -> bool:
        """Evaluate if rule conditions are met"""
        conditions = rule.trigger_conditions

        # Sensor type matching
        if 'sensor_type' in conditions:
            if sensor_data.sensor_type.value != conditions['sensor_type']:
                return False

        # Threshold conditions
        if 'threshold' in conditions:
            if sensor_data.value <= conditions['threshold']:
                return False

        # For more complex rules, we would need historical data analysis
        # This is a simplified implementation

        # Special case: energy waste detection
        if rule.rule_id == 'energy_waste':
            # Check if area is unoccupied but consuming energy
            occupancy_data = self._get_recent_occupancy_data(sensor_data.location)
            energy_data = self._get_recent_energy_data(sensor_data.location)

            if occupancy_data and energy_data:
                avg_occupancy = sum(d.value for d in occupancy_data) / len(occupancy_data)
                avg_energy = sum(d.value for d in energy_data) / len(energy_data)

                if avg_occupancy < 0.1 and avg_energy > conditions.get('energy_threshold', 50.0):
                    return True

        # Special case: lighting optimization
        elif rule.rule_id == 'lighting_optimization':
            light_data = self._get_recent_light_data(sensor_data.location)
            occupancy_data = self._get_recent_occupancy_data(sensor_data.location)

            if light_data and occupancy_data:
                avg_light = sum(d.value for d in light_data) / len(light_data)
                avg_occupancy = sum(d.value for d in occupancy_data) / len(occupancy_data)

                # High natural light + occupied = opportunity for optimization
                if avg_light > 500 and avg_occupancy > 0.5:
                    return True

        return False

    def _execute_adaptation_rule(self, rule: AdaptationRule, sensor_data: SensorData):
        """Execute adaptation actions for a triggered rule"""
        self.logger.info(f"Executing adaptation rule: {rule.rule_id}")

        actions_taken = []
        outcome = "success"

        try:
            for action in rule.actions:
                action_result = self._execute_action(action, sensor_data)
                actions_taken.append(action_result)

                if not action_result.get('success', False):
                    outcome = "partial_failure"

            # Record the event
            event = AdaptationEvent(
                event_id=f"event_{int(time.time())}_{rule.rule_id}",
                timestamp=datetime.now(),
                rule_id=rule.rule_id,
                action_type=AdaptationAction(rule.actions[0]['type']) if rule.actions else AdaptationAction.LIGHTING_ADJUSTMENT,
                priority=rule.priority,
                description=f"Autonomous adaptation triggered: {rule.name}",
                sensor_data={
                    'sensor_id': sensor_data.sensor_id,
                    'value': sensor_data.value,
                    'location': sensor_data.location
                },
                actions_taken=actions_taken,
                outcome=outcome,
                confidence_score=0.85  # Simplified confidence score
            )

            self.event_history.append(event)
            rule.last_triggered = datetime.now()

            self.logger.info(f"Adaptation rule {rule.rule_id} executed successfully")

        except Exception as e:
            self.logger.error(f"Error executing adaptation rule {rule.rule_id}: {e}")
            outcome = "failure"

    def _execute_action(self, action: Dict[str, Any], sensor_data: SensorData) -> Dict[str, Any]:
        """Execute a specific adaptation action"""
        action_type = action.get('type')

        try:
            if action_type == 'notification':
                # Send notification (in real system, this would integrate with notification service)
                message = action.get('message', 'Adaptation action triggered')
                self.logger.info(f"NOTIFICATION: {message}")
                return {'success': True, 'action': 'notification', 'message': message}

            elif action_type == 'lighting_control':
                # Control lighting system
                lighting_action = action.get('action', 'adjust')
                if lighting_action == 'dim_to_minimum':
                    # Send MQTT command to lighting controller
                    topic = f"ceiling/commands/lighting_control"
                    payload = json.dumps({
                        'action': 'dim',
                        'level': 10,  # 10% brightness
                        'zone': sensor_data.location
                    })
                    self.sensor_network.mqtt.publish(topic, payload)
                    return {'success': True, 'action': 'lighting_dimmed', 'level': 10}

                elif lighting_action == 'adjust_brightness':
                    reduction = action.get('reduction_percentage', 30)
                    topic = f"ceiling/commands/lighting_control"
                    payload = json.dumps({
                        'action': 'adjust_brightness',
                        'reduction_percentage': reduction,
                        'zone': sensor_data.location
                    })
                    self.sensor_network.mqtt.publish(topic, payload)
                    return {'success': True, 'action': 'brightness_adjusted', 'reduction': reduction}

            elif action_type == 'hvac_adjustment':
                # Adjust HVAC system
                parameter = action.get('parameter', 'cooling')
                adjustment = action.get('value', 'increase')
                topic = f"ceiling/commands/hvac_control"
                payload = json.dumps({
                    'parameter': parameter,
                    'adjustment': adjustment,
                    'zone': sensor_data.location
                })
                self.sensor_network.mqtt.publish(topic, payload)
                return {'success': True, 'action': 'hvac_adjusted', 'parameter': parameter}

            elif action_type == 'energy_optimization':
                # Implement energy optimization
                optimization_action = action.get('action')
                if optimization_action == 'implement_occupancy_based_control':
                    # Enable occupancy-based controls
                    topic = f"ceiling/commands/energy_optimization"
                    payload = json.dumps({
                        'action': 'enable_occupancy_control',
                        'zone': sensor_data.location
                    })
                    self.sensor_network.mqtt.publish(topic, payload)
                    return {'success': True, 'action': 'occupancy_control_enabled'}

            elif action_type == 'maintenance_notification':
                # Send maintenance notification
                message = action.get('message', 'Maintenance required')
                self.logger.warning(f"MAINTENANCE ALERT: {message}")
                # In real system, this would trigger maintenance workflow
                return {'success': True, 'action': 'maintenance_notified', 'message': message}

            elif action_type == 'system_shutdown':
                # Shutdown affected system (safely)
                component = action.get('component', 'unknown')
                duration = action.get('duration_minutes', 60)
                topic = f"ceiling/commands/system_control"
                payload = json.dumps({
                    'action': 'shutdown',
                    'component': component,
                    'duration_minutes': duration
                })
                self.sensor_network.mqtt.publish(topic, payload)
                return {'success': True, 'action': 'system_shutdown', 'component': component}

            elif action_type == 'daylight_harvesting':
                # Enable daylight harvesting
                topic = f"ceiling/commands/lighting_control"
                payload = json.dumps({
                    'action': 'enable_daylight_harvesting',
                    'zone': sensor_data.location
                })
                self.sensor_network.mqtt.publish(topic, payload)
                return {'success': True, 'action': 'daylight_harvesting_enabled'}

            elif action_type == 'diagnostic_run':
                # Run system diagnostics
                systems = action.get('systems', ['sensors'])
                topic = f"ceiling/commands/diagnostics"
                payload = json.dumps({
                    'action': 'run_diagnostics',
                    'systems': systems
                })
                self.sensor_network.mqtt.publish(topic, payload)
                return {'success': True, 'action': 'diagnostics_started', 'systems': systems}

        except Exception as e:
            self.logger.error(f"Error executing action {action_type}: {e}")
            return {'success': False, 'action': action_type, 'error': str(e)}

        return {'success': False, 'action': action_type, 'error': 'Unknown action type'}

    def _get_recent_occupancy_data(self, location: Dict[str, float], minutes: int = 30) -> List[SensorData]:
        """Get recent occupancy data for a location"""
        # Find occupancy sensors in the area
        nodes = self.sensor_network.db.get_all_nodes()
        occupancy_sensors = []

        for node in nodes:
            if SensorType.OCCUPANCY in node.sensors:
                # Check if node is in the same general area
                if abs(node.location.get('x', 0) - location.get('x', 0)) < 1000 and \
                   abs(node.location.get('z', 0) - location.get('z', 0)) < 1000:
                    occupancy_sensors.append(f"{node.node_id}_occupancy")

        # Get data from these sensors
        all_data = []
        for sensor_id in occupancy_sensors:
            data = self.sensor_network.get_sensor_data(sensor_id, hours=1)
            # Filter to last N minutes
            cutoff = datetime.now() - timedelta(minutes=minutes)
            recent_data = [d for d in data if d.timestamp > cutoff]
            all_data.extend(recent_data)

        return all_data

    def _get_recent_energy_data(self, location: Dict[str, float], minutes: int = 30) -> List[SensorData]:
        """Get recent energy consumption data for a location"""
        nodes = self.sensor_network.db.get_all_nodes()
        energy_sensors = []

        for node in nodes:
            if SensorType.ENERGY_CONSUMPTION in node.sensors:
                if abs(node.location.get('x', 0) - location.get('x', 0)) < 1000 and \
                   abs(node.location.get('z', 0) - location.get('z', 0)) < 1000:
                    energy_sensors.append(f"{node.node_id}_energy_consumption")

        all_data = []
        for sensor_id in energy_sensors:
            data = self.sensor_network.get_sensor_data(sensor_id, hours=1)
            cutoff = datetime.now() - timedelta(minutes=minutes)
            recent_data = [d for d in data if d.timestamp > cutoff]
            all_data.extend(recent_data)

        return all_data

    def _get_recent_light_data(self, location: Dict[str, float], minutes: int = 30) -> List[SensorData]:
        """Get recent light level data for a location"""
        nodes = self.sensor_network.db.get_all_nodes()
        light_sensors = []

        for node in nodes:
            if SensorType.LIGHT_LEVEL in node.sensors:
                if abs(node.location.get('x', 0) - location.get('x', 0)) < 1000 and \
                   abs(node.location.get('z', 0) - location.get('z', 0)) < 1000:
                    light_sensors.append(f"{node.node_id}_light_level")

        all_data = []
        for sensor_id in light_sensors:
            data = self.sensor_network.get_sensor_data(sensor_id, hours=1)
            cutoff = datetime.now() - timedelta(minutes=minutes)
            recent_data = [d for d in data if d.timestamp > cutoff]
            all_data.extend(recent_data)

        return all_data

    def start_autonomous_mode(self):
        """Start autonomous adaptation monitoring"""
        if self.is_running:
            return

        self.is_running = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        self.logger.info("Autonomous adaptation system started")

    def stop_autonomous_mode(self):
        """Stop autonomous adaptation monitoring"""
        self.is_running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        self.logger.info("Autonomous adaptation system stopped")

    def _monitoring_loop(self):
        """Main monitoring loop for periodic checks"""
        while self.is_running:
            try:
                # Periodic system health checks
                self._perform_periodic_checks()

                # Sleep for monitoring interval
                time.sleep(60)  # Check every minute

            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(30)  # Wait before retrying

    def _perform_periodic_checks(self):
        """Perform periodic system-wide checks"""
        # Check system health
        system_health = self.maintenance_engine.analyze_system_health()

        if system_health['overall_health_score'] < 70:
            # Trigger system health rule
            if 'system_health' in self.rules and self.rules['system_health'].enabled:
                rule = self.rules['system_health']
                if not rule.last_triggered or \
                   (datetime.now() - rule.last_triggered).total_seconds() > (rule.cooldown_minutes * 60):
                    self._execute_system_health_rule(rule, system_health)

        # Check for critical maintenance predictions
        predictions = self.maintenance_engine.get_maintenance_schedule(7)  # Next 7 days
        critical_predictions = [p for p in predictions if p.priority.value == 'critical']

        if critical_predictions:
            # Trigger maintenance rule
            if 'predictive_maintenance' in self.rules and self.rules['predictive_maintenance'].enabled:
                rule = self.rules['predictive_maintenance']
                if not rule.last_triggered or \
                   (datetime.now() - rule.last_triggered).total_seconds() > (rule.cooldown_minutes * 60):
                    self._execute_maintenance_rule(rule, critical_predictions[0])

    def _execute_system_health_rule(self, rule: AdaptationRule, system_health: Dict[str, Any]):
        """Execute system health monitoring rule"""
        self.logger.warning("System health degraded - initiating diagnostics")

        actions_taken = []
        for action in rule.actions:
            if action['type'] == 'diagnostic_run':
                action_result = self._execute_action(action, None)  # No specific sensor data
                actions_taken.append(action_result)

        event = AdaptationEvent(
            event_id=f"health_check_{int(time.time())}",
            timestamp=datetime.now(),
            rule_id=rule.rule_id,
            action_type=AdaptationAction.SYSTEM_CALIBRATION,
            priority=AdaptationPriority.HIGH,
            description="System health check triggered diagnostics",
            sensor_data={'system_health_score': system_health['overall_health_score']},
            actions_taken=actions_taken,
            outcome="diagnostics_initiated",
            confidence_score=0.9
        )

        self.event_history.append(event)
        rule.last_triggered = datetime.now()

    def _execute_maintenance_rule(self, rule: AdaptationRule, prediction):
        """Execute predictive maintenance rule"""
        self.logger.critical(f"Critical maintenance prediction: {prediction.component_id}")

        actions_taken = []
        for action in rule.actions:
            action_result = self._execute_action(action, None)
            actions_taken.append(action_result)

        event = AdaptationEvent(
            event_id=f"maintenance_{int(time.time())}",
            timestamp=datetime.now(),
            rule_id=rule.rule_id,
            action_type=AdaptationAction.MAINTENANCE_TRIGGER,
            priority=AdaptationPriority.CRITICAL,
            description=f"Critical maintenance triggered for {prediction.component_id}",
            sensor_data={'prediction': prediction.to_dict()},
            actions_taken=actions_taken,
            outcome="maintenance_triggered",
            confidence_score=prediction.confidence
        )

        self.event_history.append(event)
        rule.last_triggered = datetime.now()

    def get_adaptation_status(self) -> Dict[str, Any]:
        """Get current status of autonomous adaptation system"""
        enabled_rules = sum(1 for rule in self.rules.values() if rule.enabled)
        recent_events = [e.to_dict() for e in self.event_history[-10:]]  # Last 10 events

        return {
            'is_running': self.is_running,
            'total_rules': len(self.rules),
            'enabled_rules': enabled_rules,
            'total_events': len(self.event_history),
            'recent_events': recent_events,
            'rules': [rule.to_dict() for rule in self.rules.values()]
        }

    def get_adaptation_events(self, hours: int = 24) -> List[AdaptationEvent]:
        """Get adaptation events from the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        return [e for e in self.event_history if e.timestamp > cutoff]


# Example usage
if __name__ == "__main__":
    from iot_sensor_network import SensorNetworkManager
    from predictive_maintenance import PredictiveMaintenanceEngine
    from energy_optimization import EnergyOptimizationEngine

    # Initialize components
    network = SensorNetworkManager()
    maintenance_engine = PredictiveMaintenanceEngine(network)
    energy_engine = EnergyOptimizationEngine(network)
    adaptation_system = AutonomousAdaptationSystem(network, maintenance_engine, energy_engine)

    print("=== Autonomous Adaptation System Demo ===")

    # Start autonomous mode
    adaptation_system.start_autonomous_mode()
    print("Autonomous adaptation system started")

    # Get status
    status = adaptation_system.get_adaptation_status()
    print(f"System status: {status['enabled_rules']} rules enabled, {status['total_events']} events")

    try:
        # Simulate some sensor data to trigger adaptations
        print("Simulating sensor data...")

        # Add a demo node first
        from iot_sensor_network import SensorNode, SensorStatus
        demo_node = SensorNode(
            node_id="demo_node_001",
            location={'x': 1000, 'y': 0, 'z': 2000},
            sensors=[SensorType.TEMPERATURE, SensorType.OCCUPANCY, SensorType.ENERGY_CONSUMPTION],
            status=SensorStatus.ONLINE,
            battery_level=95.0,
            last_seen=datetime.now(),
            firmware_version="1.0.0",
            capabilities={'wireless': True, 'battery_powered': True}
        )
        network.add_sensor_node(demo_node)

        # Simulate high temperature
        for i in range(5):
            network.simulate_sensor_data("demo_node_001", SensorType.TEMPERATURE, 38.0)
            time.sleep(1)

        # Simulate unoccupied area with energy consumption
        for i in range(3):
            network.simulate_sensor_data("demo_node_001", SensorType.OCCUPANCY, 0.0)
            network.simulate_sensor_data("demo_node_001", SensorType.ENERGY_CONSUMPTION, 75.0)
            time.sleep(2)

        # Wait a bit for processing
        time.sleep(5)

        # Check events
        events = adaptation_system.get_adaptation_events(hours=1)
        print(f"Adaptation events triggered: {len(events)}")
        for event in events:
            print(f"- {event.timestamp}: {event.description}")

    except KeyboardInterrupt:
        print("Stopping demo...")

    # Stop autonomous mode
    adaptation_system.stop_autonomous_mode()
    print("Autonomous adaptation system stopped")

    network.shutdown()