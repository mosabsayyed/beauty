import os
import sys
import json
from qdrant_client import QdrantClient
from openai import OpenAI

# Configure environment variables for keys and settings
os.environ['OPENAI_API_KEY'] = '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'
os.environ['OPENAI_MODEL'] = 'text-embedding-3-small'
os.environ['QDRANT_URL'] = 'https://a8a5ba79-fabf-4f7d-a5d6-0d857afd34c5.europe-west3-0.gcp.cloud.qdrant.io'
os.environ['QDRANT_API_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzcxMTIzNjY0fQ.jlUzDVPQcnzndG2QK0X8FQjH6Koh2XlH_L8qvOiDoxg'

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