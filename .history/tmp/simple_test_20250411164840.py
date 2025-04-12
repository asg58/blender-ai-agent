import requests
import json
import websockets
import asyncio

# Blender WebSocket URL
BLENDER_WS_URL = "ws://localhost:9876"

# Functie om een directe code-uitvoering aan te vragen
async def run_in_blender(code):
    """Voer code direct uit in Blender via WebSocket"""
    try:
        async with websockets.connect(BLENDER_WS_URL) as ws:
            # Bereid het bericht voor
            message = json.dumps({
                "command": "execute_code",
                "params": {"code": code}
            })
            
            # Stuur het bericht
            await ws.send(message)
            
            # Wacht op antwoord
            response = await ws.recv()
            return json.loads(response)
    except Exception as e:
        return {"error": f"WebSocket error: {str(e)}"}

# Eenvoudige code om een rode kubus te maken
cube_code = """
import bpy

# Maak een kubus
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

# Stel het resultaat in
result = "Rode kubus succesvol gemaakt!"
"""

# Hoofdfunctie om de code uit te voeren
async def main():
    print("Test uitvoeren: Rode kubus maken")
    result = await run_in_blender(cube_code)
    print(f"Resultaat: {json.dumps(result, indent=2)}")

# Voer de test uit
if __name__ == "__main__":
    asyncio.run(main()) 