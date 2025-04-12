import websockets
import asyncio
import json

# Connection details
SERVER_URL = "ws://localhost:9877"

# Blender code to create a red cube
CUBE_CODE = """
import bpy

# Verwijder bestaande objecten
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Maak een nieuwe kubus
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "RedCube"

# Maak een rood materiaal
mat = bpy.data.materials.new(name="Red_Material")
mat.use_nodes = True
mat.diffuse_color = (1, 0, 0, 1)  # RGBA (Rood)

# Wijs het materiaal toe aan de kubus
if cube.data.materials:
    cube.data.materials[0] = mat
else:
    cube.data.materials.append(mat)

# Sla het resultaat op
bpy.ops.wm.save_as_mainfile(filepath="C:/Users/ahmet/Documents/red_cube.blend")

print("Rode kubus succesvol gemaakt en opgeslagen als red_cube.blend!")
"""

async def create_cube():
    print(f"Connecting to {SERVER_URL}...")
    try:
        async with websockets.connect(SERVER_URL, ping_timeout=10) as ws:
            print("Connection successful!")
            
            # Send the cube creation code
            message = {
                "command": "execute_code",
                "params": {
                    "code": CUBE_CODE
                }
            }
            
            print("Sending code to create a red cube...")
            await ws.send(json.dumps(message))
            
            # Wait for response
            response = await ws.recv()
            result = json.loads(response)
            
            if "result" in result:
                print("Success! Cube created and saved.")
            else:
                print("Error:", result.get("error", "Unknown error"))
            
            return result
    except Exception as e:
        print(f"Connection error: {type(e).__name__}: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    result = asyncio.run(create_cube())
    print("\nResult:", json.dumps(result, indent=2)) 