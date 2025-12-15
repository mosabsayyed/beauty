#!/usr/bin/env python3
"""Smoke test for memory access gates.
- Noor: secrets access must raise PermissionError
- Maestro: secrets access allowed (may return empty, but no error)
Run: python backend/scripts/test_memory_access_gate.py
"""
import asyncio
import os

from app.services import mcp_service
from app.services import mcp_service_maestro


async def test_noor_blocks_secrets():
    try:
        await mcp_service.recall_memory("secrets", "classified budget", limit=1)
    except PermissionError:
        print("[PASS] Noor blocked secrets scope as expected")
        return
    except Exception as e:
        print(f"[FAIL] Noor unexpected error: {e}")
        return
    print("[FAIL] Noor did NOT block secrets scope")


async def test_maestro_allows_secrets():
    try:
        res = await mcp_service_maestro.recall_memory("secrets", "classified budget", limit=1)
        print("[PASS] Maestro secrets call ok; result length:", len(res) if isinstance(res, list) else "n/a")
    except Exception as e:
        print(f"[FAIL] Maestro error on secrets scope: {e}")


async def main():
    # Ensure router URLs are set for clarity (not used directly here but good sanity)
    print("NOOR_MCP_ROUTER_URL=", os.getenv("NOOR_MCP_ROUTER_URL"))
    print("MAESTRO_MCP_ROUTER_URL=", os.getenv("MAESTRO_MCP_ROUTER_URL"))
    await test_noor_blocks_secrets()
    await test_maestro_allows_secrets()


if __name__ == "__main__":
    asyncio.run(main())
