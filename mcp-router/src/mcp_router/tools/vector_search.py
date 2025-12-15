import json

if __name__ == '__main__':
    import sys
    data = sys.stdin.read()
    try:
        payload = json.loads(data) if data else {}
    except Exception:
        payload = {}
    query = payload.get('args', {}).get('query', 'query')
    results = [
        {"id": "doc_1", "score": 0.95, "snippet": "Sample result for '" + query + "'"},
        {"id": "doc_2", "score": 0.84, "snippet": "Another result"}
    ]
    response = {
        "success": True,
        "status": 200,
        "data": {
            "query": query,
            "results": results
        }
    }
    print(json.dumps(response))
