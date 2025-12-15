import json
import os

def load_env(path):
    with open(path, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

load_env("/home/mosab/projects/chatmodule/backend/.env")
api_key = os.getenv("GROQ_API_KEY")
mcp_router_url = os.getenv("MCP_ROUTER_URL") or os.getenv("MCP_SERVER_URL")

with open("prompt_prefix.txt", "r") as f:
    prefix = f.read()

query = "Show me the 2026 projects status report."
full_input = prefix + "\nUSER QUERY\n\n" + query

payload = {
    "model": "openai/gpt-oss-120b",
    "input": full_input,
    "stream": False,
    "temperature": 0.1,
    "tool_choice": "auto",
    "tools": [
        {
            "type": "mcp",
            "server_label": "neo4j_database",
            "server_url": mcp_router_url,
            "require_approval": "never"
        }
    ]
}

# Escape single quotes for shell
json_payload = json.dumps(payload).replace("'", "'\\''")

curl_cmd = f"""curl -s -X POST https://api.groq.com/openai/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{json_payload}'"""

print(curl_cmd)
