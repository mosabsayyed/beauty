import os
from qdrant_client import QdrantClient
from openai import OpenAI

# Configure environment variables for keys and settings
# Configure environment variables for keys and settings
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', 'your-openai-key')
os.environ['OPENAI_MODEL'] = 'text-embedding-3-small'
os.environ['QDRANT_URL'] = os.getenv('QDRANT_URL', 'your-qdrant-url')
os.environ['QDRANT_API_KEY'] = os.getenv('QDRANT_API_KEY', 'your-qdrant-key')

openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL'),
    api_key=os.getenv('QDRANT_API_KEY')
)

collections = [
    'ws-1781fe9ea20ae979', 'ws-2e628e751ed7014a', 'ws-8fda6d24e350a94a', 'ws-5b57d96fe17e94dc',
    'ws-c4ee1072fff0cdb3', 'ws-1e7c81ec81ac7b3f', 'ws-133c6970ea5c2901', 'ws-7d899895193b4be5',
    'ws-f296a755383b0c97', 'ws-f34d760f98acde0c', 'ws-7d6e98cdcada89f8', 'ws-a69da518b0b9e35c',
    'ws-22a02e520242a05c', 'ws-ec38565726791cb3', 'ws-b5006a75c3fd20c4', 'ws-f80085b12b401c50',
    'ws-e1132ce49f40d7e1', 'ws-bcdb9acce001162f', 'ws-58dcc7d127e548ed', 'ws-53c1e63085c1ed23',
    'ws-456ff66165102eab'
]

query = "GraphFilters"
embedding_model = os.getenv('OPENAI_MODEL')
response = openai_client.embeddings.create(input=query, model=embedding_model)
query_vector = response.data[0].embedding

print(f"Searching for '{query}' in collections...")

for collection_name in collections:
    try:
        search_results = qdrant_client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=1,
            with_payload=True,
            with_vectors=False
        )
        if search_results.points:
            point = search_results.points[0]
            if point.score > 0.4: # Filter low scores
                print(f"Match in {collection_name}: Score {point.score}")
                print(f"Payload: {point.payload}")
    except Exception as e:
        pass
