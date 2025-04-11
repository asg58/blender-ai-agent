import os
import json
import requests
from typing import List, Dict, Any, Optional
import sys

# Add the parent directory to sys.path to import from knowledge_kernel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from knowledge_kernel.search import search_blender_api

class BlenderAIAgent:
    def __init__(self, ollama_api_url: str = "http://localhost:11434/api/chat"):
        """
        Initialize the Blender AI Agent
        
        Args:
            ollama_api_url (str): URL for the Ollama API
        """
        self.ollama_api_url = ollama_api_url
        self.model = "mistral:latest"  # Default model
    
    def set_model(self, model_name: str):
        """Change the LLM model"""
        self.model = model_name
    
    def generate_code(self, user_prompt: str, scene_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate Blender Python code based on user prompt and context
        
        Args:
            user_prompt (str): The user's request
            scene_data (dict): Current Blender scene data
            
        Returns:
            str: Generated Python code for Blender
        """
        # Get relevant API documentation
        api_docs = search_blender_api(user_prompt, n=2)
        
        # Format API docs as context
        knowledge_block = ""
        for i, doc in enumerate(api_docs):
            knowledge_block += f"--- Document {i+1} ---\n"
            knowledge_block += f"Title: {doc.get('title', 'No title')}\n"
            knowledge_block += f"URL: {doc.get('url', 'No URL')}\n"
            knowledge_block += f"Content: {doc.get('content', 'No content')}\n\n"
        
        # Add scene data if available
        scene_context = ""
        if scene_data:
            scene_context = f"[SCENE DATA]:\n{json.dumps(scene_data, indent=2)}\n\n"
        
        # Build the full prompt
        prompt = f"""[KNOWLEDGE]:
{knowledge_block}

{scene_context}[OPDRACHT]:
{user_prompt}

[UITVOERBARE CODE]:
"""
        
        # Send to Ollama API
        response = self._call_ollama(prompt)
        
        # Extract code from response
        return self._extract_code(response)
    
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
        except requests.RequestException as e:
            print(f"Error calling Ollama API: {e}")
            return f"Error: {str(e)}"
    
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