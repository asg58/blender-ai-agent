import bpy
import sys
import os

# Add path to sys.path
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.dirname(current_dir)
blender_agent_dir = os.path.join(parent_dir, "blender_agent")
sys.path.append(parent_dir)
sys.path.append(blender_agent_dir)

# Import the WebSocket server module
from blender_agent.websocket_server import register_websocket_server

# Register the WebSocket server
register_websocket_server()

# Start the WebSocket server
bpy.ops.websocket.start_server()

print("WebSocket server started at ws://localhost:9876")