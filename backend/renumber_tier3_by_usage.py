import argparse
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

import requests
from dotenv import load_dotenv


BACKEND_DOTENV_PATH = Path(__file__).resolve().parent / ".env"
ROOT_DOTENV_PATH = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(BACKEND_DOTENV_PATH)
load_dotenv(ROOT_DOTENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
	raise ValueError(
		"Missing SUPABASE_URL and/or a service key. Expected env vars: "
		"SUPABASE_URL plus one of SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY. "
		"Checked backend/.env then repo-root .env."
	)

REQUEST_TIMEOUT_S = int(os.getenv("SUPABASE_HTTP_TIMEOUT_S", "30"))

HEADERS = {
	"apikey": SUPABASE_KEY,
	"Authorization": f"Bearer {SUPABASE_KEY}",
	"Content-Type": "application/json",
	"Prefer": "return=representation",
}


_PREFIX_WITH_TIER_RE = re.compile(r"^\d+(?:\.\d+)*_\d+_")  # e.g. 2.0_3_
_PREFIX_NO_TIER_RE = re.compile(r"^\d+(?:\.\d+)*_")        # e.g. 3.2_


def _strip_any_prefix(name: str) -> str:
	if not name:
		return ""
	if _PREFIX_WITH_TIER_RE.match(name):
		return _PREFIX_WITH_TIER_RE.sub("", name, count=1)
	if _PREFIX_NO_TIER_RE.match(name):
		return _PREFIX_NO_TIER_RE.sub("", name, count=1)
	return name


def _classify_base_name(base: str) -> str:
	"""Return a stable category used for mapping to the caller step.

	This is intentionally strict: unknowns raise so we never mis-number silently.
	"""
	if not base:
		raise ValueError("Empty element base name")

	if base.startswith("Entity") or base.startswith("Sector"):
		return "schema"

	if base.startswith("business_chain_"):
		return "business_chain"

	if base.startswith("chart_type_"):
		return "visualization"

	if base.endswith("_pattern") or base in {
		"vector_strategy",
		"optimized_retrieval",
		"impact_analysis",
		"data_structure_rules",
		"html_rendering",
		"color_rules",
		"chart_types",
		"custom_tooltip",
	}:
		if base in {"data_structure_rules", "html_rendering", "color_rules", "chart_types", "custom_tooltip"}:
			return "visualization"
		return "query_pattern"

	# Heuristic fallback buckets (still explicit)
	if "chart" in base or "render" in base or "visual" in base or "tooltip" in base or "color" in base:
		return "visualization"

	if "pattern" in base or "pagination" in base or "match" in base or "filter" in base or "aggregate" in base:
		return "query_pattern"

	raise ValueError(f"Unknown Tier 3 element base name category: {base}")


def _desired_prefix_for_category(category: str, step2: str, step3: str, step5: str) -> str:
	"""Return x.y_3 based on which Tier-2 step USES the element."""
	if category in {"schema", "business_chain"}:
		return f"{step2}_3"
	if category == "query_pattern":
		return f"{step3}_3"
	if category == "visualization":
		return f"{step5}_3"
	raise ValueError(f"Unknown category: {category}")


def _fetch_tier3_rows() -> List[Dict[str, Any]]:
	url = f"{SUPABASE_URL}/rest/v1/instruction_elements?bundle=eq.tier3&select=id,element&order=element.asc"
	resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT_S)
	if resp.status_code != 200:
		raise RuntimeError(f"Failed to fetch Tier 3 rows: {resp.status_code} {resp.text}")
	return resp.json() or []


def _plan_renames(
	rows: List[Dict[str, Any]],
	step2: str,
	step3: str,
	step5: str,
) -> Tuple[List[Tuple[int, str, str, str]], List[str]]:
	"""Return (renames, warnings).

	renames entries: (id, old_element, new_element, category)
	"""
	warnings: List[str] = []
	desired_names: Dict[int, str] = {}

	existing = {r.get("element") for r in rows if r.get("element")}

	for r in rows:
		row_id = r.get("id")
		old_element = r.get("element") or ""
		base = _strip_any_prefix(old_element)
		category = _classify_base_name(base)
		prefix = _desired_prefix_for_category(category, step2=step2, step3=step3, step5=step5)
		new_element = f"{prefix}_{base}"

		if not row_id:
			raise ValueError(f"Missing id for row with element={old_element}")

		desired_names[int(row_id)] = new_element

	# Collision check (within desired set)
	inverted: Dict[str, List[int]] = {}
	for rid, desired in desired_names.items():
		inverted.setdefault(desired, []).append(rid)
	collisions = {name: ids for name, ids in inverted.items() if len(ids) > 1}
	if collisions:
		collision_preview = ", ".join(f"{name}<=ids{ids}" for name, ids in list(collisions.items())[:5])
		raise ValueError(f"Computed rename collisions: {collision_preview}")

	renames: List[Tuple[int, str, str, str]] = []

	# Existing-name collision check (excluding self)
	for r in rows:
		row_id = int(r["id"])
		old = r.get("element") or ""
		new = desired_names[row_id]
		base = _strip_any_prefix(old)
		category = _classify_base_name(base)

		if new == old:
			continue

		if new in existing and new != old:
			raise ValueError(f"Desired element name already exists: {old} -> {new}")

		renames.append((row_id, old, new, category))

	if not renames:
		warnings.append("No Tier 3 renames needed (already in x.y_3_<base> format).")

	return renames, warnings


def _apply_renames(renames: List[Tuple[int, str, str, str]]) -> None:
	for row_id, old, new, category in renames:
		url = f"{SUPABASE_URL}/rest/v1/instruction_elements?id=eq.{row_id}"
		resp = requests.patch(url, headers=HEADERS, json={"element": new}, timeout=REQUEST_TIMEOUT_S)
		if resp.status_code not in {200, 204}:
			raise RuntimeError(
				f"Failed renaming id={row_id} {old} -> {new} ({category}): {resp.status_code} {resp.text}"
			)


def main() -> None:
	parser = argparse.ArgumentParser(
		description="Renumber Tier 3 elements to `x.y_3_<base>` based on end-state step usage (writes only with --apply)."
	)
	parser.add_argument(
		"--apply",
		action="store_true",
		help="Apply changes to Supabase.",
	)
	parser.add_argument(
		"--step2",
		default=os.getenv("TIER3_CALLER_STEP2", "2.0"),
		help="Caller step prefix for schemas/chains (default env TIER3_CALLER_STEP2 or 2.0).",
	)
	parser.add_argument(
		"--step3",
		default=os.getenv("TIER3_CALLER_STEP3", "3.0"),
		help="Caller step prefix for query patterns (default env TIER3_CALLER_STEP3 or 3.0).",
	)
	parser.add_argument(
		"--step5",
		default=os.getenv("TIER3_CALLER_STEP5", "5.0"),
		help="Caller step prefix for visualization elements (default env TIER3_CALLER_STEP5 or 5.0).",
	)

	args = parser.parse_args()

	rows = _fetch_tier3_rows()
	renames, warnings = _plan_renames(rows, step2=args.step2, step3=args.step3, step5=args.step5)

	print("TIER 3 RENUMBER-BY-USAGE")
	print("=" * 80)
	print(f"Tier 3 rows: {len(rows)}")
	print(f"Planned renames: {len(renames)}")
	for w in warnings:
		print(f"WARNING: {w}")

	if renames:
		for row_id, old, new, category in renames:
			print(f"[{category}] id={row_id}: {old} -> {new}")

	if not args.apply:
		print("Dry-run only. Re-run with --apply to write changes.")
		return

	_apply_renames(renames)
	print("✓ Applied Tier 3 renames successfully")


if __name__ == "__main__":
	main()