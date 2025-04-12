import requests
import json
import sys
import os

# Voeg het pad toe aan sys.path
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# URL van de API
API_URL = "http://localhost:8000"

def generate_code(prompt):
    """Genereer Blender code op basis van een prompt"""
    url = f"{API_URL}/generate-code"
    payload = {
        "prompt": prompt,
        "include_scene_data": False
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            return response.json().get("code", "")
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error: {str(e)}"

def execute_code(code):
    """Voer code uit in Blender"""
    url = f"{API_URL}/execute-code"
    try:
        response = requests.post(url, json={"code": code})
        if response.status_code == 200:
            return response.json()
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Test prompt
    prompt = "Maak een rode kubus op de oorsprong"
    
    print(f"Prompt: {prompt}")
    
    # Genereer code
    print("\nCode genereren...")
    code = generate_code(prompt)
    print(f"Gegenereerde code:\n{code}")
    
    # Voer code uit in Blender
    if "Error" not in code:
        print("\nCode uitvoeren in Blender...")
        result = execute_code(code)
        print(f"Resultaat: {json.dumps(result, indent=2)}")
    else:
        print("Code bevat fouten, niet uitgevoerd in Blender.") 