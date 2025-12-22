import json
import re
import os
import uuid

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT_PATH = os.path.join(BASE_DIR, "LANGFLOW_MIGRATION_KIT.md")
SPEC_PATH = os.path.join(BASE_DIR, "COGNITIVE_ARCHITECTURE_SPECIFICATION.md")
OUTPUT_PATH = os.path.join(BASE_DIR, "noor_agent_v3_4_flow.json")

def extract_code_block(content, header):
    # Find the header
    start_idx = content.find(header)
    if start_idx == -1:
        print(f"Warning: Header '{header}' not found.")
        return ""
    
    # Find the next python code block after the header
    code_start = content.find("```python", start_idx)
    if code_start == -1:
        print(f"Warning: Code block not found after '{header}'.")
        return ""
    
    code_start += len("```python")
    code_end = content.find("```", code_start)
    
    if code_end == -1:
        print(f"Warning: Code block end not found after '{header}'.")
        return ""
        
    return content[code_start:code_end].strip()

def extract_system_prompt(content):
    marker = "TIER 1: LIGHTWEIGHT BOOTSTRAP"
    start_idx = content.find(marker)
    if start_idx == -1:
        print("Warning: Tier 1 Bootstrap marker not found.")
        return ""
    
    end_idx = content.find("```", start_idx)
    if end_idx == -1:
        print("Warning: End of system prompt block not found.")
        return ""
        
    return content[start_idx:end_idx].strip()

# Read files
print(f"Reading from {KIT_PATH}...")
with open(KIT_PATH, "r") as f:
    kit_content = f.read()

print(f"Reading from {SPEC_PATH}...")
with open(SPEC_PATH, "r") as f:
    spec_content = f.read()

# Extract components
code_tool1 = extract_code_block(kit_content, "Tool 1: Recall Memory")
code_tool2 = extract_code_block(kit_content, "Tool 2: Retrieve Instructions")
code_tool3 = extract_code_block(kit_content, "Tool 3: Read Neo4j Cypher")
system_prompt = extract_system_prompt(spec_content)

if not all([code_tool1, code_tool2, code_tool3, system_prompt]):
    print("Warning: Some content extraction failed.")

# Construct JSON
def generate_id():
    return str(uuid.uuid4())

nodes = []
edges = []

# 1. Chat Input
input_id = "ChatInput-" + generate_id()
nodes.append({
    "id": input_id,
    "type": "ChatInput",
    "data": {
        "node": {
            "template": {
                "input_value": {"value": ""}
            }
        },
        "id": input_id
    },
    "position": {"x": 0, "y": 200}
})

# 2. Prompt
prompt_id = "Prompt-" + generate_id()
nodes.append({
    "id": prompt_id,
    "type": "Prompt",
    "data": {
        "node": {
            "template": {
                "template": {"value": system_prompt + "\n\nUser Query: {user_query}\nDate: {date}"},
                "user_query": {"value": ""},
                "date": {"value": ""}
            }
        },
        "id": prompt_id
    },
    "position": {"x": 300, "y": 200}
})

# 3. Agent (Tool Calling Agent)
agent_id = "ToolCallingAgent-" + generate_id()
nodes.append({
    "id": agent_id,
    "type": "ToolCallingAgent",
    "data": {
        "node": {
            "template": {
                "system_message": {"value": ""}
            }
        },
        "id": agent_id
    },
    "position": {"x": 900, "y": 200}
})

# 4. Custom Components
# Tool 1
tool1_id = "CustomComponent-" + generate_id()
nodes.append({
    "id": tool1_id,
    "type": "CustomComponent",
    "data": {
        "node": {
            "template": {
                "code": {"value": code_tool1}
            }
        },
        "id": tool1_id
    },
    "position": {"x": 600, "y": 0}
})

# Tool 2
tool2_id = "CustomComponent-" + generate_id()
nodes.append({
    "id": tool2_id,
    "type": "CustomComponent",
    "data": {
        "node": {
            "template": {
                "code": {"value": code_tool2}
            }
        },
        "id": tool2_id
    },
    "position": {"x": 600, "y": 300}
})

# Tool 3
tool3_id = "CustomComponent-" + generate_id()
nodes.append({
    "id": tool3_id,
    "type": "CustomComponent",
    "data": {
        "node": {
            "template": {
                "code": {"value": code_tool3}
            }
        },
        "id": tool3_id
    },
    "position": {"x": 600, "y": 600}
})

# 5. Groq Model
groq_id = "GroqModel-" + generate_id()
nodes.append({
    "id": groq_id,
    "type": "GroqModel",
    "data": {
        "node": {
            "template": {
                "model_name": {"value": "llama-3.1-70b-versatile"},
                "temperature": {"value": 0.1}
            }
        },
        "id": groq_id
    },
    "position": {"x": 600, "y": 900}
})

# 6. Chat Output
output_id = "ChatOutput-" + generate_id()
nodes.append({
    "id": output_id,
    "type": "ChatOutput",
    "data": {
        "node": {
            "template": {
                "input_value": {"value": ""}
            }
        },
        "id": output_id
    },
    "position": {"x": 1200, "y": 200}
})

# Edges
edges.append({"source": input_id, "target": prompt_id, "sourceHandle": "message", "targetHandle": "user_query"})
edges.append({"source": prompt_id, "target": agent_id, "sourceHandle": "prompt", "targetHandle": "system_message"})
edges.append({"source": groq_id, "target": agent_id, "sourceHandle": "llm", "targetHandle": "llm"})
edges.append({"source": tool1_id, "target": agent_id, "sourceHandle": "tool", "targetHandle": "tools"})
edges.append({"source": tool2_id, "target": agent_id, "sourceHandle": "tool", "targetHandle": "tools"})
edges.append({"source": tool3_id, "target": agent_id, "sourceHandle": "tool", "targetHandle": "tools"})
edges.append({"source": agent_id, "target": output_id, "sourceHandle": "response", "targetHandle": "message"})

flow = {
    "name": "Noor Agent v3.4 (Migrated)",
    "description": "Migrated from Windows workflow via Gemini CLI script.",
    "data": {
        "nodes": nodes,
        "edges": edges,
        "viewport": {"x": 0, "y": 0, "zoom": 1}
    }
}

with open(OUTPUT_PATH, "w") as f:
    json.dump(flow, f, indent=2)

print(f"Successfully generated Langflow JSON at {OUTPUT_PATH}")
