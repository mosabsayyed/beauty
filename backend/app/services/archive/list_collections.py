import os
from qdrant_client import QdrantClient

# Configure environment variables for keys and settings
os.environ['QDRANT_URL'] = 'https://a8a5ba79-fabf-4f7d-a5d6-0d857afd34c5.europe-west3-0.gcp.cloud.qdrant.io'
os.environ['QDRANT_API_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzcxMTIzNjY0fQ.jlUzDVPQcnzndG2QK0X8FQjH6Koh2XlH_L8qvOiDoxg'

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL'),
    api_key=os.getenv('QDRANT_API_KEY')
)

try:
    collections = qdrant_client.get_collections()
    print("Available collections:")
    for collection in collections.collections:
        print(f"- {collection.name}")
except Exception as e:
    print(f"Error listing collections: {e}")
