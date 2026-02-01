#!/usr/bin/env python3
"""
Phase 7 Verifier: Trace actual connections before sending to staging jail
 Innocent until proven guilty - verify every orphan claim
"""

import os
import subprocess
import json
from pathlib import Path
from datetime import datetime

ROOT = Path("/home/tomas/Ceiling Panel Spacer")
RESULTS = ROOT / ".planning/phases/07-let-there-be-light/verdict-research"
RESULTS.mkdir(parents=True, exist_ok=True)


def run_grep(pattern, path="."):
    """Run grep and return matching files"""
    try:
        result = subprocess.run(
            [
                "grep",
                "-r",
                "-l",
                "--include=*.py",
                "--include=*.ts",
                "--include=*.tsx",
                "--include=*.js",
                "--include=*.jsx",
                pattern,
                path,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return [
            f
            for f in result.stdout.strip().split("\n")
            if f and "verdict" not in f and "node_modules" not in f
        ]
    except Exception as e:
        return [f"ERROR: {e}"]


def count_lines_python(path):
    """Count lines in Python files only"""
    try:
        total = 0
        for f in Path(path).rglob("*.py"):
            try:
                total += sum(1 for _ in f.open())
            except:
                pass
        return total
    except:
        return 0


def get_mtime(path):
    """Get modification time"""
    try:
        mtime = path.stat().st_mtime
        return datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M")
    except:
        return "unknown"


print("=" * 80)
print("PHASE 7 VERDICT RESEARCH: Tracing Actual Connections")
print("=" * 80)
print()

# Directories to verify
candidates = {
    "ai": "Empty directory - verify no connections",
    "analytics": "1 file - verify no connections",
    "blockchain": "1 file - verify no connections",
    "vision": "1 file - verify no connections",
    "billing": "1 file - verify no connections",
    "auth": "1 file - verify no connections",
    "web": "Verify connections",
    "resources": "Verify connections",
    "scripts": "Verify connections",
    "k8s": "Verify connections",
    "Spacer": "FULL DUPLICATE - verify connections",
    "archive": "Old files with (1) - verify connections",
    "03-platform-integration": "Phase docs at root",
    "frontend/src/main.jsx": "React entry - verify if used",
    "frontend/src/App.jsx": "App component - verify if used",
}

print("VERIFYING EACH CANDIDATE:")
print("-" * 80)

verdict_report = []

for candidate, description in candidates.items():
    path = ROOT / candidate
    if not path.exists():
        print(f"\n❌ {candidate}: DOES NOT EXIST")
        verdict_report.append(
            {
                "candidate": candidate,
                "exists": False,
                "verdict": "NOT_EXISTS",
            }
        )
        continue

    line_count = count_lines_python(path)
    mtime = get_mtime(path)

    # What imports FROM this directory?
    print(f"\n📂 {candidate} (modified: {mtime})")
    print(f"   Claimed: {description}")

    # Search for imports OF this module/directory
    # Handle both "from ai" and "from ai import" patterns
    imports_from = []

    # Try different import patterns
    for pattern in [
        f"from {candidate}",
        f"import {candidate}",
        f"{candidate}/",
        f'"{candidate}"',
        f"'{candidate}'",
    ]:
        matches = run_grep(pattern, str(ROOT))
        for m in matches:
            if candidate not in m and m not in imports_from:
                imports_from.append(m)

    # Also check if files in directory are referenced by name
    if path.is_dir():
        for f in path.rglob("*"):
            if f.is_file() and f.suffix in [".py", ".ts", ".tsx"]:
                stem = f.stem
                # Don't match common names
                if stem in ["__init__", "test", "conftest"]:
                    continue
                matches = run_grep(stem, str(ROOT))
                for m in matches:
                    if str(f) not in m and m not in imports_from:
                        imports_from.append(m)

    # Filter out self-references
    imports_from = [
        f for f in imports_from if candidate not in f or f"/{candidate}/" not in f
    ]

    if imports_from:
        print(f"   🔴 VERDICT: CONNECTED - Referenced by {len(imports_from)} file(s):")
        for f in imports_from[:8]:
            print(f"      → {f}")
        verdict = "CONNECTED"
    else:
        print(f"   🟢 VERDICT: ORPHANED - No references found")
        verdict = "ORPHAN"

    verdict_report.append(
        {
            "candidate": candidate,
            "exists": True,
            "lines": line_count,
            "mtime": mtime,
            "referenced_by": imports_from[:10] if imports_from else [],
            "verdict": verdict,
            "claim": description,
        }
    )

print()
print("=" * 80)
print("FINAL VERDICT SUMMARY")
print("=" * 80)
print()
print(f"{'STATUS':15} | {'CANDIDATE':30} | {'LINES':8} | EVIDENCE")
print("-" * 80)

connected = []
orphaned = []
unknown = []

for v in verdict_report:
    if not v.get("exists", True):
        status = "❌ NOT_EXISTS"
        unknown.append(v)
    elif v["verdict"] == "CONNECTED":
        status = "🔴 CONNECTED"
        connected.append(v)
    else:
        status = "🟢 ORPHANED"
        orphaned.append(v)

    lines = v.get("lines", 0)
    ref_count = len(v.get("referenced_by", []))
    evidence = f"{ref_count} files" if ref_count else "no refs"
    print(f"{status:15} | {v['candidate']:30} | {str(lines):8} | {evidence}")

print()
print("=" * 80)
print(
    f"TOTAL: {len(connected)} connected, {len(orphaned)} orphaned, {len(unknown)} not found"
)
print("=" * 80)

# Save full report
report_path = RESULTS / "verdict-summary.json"
with open(report_path, "w") as f:
    json.dump(
        {
            "timestamp": datetime.now().isoformat(),
            "connected": connected,
            "orphaned": orphaned,
            "unknown": unknown,
        },
        f,
        indent=2,
        default=str,
    )

print(f"\n✅ Full report: {report_path}")
print()

# Now do the deep analysis for specific questions
print("=" * 80)
print("DEEP ANALYSIS: Specific Questions")
print("=" * 80)

# Question 1: Which frontend entry is used?
print("\n📊 FRONTEND ENTRIES: Which is used?")
for candidate in ["frontend/src/main.tsx", "frontend/src/main.jsx"]:
    path = ROOT / candidate
    if path.exists():
        mtime = get_mtime(path)
        size = path.stat().st_size
        # Check which one is imported by more things
        refs = run_grep(candidate, str(ROOT))
        refs = [r for r in refs if "verdict" not in r and candidate in r]
        print(f"   {candidate}")
        print(f"      Size: {size} bytes, Modified: {mtime}")
        print(f"      Referenced by: {len(refs)} files")
        if refs:
            for r in refs[:3]:
                print(f"         → {r}")

# Question 2: What imports from Spacer/?
print("\n📊 SPACER/: What connects to it?")
spacer_refs = []
for pattern in ["Spacer/", 'Spacer"']:
    matches = run_grep(pattern, str(ROOT))
    for m in matches:
        if m not in spacer_refs:
            spacer_refs.append(m)
spacer_refs = [r for r in spacer_refs if "verdict" not in r]
print(f"   Referenced by {len(spacer_refs)} files:")
for r in spacer_refs[:5]:
    print(f"      → {r}")
if not spacer_refs:
    print("   🟢 NOT referenced by anything - likely safe to move")

# Question 3: What imports from archive/?
print("\n📊 ARCHIVE/: What connects to it?")
archive_refs = []
for item in ["archive/", "ceiling_panel_calc(1)", "examples(1)"]:
    matches = run_grep(item, str(ROOT))
    for m in matches:
        if m not in archive_refs:
            archive_refs.append(m)
archive_refs = [r for r in archive_refs if "verdict" not in r and "archive/" not in r]
print(f"   Referenced by {len(archive_refs)} files:")
for r in archive_refs[:5]:
    print(f"      → {r}")
if not archive_refs:
    print("   🟢 NOT referenced by anything - likely safe to move")

print("\n" + "=" * 80)
print("VERIFICATION COMPLETE")
print("=" * 80)
