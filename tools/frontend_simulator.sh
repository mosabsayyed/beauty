#!/usr/bin/env bash
# =============================================================================
# Frontend Simulator - Test chat API as if from the frontend
# =============================================================================
# Usage:
#   ./tools/frontend_simulator.sh "Your query here"
#   ./tools/frontend_simulator.sh "Your query" --persona maestro
#   ./tools/frontend_simulator.sh "Your query" --conversation 123
#   ./tools/frontend_simulator.sh --health   # Check backend health
#   ./tools/frontend_simulator.sh --status   # Check all services status
#
# Environment (auto-loaded from backend/.env):
#   BACKEND_URL - defaults to http://127.0.0.1:8008
# =============================================================================

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# Load environment
if [ -f "$ROOT_DIR/backend/.env" ]; then
    set -a
    source "$ROOT_DIR/backend/.env"
    set +a
fi

# Configuration
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8008}"
API_BASE="$BACKEND_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
PERSONA="noor"
CONVERSATION_ID=""
QUERY=""
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --health)
            echo -e "${CYAN}Checking backend health...${NC}"
            curl -sS -L "$API_BASE/health/" | python3 -m json.tool 2>/dev/null || echo -e "${RED}Backend not responding${NC}"
            exit 0
            ;;
        --status)
            echo -e "${CYAN}=== Service Status ===${NC}"
            echo -n "Backend (8008): "
            if curl -sS -L --max-time 2 "$API_BASE/health/" 2>/dev/null | grep -q status; then
                echo -e "${GREEN}✓ Running${NC}"
            else
                echo -e "${RED}✗ Not running${NC}"
            fi
            echo -n "MCP Router Noor (8201): "
            if curl -sS --max-time 2 http://127.0.0.1:8201/mcp/ 2>/dev/null | grep -q jsonrpc; then
                echo -e "${GREEN}✓ Running${NC}"
            else
                echo -e "${RED}✗ Not running${NC}"
            fi
            echo -n "MCP Router Maestro (8202): "
            if curl -sS --max-time 2 http://127.0.0.1:8202/mcp/ 2>/dev/null | grep -q jsonrpc; then
                echo -e "${GREEN}✓ Running${NC}"
            else
                echo -e "${RED}✗ Not running${NC}"
            fi
            echo -n "MCP Router Embeddings (8203): "
            if curl -sS --max-time 2 http://127.0.0.1:8203/mcp/ 2>/dev/null | grep -q jsonrpc; then
                echo -e "${GREEN}✓ Running${NC}"
            else
                echo -e "${RED}✗ Not running${NC}"
            fi
            echo -n "ngrok: "
            if curl -sS --max-time 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -q public_url; then
                NGROK_URL=$(curl -sS http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'] if d.get('tunnels') else 'N/A')" 2>/dev/null || echo "N/A")
                echo -e "${GREEN}✓ Running${NC} → $NGROK_URL"
            else
                echo -e "${RED}✗ Not running${NC}"
            fi
            exit 0
            ;;
        --persona)
            PERSONA="$2"
            shift 2
            ;;
        --conversation|-c)
            CONVERSATION_ID="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Frontend Simulator - Test chat API"
            echo ""
            echo "Usage:"
            echo "  $0 \"Your query here\""
            echo "  $0 \"Your query\" --persona maestro"
            echo "  $0 \"Your query\" --conversation 123"
            echo "  $0 --health    # Check backend health"
            echo "  $0 --status    # Check all services"
            echo ""
            echo "Options:"
            echo "  --persona <name>        Persona to use (noor|maestro, default: noor)"
            echo "  --conversation <id>     Existing conversation ID"
            echo "  --verbose, -v           Show full response"
            echo "  --health                Check backend health"
            echo "  --status                Check all services status"
            exit 0
            ;;
        *)
            if [ -z "$QUERY" ]; then
                QUERY="$1"
            fi
            shift
            ;;
    esac
done

# Validate query
if [ -z "$QUERY" ]; then
    echo -e "${RED}Error: No query provided${NC}"
    echo "Usage: $0 \"Your query here\""
    exit 1
fi

# Build request payload
if [ -n "$CONVERSATION_ID" ]; then
    PAYLOAD=$(cat <<EOF
{
    "query": "$QUERY",
    "conversation_id": $CONVERSATION_ID,
    "persona": "$PERSONA"
}
EOF
)
else
    PAYLOAD=$(cat <<EOF
{
    "query": "$QUERY",
    "persona": "$PERSONA"
}
EOF
)
fi

echo -e "${CYAN}=== Frontend Simulator ===${NC}"
echo -e "${BLUE}Endpoint:${NC} POST $API_BASE/chat/message"
echo -e "${BLUE}Persona:${NC} $PERSONA"
echo -e "${BLUE}Query:${NC} $QUERY"
if [ -n "$CONVERSATION_ID" ]; then
    echo -e "${BLUE}Conversation:${NC} $CONVERSATION_ID"
fi
echo ""

# Send request
echo -e "${YELLOW}Sending request...${NC}"
RESPONSE=$(curl -sS -X POST "$API_BASE/chat/message" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" 2>&1)

# Check if response is valid JSON
if ! echo "$RESPONSE" | python3 -m json.tool >/dev/null 2>&1; then
    echo -e "${RED}Error: Invalid response from backend${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Parse and display response
echo -e "${GREEN}=== Response ===${NC}"

if [ "$VERBOSE" = true ]; then
    echo "$RESPONSE" | python3 -m json.tool
else
    # Extract key fields
    python3 <<EOF
import json
import sys

try:
    r = json.loads('''$RESPONSE''')
    
    # Conversation ID
    if r.get('conversation_id'):
        print(f"\033[0;34mConversation ID:\033[0m {r['conversation_id']}")
    
    # Main answer
    answer = r.get('answer') or r.get('message', '')
    if answer:
        print(f"\n\033[0;32m--- Answer ---\033[0m")
        print(answer)
    
    # Visualization
    if r.get('visualization'):
        print(f"\n\033[0;33m--- Visualization ---\033[0m")
        print(f"Type: {r['visualization'].get('type', 'unknown')}")
    
    # Artifacts
    if r.get('artifacts'):
        print(f"\n\033[0;33m--- Artifacts ({len(r['artifacts'])}) ---\033[0m")
        for a in r['artifacts']:
            print(f"  • {a.get('artifact_type', '?')}: {a.get('title', 'Untitled')}")
    
    # Insights
    if r.get('insights'):
        print(f"\n\033[0;36m--- Insights ---\033[0m")
        for i in r['insights']:
            print(f"  • {i}")
    
    # Memory process (if present)
    if r.get('memory_process'):
        mp = r['memory_process']
        print(f"\n\033[0;35m--- Memory Process ---\033[0m")
        if mp.get('intent'):
            print(f"  Intent: {mp['intent']}")
        if mp.get('mode'):
            print(f"  Mode: {mp['mode']}")
    
    # Error handling
    if 'error' in str(answer).lower() or r.get('clarification_needed'):
        print(f"\n\033[0;31m--- Issues ---\033[0m")
        if r.get('clarification_needed'):
            print("Clarification needed:")
            for q in r.get('clarification_questions', []):
                print(f"  ? {q}")
                
except Exception as e:
    print(f"\033[0;31mError parsing response: {e}\033[0m")
    print('''$RESPONSE''')
EOF
fi

echo ""
echo -e "${CYAN}Done.${NC}"
