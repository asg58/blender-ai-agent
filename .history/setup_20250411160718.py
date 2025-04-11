import subprocess
import os
import sys
import platform

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required.")
        sys.exit(1)
    print(f"Python version: {platform.python_version()} ✓")

def check_blender():
    """Check if Blender is installed"""
    blender_path = None
    
    if platform.system() == "Windows":
        # Try common installation paths on Windows
        common_paths = [
            r"C:\Program Files\Blender Foundation\Blender 3.0",
            r"C:\Program Files\Blender Foundation\Blender 3.1",
            r"C:\Program Files\Blender Foundation\Blender 3.2",
            r"C:\Program Files\Blender Foundation\Blender 3.3",
            r"C:\Program Files\Blender Foundation\Blender 3.4",
            r"C:\Program Files\Blender Foundation\Blender 3.5",
            r"C:\Program Files\Blender Foundation\Blender 3.6"
        ]
        
        for path in common_paths:
            if os.path.exists(os.path.join(path, "blender.exe")):
                blender_path = os.path.join(path, "blender.exe")
                break
    
    elif platform.system() == "Darwin":  # macOS
        # Try common installation paths on macOS
        common_paths = [
            "/Applications/Blender.app/Contents/MacOS/Blender"
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                blender_path = path
                break
    
    else:  # Linux and others
        # Try to find blender in PATH
        try:
            result = subprocess.run(["which", "blender"], capture_output=True, text=True)
            if result.returncode == 0:
                blender_path = result.stdout.strip()
        except:
            pass
    
    if blender_path:
        print(f"Blender found at: {blender_path} ✓")
    else:
        print("Warning: Blender not found. Please install Blender 3.0 or higher.")

def check_ollama():
    """Check if Ollama is installed"""
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Ollama version: {result.stdout.strip()} ✓")
        else:
            print("Warning: Ollama found but unable to determine version.")
    except:
        print("Warning: Ollama not found. Please install Ollama (https://github.com/ollama/ollama).")

def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print("Dependencies installed ✓")

def create_directories():
    """Create necessary directories"""
    dirs = ["api_index"]
    for dir_name in dirs:
        os.makedirs(dir_name, exist_ok=True)
    print("Directories created ✓")

def main():
    """Run the setup process"""
    print("Setting up Blender AI Agent...")
    
    # Check requirements
    check_python_version()
    check_blender()
    check_ollama()
    
    # Install dependencies
    install_dependencies()
    
    # Create directories
    create_directories()
    
    print("\nSetup complete! Here's how to use the Blender AI Agent:")
    print("\n1. First, scrape the Blender API documentation:")
    print("   python backend/knowledge_kernel/scrape_api_docs.py")
    
    print("\n2. Create embeddings from the scraped documentation:")
    print("   python backend/knowledge_kernel/embed_index.py")
    
    print("\n3. Start the FastAPI backend:")
    print("   python backend/app.py")
    
    print("\n4. Start Blender and run the following in the Blender Python console:")
    print("   import bpy")
    print("   exec(open(\"path/to/blender_agent/websocket_server.py\").read())")
    print("   register_websocket_server()")
    print("   bpy.ops.websocket.start_server()")
    
    print("\nFor examples on how to use the API, see the 'examples' directory.")

if __name__ == "__main__":
    main() 