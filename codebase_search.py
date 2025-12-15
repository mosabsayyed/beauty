import os
import sys
import json
from qdrant_client import QdrantClient
from openai import OpenAI

# Configure environment variables for keys and settings
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', 'your-openai-key')
os.environ['OPENAI_MODEL'] = 'text-embedding-3-small'
os.environ['QDRANT_URL'] = os.getenv('QDRANT_URL', 'your-qdrant-url')
os.environ['QDRANT_API_KEY'] = os.getenv('QDRANT_API_KEY', 'your-qdrant-key')

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL'),
    api_key=os.getenv('QDRANT_API_KEY')
)

def search_qdrant(query: str, collection_name: str, limit: int = 5) -> list:
    """
    Embeds the natural language query using OpenAI's embedding model and performs a semantic search in the specified Qdrant collection.
    
    Args:
        query (str): The natural language query to search for.
        collection_name (str): The name of the Qdrant collection to search in.
        limit (int, optional): The maximum number of results to return. Defaults to 5.
    
    Returns:
        list: A list of dictionaries, each containing the score and payload of a search result.
    """
    # Embed the query using OpenAI
    embedding_model = os.getenv('OPENAI_MODEL')
    response = openai_client.embeddings.create(
        input=query,
        model=embedding_model
    )
    query_vector = response.data[0].embedding
    
    # Perform the vector search using query_points
    search_results = qdrant_client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=limit,
        with_payload=True,  # Include payloads in the results for structured output
        with_vectors=False  # No need to return vectors in the output
    )
    
    # Structure the results as a list of dicts with score and payload
    structured_results = [
        {
            "score": point.score,
            "payload": point.payload
        }
        for point in search_results.points
    ]
    
    return structured_results

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py <query> <collection_name> [limit]")
        sys.exit(1)
    
    query = sys.argv[1]
    collection_name = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    
    results = search_qdrant(query, collection_name, limit)
    
    # Output the structured results as JSON
    print(json.dumps(results, indent=4))