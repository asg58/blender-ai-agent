# Blender AI Agent

An intelligent agent that controls Blender through natural language commands.

## Features

- Control Blender using natural language commands
- Generate Python code for Blender operations
- Real-time communication with Blender via WebSockets
- File import capabilities (SVG, DXF)
- Interactive UI for command input and execution

## Setup & Installation

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Blender 3.5 or higher
- Ollama for AI model serving

### Backend Setup

1. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

1. Run the FastAPI backend:

```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

1. Run the Next.js development server:

```bash
cd frontend
npm run dev
```

### Blender Setup

1. Install the Blender add-on from the `blender_addon` directory
2. Start Blender and enable the add-on
3. The WebSocket server in Blender should start automatically on port 9876

## Usage

1. Open the frontend in your browser at <http://localhost:3000>
2. Connect to Blender using the connection button
3. Enter natural language commands in the input field
4. View and execute the generated Python code

## Architecture

- **Backend**: FastAPI server with WebSocket support
- **Frontend**: Next.js/React UI with Tailwind CSS
- **Blender**: Python add-on with WebSocket server
- **AI**: Powered by Ollama (supports various models like Mistral, Llama3, etc.)

## Example Commands

- "Create a red cube at the origin"
- "Add a point light above the scene"
- "Make the selected object twice as big"
- "Render the current scene"
- "Apply a subdivision surface modifier to the selected object"

## License

MIT
