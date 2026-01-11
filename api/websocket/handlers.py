"""
WebSocket connection handlers.
"""

import json
import asyncio
import logging
from typing import Optional, Dict, Any, Callable
from datetime import datetime
import uuid

from .events import Event, EventType, emit_event
from .rooms import RoomManager, StandardRooms

logger = logging.getLogger(__name__)


class WebSocketHandler:
    """
    Handles WebSocket connections and message routing.

    Supports:
    - Room-based subscriptions
    - Heartbeat/ping-pong
    - Event broadcasting
    - Connection management
    """

    def __init__(self, room_manager: RoomManager = None):
        self.room_manager = room_manager or RoomManager()
        self._message_handlers: Dict[str, Callable] = {}
        self._setup_default_handlers()

    def _setup_default_handlers(self):
        """Set up default message handlers."""
        self._message_handlers = {
            'ping': self._handle_ping,
            'subscribe': self._handle_subscribe,
            'unsubscribe': self._handle_unsubscribe,
            'broadcast': self._handle_broadcast,
        }

    def register_handler(self, message_type: str, handler: Callable):
        """
        Register a custom message handler.

        Args:
            message_type: The message type to handle
            handler: Async function(connection_id, data) -> response
        """
        self._message_handlers[message_type] = handler

    async def on_connect(
        self,
        websocket,
        connection_id: str = None,
        user_id: str = None
    ) -> str:
        """
        Handle new WebSocket connection.

        Args:
            websocket: The websocket object
            connection_id: Optional connection ID (generated if not provided)
            user_id: Optional authenticated user ID

        Returns:
            The connection ID
        """
        if connection_id is None:
            connection_id = f"ws_{uuid.uuid4().hex[:12]}"

        try:
            self.room_manager.add_connection(connection_id, websocket, user_id)

            # Send welcome message
            welcome = Event(
                type=EventType.CONNECTION_ESTABLISHED,
                data={
                    'connection_id': connection_id,
                    'user_id': user_id,
                    'message': 'Connected to Ceiling Panel Calculator WebSocket'
                }
            )
            await self._send(websocket, welcome.to_json())

            logger.info(f"WebSocket connected: {connection_id}")
            return connection_id

        except ValueError as e:
            error = Event(
                type=EventType.CONNECTION_ERROR,
                data={'error': str(e)}
            )
            await self._send(websocket, error.to_json())
            raise

    async def on_disconnect(self, connection_id: str):
        """
        Handle WebSocket disconnection.

        Args:
            connection_id: The connection that disconnected
        """
        self.room_manager.remove_connection(connection_id)
        logger.info(f"WebSocket disconnected: {connection_id}")

    async def on_message(self, connection_id: str, message: str) -> Optional[str]:
        """
        Handle incoming WebSocket message.

        Args:
            connection_id: The source connection
            message: The raw message string

        Returns:
            Optional response message
        """
        try:
            data = json.loads(message)
            message_type = data.get('type', 'unknown')
            payload = data.get('data', {})

            logger.debug(f"Received {message_type} from {connection_id}")

            # Route to handler
            handler = self._message_handlers.get(message_type)
            if handler:
                response = await handler(connection_id, payload)
                return json.dumps(response) if response else None
            else:
                return json.dumps({
                    'type': 'error',
                    'data': {'message': f'Unknown message type: {message_type}'}
                })

        except json.JSONDecodeError:
            return json.dumps({
                'type': 'error',
                'data': {'message': 'Invalid JSON'}
            })
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            return json.dumps({
                'type': 'error',
                'data': {'message': str(e)}
            })

    async def _handle_ping(self, connection_id: str, data: Dict[str, Any]) -> Dict:
        """Handle ping message."""
        self.room_manager.update_ping(connection_id)
        return {
            'type': 'pong',
            'data': {
                'timestamp': datetime.utcnow().isoformat(),
                'echo': data.get('timestamp')
            }
        }

    async def _handle_subscribe(self, connection_id: str, data: Dict[str, Any]) -> Dict:
        """Handle room subscription request."""
        room = data.get('room')
        if not room:
            return {
                'type': 'error',
                'data': {'message': 'Room name required'}
            }

        success = self.room_manager.join_room(connection_id, room)
        return {
            'type': 'subscribed' if success else 'error',
            'data': {
                'room': room,
                'success': success,
                'message': f'Subscribed to {room}' if success else f'Failed to join {room}'
            }
        }

    async def _handle_unsubscribe(self, connection_id: str, data: Dict[str, Any]) -> Dict:
        """Handle room unsubscription request."""
        room = data.get('room')
        if not room:
            return {
                'type': 'error',
                'data': {'message': 'Room name required'}
            }

        self.room_manager.leave_room(connection_id, room)
        return {
            'type': 'unsubscribed',
            'data': {'room': room}
        }

    async def _handle_broadcast(self, connection_id: str, data: Dict[str, Any]) -> Dict:
        """Handle broadcast request (if authorized)."""
        room = data.get('room')
        message = data.get('message')

        if not room or not message:
            return {
                'type': 'error',
                'data': {'message': 'Room and message required'}
            }

        # Check if connection is in the room
        connection = self.room_manager.get_connection(connection_id)
        if not connection or room not in connection.rooms:
            return {
                'type': 'error',
                'data': {'message': 'Not subscribed to room'}
            }

        # Broadcast to room
        event = Event(
            type=EventType.SYSTEM_STATUS,
            data={'message': message, 'sender': connection_id},
            source=connection_id
        )

        count = await self.broadcast_to_room(room, event)
        return {
            'type': 'broadcast_sent',
            'data': {'room': room, 'recipients': count}
        }

    async def broadcast_to_room(self, room_name: str, event: Event) -> int:
        """
        Broadcast an event to all connections in a room.

        Args:
            room_name: The room to broadcast to
            event: The event to send

        Returns:
            Number of connections reached
        """
        connections = self.room_manager.get_room_connections(room_name)
        message = event.to_json()
        sent_count = 0

        for conn in connections:
            try:
                await self._send(conn.websocket, message)
                sent_count += 1
            except Exception as e:
                logger.error(f"Error sending to {conn.id}: {e}")

        return sent_count

    async def broadcast_to_user(self, user_id: str, event: Event) -> int:
        """
        Broadcast an event to all connections for a user.

        Args:
            user_id: The user ID
            event: The event to send

        Returns:
            Number of connections reached
        """
        connections = self.room_manager.get_user_connections(user_id)
        message = event.to_json()
        sent_count = 0

        for conn in connections:
            try:
                await self._send(conn.websocket, message)
                sent_count += 1
            except Exception as e:
                logger.error(f"Error sending to {conn.id}: {e}")

        return sent_count

    async def send_to_connection(self, connection_id: str, event: Event):
        """
        Send an event to a specific connection.

        Args:
            connection_id: The target connection
            event: The event to send
        """
        connection = self.room_manager.get_connection(connection_id)
        if connection:
            await self._send(connection.websocket, event.to_json())

    async def _send(self, websocket, message: str):
        """
        Send a message through a websocket.

        Handles both sync and async websockets.
        """
        if asyncio.iscoroutinefunction(getattr(websocket, 'send', None)):
            await websocket.send(message)
        elif hasattr(websocket, 'send'):
            websocket.send(message)
        else:
            logger.warning("Websocket has no send method")

    def get_stats(self) -> Dict[str, Any]:
        """Get handler statistics."""
        return self.room_manager.get_stats()


# Calculation progress tracking
class CalculationProgressTracker:
    """
    Tracks calculation progress and broadcasts updates.
    """

    def __init__(self, handler: WebSocketHandler):
        self.handler = handler
        self._active_calculations: Dict[str, Dict[str, Any]] = {}

    async def start_calculation(self, calculation_id: str, project_id: str = None):
        """
        Start tracking a calculation.

        Args:
            calculation_id: The calculation ID
            project_id: Optional project ID
        """
        self._active_calculations[calculation_id] = {
            'started_at': datetime.utcnow(),
            'progress': 0,
            'project_id': project_id
        }

        event = Event(
            type=EventType.CALCULATION_STARTED,
            data={
                'calculation_id': calculation_id,
                'project_id': project_id,
                'status': 'started'
            }
        )

        room = StandardRooms.calculation(calculation_id)
        await self.handler.broadcast_to_room(room, event)

        if project_id:
            project_room = StandardRooms.project(project_id)
            await self.handler.broadcast_to_room(project_room, event)

    async def update_progress(
        self,
        calculation_id: str,
        progress: int,
        message: str = None
    ):
        """
        Update calculation progress.

        Args:
            calculation_id: The calculation ID
            progress: Progress percentage (0-100)
            message: Optional status message
        """
        if calculation_id in self._active_calculations:
            self._active_calculations[calculation_id]['progress'] = progress

        event = Event(
            type=EventType.CALCULATION_PROGRESS,
            data={
                'calculation_id': calculation_id,
                'progress': progress,
                'message': message
            }
        )

        room = StandardRooms.calculation(calculation_id)
        await self.handler.broadcast_to_room(room, event)

    async def complete_calculation(
        self,
        calculation_id: str,
        result: Dict[str, Any]
    ):
        """
        Mark calculation as complete.

        Args:
            calculation_id: The calculation ID
            result: The calculation result
        """
        calc_info = self._active_calculations.pop(calculation_id, {})

        event = Event(
            type=EventType.CALCULATION_COMPLETED,
            data={
                'calculation_id': calculation_id,
                'status': 'completed',
                'result': result,
                'duration_ms': (
                    (datetime.utcnow() - calc_info.get('started_at', datetime.utcnow()))
                    .total_seconds() * 1000
                ) if 'started_at' in calc_info else None
            }
        )

        room = StandardRooms.calculation(calculation_id)
        await self.handler.broadcast_to_room(room, event)

        if calc_info.get('project_id'):
            project_room = StandardRooms.project(calc_info['project_id'])
            await self.handler.broadcast_to_room(project_room, event)

    async def fail_calculation(self, calculation_id: str, error: str):
        """
        Mark calculation as failed.

        Args:
            calculation_id: The calculation ID
            error: Error message
        """
        self._active_calculations.pop(calculation_id, None)

        event = Event(
            type=EventType.CALCULATION_FAILED,
            data={
                'calculation_id': calculation_id,
                'status': 'failed',
                'error': error
            }
        )

        room = StandardRooms.calculation(calculation_id)
        await self.handler.broadcast_to_room(room, event)
