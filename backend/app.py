import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio
import websockets
from typing import Optional, Dict, Any, List
import logging
import base64
from contextlib import asynccontextmanager
import tempfile

# Import our modules
from services.ai_agent import BlenderAIAgent
from services.file_importer import BlenderFileImporter
from knowledge_kernel.search import search_blender_api
from config import API_HOST, API_PORT, CORS_ORIGINS, BLENDER_WS_URL
from utils.websocket_utils import connect_to_blender, send_to_blender, broadcast_to_clients

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use os to check for environment-specific configurations
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# WebSocket connection to Blender
blender_ws = None
blender_ws_lock = asyncio.Lock()

# Define lifespan context manager to replace on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info(f"Starting Blender AI Agent API on {API_HOST}:{API_PORT}")
    
    # Try establishing direct connection with websockets library (used as backup)
    try:
        # This is a direct use of the websockets library for diagnostic purposes
        ws_uri = f"ws://{BLENDER_WS_URL.split('://')[-1]}"
        async with websockets.connect(ws_uri, ping_timeout=1):
            logger.info(f"Successfully verified direct WebSocket connection to {ws_uri}")
    except Exception as e:
        logger.warning(f"Direct websocket connection test failed: {str(e)}")
    
    # Yield control to FastAPI to handle requests
    yield
    
    # Shutdown logic
    logger.info("Shutting down Blender AI Agent API")
    # Close any remaining websocket connections, etc.

# Initialize the FastAPI app with lifespan
app = FastAPI(title="Blender AI Agent API", lifespan=lifespan)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the AI agent and file importer
ai_agent = BlenderAIAgent()
file_importer = BlenderFileImporter()

# Pydantic models for API requests
class CodeGenerationRequest(BaseModel):
    prompt: str
    include_scene_data: bool = True

class BlenderFunctionRequest(BaseModel):
    function_path: str

class CodeExecutionRequest(BaseModel):
    code: str

class FileImportRequest(BaseModel):
    file_data: str
    file_format: str
    extrude: bool = True
    extrude_depth: float = 0.1

# Connected WebSocket clients
websocket_clients = set()

@app.get("/")
async def root():
    return {"message": "Blender AI Agent API is running"}

@app.post("/generate-code")
async def generate_code(request: CodeGenerationRequest):
    """Generate Blender Python code based on user prompt"""
    try:
        # Get scene data if requested
        scene_data = None
        if request.include_scene_data:
            scene_data = await get_blender_scene_data()
        
        # Generate code
        code = ai_agent.generate_code(request.prompt, scene_data)
        
        return {"code": code}
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-api")
async def search_api(query: str):
    """Search the Blender API documentation"""
    try:
        results = search_blender_api(query)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error searching API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute-code")
async def execute_blender_code(request: CodeExecutionRequest):
    """Execute Python code in Blender"""
    try:
        result = await send_to_blender(BLENDER_WS_URL, "execute_code", {"code": request.code})
        return result
    except Exception as e:
        logger.error(f"Error executing code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/describe-function")
async def describe_function(request: BlenderFunctionRequest):
    """Get documentation for a Blender function"""
    try:
        result = await send_to_blender(BLENDER_WS_URL, "describe_function", {"function_path": request.function_path})
        return result
    except Exception as e:
        logger.error(f"Error describing function: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import-file")
async def import_file(request: FileImportRequest):
    """Import a file (SVG, DXF) into Blender and optionally extrude it"""
    try:
        # Convert base64 data to UploadFile
        file_content = base64.b64decode(request.file_data)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{request.file_format}")
        temp_file.write(file_content)
        temp_file.close()
        
        # Create an UploadFile-like object
        upload_file = UploadFile(
            filename=f"import.{request.file_format}",
            file=open(temp_file.name, "rb")
        )
        
        # Set options
        options = {
            "extrude": request.extrude_depth if request.extrude else 0.0,
            "scale": 1.0
        }
        
        # Process the file
        result = await file_importer.import_and_process(upload_file, options)
        
        # Close and remove temp file
        upload_file.file.close()
        os.remove(temp_file.name)
        
        if result["status"] != "success":
            return JSONResponse(status_code=400, content={"error": result["message"]})
        
        # Execute the generated code in Blender
        execution_result = await send_to_blender(BLENDER_WS_URL, "execute_code", {"code": result["code"]})
        
        return {
            "success": True,
            "message": "File imported successfully",
            "execution_result": execution_result
        }
    except Exception as e:
        logger.error(f"Error importing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    extrude: bool = Form(True),
    extrude_depth: float = Form(0.1)
):
    """Upload and import a file into Blender"""
    try:
        # Get file format from extension
        file_format = os.path.splitext(file.filename)[1].lower()
        
        # Define supported formats
        supported_formats = ['.svg', '.dxf', '.SVG', '.DXF']
        
        if file_format not in supported_formats:
            return JSONResponse(
                status_code=400, 
                content={"error": f"Unsupported file format: {file_format}. Supported formats: {', '.join(supported_formats)}"}
            )
        
        # Set options
        options = {
            "extrude": extrude_depth if extrude else 0.0,
            "scale": 1.0,
            "merge": True
        }
        
        # Process the file
        result = await file_importer.import_and_process(file, options)
        
        if result["status"] != "success":
            return JSONResponse(status_code=400, content={"error": result["message"]})
        
        # Execute the generated code in Blender
        execution_result = await send_to_blender(BLENDER_WS_URL, "execute_code", {"code": result["code"]})
        
        return {
            "success": True,
            "message": f"File '{file.filename}' imported successfully",
            "execution_result": execution_result
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    websocket_clients.add(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            data_json = json.loads(data)
            
            command = data_json.get("command")
            params = data_json.get("params", {})
            
            if command == "connect_to_blender":
                # Connect to Blender WebSocket
                blender_url = params.get("url", BLENDER_WS_URL)
                result = await connect_to_blender(blender_url)
                await websocket.send_json({"type": "connect_result", "result": result})
            
            elif command == "get_connected_clients":
                # Return a list of connected clients (using List typing here)
                client_list: List[Dict[str, Any]] = [
                    {"id": id(client), "connected_at": getattr(client, "connected_at", None)}
                    for client in websocket_clients
                ]
                await websocket.send_json({"type": "client_list", "clients": client_list})
            
            elif command == "generate_code":
                # Generate code
                prompt = params.get("prompt")
                include_scene_data = params.get("include_scene_data", True)
                
                scene_data = None
                if include_scene_data:
                    scene_data = await get_blender_scene_data()
                
                code = ai_agent.generate_code(prompt, scene_data)
                await websocket.send_json({"type": "code_generated", "code": code})
            
            elif command == "execute_code":
                # Execute code in Blender
                code = params.get("code")
                result = await send_to_blender(BLENDER_WS_URL, "execute_code", {"code": code})
                await websocket.send_json({"type": "code_executed", "result": result})
            
            elif command == "introspect_scene":
                # Get scene data from Blender
                scene_data = await get_blender_scene_data()
                await websocket.send_json({"type": "scene_data", "data": scene_data})
            
            elif command == "import_file":
                # Import a file
                file_data = params.get("file_data")
                file_format = params.get("file_format")
                extrude = params.get("extrude", True)
                extrude_depth = params.get("extrude_depth", 0.1)
                
                # Create a temporary file and UploadFile object
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_format}")
                temp_file.write(base64.b64decode(file_data))
                temp_file.close()
                
                upload_file = UploadFile(
                    filename=f"import.{file_format}",
                    file=open(temp_file.name, "rb")
                )
                
                options = {
                    "extrude": extrude_depth if extrude else 0.0,
                    "scale": 1.0,
                    "merge": True
                }
                
                result = await file_importer.import_and_process(upload_file, options)
                
                # Close and remove temp file
                upload_file.file.close()
                os.remove(temp_file.name)
                
                if result["status"] != "success":
                    await websocket.send_json({"type": "import_error", "error": result["message"]})
                else:
                    execution_result = await send_to_blender(BLENDER_WS_URL, "execute_code", {"code": result["code"]})
                    await websocket.send_json({
                        "type": "file_imported", 
                        "result": {
                            "success": True,
                            "message": "File imported successfully",
                            "execution_result": execution_result
                        }
                    })
    
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        websocket_clients.remove(websocket)

async def get_blender_scene_data() -> Optional[Dict[str, Any]]:
    """Get the current scene data from Blender"""
    try:
        result = await send_to_blender(BLENDER_WS_URL, "introspect_scene", {})
        return result.get("result", None)
    except Exception as e:
        logger.error(f"Error getting scene data: {str(e)}")
        return None

async def broadcast_to_websocket_clients(message: Dict[str, Any]):
    """Broadcast a message to all connected WebSocket clients"""
    await broadcast_to_clients(websocket_clients, message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 