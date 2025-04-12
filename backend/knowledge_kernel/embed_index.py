import json
import os
import chromadb
from chromadb.utils import embedding_functions

def load_api_data(file_path="blender_api_scraped.json"):
    """Load the scraped API data"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_embeddings():
    """Create and store embeddings for the API documentation"""
    # Ensure output directory exists
    os.makedirs("api_index", exist_ok=True)
    
    # Load data
    try:
        api_data = load_api_data()
        print(f"Loaded {len(api_data)} API documents")
    except FileNotFoundError:
        print("Error: blender_api_scraped.json not found. Run scrape_api_docs.py first.")
        return
    
    # Set up ChromaDB client
    client = chromadb.PersistentClient(path="api_index")
    
    # Create embedding function using sentence-transformers
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="blender_api",
        embedding_function=embedding_function,
        metadata={"description": "Blender Python API Documentation"}
    )
    
    # Prepare data for insertion
    ids = [f"doc_{i}" for i in range(len(api_data))]
    documents = [doc["content"] for doc in api_data]
    metadatas = [{"title": doc["title"], "url": doc["url"]} for doc in api_data]
    
    # Add documents to collection
    print("Adding documents to collection...")
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    
    print(f"Successfully embedded {len(documents)} documents")
    print(f"Index stored in: {os.path.abspath('api_index')}")

if __name__ == "__main__":
    create_embeddings() 