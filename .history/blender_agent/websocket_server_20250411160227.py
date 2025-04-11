import asyncio
import json
import bpy
import websockets
import inspect
from typing import Dict, Any, List, Optional

class BlenderWebSocketServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        """
        Initialize the Blender WebSocket server
        
        Args:
            host (str): Hostname to bind to
            port (int): Port to listen on
        """
        self.host = host
        self.port = port
        self.server = None
        self.connected_clients = set()
    
    async def handle_client(self, websocket):
        """Handle WebSocket client connection"""
        self.connected_clients.add(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    command = data.get("command")
                    params = data.get("params", {})
                    
                    if command == "introspect_scene":
                        response = self.introspect_scene()
                    elif command == "describe_function":
                        function_path = params.get("function_path")
                        response = self.describe_function(function_path)
                    elif command == "execute_code":
                        code = params.get("code")
                        response = self.execute_code(code)
                    else:
                        response = {"error": f"Unknown command: {command}"}
                    
                    await websocket.send(json.dumps(response))
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({"error": "Invalid JSON"}))
                except Exception as e:
                    await websocket.send(json.dumps({"error": str(e)}))
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.connected_clients.remove(websocket)
    
    def introspect_scene(self) -> Dict[str, Any]:
        """
        Introspect the current Blender scene
        
        Returns:
            dict: Scene data including objects, materials, and nodes
        """
        scene_data = {
            "objects": self._get_objects_data(),
            "materials": self._get_materials_data(),
            "active_object": self._get_active_object_data()
        }
        return {"result": scene_data}
    
    def _get_objects_data(self) -> List[Dict[str, Any]]:
        """Get data for all objects in the scene"""
        objects_data = []
        for obj in bpy.context.scene.objects:
            obj_data = {
                "name": obj.name,
                "type": obj.type,
                "location": [obj.location.x, obj.location.y, obj.location.z],
                "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
                "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
                "visible": obj.visible_get()
            }
            objects_data.append(obj_data)
        return objects_data
    
    def _get_materials_data(self) -> List[Dict[str, Any]]:
        """Get data for all materials"""
        materials_data = []
        for mat in bpy.data.materials:
            mat_data = {
                "name": mat.name,
                "use_nodes": mat.use_nodes
            }
            if mat.use_nodes and mat.node_tree:
                mat_data["nodes"] = self._get_nodes_data(mat.node_tree.nodes)
            materials_data.append(mat_data)
        return materials_data
    
    def _get_nodes_data(self, nodes) -> List[Dict[str, Any]]:
        """Get data for material nodes"""
        nodes_data = []
        for node in nodes:
            node_data = {
                "name": node.name,
                "type": node.type,
                "inputs": [input.name for input in node.inputs],
                "outputs": [output.name for output in node.outputs]
            }
            nodes_data.append(node_data)
        return nodes_data
    
    def _get_active_object_data(self) -> Optional[Dict[str, Any]]:
        """Get detailed data for the active object"""
        if bpy.context.active_object:
            obj = bpy.context.active_object
            active_data = {
                "name": obj.name,
                "type": obj.type,
                "location": [obj.location.x, obj.location.y, obj.location.z],
                "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
                "scale": [obj.scale.x, obj.scale.y, obj.scale.z]
            }
            
            # Add mesh data if it's a mesh
            if obj.type == 'MESH' and obj.data:
                mesh = obj.data
                active_data["mesh"] = {
                    "vertices": len(mesh.vertices),
                    "edges": len(mesh.edges),
                    "polygons": len(mesh.polygons)
                }
            
            # Add armature data if it's an armature
            if obj.type == 'ARMATURE' and obj.data:
                armature = obj.data
                active_data["armature"] = {
                    "bones": [bone.name for bone in armature.bones]
                }
            
            return active_data
        return None
    
    def describe_function(self, function_path: str) -> Dict[str, Any]:
        """
        Get documentation for a Blender function
        
        Args:
            function_path (str): Path to the function (e.g., "bpy.ops.mesh.primitive_cube_add")
            
        Returns:
            dict: Function documentation
        """
        try:
            # Navigate to the function through the module structure
            parts = function_path.split('.')
            current = __import__(parts[0])
            for part in parts[1:]:
                current = getattr(current, part)
            
            # Get the docstring and signature
            doc = current.__doc__ or "No documentation available"
            
            try:
                signature = str(inspect.signature(current))
            except (ValueError, TypeError):
                signature = "(Unable to get signature)"
            
            return {
                "result": {
                    "function_path": function_path,
                    "docstring": doc,
                    "signature": signature
                }
            }
        except (ImportError, AttributeError) as e:
            return {"error": f"Function not found: {str(e)}"}
        except Exception as e:
            return {"error": f"Error: {str(e)}"}
    
    def execute_code(self, code: str) -> Dict[str, Any]:
        """
        Execute Python code in Blender
        
        Args:
            code (str): Python code to execute
            
        Returns:
            dict: Result of execution
        """
        try:
            # Create a locals dict to capture output
            locals_dict = {}
            
            # Execute the code
            exec(code, globals(), locals_dict)
            
            return {
                "result": {
                    "message": "Code executed successfully",
                    "output": str(locals_dict.get("result", ""))
                }
            }
        except Exception as e:
            return {"error": f"Execution error: {str(e)}"}
    
    async def start_server(self):
        """Start the WebSocket server"""
        self.server = await websockets.serve(self.handle_client, self.host, self.port)
        print(f"WebSocket server started at ws://{self.host}:{self.port}")
        await self.server.wait_closed()
    
    def stop_server(self):
        """Stop the WebSocket server"""
        if self.server:
            self.server.close()
            print("WebSocket server stopped")

# Code to run in Blender
def register_websocket_server():
    """Register and start the WebSocket server as a Blender operator"""
    # Define the operator class
    class WEBSOCKET_OT_Start(bpy.types.Operator):
        bl_idname = "websocket.start_server"
        bl_label = "Start WebSocket Server"
        bl_description = "Start the WebSocket server for AI agent communication"
        
        def execute(self, context):
            # Start the server in a separate thread
            import threading
            import asyncio
            
            def run_server():
                server = BlenderWebSocketServer()
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(server.start_server())
            
            server_thread = threading.Thread(target=run_server)
            server_thread.daemon = True
            server_thread.start()
            
            self.report({'INFO'}, "WebSocket server started")
            return {'FINISHED'}
    
    # Register the operator
    bpy.utils.register_class(WEBSOCKET_OT_Start)
    
    # Add to the UI
    def menu_func(self, context):
        self.layout.operator(WEBSOCKET_OT_Start.bl_idname)
    
    bpy.types.VIEW3D_MT_object.append(menu_func)

# For testing outside of Blender
if __name__ == "__main__":
    print("This module should be imported and used within Blender") 