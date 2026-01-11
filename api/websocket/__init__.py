"""
WebSocket module for real-time updates.
"""

from .handlers import WebSocketHandler
from .events import EventType, Event, emit_event
from .rooms import RoomManager

__all__ = [
    'WebSocketHandler',
    'EventType',
    'Event',
    'emit_event',
    'RoomManager',
]
