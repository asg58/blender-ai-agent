import asyncio
import json
import bpy
import websockets
import inspect
from typing import Dict, Any, List, Optional
import os
import logging
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("BlenderWebSocket")

# Default WebSocket configuration
DEFAULT_WS_HOST = "localhost"
DEFAULT_WS_PORT = 9876

# Reference to the websocket server instance
_server_instance = None

# Blender operator for starting the server
class WEBSOCKET_OT_start_server(bpy.types.Operator):
    bl_idname = "websocket.start_server"
    bl_label = "Start WebSocket Server"
    bl_description = "Start the Blender WebSocket server for AI Agent communication"
    
    def execute(self, context):
        global _server_instance
        
        if _server_instance is not None:
            self.report({'INFO'}, "WebSocket server is already running")
            return {'FINISHED'}
        
        # Create a new server instance
        _server_instance = BlenderWebSocketServer()
        
        # Start the server in a background thread
        def run_server():
            asyncio.run(_server_instance.start_server())
        
        import threading
        server_thread = threading.Thread(target=run_server)
        server_thread.daemon = True
        server_thread.start()
        
        self.report({'INFO'}, f"WebSocket server started at ws://{_server_instance.host}:{_server_instance.port}")
        return {'FINISHED'}

# Blender operator for stopping the server
class WEBSOCKET_OT_stop_server(bpy.types.Operator):
    bl_idname = "websocket.stop_server"
    bl_label = "Stop WebSocket Server"
    bl_description = "Stop the Blender WebSocket server"
    
    def execute(self, context):
        global _server_instance
        
        if _server_instance is None:
            self.report({'INFO'}, "WebSocket server is not running")
            return {'FINISHED'}
        
        # Stop the server in a background thread
        def stop_server():
            asyncio.run(_server_instance.stop_server())
            global _server_instance
            _server_instance = None
        
        import threading
        stop_thread = threading.Thread(target=stop_server)
        stop_thread.daemon = True
        stop_thread.start()
        
        self.report({'INFO'}, "WebSocket server stopped")
        return {'FINISHED'}

# Function to register the server operators with Blender
def register_websocket_server():
    """Register the WebSocket server operators with Blender"""
    bpy.utils.register_class(WEBSOCKET_OT_start_server)
    bpy.utils.register_class(WEBSOCKET_OT_stop_server)
    logger.info("Registered Blender WebSocket server operators")

# Function to unregister the server operators
def unregister_websocket_server():
    """Unregister the WebSocket server operators from Blender"""
    bpy.utils.unregister_class(WEBSOCKET_OT_stop_server)
    bpy.utils.unregister_class(WEBSOCKET_OT_start_server)
    logger.info("Unregistered Blender WebSocket server operators")

class BlenderWebSocketServer:
    def __init__(self, host: Optional[str] = None, port: Optional[int] = None):
        """
        Initialize the Blender WebSocket server
        
        Args:
            host (Optional[str]): Hostname to bind to
            port (Optional[int]): Port to listen on
        """
        # Get config from environment variables or use defaults
        self.host = host or os.environ.get("BLENDER_WS_HOST", DEFAULT_WS_HOST)
        self.port = port or int(os.environ.get("BLENDER_WS_PORT", DEFAULT_WS_PORT))
        self.server = None
        self.connected_clients = set()
        # Keep a list of command history for logging
        self.command_history: List[Dict[str, Any]] = []
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
                    
                    # Log command to history
                    self.command_history.append({
                        "command": command,
                        "params": params,
                        "client": client_ip,
                        "timestamp": datetime.now().isoformat()
                    })
                    
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
    
    def get_command_history(self) -> List[Dict[str, Any]]:
        """
        Get the history of commands executed
        
        Returns:
            List[Dict[str, Any]]: List of command history entries
        """
        return self.command_history
    
    def introspect_scene(self) -> Dict[str, Any]:
        """
        Introspect the current Blender scene
        
        Returns:
            Dict[str, Any]: Scene information
        """
        try:
            # Get the active scene
            scene = bpy.context.scene
            
            # Collect information about scene objects
            objects_info = []
            for obj in scene.objects:
                obj_info = {
                    "name": obj.name,
                    "type": obj.type,
                    "location": [obj.location.x, obj.location.y, obj.location.z],
                    "visible": obj.visible_get()
                }
                objects_info.append(obj_info)
            
            # Collect information about scene settings
            scene_info = {
                "name": scene.name,
                "frame_current": scene.frame_current,
                "frame_start": scene.frame_start,
                "frame_end": scene.frame_end,
                "objects_count": len(scene.objects),
                "objects": objects_info
            }
            
            return {
                "result": scene_info
            }
        except Exception as e:
            logger.error(f"Error introspecting scene: {str(e)}")
            return {"error": f"Scene introspection error: {str(e)}"}
    
    def describe_function(self, function_path: str) -> Dict[str, Any]:
        """
        Get documentation for a Blender Python function
        
        Args:
            function_path (str): Path to the function (e.g., "bpy.ops.mesh.primitive_cube_add")
            
        Returns:
            Dict[str, Any]: Function documentation
        """
        try:
            # Use inspect module to introspect the function
            parts = function_path.split('.')
            module = __import__(parts[0])
            obj = module
            
            for part in parts[1:]:
                obj = getattr(obj, part)
            
            # Get the documentation
            doc = inspect.getdoc(obj)
            signature = str(inspect.signature(obj)) if inspect.isfunction(obj) or inspect.ismethod(obj) else ""
            source = None
            
            try:
                if inspect.isfunction(obj) or inspect.ismethod(obj):
                    source = inspect.getsource(obj)
            except Exception:
                # Some Blender functions don't support source inspection
                pass
            
            function_info = {
                "name": parts[-1],
                "full_path": function_path,
                "docstring": doc,
                "signature": signature,
                "source": source,
                "is_function": inspect.isfunction(obj) or inspect.ismethod(obj),
                "is_class": inspect.isclass(obj),
                "is_module": inspect.ismodule(obj)
            }
            
            return {
                "result": function_info
            }
            
        except AttributeError as e:
            logger.error(f"Function not found: {function_path}")
            return {"error": f"Function not found: {function_path}"}
        except Exception as e:
            logger.error(f"Error describing function: {str(e)}")
            logger.error(traceback.format_exc())
            return {"error": f"Function description error: {str(e)}"}

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