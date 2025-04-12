import asyncio
import websockets
import json
import subprocess
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("BlenderWebSocketServer")

# WebSocket server configuration
HOST = "localhost"
PORT = 9876

# Blender path - we'll use subprocess to execute Blender commands
BLENDER_PATH = r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"

# Store connected clients
connected_clients = set()

async def execute_in_blender(code):
    """Execute Python code in Blender using the blender command line"""
    try:
        # Create a temporary Python script with the code
        with open("tmp_blender_code.py", "w") as f:
            f.write(code)
        
        # Run Blender with the script
        cmd = [BLENDER_PATH, "-b", "--python", "tmp_blender_code.py"]
        logger.info(f"Executing command: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate()
        
        # Return the result
        if process.returncode == 0:
            return {
                "result": {
                    "message": "Code executed successfully",
                    "output": stdout
                }
            }
        else:
            return {
                "error": f"Blender execution error: {stderr}"
            }
    except Exception as e:
        logger.error(f"Error executing code in Blender: {e}")
        return {"error": str(e)}

async def handle_client(websocket, path):
    """Handle WebSocket client connection"""
    client_ip = websocket.remote_address[0] if hasattr(websocket, 'remote_address') else "unknown"
    logger.info(f"New client connection from {client_ip}")
    connected_clients.add(websocket)
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                command = data.get("command")
                params = data.get("params", {})
                
                logger.info(f"Received command: {command} from {client_ip}")
                
                if command == "execute_code":
                    code = params.get("code")
                    logger.info(f"Executing code: {code[:100]}...")
                    response = await execute_in_blender(code)
                else:
                    logger.warning(f"Unknown command: {command}")
                    response = {"error": f"Unknown command: {command}"}
                
                await websocket.send(json.dumps(response))
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from {client_ip}")
                await websocket.send(json.dumps({"error": "Invalid JSON"}))
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                await websocket.send(json.dumps({"error": str(e)}))
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client {client_ip} disconnected")
    finally:
        connected_clients.remove(websocket)

async def main():
    logger.info(f"Starting WebSocket server on {HOST}:{PORT}")
    async with websockets.serve(handle_client, HOST, PORT):
        logger.info(f"WebSocket server is running at ws://{HOST}:{PORT}")
        logger.info("Press Ctrl+C to stop the server")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}") 