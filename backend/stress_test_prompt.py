import os
import sys
import json
import requests
import importlib
"""
ORCHESTRATOR LOGIC & RULES DOCUMENTATION

1. COGNITIVE CONTROL LOOP
   The Orchestrator implements a "Cognitive Control Loop" (Intent -> Recollect -> Plan -> Execute).
   - It analyzes the user query to determine intent (Mode A: Simple Query vs Mode B: Complex Analysis).
   - It recollects relevant knowledge/schema.
   - It plans the necessary tool calls.
   - It executes tools and synthesizes the final answer.

2. TOOL EXECUTION (MCP)
   - The system uses the Model Context Protocol (MCP) to execute tools.
   - CRITICAL RULE: `require_approval` MUST be set to "never" in the tool definition sent to Groq.
   - If `require_approval: "never"` is set, Groq executes the tool SERVER-SIDE and returns an `mcp_call` response type.
   - If `require_approval` is missing or "always", Groq may return a `function_call` (client-side fallback), which halts execution in `v1/responses`.
   - The Orchestrator is designed to handle `mcp_call` (server-side) primarily.

3. RESPONSE NORMALIZATION
   - The `_normalize_response` method is the core parser.
   - It handles:
     - `mcp_call`: Extracts tool name, arguments, and OUTPUT (result).
     - `message`: Extracts the final assistant answer.
     - `function_call`: Fallback handling (extracts query but doesn't execute).
   - It robustly extracts JSON from the answer text (handling markdown fences, escaped quotes, etc.).
   - It detects HTML content in the answer and moves it to a "visualizations" artifact to prevent "empty bubble" issues in the frontend.

4. MODES
   - Mode A (Simple Query): Direct data retrieval.
   - Mode B (Complex Analysis): Data retrieval + reasoning + insights + charts.

5. ERROR HANDLING
   - The system is designed to be robust. If a tool fails or returns empty data, the LLM should acknowledge it (as seen in the "2026 delays" scenario).
"""

import os
import sys
import json
import requests
import importlib
import time
from datetime import datetime

def load_env(path):
    with open(path, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip('"').strip("'")

# Load environment variables
load_env("/home/mosab/projects/chatmodule/backend/.env")

# Add backend to path
sys.path.append("/home/mosab/projects/chatmodule/backend")

import app.services.orchestrator_zero_shot as orchestrator_module

def load_orchestrator():
    importlib.reload(orchestrator_module)
    return orchestrator_module.OrchestratorZeroShot()

def run_query(orchestrator, query, history=[]):
    # Inject Efficiency Instruction into the prompt (PREPENDED)
    # Simplified to avoid confusing the model
    efficiency_instruction = (
        "[INSTRUCTION: Reply normally. "
        "Also append a tag: [EFFICIENCY: <how this could be more efficient>].]\n\n"
    )
    
    prefix = orchestrator.static_prefix
    # Prepend instruction to query
    suffix = orchestrator._build_dynamic_suffix(efficiency_instruction + "USER QUERY: " + query, history)
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
    
    try:
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
            return {"error": f"Error {response.status_code}: {response.text}"}
            
        resp_json = response.json()
        normalized = orchestrator._normalize_response(resp_json)
        
        # Debug empty answer
        if not normalized.get("answer") and not normalized.get("tool_results"):
            # Check for function_call in raw response
            output_items = resp_json.get("output", [])
            for item in output_items:
                if item.get("type") == "function_call":
                    normalized["debug_info"] = f"FUNCTION_CALL DETECTED: {item.get('name')}"
        
        return normalized
        
    except Exception as e:
        return {"error": f"EXCEPTION: {e}"}

def run_batch(orchestrator, scenarios_file):
    with open(scenarios_file, 'r') as f:
        data = json.load(f)
    
    legitimate = data.get("legitimate", [])
    results = []
    transcript = []
    
    print(f"\n--- STARTING BATCH RUN ({len(legitimate)} scenarios) ---")
    
    # Introduction Phase
    intro_msg = (
        "I am the Stress Tester. I need you to reply normally using your instructions, "
        "but I also need a tag with each response where it tells me how this could have been more efficient."
    )
    print(f"\n[Tester]: {intro_msg}")
    transcript.append(f"[Tester]: {intro_msg}")
    
    for i, scenario in enumerate(legitimate):
        category = scenario["category"]
        query = scenario["query"]
        print(f"\n[{i+1}/{len(legitimate)}] Category: {category}")
        print(f"Query: {query}")
        
        start_time = time.time()
        result = run_query(orchestrator, query)
        duration = time.time() - start_time
        
        answer = result.get("answer", "")
        error = result.get("error")
        cypher = result.get("cypher_executed")
        
        if error:
            print(f"RESULT: ERROR ({error})")
            transcript.append(f"\n--- SCENARIO {i+1}: {category} ---\nQuery: {query}\nRESULT: ERROR\n{error}")
        else:
            print(f"RESULT: SUCCESS ({len(answer)} chars, {duration:.2f}s)")
            transcript.append(f"\n--- SCENARIO {i+1}: {category} ---\nQuery: {query}\nRESULT: SUCCESS")
            if cypher:
                transcript.append(f"Cypher Executed: {cypher}")
            transcript.append(f"Answer: {answer}\n")
            
            if not answer:
                print("WARNING: Empty answer. Checking tool results...")
                tool_results = result.get("tool_results", [])
                print(f"Tool Results: {len(tool_results)}")
                transcript.append(f"Tool Results: {json.dumps(tool_results, indent=2)}")
                if result.get("debug_info"):
                    print(f"Debug Info: {result['debug_info']}")
                    transcript.append(f"Debug Info: {result['debug_info']}")
            
            # Check for Efficiency Tag
            if "[EFFICIENCY:" in answer:
                print("Efficiency Tag: FOUND")
            else:
                print("Efficiency Tag: MISSING")
        
        results.append({
            "category": category,
            "query": query,
            "result": result,
            "duration": duration
        })
        
        # Save transcript incrementally
        with open("batch_transcript.txt", "w") as f:
            f.write("\n".join(transcript))
            
    print("\n--- BATCH RUN COMPLETE ---")
    print("Transcript saved to batch_transcript.txt")

def stress_test():
    print("Initializing Orchestrator...")
    try:
        orchestrator = load_orchestrator()
    except Exception as e:
        print(f"Error initializing Orchestrator: {e}")
        return

    print("\n--- Interactive Stress Tester ---")
    print("Commands:")
    print("  /batch  : Run legitimate scenarios from scenarios.json")
    print("  /reload : Reload Orchestrator")
    print("  /history: Show history")
    print("  /clear  : Clear history")
    print("  /save   : Save last HTML output")
    print("  exit    : Quit")
    
    conversation_history = []
    last_response = None
    
    while True:
        user_input = input("\nUSER QUERY: ")
        if user_input.lower() == 'exit':
            break
        elif user_input.lower() == '/batch':
            run_batch(orchestrator, "scenarios.json")
            continue
        elif user_input.lower() == '/reload':
            print("Reloading Orchestrator...")
            try:
                orchestrator = load_orchestrator()
                print("Reloaded successfully.")
            except Exception as e:
                print(f"Error reloading: {e}")
            continue
        elif user_input.lower() == '/clear':
            conversation_history = []
            print("History cleared.")
            continue
        elif user_input.lower() == '/history':
            print(json.dumps(conversation_history, indent=2))
            continue
        elif user_input.lower() == '/save':
            # ... (Same save logic as before)
            saved = False
            if last_response:
                for viz in last_response.get("visualizations", []):
                    if viz.get("type") == "html":
                        with open("last_output.html", "w") as f:
                            f.write(viz["content"])
                        print("Saved HTML artifact to last_output.html")
                        saved = True
                        break
                if not saved and last_response.get("answer"):
                    with open("last_output.html", "w") as f:
                        f.write(last_response["answer"])
                    print("Saved answer to last_output.html")
                    saved = True
            if not saved:
                print("No HTML content found to save.")
            continue
        elif user_input.lower() == '/dump':
            if last_response and last_response.get("raw_response"):
                with open("raw_response.json", "w") as f:
                    json.dump(last_response["raw_response"], f, indent=2)
                print("Saved to raw_response.json")
            else:
                print("No raw response to save.")
            continue

        print("\nSending to LLM...")
        result = run_query(orchestrator, user_input, conversation_history)
        last_response = result
        
        if result.get("error"):
            print(result["error"])
        else:
            print("\n--- LLM RESPONSE ---")
            debug_view = result.copy()
            if "raw_response" in debug_view:
                del debug_view["raw_response"]
            print(json.dumps(debug_view, indent=2))
            
            if result.get("answer"):
                print(f"\nAnswer found ({len(result['answer'])} chars).")
            else:
                print("\nNO ANSWER FOUND.")
            
            conversation_history.append({"role": "user", "content": user_input})
            conversation_history.append({"role": "assistant", "content": result.get("answer", "")})

if __name__ == "__main__":
    stress_test()
