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

# Import our modules
from services.ai_agent import BlenderAIAgent
from services.file_importer import BlenderFileImporter
from knowledge_kernel.search import search_blender_api
from config import API_HOST, API_PORT, CORS_ORIGINS, BLENDER_WS_URL
from utils.websocket_utils import connect_to_blender, send_to_blender, broadcast_to_clients

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connection to Blender
blender_ws = None
blender_ws_lock = asyncio.Lock()

# Define lifespan context manager to replace on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting Blender AI Agent API")
    
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
async def execute_blender_code(code: str):
    """Execute Python code in Blender"""
    try:
        result = await send_to_blender("execute_code", {"code": code})
        return result
    except Exception as e:
        logger.error(f"Error executing code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/describe-function")
async def describe_function(request: BlenderFunctionRequest):
    """Get documentation for a Blender function"""
    try:
        result = await send_to_blender("describe_function", {"function_path": request.function_path})
        return result
    except Exception as e:
        logger.error(f"Error describing function: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import-file")
async def import_file(request: FileImportRequest):
    """Import a file (SVG, DXF) into Blender and optionally extrude it"""
    try:
        # Process the file
        result = file_importer.import_and_process(
            request.file_data,
            request.file_format,
            request.extrude,
            request.extrude_depth
        )
        
        if not result["success"]:
            return JSONResponse(status_code=400, content={"error": result["error"]})
        
        # Execute the generated code in Blender
        execution_result = await send_to_blender("execute_code", {"code": result["code"]})
        
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
        # Read the file content
        file_content = await file.read()
        
        # Get file format from extension
        file_format = file.filename.split('.')[-1].lower()
        
        if file_format not in file_importer.supported_formats:
            return JSONResponse(
                status_code=400, 
                content={"error": f"Unsupported file format: {file_format}. Supported formats: {', '.join(file_importer.supported_formats)}"}
            )
        
        # Encode file content as base64
        file_data = base64.b64encode(file_content).decode('utf-8')
        
        # Process the file
        result = file_importer.import_and_process(
            file_data,
            file_format,
            extrude,
            extrude_depth
        )
        
        if not result["success"]:
            return JSONResponse(status_code=400, content={"error": result["error"]})
        
        # Execute the generated code in Blender
        execution_result = await send_to_blender("execute_code", {"code": result["code"]})
        
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
                result = await send_to_blender("execute_code", {"code": code})
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
                
                result = file_importer.import_and_process(
                    file_data, file_format, extrude, extrude_depth
                )
                
                if not result["success"]:
                    await websocket.send_json({"type": "import_error", "error": result["error"]})
                else:
                    execution_result = await send_to_blender("execute_code", {"code": result["code"]})
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