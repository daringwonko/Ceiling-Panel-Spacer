#!/usr/bin/env python3
"""
Phase 7 Deep Search Synthesizer
Aggregates reports from 10+ specialized agents
"""

import json
from pathlib import Path
from datetime import datetime
import os

SEARCH_DIR = Path("/home/tomas/Ceiling Panel Spacer")
OUTPUT = SEARCH_DIR / ".planning/phases/07-let-there-be-light/deep-search"


def synthesize_reports():
    """Aggregate all agent reports into a comprehensive summary"""

    reports = {}

    # Read all agent reports
    for report_file in OUTPUT.glob("*REPORT.md"):
        agent_name = report_file.stem.replace("_", " ").title()
        with open(report_file) as f:
            reports[agent_name] = f.read()

    # Also check for JSON reports
    for json_file in OUTPUT.glob("*_report.json"):
        agent_name = json_file.stem.replace("_report", "").replace("_", " ").title()
        try:
            with open(json_file) as f:
                data = json.load(f)
                reports[agent_name] = data
        except:
            pass

    return reports


def generate_summary():
    """Generate summary of findings"""

    print("=" * 80)
    print("PHASE 7 DEEP SEARCH - COMPREHENSIVE FINDINGS")
    print("=" * 80)
    print(f"Synthesized: {datetime.now().isoformat()}")
    print()

    # Aggregate by category
    categories = {
        "AI/LLM": [],
        "BIM Objects": [],
        "Kitchen": [],
        "UI Components": [],
        "Tools": [],
        "Missing Imports": [],
        "Architecture": [],
    }

    # Read findings from files
    findings_file = OUTPUT / "all_findings.json"
    if findings_file.exists():
        with open(findings_file) as f:
            all_findings = json.load(f)
            for finding in all_findings:
                for cat in categories:
                    if cat.lower() in finding.get("category", "").lower():
                        categories[cat].append(finding)

    # Print summary
    print("📊 FINDINGS BY CATEGORY")
    print("-" * 40)

    for cat, items in categories.items():
        print(f"\n{cat}: {len(items)} items")
        for item in items[:5]:  # Show first 5
            print(f"  - {item.get('name', item)}")
        if len(items) > 5:
            print(f"  ... and {len(items) - 5} more")

    print("\n" + "=" * 80)
    print("RECOMMENDED ACTIONS")
    print("=" * 80)

    # Missing imports
    missing = [i for i in categories["Missing Imports"]]
    if missing:
        print("\n🔧 MISSING IMPORTS TO FIX:")
        for m in missing:
            print(f"  - {m}")

    # High value finds
    high_value = [i for i in categories["AI/LLM"] if i.get("size", 0) > 10000]
    if high_value:
        print("\n💎 HIGH VALUE AI FILES (>10KB):")
        for f in high_value:
            print(f"  - {f.get('path', f)} ({f.get('size', 0)} bytes)")

    return categories


if __name__ == "__main__":
    generate_summary()
