import sys
import json
import asyncio
import os
import logging

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services import mcp_service_maestro
from app.utils.debug_logger import init_debug_logger

# Configure logging to stderr so stdout is clean for JSON
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger("mcp_wrapper_maestro")

async def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get('tool_meta', {}).get('name')
        args = input_data.get('args', {})

        logger.info(f"Executing tool: {tool_name} with args: {args}")

        result = None

        if tool_name == 'recall_memory':
            scope = args.get('scope') or args.get('memory_type')
            query = args.get('query') or args.get('query_summary')
            limit = args.get('limit', 5)
            result = await mcp_service_maestro.recall_memory(scope, query, limit)
            try:
                result = json.loads(result)
            except Exception:
                pass

        elif tool_name == 'retrieve_instructions':
            # v3.3 Three-Tier Architecture:
            # retrieve_instructions(mode, tier=None, elements=None)
            mode = args.get('mode')
            tier = args.get('tier')
            elements = args.get('elements')
            result = await mcp_service_maestro.retrieve_instructions(mode, tier, elements)

        elif tool_name == 'read_neo4j_cypher':
            cypher_query = args.get('cypher_query') or args.get('query')
            parameters = args.get('parameters')
            result = mcp_service_maestro.read_neo4j_cypher(cypher_query, parameters)

        else:
            raise ValueError(f"Unknown tool: {tool_name}")

        print(json.dumps(result))

    except Exception as e:
        logger.error(f"Error executing tool: {e}", exc_info=True)
        error_response = {
            "error": str(e),
            "status": "failed"
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    asyncio.run(main())
