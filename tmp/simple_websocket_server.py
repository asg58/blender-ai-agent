import asyncio
import json
import logging
import websockets

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("BlenderWebSocket")

# Global server instance
server = None

async def handle_client(websocket, path):
    """Handle client connections and messages"""
    logger.info(f"Client connected: {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                command = data.get("command")
                params = data.get("params", {})
                request_id = data.get("requestId")
                
                logger.info(f"Received command: {command}, params: {params}")
                
                if command == "execute_code":
                    code = params.get("code", "")
                    if code:
                        # Mock code execution (just return the code and success message)
                        result = {"message": "Code executed successfully", "output": code}
                        response = {
                            "type": "code_executed",
                            "result": result
                        }
                        if request_id:
                            response["requestId"] = request_id
                            
                        await websocket.send(json.dumps(response))
                    else:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "error": "No code provided",
                            "requestId": request_id
                        }))
                
                elif command == "introspect_scene":
                    # Mock scene data
                    scene_data = {
                        "objects": ["Cube", "Camera", "Light"],
                        "activeObject": "Cube",
                        "objectCount": 3,
                        "renderEngine": "CYCLES"
                    }
                    await websocket.send(json.dumps({
                        "type": "scene_data",
                        "result": scene_data,
                        "requestId": request_id
                    }))
                    
                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "error": f"Unknown command: {command}",
                        "requestId": request_id
                    }))
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {message}")
                await websocket.send(json.dumps({"type": "error", "error": "Invalid JSON"}))
            
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client disconnected: {websocket.remote_address}")

async def start_server(host="localhost", port=9876):
    """Start the WebSocket server"""
    global server
    server = await websockets.serve(handle_client, host, port)
    logger.info(f"WebSocket server started at ws://{host}:{port}")
    await server.wait_closed()

async def stop_server():
    """Stop the WebSocket server"""
    global server
    if server:
        server.close()
        await server.wait_closed()
        logger.info("WebSocket server stopped")

if __name__ == "__main__":
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        logger.info("Server stopped by user") 