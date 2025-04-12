"""
Utility functions for WebSocket operations.
"""
import json
import asyncio
from websockets.client import connect, WebSocketClientProtocol
from typing import Dict, Any, Optional, TypedDict, Set, List
import logging
from datetime import datetime
from websockets.exceptions import ConnectionClosed, InvalidStatusCode

# Setup logging
logger = logging.getLogger(__name__)

class ConnectionResult(TypedDict, total=False):
    """Type definition for WebSocket connection results"""
    success: bool
    message: str
    error: str
    timestamp: str

class WebSocketResponse(TypedDict, total=False):
    """Type definition for WebSocket responses"""
    error: str
    command: str
    result: Any
    timestamp: str

class WebSocketManager:
    """
    Manager for handling WebSocket connections and messaging
    """
    def __init__(self):
        """Initialize the WebSocket manager"""
        self.active_connections: Set[WebSocketClientProtocol] = set()
        self.connection_timestamps: Dict[WebSocketClientProtocol, datetime] = {}
        
    async def connect(self, ws_url: str) -> ConnectionResult:
        """
        Establish connection to a WebSocket server
        
        Args:
            ws_url (str): WebSocket URL to connect to
            
        Returns:
            ConnectionResult: Result of the connection attempt
        """
        try:
            connection = await connect_to_blender(ws_url)
            if connection:
                self.active_connections.add(connection)
                self.connection_timestamps[connection] = datetime.now()
                return {
                    "success": True,
                    "message": f"Successfully connected to {ws_url}",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to connect to {ws_url}",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error connecting to {ws_url}: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def disconnect(self, connection: WebSocketClientProtocol) -> None:
        """
        Disconnect from a WebSocket server
        
        Args:
            connection (WebSocketClientProtocol): Connection to close
        """
        if connection in self.active_connections:
            await connection.close()
            self.active_connections.remove(connection)
            if connection in self.connection_timestamps:
                del self.connection_timestamps[connection]
    
    async def disconnect_all(self) -> None:
        """Disconnect from all active WebSocket connections"""
        for connection in list(self.active_connections):
            await self.disconnect(connection)
    
    async def send(self, connection: WebSocketClientProtocol, message: Dict[str, Any]) -> WebSocketResponse:
        """
        Send a message to a WebSocket server
        
        Args:
            connection (WebSocketClientProtocol): Connection to send to
            message (Dict[str, Any]): Message to send
            
        Returns:
            WebSocketResponse: Response from the server
        """
        try:
            await connection.send(json.dumps(message))
            response = await connection.recv()
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return {"error": str(e), "timestamp": datetime.now().isoformat()}
    
    async def broadcast(self, message: Dict[str, Any]) -> None:
        """
        Broadcast a message to all active connections
        
        Args:
            message (Dict[str, Any]): Message to broadcast
        """
        for connection in list(self.active_connections):
            try:
                await connection.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {connection}: {str(e)}")
                await self.disconnect(connection)
    
    def get_connection_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all active connections
        
        Returns:
            List[Dict[str, Any]]: List of connection information
        """
        return [
            {
                "id": id(conn),
                "connected_at": self.connection_timestamps.get(conn, datetime.now()).isoformat(),
                "remote": str(getattr(conn, "remote_address", "unknown"))
            }
            for conn in self.active_connections
        ]

async def connect_to_blender(ws_url: str) -> Optional[WebSocketClientProtocol]:
    """
    Connect to Blender's WebSocket server with retry logic
    
    Args:
        ws_url (str): WebSocket URL to connect to
        
    Returns:
        Optional[WebSocketClientProtocol]: WebSocket connection if successful, None otherwise
    """
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to connect to Blender WebSocket at {ws_url} (attempt {attempt + 1}/{max_retries})")
            websocket = await connect(ws_url, ping_timeout=10)
            logger.info("Successfully connected to Blender WebSocket")
            return websocket
        except ConnectionRefusedError:
            logger.error(f"Connection refused to Blender WebSocket. Is Blender running with the WebSocket add-on enabled?")
        except InvalidStatusCode as e:
            logger.error(f"Invalid status code from Blender WebSocket: {e}")
        except Exception as e:
            logger.error(f"Error connecting to Blender WebSocket: {str(e)}")
        
        if attempt < max_retries - 1:
            logger.info(f"Retrying in {retry_delay} seconds...")
            await asyncio.sleep(retry_delay)
    
    logger.error("Failed to connect to Blender WebSocket after all retries")
    return None

async def send_to_blender(ws_url: str, action: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send a message to Blender via WebSocket
    
    Args:
        ws_url (str): WebSocket URL to connect to
        action (str): Action to perform
        data (Dict[str, Any]): Data to send
        
    Returns:
        Dict[str, Any]: Response from Blender
    """
    websocket = await connect_to_blender(ws_url)
    if not websocket:
        return {"status": "error", "message": "Could not connect to Blender"}
    
    try:
        message = {
            "action": action,
            "data": data
        }
        
        await websocket.send(json.dumps(message))
        response = await websocket.recv()
        return json.loads(response)
    except ConnectionClosed:
        logger.error("WebSocket connection closed while communicating with Blender")
        return {"status": "error", "message": "WebSocket connection closed"}
    except json.JSONDecodeError:
        logger.error("Invalid JSON response from Blender")
        return {"status": "error", "message": "Invalid response from Blender"}
    except Exception as e:
        logger.error(f"Error communicating with Blender: {str(e)}")
        return {"status": "error", "message": str(e)}
    finally:
        await websocket.close()

async def broadcast_to_clients(message: Dict[str, Any], clients: set) -> None:
    """
    Broadcast a message to all connected WebSocket clients
    
    Args:
        message (Dict[str, Any]): Message to broadcast
        clients (set): Set of connected WebSocket clients
    """
    if not clients:
        return
    
    disconnected_clients = set()
    for client in clients:
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error broadcasting to client: {str(e)}")
            disconnected_clients.add(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        clients.remove(client) 