#!/usr/bin/env python3
"""
Phase 7 Deep Search: Deploy 12 specialized agents
Each agent searches for specific types of materials/objects
Results synthesized by aggregator
"""

import subprocess
import json
from pathlib import Path
from datetime import datetime
import os
import threading
import time

ROOT = Path("/home/tomas/Ceiling Panel Spacer")
OUTPUT = ROOT / ".planning/phases/07-let-there-be-light/deep-search"
OUTPUT.mkdir(parents=True, exist_ok=True)

AGENTS = [
    {
        "id": "agent_01_ai_llm",
        "name": "AI/LLM Specialist",
        "target": "AI, LLM, agent, neural, transformer, language model files",
        "patterns": ["*ai*", "*llm*", "*agent*", "*neural*", "*transformer*", "*language*"],
        "paths": ["."],
        "size_threshold": 5000
    },
    {
        "id": "agent_02_bim_objects",
        "name": "BIM Objects Specialist",
        "target": "Wall, Beam, Column, Slab, Roof, structural objects",
        "patterns": ["*wall*", "*beam*", "*column*", "*slab*", "*roof*", "*structural*"],
        "paths": ["bim/", "bim_workbench/", "frontend/src/bim/", "Spacer/bim/"],
        "size_threshold": 1000
    },
    {
        "id": "agent_03_kitchen",
        "name": "Kitchen Module Specialist",
        "target": "Kitchen, cabinet, cabinetry, cooking, culinary",
        "patterns": ["*kitchen*", "*cabinet*", "*cabinetry*", "*cooking*"],
        "paths": ["Savage_Cabinetry_Platform/", "frontend/src/", "Spacer/"],
        "size_threshold": 1000
    },
    {
        "id": "agent_04_ui_components",
        "name": "UI Components Specialist",
        "target": "Badge, Card, Button, Input, Modal, Dialog, Dropdown",
        "patterns": ["Badge", "Card", "Button", "Input", "Modal", "Dialog", "Dropdown"],
        "paths": ["frontend/src/components/", "Spacer/frontend/src/components/"],
        "size_threshold": 500
    },
    {
        "id": "agent_05_tools",
        "name": "Tools Specialist",
        "target": "LineTool, RectangleTool, CircleTool, ArcTool, MoveTool, RotateTool",
        "patterns": ["*tool*.py", "*Tool*.py"],
        "paths": ["bim_workbench/tools/", "frontend/src/tools/", "Spacer/"],
        "size_threshold": 500
    },
    {
        "id": "agent_06_3d_objects",
        "name": "3D Objects Specialist",
        "target": "3D, Three.js, canvas, mesh, geometry, scene",
        "patterns": ["*3d*", "*three*", "*canvas*", "*mesh*", "*geometry*"],
        "paths": ["frontend/src/", "bim/", "src/"],
        "size_threshold": 1000
    },
    {
        "id": "agent_07_property_panels",
        "name": "Property Panels Specialist",
        "target": "Properties, panel, sidebar, inspector, attributes",
        "patterns": ["*property*", "*panel*", "*sidebar*", "*inspector*", "*attribute*"],
        "paths": ["bim/property/", "frontend/src/bim/property-panels/", "Spacer/"],
        "size_threshold": 500
    },
    {
        "id": "agent_08_materials",
        "name": "Materials Specialist",
        "target": "Materials, textures, colors, finishes, wood, tile",
        "patterns": ["*material*", "*texture*", "*color*", "*finish*", "*wood*", "*tile*"],
        "paths": ["frontend/src/", "core/", "Spacer/"],
        "size_threshold": 500
    },
    {
        "id": "agent_09_automation",
        "name": "Automation/AI Specialist",
        "target": "Automation, auto, workflow, pipeline, orchestration",
        "patterns": ["*automation*", "*auto*", "*workflow*", "*pipeline*", "*orchestration*"],
        "paths": ["orchestration/", "ai/", "Spacer/"],
        "size_threshold": 2000
    },
    {
        "id": "agent_10_gui",
        "name": "GUI/Interface Specialist",
        "target": "GUI, interface, layout, toolbar, menu, ribbon",
        "patterns": ["*gui*", "*interface*", "*layout*", "*toolbar*", "*menu*"],
        "paths": ["bim/gui/", "frontend/src/components/", "Spacer/"],
        "size_threshold": 500
    },
    {
        "id": "agent_11_export",
        "name": "Export/Import Specialist",
        "target": "Export, import, DXF, IFC, SVG, JSON, file format",
        "patterns": ["*export*", "*import*", "*dxf*", "*ifc*", "*svg*", "*json*"],
        "paths": ["output/", "frontend/src/", "Spacer/"],
        "size_threshold": 1000
    },
    {
        "id": "agent_12_validation",
        "name": "Validation/Rule Specialist",
        "target": "Validation, rules, constraints, check, verify, compliance",
        "patterns": ["*valid*", "*rule*", "*constraint*", "*check*", "*compliance*"],
        "paths": ["bim/", "core/", "frontend/src/", "Spacer/"],
        "size_threshold": 500
    },
]

def run_agent(agent):
    """Run a single search agent"""
    print(f"🔍 Starting: {agent['name']}")
    
    findings = []
    
    for pattern in agent["patterns"]:
        for path in agent["paths"]:
            try:
                result = subprocess.run(
                    ["find", str(ROOT / path), "-type", "f",
                     "(", "-name", f"*{pattern}*", "!", "-name", "node_modules",
                     "!", "-name", "__pycache__", "!", -name "*.pyc", ")",
                     "-exec", "wc", "-l", "{}", "+"],
                    capture_output=True, text=True, timeout=60
                )
                
                for line in result.stdout.strip().split("\n"):
                    if line.strip():
                        parts = line.rsplit(None, 1)
                        if len(parts) == 2:
                            try:
                                lines = int(parts[1])
                                filepath = parts[0]
                                size_kb = lines * 0.05  # rough estimate
                                
                                if size_kb > 1 or agent["size_threshold"] < 1000:
                                    findings.append({
                                        "file": filepath,
                                        "lines": lines,
                                        "size_kb": round(size_kb, 2),
                                        "pattern": pattern,
                                        "path_source": path
                                    })
                            except:
                                pass
            except Exception as e:
                print(f"  Error in {agent['name']}: {e}")
    
    # Remove duplicates
    unique = {}
    for f in findings:
        key = f["file"]
        if key not in unique:
            unique[key] = f
    
    # Save report
    report = {
        "agent": agent["name"],
        "target": agent["target"],
        "findings": list(unique.values()),
        "total_files": len(unique),
        "total_lines": sum(f["lines"] for f in unique.values()),
        "large_files": [f for f in unique.values() if f["size_kb"] > 5]
    }
    
    report_file = OUTPUT / f"{agent['id']}_report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ {agent['name']}: {len(unique)} files found")
    return report

def main():
    print("=" * 80)
    print("PHASE 7 DEEP SEARCH: Deploying 12 Specialized Agents")
    print("=" * 80)
    print(f"Output directory: {OUTPUT}")
    print()
    
    # Run agents in parallel batches
    batch_size = 4
    all_reports = []
    
    for i in range(0, len(AGENTS), batch_size):
        batch = AGENTS[i:i+batch_size]
        print(f"\n🚀 Launching batch {i//batch_size + 1}: {[a['name'] for a in batch]}")
        
        threads = []
        results = []
        
        for agent in batch:
            t = threading.Thread(target=lambda a=agent, r=results: r.append(run_agent(a)))
            t.start()
            threads.append(t)
        
        for t in threads:
            t.join()
        
        print(f"  Batch {i//batch_size + 1} complete")
    
    # Synthesize all findings
    print("\n" + "=" * 80)
    print("SYNTHESIZING FINDINGS")
    print("=" * 80)
    
    all_findings = []
    all_large_files = []
    
    for report_file in OUTPUT.glob("*_report.json"):
        with open(report_file) as f:
            data = json.load(f)
            all_findings.extend(data.get("findings", []))
            all_large_files.extend(data.get("large_files", []))
    
    # Save combined findings
    combined = {
        "timestamp": datetime.now().isoformat(),
        "total_files_found": len(all_findings),
        "total_large_files": len(all_large_files),
        "all_large_files": sorted(all_large_files, key=lambda x: x.get("size_kb", 0), reverse=True)[:50],
        "by_extension": {}
    }
    
    # Group by extension
    for f in all_findings:
        ext = f["file"].split(".")[-1] if "." in f["file"] else "unknown"
        if ext not in combined["by_extension"]:
            combined["by_extension"][ext] = []
        combined["by_extension"][ext].append(f["file"])
    
    with open(OUTPUT / "all_findings.json", "w") as f:
        json.dump(combined, f, indent=2)
    
    print(f"\n📊 TOTAL FILES FOUND: {len(all_findings)}")
    print(f"📊 LARGE FILES (>5KB): {len(all_large_files)}")
    print(f"\n💎 TOP 10 LARGEST FILES:")
    for f in sorted(all_large_files, key=lambda x: x.get("size_kb", 0), reverse=True)[:10]:
        print(f"  - {f['file']} ({f['size_kb']} KB)")
    
    print("\n" + "=" * 80)
    print("DEEP SEARCH COMPLETE")
    print("=" * 80)
    print(f"Reports saved to: {OUTPUT}")

if __name__ == "__main__":
    main()
