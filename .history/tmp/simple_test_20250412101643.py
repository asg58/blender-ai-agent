import requests
import json
import websockets
import asyncio
import socket

# Blender WebSocket URL
BLENDER_WS_URL = "ws://localhost:9876"

# Function to execute code directly in Blender via WebSocket
async def run_in_blender(code):
    """Execute code directly in Blender via WebSocket"""
    try:
        async with websockets.connect(BLENDER_WS_URL) as ws:
            # Prepare the message
            message = json.dumps({
                "command": "execute_code",
                "params": {"code": code}
            })
            
            # Send the message
            await ws.send(message)
            
            # Wait for response
            response = await ws.recv()
            return json.loads(response)
    except websockets.exceptions.ConnectionError as e:
        return {
            "error": f"Connection error: Could not connect to Blender at {BLENDER_WS_URL}. Is Blender running with the WebSocket server enabled?",
            "details": str(e)
        }
    except socket.gaierror as e:
        return {
            "error": f"Network error: Could not resolve host {BLENDER_WS_URL}",
            "details": str(e)
        }
    except asyncio.TimeoutError:
        return {
            "error": f"Connection timeout: The connection to {BLENDER_WS_URL} timed out",
        }
    except json.JSONDecodeError as e:
        return {
            "error": "Invalid JSON response from Blender",
            "details": str(e)
        }
    except Exception as e:
        return {
            "error": f"WebSocket error: {type(e).__name__}",
            "details": str(e)
        }

# Simple code to create a red cube
cube_code = """
import bpy

# Create a cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "RedCube"

# Create a red material
mat = bpy.data.materials.new(name="Red_Material")
mat.use_nodes = True
mat.diffuse_color = (1, 0, 0, 1)  # RGBA (Red)

# Assign the material to the cube
if cube.data.materials:
    cube.data.materials[0] = mat
else:
    cube.data.materials.append(mat)

# Set the result
result = "Red cube successfully created!"
"""

# Main function to execute the code
async def main():
    print("Running test: Creating a red cube")
    result = await run_in_blender(cube_code)
    print(f"Result: {json.dumps(result, indent=2)}")

# Run the test
if __name__ == "__main__":
    asyncio.run(main()) 