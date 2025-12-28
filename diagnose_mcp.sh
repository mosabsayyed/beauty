#!/bin/bash
# MCP Pipeline Test Script

echo "=== MCP PIPELINE DIAGNOSTIC ==="
echo ""

# 1. Check if MCP Router is running
echo "1. Checking MCP Router on port 8201..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8201/mcp/ 2>/dev/null | grep -q "406\|400\|200"; then
    echo "   ✅ MCP Router responds (some HTTP code returned)"
else
    echo "   ❌ MCP Router not responding"
fi

# 2. Check if LM Studio is running
echo ""
echo "2. Checking LM Studio on port 8000..."
if curl -s http://127.0.0.1:8000/v1/models 2>/dev/null | grep -q "model" || curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/v1/models 2>/dev/null | grep -q "200\|401"; then
    echo "   ✅ LM Studio responds"
else
    echo "   ❌ LM Studio not responding"
fi

# 3. Test MCP tool call directly
echo ""
echo "3. Testing direct MCP tool call..."
MCP_RESPONSE=$(curl -s -X POST http://127.0.0.1:8201/mcp/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {"name": "recall_memory", "arguments": {"scope": "personal", "query_summary": "test", "limit": 5}}
  }' 2>&1)

if echo "$MCP_RESPONSE" | grep -q "error\|Error"; then
    echo "   ⚠️  MCP returned error:"
    echo "$MCP_RESPONSE" | head -5
else
    echo "   ✅ MCP tool call succeeded"
    echo "$MCP_RESPONSE" | head -3
fi

# 4. Check backend logs
echo ""
echo "4. Recent backend errors:"
if [ -f /home/mosab/projects/chatmodule/backend/logs/*.log ]; then
    grep -i "mcp\|406\|closedresource" /home/mosab/projects/chatmodule/backend/logs/*.log | tail -5
else
    echo "   No backend logs found"
fi

echo ""
echo "=== ENVIRONMENT CHECK ==="
echo "MCP Router URL expected: http://127.0.0.1:8201"
echo "LM Studio URL expected: http://127.0.0.1:8000"
echo ""
