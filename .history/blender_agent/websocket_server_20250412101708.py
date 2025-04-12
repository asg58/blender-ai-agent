import asyncio
import json
import bpy
import websockets
import inspect
from typing import Dict, Any, List, Optional
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("BlenderWebSocket")

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
        logger.info(f"Initialized BlenderWebSocketServer on {self.host}:{self.port}")

    async def handle_client(self, websocket):
        """Handle WebSocket client connection"""
        client_ip = websocket.remote_address[0] if hasattr(websocket, 'remote_address') else "unknown"
        logger.info(f"New client connection from {client_ip}")
        self.connected_clients.add(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    command = data.get("command")
                    params = data.get("params", {})
                    
                    logger.info(f"Received command: {command} from {client_ip}")
                    
                    if command == "introspect_scene":
                        response = self.introspect_scene()
                    elif command == "describe_function":
                        function_path = params.get("function_path")
                        response = self.describe_function(function_path)
                    elif command == "execute_code":
                        code = params.get("code")
                        logger.debug(f"Executing code: {code[:100]}...")
                        response = self.execute_code(code)
                    else:
                        logger.warning(f"Unknown command: {command}")
                        response = {"error": f"Unknown command: {command}"}
                    
                    await websocket.send(json.dumps(response))
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from {client_ip}")
                    await websocket.send(json.dumps({"error": "Invalid JSON"}))
                except Exception as e:
                    logger.error(f"Error handling message: {str(e)}")
                    await websocket.send(json.dumps({"error": str(e)}))
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_ip} disconnected")
        finally:
            self.connected_clients.remove(websocket)
    
    async def start_server(self):
        """Start the WebSocket server"""
        self.server = await websockets.serve(self.handle_client, self.host, self.port)
        logger.info(f"WebSocket server started at ws://{self.host}:{self.port}")
        await self.server.wait_closed()
    
    async def stop_server(self):
        """Stop the WebSocket server"""
        if self.server:
            # Close all active connections
            close_tasks = []
            logger.info(f"Closing {len(self.connected_clients)} client connections")
            for client in self.connected_clients:
                try:
                    close_tasks.append(client.close(1001, "Server shutting down"))
                except Exception as e:
                    logger.error(f"Error closing client connection: {str(e)}")
            
            # Wait for all connections to close
            if close_tasks:
                await asyncio.gather(*close_tasks, return_exceptions=True)
            
            # Close the server
            self.server.close()
            await self.server.wait_closed()
            logger.info("WebSocket server stopped")

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