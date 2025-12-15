# LangFlow Migration Kit: Noor Agent v3.4

**Objective:** Build the Noor Cognitive Digital Twin in LangFlow using the "Single-Call MCP" architecture.

## 1. Visual Flow Blueprint (Drag & Drop These Nodes)

Arrangement of nodes in the LangFlow Canvas:

1.  **Chat Input**
    *   *Connect to:* `Prompt` (Variable: `user_query`)
2.  **Prompt** (The "System Prompt")
    *   *Template:* Paste the **Tier 1 Bootstrap** content here (See `COGNITIVE_ARCHITECTURE_SPECIFICATION.md` -> Section 5.A).
    *   *Variables:* `{user_query}`, `{date}`.
    *   *Connect to:* `Agent` (System Prompt input).
3.  **Agent** (Recommended: **Tool Calling Agent**)
    *   *Model:* Connect a **Groq Model** node (Select `llama-3.1-70b` or similar).
    *   *Tools:* Connect the 3 **Custom Tool Components** defined below.
4.  **Custom Components** (The 3 Tools)
    *   Create 3 "Custom Component" nodes.
    *   Paste the code provided in Section 2 into each.
5.  **Chat Output**
    *   *Connect to:* `Agent` (Output).

---

## 2. Custom Component Code (Copy-Paste)

In LangFlow, drag a **Custom Component** node, click "Code", and replace the content with the blocks below. You will need to set your Environment Variables (`SUPABASE_URL`, `NEO4J_URI`, etc.) in the LangFlow Settings or `.env` file.

### A. Tool 1: Recall Memory (Step 0)

```python
from langflow.custom import CustomComponent
from langflow.field_typing import Tool
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Literal, Optional
import json
# Import your actual drivers/clients here if installed in the environment
# from neo4j import GraphDatabase

class RecallMemoryComponent(CustomComponent):
    display_name = "Tool: Recall Memory"
    description = "Retrieves semantic memory from Neo4j."

    def build_config(self):
        return {
            "neo4j_uri": {"display_name": "Neo4j URI", "value": "bolt://localhost:7687"},
            "neo4j_user": {"display_name": "Neo4j User", "value": "neo4j"},
            "neo4j_password": {"display_name": "Neo4j Password", "password": True},
        }

    def build(
        self,
        neo4j_uri: str,
        neo4j_user: str,
        neo4j_password: str
    ) -> Tool:
        
        # --- Internal Logic (The "Brain" of the Tool) ---
        def recall_memory_logic(scope: str, query_summary: str, limit: int = 5):
            """
            Retrieves memory using vector search. 
            (Actual DB logic goes here. For this component to work in LangFlow, 
            ensure 'neo4j' pip package is installed in your LangFlow env).
            """
            # Placeholder for actual Neo4j connection & vector search
            # In a real deployment, paste the full 'recall_memory' function 
            # from COGNITIVE_ARCHITECTURE_SPECIFICATION.md here.
            
            if scope in ['csuite', 'secrets']:
                return "Permission Error: Forbidden scope."
            
            return f"[Mock Result] Found memory for '{query_summary}' in scope '{scope}'"

        # --- Tool Schema Definition ---
        class RecallMemoryInput(BaseModel):
            scope: Literal['personal', 'departmental', 'ministry'] = Field(..., description="Memory tier to search.")
            query_summary: str = Field(..., description="Semantic search query.")
            limit: int = Field(5, description="Max results.")

        return StructuredTool.from_function(
            func=recall_memory_logic,
            name="recall_memory",
            description="Retrieves relevant hierarchical memory using semantic search. Use for Step 0: REMEMBER.",
            args_schema=RecallMemoryInput
        )
```

### B. Tool 2: Retrieve Instructions (Step 2)

```python
from langflow.custom import CustomComponent
from langflow.field_typing import Tool
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Literal, List, Optional

class RetrieveInstructionsComponent(CustomComponent):
    display_name = "Tool: Retrieve Instructions"
    description = "Fetches dynamic prompt bundles from Supabase."

    def build_config(self):
        return {
            "supabase_url": {"display_name": "Supabase URL"},
            "supabase_key": {"display_name": "Supabase Key", "password": True},
        }

    def build(self, supabase_url: str, supabase_key: str) -> Tool:
        
        def retrieve_logic(mode: Optional[str] = None, elements: Optional[List[str]] = None):
            """
            Fetches instruction bundles.
            Paste the full 'retrieve_instructions' logic from the Spec here.
            """
            if elements:
                return f"<element name='{elements[0]}'>Mock Schema for {elements[0]}</element>"
            if mode:
                return f"Mock Instructions for Mode {mode}"
            return "Error: No mode or elements provided."

        class RetrieveInput(BaseModel):
            mode: Optional[str] = Field(None, description="Interaction mode (A, B, C, D).")
            elements: Optional[List[str]] = Field(None, description="List of element tags.")

        return StructuredTool.from_function(
            func=retrieve_logic,
            name="retrieve_instructions",
            description="Dynamically loads Task-Specific Instruction Bundles. Use for Step 2: RECOLLECT.",
            args_schema=RetrieveInput
        )
```

### C. Tool 3: Read Neo4j Cypher (Step 3)

```python
from langflow.custom import CustomComponent
from langflow.field_typing import Tool
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ReadNeo4jComponent(CustomComponent):
    display_name = "Tool: Read Neo4j"
    description = "Executes Cypher with strict validation."

    def build_config(self):
        return {
            "neo4j_uri": {"display_name": "Neo4j URI", "value": "bolt://localhost:7687"},
            "neo4j_user": {"display_name": "Neo4j User", "value": "neo4j"},
            "neo4j_password": {"display_name": "Neo4j Password", "password": True},
        }

    def build(self, neo4j_uri: str, neo4j_user: str, neo4j_password: str) -> Tool:
        
        def cypher_logic(cypher_query: str, parameters: Optional[Dict[str, Any]] = None):
            """
            Executes Cypher. 
            Paste the 'read_neo4j_cypher' logic from the Spec here 
            (including the Trap Prevention regex checks).
            """
            # 1. Trap Prevention (Validation)
            if "SKIP" in cypher_query.upper() or "OFFSET" in cypher_query.upper():
                return "Error: SKIP/OFFSET forbidden. Use keyset pagination."
            
            # 2. Execution (Mock for now)
            return f"[Mock Result] Executed: {cypher_query}"

        class CypherInput(BaseModel):
            cypher_query: str = Field(..., description="Valid Cypher query.")
            parameters: Optional[Dict[str, Any]] = Field(None, description="Query parameters.")

        return StructuredTool.from_function(
            func=cypher_logic,
            name="read_neo4j_cypher",
            description="Executes validated Cypher query against Neo4j. Use for Step 3: RECALL.",
            args_schema=CypherInput
        )
```

## 3. Next Steps in LangFlow

1.  **Install Dependencies:** Your LangFlow environment (wherever it's running) needs `neo4j` and `supabase` python packages installed (`pip install neo4j supabase`).
2.  **Paste & Configure:** Copy the code above into 3 separate Custom Components. Fill in your DB credentials in the node settings.
3.  **Populate DB:** Ensure your Supabase and Neo4j databases are actually populated (Phase 1 of the Execution Plan in the Spec).
4.  **Run:** Chat with the agent in the LangFlow Playground. It should now follow the Tier 1 instructions and call your tools.
