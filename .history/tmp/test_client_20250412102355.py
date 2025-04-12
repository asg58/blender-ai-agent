import websockets
import asyncio
import json

# Connection details
SERVER_URL = "ws://localhost:9876"

async def test_connection():
    print(f"Connecting to {SERVER_URL}...")
    try:
        async with websockets.connect(SERVER_URL, ping_timeout=5) as ws:
            print("Connection successful!")
            
            # Send a simple test message
            message = {
                "command": "execute_code",
                "params": {
                    "code": "print('Hello from Blender!')"
                }
            }
            
            print(f"Sending message: {json.dumps(message)}")
            await ws.send(json.dumps(message))
            
            # Wait for response
            response = await ws.recv()
            print(f"Response received: {response}")
            
            return json.loads(response)
    except Exception as e:
        print(f"Connection error: {type(e).__name__}: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    result = asyncio.run(test_connection())
    print("\nResult:", json.dumps(result, indent=2)) 