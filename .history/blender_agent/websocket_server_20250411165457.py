import asyncio
import json
import bpy
import websockets
import inspect
from typing import Dict, Any, List, Optional
import os

# Default WebSocket configuration
DEFAULT_WS_HOST = "localhost"
DEFAULT_WS_PORT = 9876

class BlenderWebSocketServer:
    def __init__(self, host: str = None, port: int = None):
        """
        Initialize the Blender WebSocket server
        
        Args:
            host (str): Hostname to bind to
            port (int): Port to listen on
        """
        # Get config from environment variables or use defaults
        self.host = host or os.environ.get("BLENDER_WS_HOST", DEFAULT_WS_HOST)
        self.port = port or int(os.environ.get("BLENDER_WS_PORT", DEFAULT_WS_PORT))
        self.server = None
        self.connected_clients = set()