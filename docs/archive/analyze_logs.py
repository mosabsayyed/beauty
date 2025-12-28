import csv
import statistics

log_file = '/home/mosab/projects/chatmodule/backend/logs/groq-logs-Default_Project-1d-2025-12-03-08-12-45.csv'

data = []
with open(log_file, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            if row['status_code'] == '200':
                data.append({
                    'latency': float(row['time_to_completion']),
                    'output_tokens': int(row['output_tokens']),
                    'input_tokens': int(row['input_tokens']),
                    'ttft': float(row['time_to_first_token'])
                })
        except ValueError:
            continue

# Sort by output tokens
data.sort(key=lambda x: x['output_tokens'])

# Group into buckets
simple = [d for d in data if d['output_tokens'] < 1000]
medium = [d for d in data if 1000 <= d['output_tokens'] < 3000]
complex_req = [d for d in data if d['output_tokens'] >= 3000]

print(f'Total Successful Requests: {len(data)}')

def stats(name, subset):
    if not subset:
        print(f'\n{name}: No data')
        return
    avg_lat = statistics.mean([d['latency'] for d in subset])
    avg_out = statistics.mean([d['output_tokens'] for d in subset])
    min_lat = min([d['latency'] for d in subset])
    max_lat = max([d['latency'] for d in subset])
    
    print(f'\n{name} (n={len(subset)}):')
    print(f'  Avg Latency: {avg_lat:.2f}s')
    print(f'  Avg Output Tokens: {avg_out:.0f}')
    print(f'  Range: {min_lat:.2f}s - {max_lat:.2f}s')

stats('Simple (<1k tokens)', simple)
stats('Medium (1k-3k tokens)', medium)
stats('Complex (>3k tokens)', complex_req)

# Check correlation
if data:
    print('\nCorrelation Check:')
    print(f'Shortest Request: {data[0]["latency"]}s ({data[0]["output_tokens"]} tokens)')
    print(f'Longest Request: {data[-1]["latency"]}s ({data[-1]["output_tokens"]} tokens)')
