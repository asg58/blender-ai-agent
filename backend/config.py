"""
Configuration settings for the application.
Loads from environment variables with sensible defaults.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API and Web Server Settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Blender WebSocket Settings
BLENDER_WS_HOST = os.getenv("BLENDER_WS_HOST", "localhost")
BLENDER_WS_PORT = int(os.getenv("BLENDER_WS_PORT", "9876"))
BLENDER_WS_URL = f"ws://{BLENDER_WS_HOST}:{BLENDER_WS_PORT}"

# Ollama AI Settings
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost")
OLLAMA_PORT = int(os.getenv("OLLAMA_PORT", "11434"))
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral:latest")

# File Import Settings
SUPPORTED_FILE_FORMATS = ["svg", "dxf"]
DEFAULT_EXTRUDE = True
DEFAULT_EXTRUDE_DEPTH = 0.1 