import requests
import websockets
import asyncio
import json

# API endpoint
API_BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"
BLENDER_WS_URL = "ws://localhost:9876"  # The Blender WebSocket URL

async def connect_to_api_ws():
    """Connect to the API WebSocket and handle messages"""
    print(f"Connecting to API WebSocket at {WS_URL}...")
    async with websockets.connect(WS_URL) as websocket:
        # First connect to Blender
        await websocket.send(json.dumps({
            "command": "connect_to_blender",
            "params": {"url": BLENDER_WS_URL}
        }))
        
        response = await websocket.recv()
        print(f"Blender connection result: {response}")
        
        # Example 1: Generate code to create a red cube
        await websocket.send(json.dumps({
            "command": "generate_code",
            "params": {
                "prompt": "Create a red cube at the origin",
                "include_scene_data": True
            }
        }))
        
        response = await websocket.recv()
        response_data = json.loads(response)
        
        if response_data.get("type") == "code_generated":
            code = response_data.get("code")
            print(f"Generated code:\n{code}\n")
            
            # Execute the generated code
            await websocket.send(json.dumps({
                "command": "execute_code",
                "params": {"code": code}
            }))
            
            execution_response = await websocket.recv()
            print(f"Execution result: {execution_response}\n")
        
        # Example 2: Get scene data
        await websocket.send(json.dumps({
            "command": "introspect_scene",
            "params": {}
        }))
        
        scene_response = await websocket.recv()
        scene_data = json.loads(scene_response)
        
        if scene_data.get("type") == "scene_data":
            print("Scene data received:")
            print(f"Number of objects: {len(scene_data.get('data', {}).get('objects', []))}")

def rest_api_examples():
    """Examples using the REST API"""
    print("Using REST API examples...")
    
    # Example 1: Search the API
    query = "how to create a material"
    print(f"Searching API for: {query}")
    
    response = requests.post(f"{API_BASE_URL}/search-api", params={"query": query})
    
    if response.status_code == 200:
        results = response.json().get("results", [])
        print(f"Found {len(results)} results")
        
        for i, result in enumerate(results):
            print(f"Result {i+1}:")
            print(f"Title: {result.get('title', 'No title')}")
            print(f"URL: {result.get('url', 'No URL')}")
            print(f"Content snippet: {result.get('content', 'No content')[:100]}...")
            print("-" * 80)
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Example 2: Generate code
    prompt = "Create a blue sphere with a glossy material"
    print(f"\nGenerating code for: {prompt}")
    
    response = requests.post(
        f"{API_BASE_URL}/generate-code", 
        json={"prompt": prompt, "include_scene_data": False}
    )
    
    if response.status_code == 200:
        code = response.json().get("code", "")
        print(f"Generated code:\n{code}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

async def main():
    # REST API examples
    rest_api_examples()
    
    # WebSocket examples
    try:
        await connect_to_api_ws()
    except Exception as e:
        print(f"WebSocket error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 