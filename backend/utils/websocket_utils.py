"""
Utility functions for WebSocket operations.
"""
import json
import asyncio
import websockets
from typing import Dict, Any, Optional, TypedDict, Set, cast
import logging
from datetime import datetime

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

async def connect_to_blender(url: str, timeout: Optional[float] = None) -> ConnectionResult:
    """
    Connect to the Blender WebSocket server
    
    Args:
        url (str): WebSocket URL to connect to
        timeout (Optional[float]): Connection timeout in seconds
        
    Returns:
        ConnectionResult: Connection result with status information
    """
    # Use the provided timeout or default value
    ping_timeout = timeout or 2.0
    
    try:
        # Test connection to Blender
        async with websockets.connect(url, ping_timeout=ping_timeout) as ws:
            # Send a ping to verify connection is working
            await ws.ping()
            
            result: ConnectionResult = {
                "success": True,
                "message": f"Successfully connected to Blender at {url}",
                "timestamp": datetime.now().isoformat()
            }
            return result
    except (websockets.exceptions.InvalidURI, ValueError) as e:
        logger.error(f"Invalid WebSocket URI: {url} - {str(e)}")
        return cast(ConnectionResult, {"success": False, "error": f"Invalid WebSocket URI: {str(e)}"})
    except websockets.exceptions.ConnectionClosed as e:
        logger.error(f"WebSocket connection closed: {str(e)}")
        return cast(ConnectionResult, {"success": False, "error": f"Connection closed: {str(e)}"})
    except asyncio.TimeoutError:
        logger.error(f"Connection timeout when connecting to {url}")
        return cast(ConnectionResult, {"success": False, "error": "Connection timeout"})
    except Exception as e:
        logger.error(f"Error connecting to Blender: {str(e)}")
        return cast(ConnectionResult, {"success": False, "error": str(e)})

async def send_to_blender(url: str, command: str, params: Dict[str, Any]) -> WebSocketResponse:
    """
    Send a command to the Blender WebSocket server
    
    Args:
        url (str): WebSocket URL
        command (str): Command to send
        params (dict): Parameters for the command
        
    Returns:
        WebSocketResponse: Response from Blender
    """
    try:
        async with websockets.connect(url) as ws:
            # Prepare message
            message = json.dumps({
                "command": command,
                "params": params
            })
            
            # Send message
            await ws.send(message)
            
            # Wait for response
            response = await ws.recv()
            response_data = json.loads(response)
            
            # Add timestamp for tracking
            if isinstance(response_data, dict):
                response_data["timestamp"] = datetime.now().isoformat()
                return cast(WebSocketResponse, response_data)
            else:
                # Handle non-dict responses by wrapping them
                result: WebSocketResponse = {
                    "result": response_data,
                    "timestamp": datetime.now().isoformat()
                }
                return result
    except Exception as e:
        logger.error(f"Error communicating with Blender: {str(e)}")
        return cast(WebSocketResponse, {"error": f"WebSocket error: {str(e)}"})

async def broadcast_to_clients(clients: Set, message: Dict[str, Any]) -> int:
    """
    Broadcast a message to all connected WebSocket clients
    
    Args:
        clients (set): Set of connected WebSocket clients
        message (dict): Message to broadcast
        
    Returns:
        int: Number of successful broadcasts
    """
    message_json = json.dumps(message)
    success_count = 0
    
    for client in clients:
        try:
            await client.send_text(message_json)
            success_count += 1
        except Exception as e:
            logger.error(f"Error broadcasting to client: {str(e)}")
    
    return success_count 