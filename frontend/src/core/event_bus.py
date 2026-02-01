"""Event bus system for decoupled component communication."""

from typing import Callable, Dict, List, Any
from dataclasses import dataclass
from enum import Enum


class EventPriority(Enum):
    """Priority levels for event handlers."""

    HIGH = 0
    NORMAL = 1
    LOW = 2


@dataclass
class Event:
    """Event data structure."""

    type: str
    data: Any = None
    source: str = None


class EventBus:
    """Central event bus for publish-subscribe pattern.

    Allows components to communicate without direct coupling.
    """

    def __init__(self):
        self._handlers: Dict[str, List[tuple]] = {}
        self._history: List[Event] = []
        self._max_history = 100

    def subscribe(
        self,
        event_type: str,
        handler: Callable,
        priority: EventPriority = EventPriority.NORMAL,
    ) -> Callable:
        """Subscribe to an event type.

        Args:
            event_type: Type of event to subscribe to
            handler: Function to call when event occurs
            priority: Handler priority (HIGH runs first)

        Returns:
            Unsubscribe function
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []

        self._handlers[event_type].append((priority.value, handler))
        self._handlers[event_type].sort(key=lambda x: x[0])

        def unsubscribe():
            self._handlers[event_type] = [
                (p, h) for p, h in self._handlers[event_type] if h != handler
            ]

        return unsubscribe

    def publish(self, event_type: str, data: Any = None, source: str = None) -> None:
        """Publish an event to all subscribers.

        Args:
            event_type: Type of event
            data: Event data
            source: Source component identifier
        """
        event = Event(type=event_type, data=data, source=source)

        # Add to history
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        # Notify handlers
        if event_type in self._handlers:
            for _, handler in self._handlers[event_type]:
                try:
                    handler(event)
                except Exception as e:
                    print(f"Error in event handler for {event_type}: {e}")

    def get_history(self, event_type: str = None) -> List[Event]:
        """Get event history.

        Args:
            event_type: Filter by event type (optional)

        Returns:
            List of events
        """
        if event_type:
            return [e for e in self._history if e.type == event_type]
        return self._history.copy()

    def clear_history(self) -> None:
        """Clear event history."""
        self._history.clear()


# Global event bus instance
event_bus = EventBus()
