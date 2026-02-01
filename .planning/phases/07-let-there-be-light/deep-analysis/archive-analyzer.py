#!/usr/bin/env python3
"""
Deep Analysis: Archive Directory - Connected vs Orphaned
Find the treasure in the trash
"""

import subprocess
import json
from pathlib import Path
from datetime import datetime
import os

ROOT = Path("/home/tomas/Ceiling Panel Spacer")
ARCHIVE = ROOT / "archive"
OUTPUT = ROOT / ".planning/phases/07-let-there-be-light/deep-analysis"


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
                pattern,
                path,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return [
            f for f in result.stdout.strip().split("\n") if f and "archive" not in f
        ]
    except:
        return []


def count_lines(path):
    """Count lines in files"""
    total = 0
    if path.is_file():
        try:
            with open(path) as f:
                total = sum(1 for _ in f)
        except:
            pass
    elif path.is_dir():
        for f in path.rglob("*"):
            if f.is_file() and f.suffix in [".py", ".ts", ".tsx", ".js"]:
                try:
                    with open(f) as file:
                        total += sum(1 for _ in file)
                except:
                    pass
    return total


print("=" * 80)
print("ARCHIVE DEEP DIVE: Connected vs Orphaned")
print("=" * 80)

if not ARCHIVE.exists():
    print("❌ archive/ does not exist!")
    exit(1)

# List all files in archive
archive_files = list(ARCHIVE.glob("*"))
print(f"\n📁 Files in archive/: {len(archive_files)}")

analysis = {
    "timestamp": datetime.now().isoformat(),
    "files": [],
    "connected": [],
    "orphaned": [],
    "summary": {},
}

for afile in sorted(archive_files):
    if afile.is_file():
        name = afile.name
        lines = count_lines(afile)

        # What imports this file?
        # Try stem without extension
        stem = afile.stem

        # Check references
        refs = []

        # Search for imports
        for pattern in [f"import {stem}", f"from {stem}", f"'{stem}'", f'"{stem}"']:
            matches = run_grep(pattern, str(ROOT))
            for m in matches:
                if str(afile) not in m and m not in refs:
                    refs.append(m)

        # Special case for (1) files - check original name
        if "(1)" in name:
            original = name.replace("(1)", "")
            for pattern in [original, original.replace(".py", "")]:
                matches = run_grep(pattern, str(ROOT))
                for m in matches:
                    if str(afile) not in m and m not in refs:
                        refs.append(m)

        # Filter out self-reference in archive
        refs = [r for r in refs if "archive/" not in r]

        status = "ORPHANED" if not refs else "CONNECTED"

        print(f"\n📄 {name}")
        print(f"   Lines: {lines}")
        print(
            f"   Status: {'🔴 CONNECTED' if status == 'CONNECTED' else '🟢 ORPHANED'}"
        )
        if refs:
            print(f"   Referenced by:")
            for r in refs[:5]:
                print(f"      → {r}")

        file_info = {
            "name": name,
            "lines": lines,
            "status": status,
            "referenced_by": refs[:5] if refs else [],
        }

        analysis["files"].append(file_info)

        if status == "CONNECTED":
            analysis["connected"].append(file_info)
        else:
            analysis["orphaned"].append(file_info)

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

connected_lines = sum(f["lines"] for f in analysis["connected"])
orphaned_lines = sum(f["lines"] for f in analysis["orphaned"])
total_lines = connected_lines + orphaned_lines

print(
    f"\n📊 Connected: {len(analysis['connected'])} files ({connected_lines} lines, {100 * connected_lines / total_lines:.1f}%)"
)
print(
    f"📊 Orphaned: {len(analysis['orphaned'])} files ({orphaned_lines} lines, {100 * orphaned_lines / total_lines:.1f}%)"
)

print(f"\n🔴 CONNECTED FILES (KEEP or HARVEST IP):")
for f in analysis["connected"]:
    print(f"   - {f['name']} ({f['lines']} lines)")

print(f"\n🟢 ORPHANED FILES (MOVE TO STAGING):")
for f in analysis["orphaned"]:
    print(f"   - {f['name']} ({f['lines']} lines)")

# Save report
report_path = OUTPUT / "archive-analysis.json"
with open(report_path, "w") as f:
    json.dump(analysis, f, indent=2)

print(f"\n✅ Report: {report_path}")
