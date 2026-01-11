"""
WebSocket room management for pub/sub channels.
"""

from typing import Dict, Set, Optional, Any, List
from dataclasses import dataclass, field
from datetime import datetime
import logging
import threading

logger = logging.getLogger(__name__)


@dataclass
class Connection:
    """Represents a WebSocket connection."""
    id: str
    websocket: Any  # The actual websocket object
    user_id: Optional[str] = None
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_ping: datetime = field(default_factory=datetime.utcnow)
    rooms: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_alive(self, timeout_seconds: int = 60) -> bool:
        """Check if connection is still alive based on last ping."""
        elapsed = (datetime.utcnow() - self.last_ping).total_seconds()
        return elapsed < timeout_seconds


@dataclass
class Room:
    """Represents a pub/sub room/channel."""
    name: str
    connections: Set[str] = field(default_factory=set)
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    max_connections: int = 1000

    def is_full(self) -> bool:
        """Check if room has reached max connections."""
        return len(self.connections) >= self.max_connections


class RoomManager:
    """
    Manages WebSocket rooms and connections.

    Provides room-based pub/sub functionality for real-time updates.
    """

    def __init__(self, max_rooms: int = 10000, max_connections_per_user: int = 5):
        self._rooms: Dict[str, Room] = {}
        self._connections: Dict[str, Connection] = {}
        self._user_connections: Dict[str, Set[str]] = {}
        self._lock = threading.Lock()
        self.max_rooms = max_rooms
        self.max_connections_per_user = max_connections_per_user

    def add_connection(
        self,
        connection_id: str,
        websocket: Any,
        user_id: Optional[str] = None
    ) -> Connection:
        """
        Add a new connection.

        Args:
            connection_id: Unique connection identifier
            websocket: The websocket object
            user_id: Optional user ID for authenticated connections

        Returns:
            The created Connection object

        Raises:
            ValueError: If user has too many connections
        """
        with self._lock:
            # Check user connection limit
            if user_id:
                user_conns = self._user_connections.get(user_id, set())
                if len(user_conns) >= self.max_connections_per_user:
                    raise ValueError(
                        f"User {user_id} has reached max connections ({self.max_connections_per_user})"
                    )

            connection = Connection(
                id=connection_id,
                websocket=websocket,
                user_id=user_id
            )

            self._connections[connection_id] = connection

            if user_id:
                if user_id not in self._user_connections:
                    self._user_connections[user_id] = set()
                self._user_connections[user_id].add(connection_id)

            logger.info(f"Connection added: {connection_id}")
            return connection

    def remove_connection(self, connection_id: str):
        """
        Remove a connection and clean up its room memberships.

        Args:
            connection_id: The connection to remove
        """
        with self._lock:
            connection = self._connections.get(connection_id)
            if not connection:
                return

            # Remove from all rooms
            for room_name in list(connection.rooms):
                self._leave_room_internal(connection_id, room_name)

            # Remove from user connections
            if connection.user_id:
                if connection.user_id in self._user_connections:
                    self._user_connections[connection.user_id].discard(connection_id)

            del self._connections[connection_id]
            logger.info(f"Connection removed: {connection_id}")

    def join_room(self, connection_id: str, room_name: str) -> bool:
        """
        Add a connection to a room.

        Args:
            connection_id: The connection ID
            room_name: The room to join

        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            connection = self._connections.get(connection_id)
            if not connection:
                return False

            # Create room if it doesn't exist
            if room_name not in self._rooms:
                if len(self._rooms) >= self.max_rooms:
                    logger.warning(f"Max rooms reached: {self.max_rooms}")
                    return False
                self._rooms[room_name] = Room(name=room_name)

            room = self._rooms[room_name]

            # Check if room is full
            if room.is_full():
                logger.warning(f"Room {room_name} is full")
                return False

            room.connections.add(connection_id)
            connection.rooms.add(room_name)

            logger.debug(f"Connection {connection_id} joined room {room_name}")
            return True

    def _leave_room_internal(self, connection_id: str, room_name: str):
        """Internal method to leave a room (no lock)."""
        connection = self._connections.get(connection_id)
        room = self._rooms.get(room_name)

        if connection:
            connection.rooms.discard(room_name)

        if room:
            room.connections.discard(connection_id)
            # Clean up empty rooms
            if len(room.connections) == 0:
                del self._rooms[room_name]

    def leave_room(self, connection_id: str, room_name: str):
        """
        Remove a connection from a room.

        Args:
            connection_id: The connection ID
            room_name: The room to leave
        """
        with self._lock:
            self._leave_room_internal(connection_id, room_name)
            logger.debug(f"Connection {connection_id} left room {room_name}")

    def get_room_connections(self, room_name: str) -> List[Connection]:
        """
        Get all connections in a room.

        Args:
            room_name: The room name

        Returns:
            List of connections in the room
        """
        with self._lock:
            room = self._rooms.get(room_name)
            if not room:
                return []

            return [
                self._connections[conn_id]
                for conn_id in room.connections
                if conn_id in self._connections
            ]

    def get_connection(self, connection_id: str) -> Optional[Connection]:
        """Get a connection by ID."""
        return self._connections.get(connection_id)

    def get_user_connections(self, user_id: str) -> List[Connection]:
        """Get all connections for a user."""
        with self._lock:
            conn_ids = self._user_connections.get(user_id, set())
            return [
                self._connections[conn_id]
                for conn_id in conn_ids
                if conn_id in self._connections
            ]

    def update_ping(self, connection_id: str):
        """Update the last ping time for a connection."""
        connection = self._connections.get(connection_id)
        if connection:
            connection.last_ping = datetime.utcnow()

    def cleanup_stale_connections(self, timeout_seconds: int = 60):
        """
        Remove connections that haven't pinged recently.

        Args:
            timeout_seconds: Connections older than this are removed
        """
        with self._lock:
            stale = [
                conn_id for conn_id, conn in self._connections.items()
                if not conn.is_alive(timeout_seconds)
            ]

        for conn_id in stale:
            logger.info(f"Removing stale connection: {conn_id}")
            self.remove_connection(conn_id)

    def broadcast_to_room(self, room_name: str, message: str) -> int:
        """
        Send a message to all connections in a room.

        Args:
            room_name: The room to broadcast to
            message: The message to send

        Returns:
            Number of connections the message was sent to
        """
        connections = self.get_room_connections(room_name)
        sent_count = 0

        for conn in connections:
            try:
                # This would be overridden based on the websocket implementation
                if hasattr(conn.websocket, 'send'):
                    conn.websocket.send(message)
                    sent_count += 1
            except Exception as e:
                logger.error(f"Error sending to {conn.id}: {e}")

        return sent_count

    def broadcast_to_user(self, user_id: str, message: str) -> int:
        """
        Send a message to all connections for a user.

        Args:
            user_id: The user ID
            message: The message to send

        Returns:
            Number of connections the message was sent to
        """
        connections = self.get_user_connections(user_id)
        sent_count = 0

        for conn in connections:
            try:
                if hasattr(conn.websocket, 'send'):
                    conn.websocket.send(message)
                    sent_count += 1
            except Exception as e:
                logger.error(f"Error sending to {conn.id}: {e}")

        return sent_count

    def get_stats(self) -> Dict[str, Any]:
        """Get room manager statistics."""
        with self._lock:
            return {
                'total_connections': len(self._connections),
                'total_rooms': len(self._rooms),
                'total_users': len(self._user_connections),
                'rooms': {
                    name: len(room.connections)
                    for name, room in self._rooms.items()
                }
            }


# Standard room names
class StandardRooms:
    """Standard room name constants."""
    MONITORING = "monitoring"
    ALERTS = "alerts"
    SYSTEM = "system"

    @staticmethod
    def calculation(calculation_id: str) -> str:
        """Room name for a specific calculation."""
        return f"calculation:{calculation_id}"

    @staticmethod
    def project(project_id: str) -> str:
        """Room name for a specific project."""
        return f"project:{project_id}"

    @staticmethod
    def user(user_id: str) -> str:
        """Room name for a specific user."""
        return f"user:{user_id}"
