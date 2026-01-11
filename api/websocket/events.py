"""
WebSocket event definitions and handling.
"""

from enum import Enum
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, Optional, List, Callable
import json
import logging

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """WebSocket event types."""
    # Calculation events
    CALCULATION_STARTED = "calculation.started"
    CALCULATION_PROGRESS = "calculation.progress"
    CALCULATION_COMPLETED = "calculation.completed"
    CALCULATION_FAILED = "calculation.failed"

    # Project events
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_DELETED = "project.deleted"

    # Sensor/monitoring events
    SENSOR_READING = "sensor.reading"
    SENSOR_CONNECTED = "sensor.connected"
    SENSOR_DISCONNECTED = "sensor.disconnected"

    # Alert events
    ALERT_NEW = "alert.new"
    ALERT_RESOLVED = "alert.resolved"
    ALERT_ACKNOWLEDGED = "alert.acknowledged"

    # System events
    SYSTEM_STATUS = "system.status"
    SYSTEM_MAINTENANCE = "system.maintenance"

    # Connection events
    CONNECTION_ESTABLISHED = "connection.established"
    CONNECTION_ERROR = "connection.error"
    HEARTBEAT = "heartbeat"
    PONG = "pong"


@dataclass
class Event:
    """WebSocket event structure."""
    type: EventType
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    id: Optional[str] = None
    source: Optional[str] = None

    def __post_init__(self):
        if self.id is None:
            import uuid
            self.id = f"evt_{uuid.uuid4().hex[:12]}"

    def to_json(self) -> str:
        """Serialize event to JSON string."""
        return json.dumps({
            'id': self.id,
            'type': self.type.value if isinstance(self.type, EventType) else self.type,
            'data': self.data,
            'timestamp': self.timestamp.isoformat(),
            'source': self.source
        })

    @classmethod
    def from_json(cls, json_str: str) -> 'Event':
        """Deserialize event from JSON string."""
        data = json.loads(json_str)
        return cls(
            id=data.get('id'),
            type=EventType(data['type']),
            data=data.get('data', {}),
            timestamp=datetime.fromisoformat(data['timestamp']) if 'timestamp' in data else datetime.utcnow(),
            source=data.get('source')
        )


class EventEmitter:
    """
    Event emitter for pub/sub pattern.

    Allows subscribing to specific event types and emitting events.
    """

    def __init__(self):
        self._handlers: Dict[EventType, List[Callable]] = {}
        self._global_handlers: List[Callable] = []

    def on(self, event_type: EventType, handler: Callable):
        """
        Subscribe to a specific event type.

        Args:
            event_type: The event type to subscribe to
            handler: Callback function(event: Event)
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def on_all(self, handler: Callable):
        """
        Subscribe to all events.

        Args:
            handler: Callback function(event: Event)
        """
        self._global_handlers.append(handler)

    def off(self, event_type: EventType, handler: Callable):
        """
        Unsubscribe from an event type.

        Args:
            event_type: The event type to unsubscribe from
            handler: The handler to remove
        """
        if event_type in self._handlers:
            self._handlers[event_type] = [
                h for h in self._handlers[event_type] if h != handler
            ]

    def emit(self, event: Event):
        """
        Emit an event to all subscribers.

        Args:
            event: The event to emit
        """
        logger.debug(f"Emitting event: {event.type.value}")

        # Call type-specific handlers
        if event.type in self._handlers:
            for handler in self._handlers[event.type]:
                try:
                    handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler: {e}")

        # Call global handlers
        for handler in self._global_handlers:
            try:
                handler(event)
            except Exception as e:
                logger.error(f"Error in global event handler: {e}")

    def emit_raw(self, event_type: EventType, data: Dict[str, Any] = None, source: str = None):
        """
        Convenience method to emit an event with raw data.

        Args:
            event_type: The type of event
            data: Event data
            source: Event source identifier
        """
        event = Event(
            type=event_type,
            data=data or {},
            source=source
        )
        self.emit(event)


# Global event emitter instance
_emitter = EventEmitter()


def emit_event(event_type: EventType, data: Dict[str, Any] = None, source: str = None) -> Event:
    """
    Emit an event using the global emitter.

    Args:
        event_type: The type of event
        data: Event data
        source: Event source identifier

    Returns:
        The emitted event
    """
    event = Event(
        type=event_type,
        data=data or {},
        source=source
    )
    _emitter.emit(event)
    return event


def on_event(event_type: EventType, handler: Callable):
    """Subscribe to events using the global emitter."""
    _emitter.on(event_type, handler)


def on_all_events(handler: Callable):
    """Subscribe to all events using the global emitter."""
    _emitter.on_all(handler)


# Calculation event helpers
def emit_calculation_started(calculation_id: str, project_id: str = None):
    """Emit calculation started event."""
    return emit_event(
        EventType.CALCULATION_STARTED,
        {
            'calculation_id': calculation_id,
            'project_id': project_id,
            'status': 'started'
        }
    )


def emit_calculation_progress(calculation_id: str, progress: int, message: str = None):
    """Emit calculation progress event."""
    return emit_event(
        EventType.CALCULATION_PROGRESS,
        {
            'calculation_id': calculation_id,
            'progress': progress,
            'message': message
        }
    )


def emit_calculation_completed(calculation_id: str, result: Dict[str, Any]):
    """Emit calculation completed event."""
    return emit_event(
        EventType.CALCULATION_COMPLETED,
        {
            'calculation_id': calculation_id,
            'status': 'completed',
            'result': result
        }
    )


def emit_calculation_failed(calculation_id: str, error: str):
    """Emit calculation failed event."""
    return emit_event(
        EventType.CALCULATION_FAILED,
        {
            'calculation_id': calculation_id,
            'status': 'failed',
            'error': error
        }
    )


# Alert event helpers
def emit_alert(alert_id: str, severity: str, message: str, details: Dict[str, Any] = None):
    """Emit new alert event."""
    return emit_event(
        EventType.ALERT_NEW,
        {
            'alert_id': alert_id,
            'severity': severity,
            'message': message,
            'details': details or {}
        }
    )


def emit_alert_resolved(alert_id: str, resolved_by: str = None):
    """Emit alert resolved event."""
    return emit_event(
        EventType.ALERT_RESOLVED,
        {
            'alert_id': alert_id,
            'resolved_by': resolved_by,
            'resolved_at': datetime.utcnow().isoformat()
        }
    )
