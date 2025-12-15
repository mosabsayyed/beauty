import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="/home/mosab/projects/chatmodule/backend/.env")

# Add backend to path
sys.path.append("/home/mosab/projects/chatmodule/backend")

from app.services.orchestrator_zero_shot import Orchestrator

def debug_interaction():
    print("Initializing Orchestrator...")
    try:
        orchestrator = Orchestrator()
    except Exception as e:
        print(f"Error initializing Orchestrator: {e}")
        return

    print("\n--- Interactive Prompt Debugger ---")
    print("Type 'exit' to quit.")
    
    # Initial context
    conversation_history = []
    
    while True:
        user_input = input("\nUSER QUERY: ")
        if user_input.lower() == 'exit':
            break
            
        print("\nSending to LLM...")
        
        # We use the internal logic of stream_query but capture the output
        # Since stream_query is a generator, we iterate over it
        try:
            generator = orchestrator.stream_query(
                user_query=user_input,
                conversation_history=conversation_history,
                sse=False # Get raw JSON
            )
            
            final_result = None
            for chunk in generator:
                try:
                    data = json.loads(chunk)
                    if "error" in data:
                        print(f"ERROR: {data['error']}")
                    else:
                        final_result = data
                except json.JSONDecodeError:
                    print(f"RAW CHUNK: {chunk}")
            
            if final_result:
                print("\n--- LLM RESPONSE ---")
                print(json.dumps(final_result, indent=2))
                
                # Update history for next turn
                conversation_history.append({"role": "user", "content": user_input})
                conversation_history.append({"role": "assistant", "content": final_result.get("answer", "")})
                
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    debug_interaction()
