# 🧠 Blender AI Expert Agent

An AI-powered agent that understands and controls Blender in real-time based on natural language instructions, API knowledge, and scene data.

## 🛠️ Features

- Live scene data analysis via WebSocket
- Semantic search of Blender Python API
- Code generation based on natural language prompts
- Real-time execution of generated code in Blender
- WebSocket communication between backend and Blender

## 📦 Project Structure

- `/backend/knowledge_kernel/` - API documentation scraper and embedder
- `/backend/services/` - AI agent for code generation
- `/blender_agent/` - WebSocket server for Blender
- `/backend/app.py` - FastAPI server

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Blender 3.0+
- [Ollama](https://github.com/ollama/ollama) (for LLM inference)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blender-ai-agent.git
   cd blender-ai-agent
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start Ollama with a compatible model:
   ```bash
   ollama pull mistral
   ollama serve
   ```

### Usage

1. First, scrape the Blender API documentation:
   ```bash
   python backend/knowledge_kernel/scrape_api_docs.py
   ```

2. Create embeddings from the scraped documentation:
   ```bash
   python backend/knowledge_kernel/embed_index.py
   ```

3. Start the FastAPI backend:
   ```bash
   python backend/app.py
   ```

4. Start Blender and run the following in the Blender Python console:
   ```python
   import bpy
   exec(open("path/to/blender_agent/websocket_server.py").read())
   register_websocket_server()
   bpy.ops.websocket.start_server()
   ```

5. Connect to the WebSocket server from the backend.

## 🔧 Usage Examples

### Generate and Execute Code

```python
# Example: Create a red cube
prompt = "Create a red cube at the origin"
response = requests.post("http://localhost:8000/generate-code", 
                        json={"prompt": prompt})
code = response.json()["code"]

# Execute the generated code
response = requests.post("http://localhost:8000/execute-code", 
                        json={"code": code})
```

### Search the API Documentation

```python
response = requests.post("http://localhost:8000/search-api?query=how to add a mesh")
results = response.json()["results"]
```

## ✨ Bonus Features

- SVG/DXF import and extrusion
- Live 3D render feedback
- Real-time error correction

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 