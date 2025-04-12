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

    async def start_server(self):
        """Start the WebSocket server"""
        self.server = await websockets.serve(self.handle_client, self.host, self.port)
        print(f"WebSocket server started at ws://{self.host}:{self.port}")
        await self.server.wait_closed()
    
    async def stop_server(self):
        """Stop the WebSocket server"""
        if self.server:
            # Close all active connections
            close_tasks = []
            for client in self.connected_clients:
                try:
                    close_tasks.append(client.close(1001, "Server shutting down"))
                except Exception as e:
                    print(f"Error closing client connection: {str(e)}")
            
            # Wait for all connections to close
            if close_tasks:
                await asyncio.gather(*close_tasks, return_exceptions=True)
            
            # Close the server
            self.server.close()
            await self.server.wait_closed()
            print("WebSocket server stopped")

    def execute_code(self, code: str) -> Dict[str, Any]:
        """
        Execute Python code in Blender
        
        Args:
            code (str): Python code to execute
            
        Returns:
            dict: Result of execution
        """
        try:
            # Create a restricted globals dict with only safe Blender modules
            safe_globals = {
                'bpy': bpy,
                'mathutils': __import__('mathutils'),
                '__builtins__': {
                    k: __builtins__[k] for k in [
                        'abs', 'all', 'any', 'bool', 'dict', 'dir', 'enumerate', 
                        'filter', 'float', 'format', 'frozenset', 'getattr', 'hasattr',
                        'hash', 'id', 'int', 'isinstance', 'issubclass', 'iter', 'len',
                        'list', 'map', 'max', 'min', 'next', 'object', 'pow', 'print',
                        'property', 'range', 'repr', 'reversed', 'round', 'set', 'slice',
                        'sorted', 'str', 'sum', 'tuple', 'type', 'zip'
                    ]
                }
            }
            
            # Create a locals dict to capture output
            locals_dict = {}
            
            # Execute the code with restricted globals
            exec(code, safe_globals, locals_dict)
            
            return {
                "result": {
                    "message": "Code executed successfully",
                    "output": str(locals_dict.get("result", ""))
                }
            }
        except Exception as e:
            return {"error": f"Execution error: {str(e)}"}