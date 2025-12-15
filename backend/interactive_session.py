import os
import sys
import json
import requests
import importlib
import readline

# Load env
def load_env(path):
    with open(path, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

load_env("/home/mosab/projects/chatmodule/backend/.env")
sys.path.append("/home/mosab/projects/chatmodule/backend")

import app.services.orchestrator_zero_shot as orchestrator_module

def interactive_session():
    print("Initializing Orchestrator...")
    orchestrator = orchestrator_module.OrchestratorZeroShot()
    conversation_history = []
    
    print("\n--- DIRECT INTERACTIVE SESSION ---")
    print("Type your message. Type 'exit' to quit. Type '/history' to see context.")
    
    while True:
        try:
            user_input = input("\nYOU: ")
            if user_input.lower() == 'exit':
                break
            if user_input.lower() == '/history':
                print(json.dumps(conversation_history, indent=2))
                continue
            
            print("Thinking...")
            
            # Build input using the Orchestrator's logic
            # We use the standard static_prefix + dynamic_suffix
            prefix = orchestrator.static_prefix
            suffix = orchestrator._build_dynamic_suffix(user_input, conversation_history)
            full_input = prefix + suffix
            
            payload = {
                "model": orchestrator.model,
                "input": full_input,
                "stream": False,
                "temperature": 0.1,
                "tool_choice": "auto",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "neo4j_database",
                        "server_url": orchestrator.mcp_router_url,
                        "require_approval": "never"
                    },
                    {
                        "type": "mcp",
                        "server_label": "file_reader",
                        "server_url": orchestrator.mcp_router_url,
                        "require_approval": "never"
                    }
                ]
            }
            
            response = requests.post(
                "https://api.groq.com/openai/v1/responses",
                headers={
                    "Authorization": f"Bearer {orchestrator.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=120
            )
            
            if response.status_code != 200:
                print(f"API ERROR: {response.status_code} - {response.text}")
                continue
                
            resp_json = response.json()
            normalized = orchestrator._normalize_response(resp_json)
            
            # Print Reasoning/Thought Trace
            if normalized.get("memory_process"):
                print(f"\n[THOUGHT]: {normalized['memory_process'].get('thought_trace', 'No trace')}")
            
            # Print Answer
            answer = normalized.get("answer", "")
            print(f"\n[NOOR]: {answer}")
            
            # Print Tool Results (if any)
            tool_results = normalized.get("tool_results", [])
            if tool_results:
                print(f"\n[TOOLS EXECUTED]: {len(tool_results)}")
                for tr in tool_results:
                    print(f"- {tr['tool']}")
            
            # Check for empty answer
            if not answer and not tool_results:
                print("\n[SYSTEM WARNING]: Empty answer and no tools. Checking raw output...")
                # Check for function_call fallback
                output_items = resp_json.get("output", [])
                for item in output_items:
                    if item.get("type") == "function_call":
                        print(f"[DEBUG]: FUNCTION_CALL DETECTED: {item.get('name')}")
                        print(f"[DEBUG]: Args: {item.get('arguments')}")
            
            # Update History
            conversation_history.append({"role": "user", "content": user_input})
            conversation_history.append({"role": "assistant", "content": answer})
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    interactive_session()
