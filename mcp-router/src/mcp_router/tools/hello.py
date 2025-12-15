import json

if __name__ == '__main__':
    import sys
    data = sys.stdin.read()
    try:
        payload = json.loads(data) if data else {}
    except Exception:
        payload = {}
    resp = {'success': True, 'status': 200, 'data': {'message': 'hello from mcp-router hello tool', 'payload': payload}}
    print(json.dumps(resp))
