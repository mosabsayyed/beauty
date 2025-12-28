import json
import os

log_file = '/home/mosab/projects/chatmodule/backend/logs/chat_debug_318.json'

try:
    with open(log_file, 'r') as f:
        data = json.load(f)
        
    events = data.get('events', [])
    # Get last 3 events
    last_events = events[-3:]
    
    with open('log_output.txt', 'w') as out_f:
        for i, event in enumerate(last_events):
            out_f.write(f"--- Event {i+1} ({event.get('event_type')}) ---\n")
            event_data = event.get('data', {})
            if isinstance(event_data, dict):
                sample = event_data.get('sample')
                if sample:
                    out_f.write(f"Sample (first 500 chars): {sample[:500]}\n")
                    # Try to find the output_text part
                    if "'type': 'output_text'" in sample:
                        start = sample.find("'type': 'output_text'")
                        # Print more characters to capture the JSON
                        out_f.write(f"Output Text Section: {sample[start:start+2000]}\n")
                else:
                    out_f.write(json.dumps(event_data, indent=2) + "\n")
            else:
                out_f.write(str(event_data) + "\n")
            
except Exception as e:
    with open('log_output.txt', 'w') as out_f:
        out_f.write(f"Error: {e}\n")
