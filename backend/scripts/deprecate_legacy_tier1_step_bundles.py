#!/usr/bin/env python3
"""Deprecate legacy Tier1 step bundles in instruction_elements.

Why:
- The normalized schema uses bundle='tier1' and numeric element names (e.g., 0.1_mode_classification).
- Some environments still have legacy bundles: tier1_step0_classification and tier1_step5_return.
- Having both active risks contradictory Tier1 instructions and (observed) LLM confusion.

What this script does:
1) Verifies normalized Tier1 (0.* and 5.*) elements exist and are active.
2) Verifies every legacy element name has a matching normalized element suffix.
3) If safe, marks legacy rows as status='inactive' (unless --dry-run).

Run:
  python3 backend/scripts/deprecate_legacy_tier1_step_bundles.py --dry-run
  python3 backend/scripts/deprecate_legacy_tier1_step_bundles.py
  python3 backend/scripts/deprecate_legacy_tier1_step_bundles.py --force

Requires env:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY

Note:
- This script does not delete rows; it only flips status.
"""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

LEGACY_BUNDLES = ["tier1_step0_classification", "tier1_step5_return"]


def _load_env() -> None:
    # Load backend/.env if present, matching other scripts in this repo
    load_dotenv(Path(__file__).parent.parent / ".env")


def _get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)")
    return create_client(url, key)


def _is_normalized_tier1_element(name: str) -> bool:
    return bool(re.match(r"^\d+(?:\.\d+)*_", name or "")) and (
        name.startswith("0.") or name.startswith("5.")
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Do not modify DB; only print what would change")
    parser.add_argument("--force", action="store_true", help="Proceed even if unmatched legacy elements exist")
    args = parser.parse_args()

    _load_env()
    supabase = _get_supabase()

    # Fetch normalized Tier1
    normalized_resp = (
        supabase.table("instruction_elements")
        .select("id, element")
        .eq("bundle", "tier1")
        .eq("status", "active")
        .execute()
    )
    normalized = [r for r in (normalized_resp.data or []) if _is_normalized_tier1_element(r.get("element", ""))]
    if not normalized:
        print("No active normalized Tier1 elements found (bundle='tier1' with 0.* / 5.*). Aborting.")
        return 2

    normalized_suffixes = {r["element"].split("_", 1)[1] for r in normalized if "_" in r.get("element", "")}

    # Fetch legacy Tier1
    legacy_resp = (
        supabase.table("instruction_elements")
        .select("id, bundle, element, status")
        .in_("bundle", LEGACY_BUNDLES)
        .execute()
    )
    legacy = legacy_resp.data or []
    if not legacy:
        print("No legacy Tier1 step bundles found. Nothing to do.")
        return 0

    active_legacy = [r for r in legacy if r.get("status") == "active"]

    # Check for unmatched legacy element names
    unmatched = []
    for r in legacy:
        elem = r.get("element") or ""
        if elem and elem not in normalized_suffixes:
            unmatched.append({"id": r.get("id"), "bundle": r.get("bundle"), "element": elem, "status": r.get("status")})

    print(f"Normalized Tier1 active elements: {len(normalized)}")
    print(f"Legacy Tier1 rows total: {len(legacy)} (active: {len(active_legacy)})")

    if unmatched:
        print("\nUnmatched legacy elements (no normalized tier1 numeric counterpart by suffix):")
        for u in unmatched:
            print(f"- id={u['id']} bundle={u['bundle']} element={u['element']} status={u['status']}")

        if not args.force:
            print("\nRefusing to deactivate legacy bundles without --force.")
            return 3

    if args.dry_run:
        print("\n--dry-run set; no DB updates executed.")
        return 0

    # Deactivate legacy bundles (only rows currently active)
    for bundle in LEGACY_BUNDLES:
        upd = (
            supabase.table("instruction_elements")
            .update({"status": "inactive"})
            .eq("bundle", bundle)
            .eq("status", "active")
            .execute()
        )
        changed = len(upd.data or [])
        print(f"Deactivated {changed} rows in bundle={bundle}")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
