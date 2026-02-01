"""
Schedule API Endpoints for BIM Workbench

Provides endpoints for schedule management, quantity takeoff, and export functionality.
"""

from flask import Blueprint, request, jsonify, Response
from typing import List, Dict, Any
import json
from datetime import datetime

# Create blueprint
schedules_bp = Blueprint("schedules", __name__, url_prefix="/api/bim/schedules")


# ============================================================================
# Helper Functions
# ============================================================================


def calculate_area(obj: Dict) -> float:
    """Calculate surface area from object geometry (mm² to m²)"""
    width = obj.get("geometry", {}).get("width", 0)
    height = obj.get("geometry", {}).get("height", 0)
    if width and height:
        return (width * height) / 1_000_000
    return 0.0


def calculate_volume(obj: Dict) -> float:
    """Calculate volume from object geometry (mm³ to m³)"""
    width = obj.get("geometry", {}).get("width", 0)
    height = obj.get("geometry", {}).get("height", 0)
    thickness = obj.get("geometry", {}).get("thickness", 0)
    if width and height and thickness:
        return (width * height * thickness) / 1_000_000_000
    return 0.0


# ============================================================================
# Schedule Generation Endpoints
# ============================================================================


@schedules_bp.route("/generate", methods=["POST"])
def generate_schedule():
    """
    Generate a schedule from BIM objects.

    Request body:
    {
        "schedule_type": "door" | "window" | "material" | "custom",
        "objects": [list of BIM objects],
        "columns": [optional list of column definitions],
        "filters": [optional list of filters]
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    schedule_type = data.get("schedule_type")
    objects = data.get("objects", [])
    columns = data.get("columns", [])
    filters = data.get("filters", [])

    if not schedule_type:
        return jsonify({"error": "schedule_type is required"}), 400

    # Generate rows based on schedule type
    rows = []

    for obj in objects:
        obj_type = obj.get("type", "")

        # Apply filters
        include = True
        for f in filters:
            key = f.get("key")
            operator = f.get("operator", "equals")
            value = f.get("value")
            obj_value = obj.get(key, obj.get("properties", {}).get(key))

            if operator == "equals":
                if obj_value != value:
                    include = False
                    break
            elif operator == "contains":
                if value not in str(obj_value):
                    include = False
                    break
            elif operator == "gt":
                if float(obj_value) <= float(value):
                    include = False
                    break
            elif operator == "lt":
                if float(obj_value) >= float(value):
                    include = False
                    break

        if not include:
            continue

        # Build row based on schedule type
        if schedule_type == "door" and obj_type == "door":
            row = {
                "id": f"door-{obj.get('id')}",
                "objectId": obj.get("id"),
                "count": 1,
                "type": obj.get("properties", {}).get("type", "Standard"),
                "width": f"{obj.get('geometry', {}).get('width', obj.get('properties', {}).get('width', 900))}mm",
                "height": f"{obj.get('geometry', {}).get('height', obj.get('properties', {}).get('height', 2100))}mm",
                "material": obj.get("material", "-"),
                "fireRating": obj.get("properties", {}).get("fireRating", "-"),
            }
            rows.append(row)

        elif schedule_type == "window" and obj_type == "window":
            row = {
                "id": f"window-{obj.get('id')}",
                "objectId": obj.get("id"),
                "count": 1,
                "type": obj.get("properties", {}).get("type", "Fixed"),
                "width": f"{obj.get('geometry', {}).get('width', obj.get('properties', {}).get('width', 1200))}mm",
                "height": f"{obj.get('geometry', {}).get('height', obj.get('properties', {}).get('height', 1200))}mm",
                "glazing": obj.get("properties", {}).get("glazing", "Double"),
                "material": obj.get("material", "Aluminum"),
            }
            rows.append(row)

        elif schedule_type == "material":
            row = {
                "id": f"material-{obj.get('id')}",
                "objectId": obj.get("id"),
                "material": obj.get("material", "Unknown"),
                "objectCount": 1,
                "totalArea": f"{calculate_area(obj):.2f} m²",
                "totalVolume": f"{calculate_volume(obj):.3f} m³"
                if calculate_volume(obj) > 0
                else "-",
            }
            rows.append(row)

    # Calculate summary
    summary = {"totalItems": len(rows), "byType": {}}

    for row in rows:
        obj_type = row.get("type", row.get("material", "unknown"))
        summary["byType"][obj_type] = summary["byType"].get(obj_type, 0) + 1

    return jsonify(
        {
            "schedule_type": schedule_type,
            "rows": rows,
            "totalCount": len(rows),
            "generated": datetime.utcnow().isoformat(),
            "summary": summary,
        }
    )


@schedules_bp.route("/quantity-takeoff", methods=["POST"])
def quantity_takeoff():
    """
    Calculate quantity takeoff for BIM objects.

    Request body:
    {
        "objects": [list of BIM objects],
        "categories": [optional list of categories to include]
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    objects = data.get("objects", [])
    categories = data.get(
        "categories", ["walls", "floors", "doors", "windows", "materials"]
    )

    results = []

    # Walls
    if "walls" in categories:
        for obj in objects:
            if obj.get("type") == "wall":
                length = obj.get("geometry", {}).get(
                    "length", obj.get("properties", {}).get("length", 0)
                )
                height = obj.get("geometry", {}).get(
                    "height", obj.get("properties", {}).get("height", 0)
                )
                area = (length * height) / 1_000_000  # m²

                results.append(
                    {
                        "category": "Walls",
                        "item": obj.get("name", obj.get("id")),
                        "count": 1,
                        "unit": "m²",
                        "total": round(area, 3),
                        "unitCost": obj.get("properties", {}).get("unitCost"),
                        "totalCost": round(
                            area * obj.get("properties", {}).get("unitCost", 0), 2
                        )
                        if obj.get("properties", {}).get("unitCost")
                        else None,
                    }
                )

    # Floors/Slabs
    if "floors" in categories:
        for obj in objects:
            if obj.get("type") in ["slab", "floor", "ceiling"]:
                area = calculate_area(obj)
                volume = calculate_volume(obj)

                results.append(
                    {
                        "category": "Floors/Slabs",
                        "item": obj.get("name", obj.get("id")),
                        "count": 1,
                        "unit": "m²",
                        "total": round(area, 3),
                    }
                )

                if volume > 0:
                    results.append(
                        {
                            "category": "Concrete Volume",
                            "item": obj.get("name", obj.get("id")),
                            "count": 1,
                            "unit": "m³",
                            "total": round(volume, 3),
                        }
                    )

    # Doors
    if "doors" in categories:
        door_count = sum(1 for obj in objects if obj.get("type") == "door")
        if door_count > 0:
            results.append(
                {
                    "category": "Doors",
                    "item": "Door Count",
                    "count": door_count,
                    "unit": "ea",
                    "total": door_count,
                }
            )

    # Windows
    if "windows" in categories:
        window_count = sum(1 for obj in objects if obj.get("type") == "window")
        if window_count > 0:
            results.append(
                {
                    "category": "Windows",
                    "item": "Window Count",
                    "count": window_count,
                    "unit": "ea",
                    "total": window_count,
                }
            )

    # Materials
    if "materials" in categories:
        material_totals = {}
        for obj in objects:
            material = obj.get("material", "Unknown")
            if material not in material_totals:
                material_totals[material] = {"count": 0, "area": 0}
            material_totals[material]["count"] += 1
            material_totals[material]["area"] += calculate_area(obj)

        for material, totals in material_totals.items():
            results.append(
                {
                    "category": "Materials",
                    "item": material,
                    "count": totals["count"],
                    "unit": "ea",
                    "total": round(totals["area"], 3),
                }
            )

    return jsonify({"results": results, "generated": datetime.utcnow().isoformat()})


# ============================================================================
# Export Endpoints
# ============================================================================


@schedules_bp.route("/export/csv", methods=["POST"])
def export_csv():
    """
    Export schedule data to CSV format.

    Request body:
    {
        "schedule_type": "door" | "window" | "material",
        "headers": [list of column headers],
        "rows": [list of row data]
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    headers = data.get("headers", [])
    rows = data.get("rows", [])
    schedule_type = data.get("schedule_type", "schedule")

    # Build CSV
    csv_lines = [",".join(f'"{h}"' for h in headers)]
    for row in rows:
        values = [str(v) for v in row.values()]
        csv_lines.append(",".join(f'"{v}"' for v in values))

    csv_content = "\n".join(csv_lines)

    return Response(
        csv_content,
        mimetype="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{schedule_type}_schedule.csv"'
        },
    )


@schedules_bp.route("/export/excel", methods=["POST"])
def export_excel():
    """
    Export schedule data to Excel format.

    Note: This is a placeholder. In production, you would use a library
    like openpyxl or xlsxwriter to generate proper Excel files.

    Request body:
    {
        "schedule_type": "door" | "window" | "material",
        "headers": [list of column headers],
        "rows": [list of row data],
        "title": [optional report title]
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # For now, return JSON that frontend can convert
    # In production, implement proper Excel generation
    return jsonify(
        {
            "message": "Excel export placeholder - implement with openpyxl",
            "schedule_type": data.get("schedule_type"),
            "row_count": len(data.get("rows", [])),
            "note": "Install openpyxl and implement proper Excel generation",
        }
    )


@schedules_bp.route("/report", methods=["POST"])
def generate_report():
    """
    Generate full project report with schedules and quantities.

    Request body:
    {
        "project": { project metadata },
        "objects": [list of BIM objects],
        "include_schedules": [list of schedule types to include],
        "include_quantities": boolean
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    project = data.get("project", {})
    objects = data.get("objects", [])
    include_schedules = data.get("include_schedules", ["door", "window", "material"])
    include_quantities = data.get("include_quantities", True)

    report = {
        "metadata": {
            "projectName": project.get("name", "Untitled Project"),
            "generated": datetime.utcnow().isoformat(),
            "author": project.get("author", "Unknown"),
        },
        "summary": {
            "totalObjects": len(objects),
            "totalMaterials": len(set(obj.get("material") for obj in objects)),
            "totalLayers": len(set(obj.get("layer") for obj in objects)),
        },
        "schedules": {},
        "quantities": None,
    }

    # Generate schedules
    for schedule_type in include_schedules:
        schedule_data = {
            "schedule_type": schedule_type,
            "rows": [],
            "totalCount": 0,
            "generated": datetime.utcnow().isoformat(),
        }

        filtered_objects = [
            obj
            for obj in objects
            if schedule_type == "material" or obj.get("type") == schedule_type
        ]

        schedule_data["totalCount"] = len(filtered_objects)
        schedule_data["rows"] = [
            {
                "id": f"{schedule_type}-{obj.get('id')}",
                "objectId": obj.get("id"),
                "type": obj.get("properties", {}).get(
                    "type", obj.get("type", "Standard")
                ),
                "dimensions": f"{obj.get('geometry', {}).get('width', '?')} × {obj.get('geometry', {}).get('height', '?')}mm",
                "material": obj.get("material", "-"),
            }
            for obj in filtered_objects
        ]

        report["schedules"][schedule_type] = schedule_data

    # Generate quantity takeoff
    if include_quantities:
        from . import quantity_takeoff

        report["quantities"] = quantity_takeoff.generate_full_quantity_takeoff(objects)

    return jsonify(report)


# ============================================================================
# Schedule Definition Endpoints
# ============================================================================


@schedules_bp.route("/definitions", methods=["GET"])
def get_schedule_definitions():
    """
    Get available schedule definitions.

    Returns list of predefined and custom schedule definitions.
    """
    definitions = [
        {
            "id": "door-schedule",
            "name": "Door Schedule",
            "type": "door",
            "description": "Complete door schedule with dimensions and materials",
            "columns": [
                {"key": "count", "header": "Count", "width": 60},
                {"key": "type", "header": "Type", "width": 100},
                {"key": "width", "header": "Width", "width": 80},
                {"key": "height", "header": "Height", "width": 80},
                {"key": "material", "header": "Material", "width": 120},
                {"key": "fireRating", "header": "Fire Rating", "width": 100},
            ],
        },
        {
            "id": "window-schedule",
            "name": "Window Schedule",
            "type": "window",
            "description": "Window schedule with sizes and glazing",
            "columns": [
                {"key": "count", "header": "Count", "width": 60},
                {"key": "type", "header": "Type", "width": 100},
                {"key": "width", "header": "Width", "width": 80},
                {"key": "height", "header": "Height", "width": 80},
                {"key": "glazing", "header": "Glazing", "width": 100},
                {"key": "material", "header": "Frame Material", "width": 120},
            ],
        },
        {
            "id": "material-schedule",
            "name": "Material Schedule",
            "type": "material",
            "description": "Material quantities by type",
            "columns": [
                {"key": "material", "header": "Material", "width": 150},
                {"key": "objectCount", "header": "Objects", "width": 80},
                {"key": "totalArea", "header": "Total Area", "width": 100},
                {"key": "totalVolume", "header": "Total Volume", "width": 100},
            ],
        },
    ]

    return jsonify({"definitions": definitions})


# ============================================================================
# Error Handlers
# ============================================================================


@schedules_bp.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400


@schedules_bp.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500
