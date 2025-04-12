"""
Utility functions for WebSocket operations.
"""
import json
import asyncio
import websockets
from typing import Dict, Any, Optional
import logging

# Setup logging
logger = logging.getLogger(__name__)

async def connect_to_blender(url: str) -> Dict[str, Any]:
    """
    Connect to the Blender WebSocket server
    
    Args:
        url (str): WebSocket URL to connect to
        
    Returns:
        dict: Connection result
    """
    try:
        # Test connection to Blender
        async with websockets.connect(url, ping_timeout=2) as ws:
            return {
                "success": True,
                "message": f"Successfully connected to Blender at {url}"
            }
    except (websockets.exceptions.InvalidURI, ValueError) as e:
        logger.error(f"Invalid WebSocket URI: {url} - {str(e)}")
        return {"success": False, "error": f"Invalid WebSocket URI: {str(e)}"}
    except websockets.exceptions.ConnectionClosed as e:
        logger.error(f"WebSocket connection closed: {str(e)}")
        return {"success": False, "error": f"Connection closed: {str(e)}"}
    except asyncio.TimeoutError:
        logger.error(f"Connection timeout when connecting to {url}")
        return {"success": False, "error": "Connection timeout"}
    except Exception as e:
        logger.error(f"Error connecting to Blender: {str(e)}")
        return {"success": False, "error": str(e)}

async def send_to_blender(url: str, command: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send a command to the Blender WebSocket server
    
    Args:
        url (str): WebSocket URL
        command (str): Command to send
        params (dict): Parameters for the command
        
    Returns:
        dict: Response from Blender
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
            return json.loads(response)
    except Exception as e:
        logger.error(f"Error communicating with Blender: {str(e)}")
        return {"error": f"WebSocket error: {str(e)}"}

async def broadcast_to_clients(clients, message: Dict[str, Any]):
    """
    Broadcast a message to all connected WebSocket clients
    
    Args:
        clients (set): Set of connected WebSocket clients
        message (dict): Message to broadcast
    """
    message_json = json.dumps(message)
    for client in clients:
        try:
            await client.send_text(message_json)
        except Exception as e:
            logger.error(f"Error broadcasting to client: {str(e)}") 