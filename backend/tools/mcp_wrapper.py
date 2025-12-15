import sys
import json
import asyncio
import os
import logging

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services import mcp_service
from app.utils.debug_logger import init_debug_logger

# Configure logging to stderr so stdout is clean for JSON
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger("mcp_wrapper")

async def main():
    try:
        # Read input JSON from stdin
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_meta', {}).get('name')
        args = input_data.get('args', {})

        logger.info(f"Executing tool: {tool_name} with args: {args}")

        result = None
        
        if tool_name == 'recall_memory':
            # Map args to function parameters
            # recall_memory(scope, query_summary, limit=5)

            scope = args.get('scope') or args.get('memory_type')
            query = args.get('query_summary') or args.get('query')
            limit = args.get('limit', 5)
            user_id = args.get('user_id')

            result = await mcp_service.recall_memory(scope, query, limit, user_id=user_id)
            # Result is already a JSON string, we might need to parse it to return object
            try:
                result = json.loads(result)
            except:
                pass

        elif tool_name == 'retrieve_instructions':
            # v3.3 Three-Tier Architecture:
            # retrieve_instructions(mode, tier=None, elements=None)
            # 
            # Usage patterns:
            # 1. Legacy: retrieve_instructions(mode="A")
            # 2. Tier 2: retrieve_instructions(mode="A", tier="data_mode_definitions")
            # 3. Tier 3: retrieve_instructions(mode="A", tier="elements", elements=["EntityProject", ...])
            
            mode = args.get('mode')
            tier = args.get('tier')
            elements = args.get('elements')
            
            # Call with new signature
            result = await mcp_service.retrieve_instructions(mode, tier, elements)

        elif tool_name == 'read_neo4j_cypher':
            # read_neo4j_cypher(cypher_query, parameters)
            cypher_query = args.get('cypher_query')
            parameters = args.get('parameters')
            # This function is synchronous
            result = mcp_service.read_neo4j_cypher(cypher_query, parameters)

        else:
            raise ValueError(f"Unknown tool: {tool_name}")

        # Output result as JSON to stdout
        print(json.dumps(result))

    except Exception as e:
        logger.error(f"Error executing tool: {e}", exc_info=True)
        # Return error structure
        error_response = {
            "error": str(e),
            "status": "failed"
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    asyncio.run(main())
