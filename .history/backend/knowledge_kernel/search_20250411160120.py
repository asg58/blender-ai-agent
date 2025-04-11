import chromadb
from chromadb.utils import embedding_functions
import os

def search_blender_api(query: str, n=3):
    """
    Search for relevant Blender API documentation using semantic search
    
    Args:
        query (str): The search query
        n (int): Number of results to return
        
    Returns:
        list: Top n documents with content and url
    """
    # Check if index exists
    if not os.path.exists("api_index"):
        raise FileNotFoundError("API index not found. Run embed_index.py first.")
    
    # Set up ChromaDB client
    client = chromadb.PersistentClient(path="api_index")
    
    # Create embedding function using sentence-transformers
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Get collection
    try:
        collection = client.get_collection(
            name="blender_api",
            embedding_function=embedding_function
        )
    except ValueError:
        raise ValueError("Blender API collection not found. Run embed_index.py first.")
    
    # Query the collection
    results = collection.query(
        query_texts=[query],
        n_results=n
    )
    
    # Format results
    documents = []
    if results["documents"] and len(results["documents"][0]) > 0:
        for i, doc in enumerate(results["documents"][0]):
            documents.append({
                "content": doc,
                "url": results["metadatas"][0][i]["url"] if "url" in results["metadatas"][0][i] else "",
                "title": results["metadatas"][0][i]["title"] if "title" in results["metadatas"][0][i] else ""
            })
    
    return documents

if __name__ == "__main__":
    # Example usage
    query = "How to add a cube to the scene"
    results = search_blender_api(query, n=2)
    
    for i, result in enumerate(results):
        print(f"Result {i+1}:")
        print(f"Title: {result.get('title', 'No title')}")
        print(f"URL: {result.get('url', 'No URL')}")
        print(f"Content snippet: {result.get('content', 'No content')[:150]}...")
        print("-" * 80) 