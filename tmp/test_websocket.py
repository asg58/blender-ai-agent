import bpy
import sys
import os

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Print info for debugging
print("=" * 50)
print("Current directory:", current_dir)
print("Parent directory:", parent_dir)
print("Python sys.path:", sys.path)
print("=" * 50)

# Try to import the WebSocket server
try:
    import blender_agent.websocket_server as ws
    print("Successfully imported websocket_server module")
    
    # Register and start the WebSocket server
    ws.register_websocket_server()
    print("WebSocket server registered")
    
    # Start the server
    bpy.ops.websocket.start_server()
    print("WebSocket server started at ws://localhost:9876")
except Exception as e:
    print("ERROR importing or starting WebSocket server:", str(e))
    import traceback
    traceback.print_exc()

print("=" * 50) 