#!/usr/bin/env python3
"""
IoT Sensor Network for Smart Building Integration
Implements sensor network design, MQTT communication, and real-time data processing.
"""

import json
import time
import random
import threading
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import paho.mqtt.client as mqtt
import sqlite3
from pathlib import Path


class SensorType(Enum):
    """Types of sensors in the smart building network"""
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    LIGHT_LEVEL = "light_level"
    OCCUPANCY = "occupancy"
    VIBRATION = "vibration"
    SOUND_LEVEL = "sound_level"
    AIR_QUALITY = "air_quality"
    ENERGY_CONSUMPTION = "energy_consumption"
    PANEL_STATUS = "panel_status"


class SensorStatus(Enum):
    """Sensor operational status"""
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"


@dataclass
class SensorData:
    """Real-time sensor data point"""
    sensor_id: str
    sensor_type: SensorType
    value: float
    unit: str
    timestamp: datetime
    location: Dict[str, float]  # {'x': float, 'y': float, 'z': float}
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict:
        return {
            'sensor_id': self.sensor_id,
            'sensor_type': self.sensor_type.value,
            'value': self.value,
            'unit': self.unit,
            'timestamp': self.timestamp.isoformat(),
            'location': self.location,
            'metadata': self.metadata or {}
        }


@dataclass
class SensorNode:
    """Physical sensor node in the network"""
    node_id: str
    location: Dict[str, float]
    sensors: List[SensorType]
    status: SensorStatus
    battery_level: float
    last_seen: datetime
    firmware_version: str
    capabilities: Dict[str, Any]

    def to_dict(self) -> Dict:
        return {
            'node_id': self.node_id,
            'location': self.location,
            'sensors': [s.value for s in self.sensors],
            'status': self.status.value,
            'battery_level': self.battery_level,
            'last_seen': self.last_seen.isoformat(),
            'firmware_version': self.firmware_version,
            'capabilities': self.capabilities
        }


class SensorNetworkDatabase:
    """SQLite database for sensor data storage"""

    def __init__(self, db_path: str = "sensor_network.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS sensor_nodes (
                    node_id TEXT PRIMARY KEY,
                    location TEXT NOT NULL,
                    sensors TEXT NOT NULL,
                    status TEXT NOT NULL,
                    battery_level REAL,
                    last_seen TEXT NOT NULL,
                    firmware_version TEXT,
                    capabilities TEXT
                )
            ''')

            conn.execute('''
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sensor_id TEXT NOT NULL,
                    sensor_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    unit TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    location TEXT NOT NULL,
                    metadata TEXT,
                    created_at REAL
                )
            ''')

            # Create indexes for performance
            conn.execute('CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id ON sensor_data(sensor_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_sensor_data_type ON sensor_data(sensor_type)')

    def save_sensor_node(self, node: SensorNode):
        """Save or update sensor node"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO sensor_nodes
                (node_id, location, sensors, status, battery_level, last_seen, firmware_version, capabilities)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                node.node_id,
                json.dumps(node.location),
                json.dumps([s.value for s in node.sensors]),
                node.status.value,
                node.battery_level,
                node.last_seen.isoformat(),
                node.firmware_version,
                json.dumps(node.capabilities)
            ))

    def save_sensor_data(self, data: SensorData):
        """Save sensor data point"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO sensor_data
                (sensor_id, sensor_type, value, unit, timestamp, location, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.sensor_id,
                data.sensor_type.value,
                data.value,
                data.unit,
                data.timestamp.isoformat(),
                json.dumps(data.location),
                json.dumps(data.metadata) if data.metadata else None,
                time.time()
            ))

    def get_recent_data(self, sensor_id: str, hours: int = 24) -> List[SensorData]:
        """Get recent sensor data"""
        cutoff = datetime.now() - timedelta(hours=hours)
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute('''
                SELECT sensor_id, sensor_type, value, unit, timestamp, location, metadata
                FROM sensor_data
                WHERE sensor_id = ? AND timestamp > ?
                ORDER BY timestamp DESC
            ''', (sensor_id, cutoff.isoformat())).fetchall()

        return [SensorData(
            sensor_id=row[0],
            sensor_type=SensorType(row[1]),
            value=row[2],
            unit=row[3],
            timestamp=datetime.fromisoformat(row[4]),
            location=json.loads(row[5]),
            metadata=json.loads(row[6]) if row[6] else None
        ) for row in rows]

    def get_all_nodes(self) -> List[SensorNode]:
        """Get all sensor nodes"""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute('SELECT * FROM sensor_nodes').fetchall()

        nodes = []
        for row in rows:
            nodes.append(SensorNode(
                node_id=row[0],
                location=json.loads(row[1]),
                sensors=[SensorType(s) for s in json.loads(row[2])],
                status=SensorStatus(row[3]),
                battery_level=row[4],
                last_seen=datetime.fromisoformat(row[5]),
                firmware_version=row[6],
                capabilities=json.loads(row[7]) if row[7] else {}
            ))
        return nodes


class MQTTBroker:
    """MQTT broker for IoT communication"""

    def __init__(self, broker_host: str = "localhost", broker_port: int = 1883,
                 client_id: str = "ceiling_iot_broker"):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client_id = client_id
        self.client = None
        self.connected = False
        self.subscriptions: Dict[str, Callable] = {}
        self._connect()

    def _connect(self):
        """Connect to MQTT broker"""
        try:
            self.client = mqtt.Client(client_id=self.client_id)
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.on_disconnect = self._on_disconnect

            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"MQTT Connection failed: {e}")
            self.connected = False

    def _on_connect(self, client, userdata, flags, rc):
        """MQTT connect callback"""
        if rc == 0:
            self.connected = True
            print(f"Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
            # Resubscribe to all topics
            for topic in self.subscriptions:
                self.client.subscribe(topic)
        else:
            print(f"MQTT connection failed with code {rc}")
            self.connected = False

    def _on_message(self, client, userdata, msg):
        """MQTT message callback"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')

            if topic in self.subscriptions:
                self.subscriptions[topic](topic, payload)
        except Exception as e:
            print(f"Error processing MQTT message: {e}")

    def _on_disconnect(self, client, userdata, rc):
        """MQTT disconnect callback"""
        self.connected = False
        print("Disconnected from MQTT broker")
        if rc != 0:
            print("Unexpected disconnection, attempting reconnect...")
            time.sleep(5)
            self._connect()

    def subscribe(self, topic: str, callback: Callable):
        """Subscribe to MQTT topic"""
        self.subscriptions[topic] = callback
        if self.connected:
            self.client.subscribe(topic)

    def publish(self, topic: str, payload: str, qos: int = 0, retain: bool = False):
        """Publish message to MQTT topic"""
        if self.connected:
            self.client.publish(topic, payload, qos=qos, retain=retain)
        else:
            print("MQTT not connected, cannot publish")

    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()


class SensorNetworkManager:
    """Main sensor network management system"""

    def __init__(self, db_path: str = "sensor_network.db",
                 mqtt_host: str = "localhost", mqtt_port: int = 1883):
        self.db = SensorNetworkDatabase(db_path)
        self.mqtt = MQTTBroker(mqtt_host, mqtt_port)
        self.nodes: Dict[str, SensorNode] = {}
        self.data_callbacks: List[Callable] = []
        self._load_existing_nodes()
        self._setup_mqtt_subscriptions()

    def _load_existing_nodes(self):
        """Load existing sensor nodes from database"""
        nodes = self.db.get_all_nodes()
        for node in nodes:
            self.nodes[node.node_id] = node

    def _setup_mqtt_subscriptions(self):
        """Setup MQTT topic subscriptions"""
        # Subscribe to sensor data topics
        self.mqtt.subscribe("ceiling/sensors/+/data", self._handle_sensor_data)
        self.mqtt.subscribe("ceiling/nodes/+/status", self._handle_node_status)
        self.mqtt.subscribe("ceiling/commands/+", self._handle_commands)

    def _handle_sensor_data(self, topic: str, payload: str):
        """Handle incoming sensor data"""
        try:
            # Parse topic: ceiling/sensors/{sensor_id}/data
            parts = topic.split('/')
            if len(parts) >= 4:
                sensor_id = parts[2]
                data_dict = json.loads(payload)

                sensor_data = SensorData(
                    sensor_id=sensor_id,
                    sensor_type=SensorType(data_dict['sensor_type']),
                    value=data_dict['value'],
                    unit=data_dict['unit'],
                    timestamp=datetime.fromisoformat(data_dict['timestamp']),
                    location=data_dict['location'],
                    metadata=data_dict.get('metadata')
                )

                # Save to database
                self.db.save_sensor_data(sensor_data)

                # Notify callbacks
                for callback in self.data_callbacks:
                    try:
                        callback(sensor_data)
                    except Exception as e:
                        print(f"Error in data callback: {e}")

        except Exception as e:
            print(f"Error handling sensor data: {e}")

    def _handle_node_status(self, topic: str, payload: str):
        """Handle node status updates"""
        try:
            parts = topic.split('/')
            if len(parts) >= 4:
                node_id = parts[2]
                status_dict = json.loads(payload)

                # Update node status
                if node_id in self.nodes:
                    self.nodes[node_id].status = SensorStatus(status_dict['status'])
                    self.nodes[node_id].battery_level = status_dict.get('battery_level', 100.0)
                    self.nodes[node_id].last_seen = datetime.now()
                    self.db.save_sensor_node(self.nodes[node_id])

        except Exception as e:
            print(f"Error handling node status: {e}")

    def _handle_commands(self, topic: str, payload: str):
        """Handle incoming commands"""
        try:
            parts = topic.split('/')
            if len(parts) >= 3:
                target = parts[2]  # node_id or 'all'
                command_dict = json.loads(payload)

                print(f"Received command for {target}: {command_dict}")

                # Here you would implement command handling logic
                # For example: calibration, firmware updates, etc.

        except Exception as e:
            print(f"Error handling command: {e}")

    def add_sensor_node(self, node: SensorNode):
        """Add a new sensor node to the network"""
        self.nodes[node.node_id] = node
        self.db.save_sensor_node(node)

        # Publish node registration
        self.mqtt.publish(f"ceiling/nodes/{node.node_id}/registration",
                         json.dumps(node.to_dict()), retain=True)

    def register_data_callback(self, callback: Callable):
        """Register callback for sensor data events"""
        self.data_callbacks.append(callback)

    def get_sensor_data(self, sensor_id: str, hours: int = 24) -> List[SensorData]:
        """Get recent sensor data"""
        return self.db.get_recent_data(sensor_id, hours)

    def get_network_status(self) -> Dict:
        """Get overall network status"""
        total_nodes = len(self.nodes)
        online_nodes = sum(1 for node in self.nodes.values()
                          if node.status == SensorStatus.ONLINE)
        offline_nodes = total_nodes - online_nodes

        return {
            'total_nodes': total_nodes,
            'online_nodes': online_nodes,
            'offline_nodes': offline_nodes,
            'network_health': (online_nodes / total_nodes * 100) if total_nodes > 0 else 0
        }

    def simulate_sensor_data(self, node_id: str, sensor_type: SensorType,
                           base_value: float, variance: float = 0.1):
        """Simulate sensor data for testing (development only)"""
        if node_id not in self.nodes:
            return

        node = self.nodes[node_id]
        if sensor_type not in node.sensors:
            return

        # Generate realistic sensor values
        if sensor_type == SensorType.TEMPERATURE:
            value = base_value + random.uniform(-variance * 10, variance * 10)
            unit = "°C"
        elif sensor_type == SensorType.HUMIDITY:
            value = max(0, min(100, base_value + random.uniform(-variance * 20, variance * 20)))
            unit = "%"
        elif sensor_type == SensorType.LIGHT_LEVEL:
            value = max(0, base_value + random.uniform(-variance * 500, variance * 500))
            unit = "lux"
        elif sensor_type == SensorType.OCCUPANCY:
            value = 1.0 if random.random() > 0.7 else 0.0  # 30% occupancy
            unit = "boolean"
        elif sensor_type == SensorType.ENERGY_CONSUMPTION:
            value = max(0, base_value + random.uniform(-variance * 50, variance * 50))
            unit = "W"
        else:
            value = base_value + random.uniform(-variance * base_value, variance * base_value)
            unit = "units"

        sensor_data = SensorData(
            sensor_id=f"{node_id}_{sensor_type.value}",
            sensor_type=sensor_type,
            value=round(value, 2),
            unit=unit,
            timestamp=datetime.now(),
            location=node.location,
            metadata={'simulated': True}
        )

        # Publish to MQTT
        topic = f"ceiling/sensors/{sensor_data.sensor_id}/data"
        self.mqtt.publish(topic, json.dumps(sensor_data.to_dict()))

    def shutdown(self):
        """Shutdown the sensor network"""
        self.mqtt.disconnect()
        print("Sensor network shutdown complete")


# Example usage and testing
if __name__ == "__main__":
    # Initialize sensor network
    network = SensorNetworkManager()

    # Add some example sensor nodes
    example_nodes = [
        SensorNode(
            node_id="ceiling_node_001",
            location={'x': 1000, 'y': 0, 'z': 2000},
            sensors=[SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.LIGHT_LEVEL],
            status=SensorStatus.ONLINE,
            battery_level=95.0,
            last_seen=datetime.now(),
            firmware_version="1.0.0",
            capabilities={'wireless': True, 'battery_powered': True}
        ),
        SensorNode(
            node_id="ceiling_node_002",
            location={'x': 3000, 'y': 0, 'z': 2000},
            sensors=[SensorType.OCCUPANCY, SensorType.ENERGY_CONSUMPTION],
            status=SensorStatus.ONLINE,
            battery_level=87.0,
            last_seen=datetime.now(),
            firmware_version="1.0.0",
            capabilities={'wireless': True, 'poe_powered': True}
        )
    ]

    for node in example_nodes:
        network.add_sensor_node(node)

    # Data callback example
    def print_sensor_data(data: SensorData):
        print(f"Sensor {data.sensor_id}: {data.value} {data.unit} at {data.timestamp}")

    network.register_data_callback(print_sensor_data)

    # Simulate some sensor data
    print("Starting sensor data simulation...")
    try:
        for _ in range(10):
            for node in example_nodes:
                for sensor_type in node.sensors:
                    if sensor_type == SensorType.TEMPERATURE:
                        network.simulate_sensor_data(node.node_id, sensor_type, 22.0)
                    elif sensor_type == SensorType.HUMIDITY:
                        network.simulate_sensor_data(node.node_id, sensor_type, 45.0)
                    elif sensor_type == SensorType.LIGHT_LEVEL:
                        network.simulate_sensor_data(node.node_id, sensor_type, 300.0)
                    elif sensor_type == SensorType.OCCUPANCY:
                        network.simulate_sensor_data(node.node_id, sensor_type, 0.0)
                    elif sensor_type == SensorType.ENERGY_CONSUMPTION:
                        network.simulate_sensor_data(node.node_id, sensor_type, 25.0)
            time.sleep(2)

    except KeyboardInterrupt:
        print("Stopping simulation...")

    # Print network status
    status = network.get_network_status()
    print(f"Network Status: {status}")

    network.shutdown()