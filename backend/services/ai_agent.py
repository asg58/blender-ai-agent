import os
import json
import requests
from typing import List, Dict, Any, Optional
import sys
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import from knowledge_kernel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from knowledge_kernel.search import search_blender_api
    from config import OLLAMA_API_URL, OLLAMA_MODEL
except ImportError:
    # Create a dummy function if the module is not available
    def search_blender_api(query: str, n=3):
        return []
    # Default config values if import fails
    OLLAMA_API_URL = "http://localhost:11434/api/chat"
    OLLAMA_MODEL = "mistral:latest"

class BlenderAIAgent:
    def __init__(self, ollama_api_url: str = OLLAMA_API_URL):
        """
        Initialize the Blender AI Agent
        
        Args:
            ollama_api_url (str): URL for the Ollama API
        """
        self.ollama_api_url = ollama_api_url
        self.model = OLLAMA_MODEL  # Use configured model
        self.history: List[Dict[str, Any]] = []  # Store conversation history
        self.logger = logging.getLogger(__name__)
    
    def set_model(self, model_name: str):
        """Change the LLM model"""
        self.model = model_name
    
    def generate_code(self, prompt: str, scene_data: Optional[Dict[str, Any]] = None) -> str:
        """Generate Blender Python code based on user prompt and optional scene data"""
        try:
            # Search for relevant API documentation
            api_results = search_blender_api(prompt, n=2)
            
            # Format API docs as context
            knowledge_block = ""
            for i, doc in enumerate(api_results):
                knowledge_block += f"--- Document {i+1} ---\n"
                knowledge_block += f"Name: {doc.get('name', 'No name')}\n"
                knowledge_block += f"Description: {doc.get('description', 'No description')}\n"
                knowledge_block += f"Parameters: {doc.get('parameters', 'No parameters')}\n\n"
            
            # Add scene data if available
            scene_context = ""
            if scene_data:
                scene_context = f"[SCENE DATA]:\n{json.dumps(scene_data, indent=2)}\n\n"
            
            # Build the full prompt
            full_prompt = f"""[KNOWLEDGE]:
{knowledge_block}

{scene_context}[OPDRACHT]:
{prompt}

[UITVOERBARE CODE]:
"""
            
            # Roep Ollama API aan met de volledige prompt
            generated_code = self._call_ollama(full_prompt)
            
            # Extraheer de code uit het antwoord
            cleaned_code = self._extract_code(generated_code)
            
            return cleaned_code
            
        except Exception as e:
            self.logger.error(f"Error generating code: {str(e)}")
            raise
    
    def _call_ollama(self, prompt: str) -> str:
        """Call the Ollama API and get the response"""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an expert Blender Python API assistant. Your task is to generate executable Python code for Blender based on the user's request."},
                {"role": "user", "content": prompt}
            ]
        }
        
        try:
            response = requests.post(self.ollama_api_url, json=payload)
            response.raise_for_status()
            return response.json()["message"]["content"]
        except requests.ConnectionError as e:
            error_msg = f"Connection error when calling Ollama API: {e}"
            print(error_msg)
            self.history.append({"type": "error", "message": error_msg})
            return f"Connection Error: Could not connect to Ollama API. Is the service running?"
        except requests.Timeout as e:
            error_msg = f"Timeout error when calling Ollama API: {e}"
            print(error_msg)
            self.history.append({"type": "error", "message": error_msg})
            return f"Timeout Error: The request to Ollama API timed out."
        except requests.HTTPError as e:
            error_msg = f"HTTP error when calling Ollama API: {e}"
            print(error_msg)
            self.history.append({"type": "error", "message": error_msg})
            return f"HTTP Error: {e.response.status_code} - {e.response.reason}"
        except (KeyError, json.JSONDecodeError) as e:
            error_msg = f"Error parsing Ollama API response: {e}"
            print(error_msg)
            self.history.append({"type": "error", "message": error_msg})
            return f"Error: Received invalid response from Ollama API."
        except Exception as e:
            error_msg = f"Unexpected error when calling Ollama API: {e}"
            print(error_msg)
            self.history.append({"type": "error", "message": error_msg})
            return f"Unexpected Error: {str(e)}"
    
    def get_history(self) -> List[Dict[str, Any]]:
        """Return the conversation history"""
        return self.history
    
    def _extract_code(self, response: str) -> str:
        """Extract code block from the response"""
        # Simple extraction of code between python code blocks
        if "```python" in response and "```" in response:
            code_blocks = []
            parts = response.split("```python")
            for part in parts[1:]:  # Skip the first part before any code block
                if "```" in part:
                    code = part.split("```")[0].strip()
                    code_blocks.append(code)
            
            return "\n".join(code_blocks)
            
        # If no code block markers, return the whole response
        return response

# Example usage
if __name__ == "__main__":
    agent = BlenderAIAgent()
    code = agent.generate_code("Create a red cube at the origin")
    print("Generated code:")
    print(code) 