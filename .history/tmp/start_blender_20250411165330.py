import bpy
import sys
import os

# Voeg het pad toe aan sys.path
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.dirname(current_dir)
blender_agent_dir = os.path.join(parent_dir, "blender_agent")
sys.path.append(parent_dir)
sys.path.append(blender_agent_dir)

# Importeer de WebSocket-server module
from blender_agent.websocket_server import register_websocket_server, BlenderWebSocketServer

# Registreer de WebSocket server
register_websocket_server()

# Start de WebSocket server
bpy.ops.websocket.start_server()

print("WebSocket server gestart op ws://localhost:9876") 