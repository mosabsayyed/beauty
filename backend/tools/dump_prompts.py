import os
import sys
from typing import List

# Ensure we can import app.* modules
ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ROOT)

from app.services.tier1_assembler import assemble_tier1_prompt
from app.services.mcp_service import retrieve_instructions

try:
    from supabase import create_client
except Exception as e:
    print(f"Supabase client import failed: {e}")
    create_client = None


def require_env(var: str) -> str:
    val = os.getenv(var)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {var}")
    return val


def get_supabase():
    url = require_env("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not key:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY")
    return create_client(url, key)


def dump_tier1(persona: str = "noor") -> None:
    print("\n=== Tier 1 (persona=%s) ===" % persona)
    try:
        content = assemble_tier1_prompt(persona)
        print(content)
    except Exception as e:
        print(f"Tier 1 dump failed: {e}")


def dump_tier2() -> None:
    print("\n=== Tier 2 (data_mode_definitions) ===")
    try:
        # mode is not used in filtering; pass a placeholder
        content = __import__("asyncio").run(retrieve_instructions(mode="A", tier="data_mode_definitions"))
        print(content)
    except Exception as e:
        print(f"Tier 2 dump failed: {e}")


def dump_tier3_all() -> None:
    print("\n=== Tier 3 (all active elements) ===")
    if create_client is None:
        print("Supabase client unavailable; cannot list tier3 elements.")
        return
    try:
        supabase = get_supabase()
        resp = supabase.table('instruction_elements') \
            .select('element') \
            .eq('bundle', 'tier3') \
            .eq('status', 'active') \
            .order('element') \
            .execute()
        elems: List[str] = [row['element'] for row in (resp.data or [])]
        if not elems:
            print("No active tier3 elements found.")
            return
        # The Tier 3 path wraps each element content with <element name="..."> ... </element>
        content = __import__("asyncio").run(retrieve_instructions(mode="A", tier="elements", elements=elems))
        print(content)
    except Exception as e:
        print(f"Tier 3 dump failed: {e}")


if __name__ == "__main__":
    persona = os.getenv("PERSONA", "noor")
    dump_tier1(persona)
    dump_tier2()
    dump_tier3_all()
