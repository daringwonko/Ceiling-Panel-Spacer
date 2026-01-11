"""
Example WebSocket client for Ceiling Panel Calculator.

Demonstrates how to connect to the WebSocket server and receive real-time updates.
"""

import asyncio
import json
import sys

# Try to use websockets library if available
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("Note: websockets library not installed. Install with: pip install websockets")


async def demo_websocket_client(uri: str = "ws://localhost:5000/ws"):
    """
    Demo WebSocket client that connects and receives events.

    Args:
        uri: WebSocket server URI
    """
    if not HAS_WEBSOCKETS:
        print("websockets library required. Install with: pip install websockets")
        return

    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")

            # Subscribe to monitoring room
            await websocket.send(json.dumps({
                'type': 'subscribe',
                'data': {'room': 'monitoring'}
            }))
            print("Subscribed to monitoring room")

            # Subscribe to alerts room
            await websocket.send(json.dumps({
                'type': 'subscribe',
                'data': {'room': 'alerts'}
            }))
            print("Subscribed to alerts room")

            # Start ping task
            async def ping_task():
                while True:
                    await asyncio.sleep(30)
                    await websocket.send(json.dumps({
                        'type': 'ping',
                        'data': {'timestamp': asyncio.get_event_loop().time()}
                    }))

            ping = asyncio.create_task(ping_task())

            # Receive messages
            print("\nWaiting for events (Ctrl+C to exit)...")
            try:
                async for message in websocket:
                    data = json.loads(message)
                    event_type = data.get('type', 'unknown')

                    if event_type == 'pong':
                        print(f"  [pong] Server responded")
                    elif event_type == 'subscribed':
                        print(f"  [subscribed] {data['data'].get('room')}")
                    elif event_type.startswith('calculation'):
                        print(f"  [{event_type}] {json.dumps(data['data'], indent=2)}")
                    elif event_type.startswith('sensor'):
                        reading = data['data']
                        print(f"  [{event_type}] {reading.get('sensor_id')}: {reading.get('value')}")
                    elif event_type.startswith('alert'):
                        alert = data['data']
                        print(f"  [{event_type}] [{alert.get('severity')}] {alert.get('message')}")
                    else:
                        print(f"  [{event_type}] {data.get('data', {})}")

            except asyncio.CancelledError:
                pass
            finally:
                ping.cancel()

    except ConnectionRefusedError:
        print(f"Could not connect to {uri}. Is the server running?")
    except Exception as e:
        print(f"Error: {e}")


def demo_calculation_tracking():
    """
    Demo how to track a specific calculation.
    """
    async def track_calculation(calculation_id: str):
        if not HAS_WEBSOCKETS:
            print("websockets library required")
            return

        uri = "ws://localhost:5000/ws"
        print(f"Tracking calculation: {calculation_id}")

        async with websockets.connect(uri) as websocket:
            # Subscribe to the calculation's room
            room = f"calculation:{calculation_id}"
            await websocket.send(json.dumps({
                'type': 'subscribe',
                'data': {'room': room}
            }))

            print(f"Subscribed to {room}, waiting for updates...")

            async for message in websocket:
                data = json.loads(message)
                event_type = data.get('type', '')

                if 'calculation' in event_type:
                    event_data = data.get('data', {})

                    if event_type == 'calculation.progress':
                        progress = event_data.get('progress', 0)
                        msg = event_data.get('message', '')
                        print(f"  Progress: {progress}% - {msg}")

                    elif event_type == 'calculation.completed':
                        print(f"  Completed!")
                        print(f"  Result: {json.dumps(event_data.get('result', {}), indent=2)}")
                        break

                    elif event_type == 'calculation.failed':
                        print(f"  Failed: {event_data.get('error')}")
                        break

    if len(sys.argv) > 1:
        calc_id = sys.argv[1]
        asyncio.run(track_calculation(calc_id))
    else:
        print("Usage: python websocket_client.py <calculation_id>")


class SimpleWebSocketClient:
    """
    Simple synchronous WebSocket client wrapper.

    For use in applications that don't use asyncio.
    """

    def __init__(self, uri: str = "ws://localhost:5000/ws"):
        self.uri = uri
        self.websocket = None
        self._loop = None

    def connect(self):
        """Connect to the WebSocket server."""
        if not HAS_WEBSOCKETS:
            raise ImportError("websockets library required")

        self._loop = asyncio.new_event_loop()
        self.websocket = self._loop.run_until_complete(
            websockets.connect(self.uri)
        )
        return self

    def disconnect(self):
        """Disconnect from the server."""
        if self.websocket:
            self._loop.run_until_complete(self.websocket.close())
            self.websocket = None
        if self._loop:
            self._loop.close()
            self._loop = None

    def send(self, message_type: str, data: dict = None):
        """Send a message to the server."""
        if not self.websocket:
            raise RuntimeError("Not connected")

        message = json.dumps({
            'type': message_type,
            'data': data or {}
        })
        self._loop.run_until_complete(self.websocket.send(message))

    def receive(self, timeout: float = None) -> dict:
        """Receive a message from the server."""
        if not self.websocket:
            raise RuntimeError("Not connected")

        async def _receive():
            if timeout:
                return await asyncio.wait_for(
                    self.websocket.recv(),
                    timeout=timeout
                )
            return await self.websocket.recv()

        message = self._loop.run_until_complete(_receive())
        return json.loads(message)

    def subscribe(self, room: str):
        """Subscribe to a room."""
        self.send('subscribe', {'room': room})
        return self.receive()

    def unsubscribe(self, room: str):
        """Unsubscribe from a room."""
        self.send('unsubscribe', {'room': room})
        return self.receive()

    def ping(self):
        """Send a ping."""
        import time
        self.send('ping', {'timestamp': time.time()})
        return self.receive()


# Example usage
if __name__ == '__main__':
    print("""
    Ceiling Panel Calculator - WebSocket Client Demo
    =================================================

    This demo shows how to connect to the WebSocket server
    and receive real-time updates.

    Prerequisites:
    - pip install websockets
    - Start the API server: python -m api.app

    Usage:
    - python websocket_client.py              # General event listening
    - python websocket_client.py <calc_id>    # Track specific calculation
    """)

    if len(sys.argv) > 1:
        demo_calculation_tracking()
    else:
        asyncio.run(demo_websocket_client())
