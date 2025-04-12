import json
import os
from typing import List, Dict, Any

def search_blender_api(query: str, n: int = 10) -> List[Dict[str, Any]]:
    """
    Simple search function that searches through a JSON file containing Blender API documentation.
    Returns a list of matching results.
    
    Args:
        query (str): The search query
        n (int): Maximum number of results to return (default: 10)
        
    Returns:
        List[Dict[str, Any]]: List of matching API documentation entries
    """
    results = []
    
    # Path to the JSON file containing Blender API documentation
    api_docs_path = os.path.join(os.path.dirname(__file__), "data", "blender_api.json")
    
    try:
        # Load API documentation
        if os.path.exists(api_docs_path):
            with open(api_docs_path, 'r', encoding='utf-8') as f:
                api_docs = json.load(f)
        else:
            # Return empty results if no documentation file exists
            return []
        
        # Simple search implementation
        query = query.lower()
        for item in api_docs:
            # Search in name
            if query in item.get("name", "").lower():
                results.append(item)
                continue
                
            # Search in description
            if query in item.get("description", "").lower():
                results.append(item)
                continue
                
            # Search in parameters
            if any(query in str(param).lower() for param in item.get("parameters", [])):
                results.append(item)
                continue
        
        return results[:n]  # Return top n results
        
    except Exception as e:
        print(f"Error searching API: {str(e)}")
        return []

if __name__ == "__main__":
    # Example usage
    query = "How to add a cube to the scene"
    results = search_blender_api(query, n=5)
    
    for i, result in enumerate(results):
        print(f"Result {i+1}:")
        print(f"Name: {result.get('name', 'No name')}")
        print(f"Description: {result.get('description', 'No description')}")
        print(f"Parameters: {result.get('parameters', 'No parameters')}")
        print("-" * 80) 