"""
Quantity Takeoff Module

Calculates areas, volumes, and material quantities for BIM objects.
Supports door, window, wall, floor, and material schedules.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid


@dataclass
class QuantityResult:
    """Result of quantity calculation"""

    category: str
    item: str
    count: int
    unit: str
    total: float
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    breakdown: Optional[Dict[str, Any]] = None


@dataclass
class AreaCalculation:
    """Area calculation result"""

    object_id: str
    object_name: str
    object_type: str
    area: float  # in m²
    unit: str = "m²"
    faces: Optional[Dict[str, float]] = None


@dataclass
class VolumeCalculation:
    """Volume calculation result"""

    object_id: str
    object_name: str
    object_type: str
    volume: float  # in m³
    unit: str = "m³"


@dataclass
class MaterialQuantity:
    """Material quantity result"""

    material_id: str
    material_name: str
    category: str
    area: float  # in m²
    volume: float  # in m³
    count: int
    objects: List[str]
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None


def mm_to_m(value_mm: float) -> float:
    """Convert millimeters to meters"""
    return value_mm / 1000


def mm2_to_m2(value_mm2: float) -> float:
    """Convert square millimeters to square meters"""
    return value_mm2 / 1000000


def mm3_to_m3(value_mm3: float) -> float:
    """Convert cubic millimeters to cubic meters"""
    return value_mm3 / 1000000000


def calculate_areas(objects: List[Dict]) -> List[AreaCalculation]:
    """
    Calculate surface areas for all objects

    Args:
        objects: List of BIM object dictionaries

    Returns:
        List of AreaCalculation results
    """
    results = []

    for obj in objects:
        if obj.get("type") in ["site", "building"]:
            continue

        obj_type = obj.get("type", "").lower()
        props = obj.get("properties", {})
        geometry = obj.get("geometry", {})

        # Get dimensions
        width = geometry.get("width") or props.get("width") or props.get("length") or 0
        depth = geometry.get("depth") or props.get("depth") or props.get("length") or 0
        height = geometry.get("height") or props.get("height") or 0
        length = geometry.get("length") or props.get("length") or 0

        # Calculate based on object type
        faces = {"total": 0}

        if obj_type in ["wall"]:
            # Wall has two large faces (sides)
            wall_area = mm2_to_m2(length * height)
            faces = {"sides": wall_area, "total": wall_area * 2}

        elif obj_type in ["floor", "slab"]:
            # Floor has top and bottom
            floor_area = mm2_to_m2(width * depth)
            faces = {"top": floor_area, "bottom": floor_area, "total": floor_area * 2}

        elif obj_type in ["door", "window"]:
            # Door/window is a single face
            opening_area = mm2_to_m2(width * height)
            faces = {"sides": opening_area, "total": opening_area}

        elif obj_type in ["column"]:
            # Column has side faces
            perimeter = 2 * (mm_to_m(width) + mm_to_m(depth))
            side_area = perimeter * mm_to_m(height)
            faces = {
                "sides": side_area,
                "top": mm2_to_m2(width * depth),
                "bottom": mm2_to_m2(width * depth),
                "total": side_area + 2 * mm2_to_m2(width * depth),
            }

        elif obj_type in ["beam"]:
            # Beam has side faces
            perimeter = 2 * (mm_to_m(width) + mm_to_m(depth))
            side_area = perimeter * mm_to_m(length)
            faces = {
                "sides": side_area,
                "top": mm2_to_m2(width * depth),
                "bottom": mm2_to_m2(width * depth),
                "total": side_area + 2 * mm2_to_m2(width * depth),
            }

        elif obj_type in ["ceiling"]:
            # Ceiling is single face
            ceiling_area = mm2_to_m2(width * depth)
            faces = {"top": ceiling_area, "total": ceiling_area}

        else:
            # Generic calculation
            generic_area = mm2_to_m2(width * height)
            faces = {"sides": generic_area, "total": generic_area}

        results.append(
            AreaCalculation(
                object_id=obj.get("id", str(uuid.uuid4())),
                object_name=obj.get("name", "Unknown"),
                object_type=obj.get("type", "Unknown"),
                area=faces["total"],
                faces=faces,
            )
        )

    return results


def calculate_volumes(objects: List[Dict]) -> List[VolumeCalculation]:
    """
    Calculate volumes for 3D objects

    Args:
        objects: List of BIM object dictionaries

    Returns:
        List of VolumeCalculation results
    """
    volumetric_types = ["wall", "floor", "slab", "column", "beam", "ceiling"]
    results = []

    for obj in objects:
        obj_type = obj.get("type", "").lower()
        if obj_type not in volumetric_types:
            continue

        props = obj.get("properties", {})
        geometry = obj.get("geometry", {})

        # Get dimensions
        width = geometry.get("width") or props.get("width") or props.get("length") or 0
        depth = geometry.get("depth") or props.get("depth") or props.get("length") or 0
        height = geometry.get("height") or props.get("height") or 0
        length = geometry.get("length") or props.get("length") or 0
        thickness = geometry.get("thickness") or props.get("thickness") or width

        volume = 0

        if obj_type == "wall":
            # Wall volume
            volume = mm3_to_m3(length * thickness * height)

        elif obj_type in ["floor", "slab"]:
            # Slab volume
            volume = mm3_to_m3(width * depth * (props.get("thickness") or 200))

        elif obj_type == "column":
            # Column volume (rectangular)
            volume = mm3_to_m3(width * depth * height)

        elif obj_type == "beam":
            # Beam volume
            volume = mm3_to_m3(width * depth * length)

        elif obj_type == "ceiling":
            # Ceiling volume (thin)
            volume = mm3_to_m3(width * depth * 50)  # Assume 50mm thickness

        else:
            # Generic volume
            volume = mm3_to_m3(width * depth * height)

        results.append(
            VolumeCalculation(
                object_id=obj.get("id", str(uuid.uuid4())),
                object_name=obj.get("name", "Unknown"),
                object_type=obj.get("type", "Unknown"),
                volume=volume,
            )
        )

    return results


def calculate_material_quantities(objects: List[Dict]) -> List[MaterialQuantity]:
    """
    Calculate material quantities across all objects

    Args:
        objects: List of BIM object dictionaries

    Returns:
        List of MaterialQuantity results
    """
    material_map: Dict[str, Dict] = {}

    for obj in objects:
        if obj.get("type") in ["site", "building"]:
            continue

        material_id = obj.get("material") or "unknown"
        material_name = obj.get("material") or "Unknown Material"

        if material_id not in material_map:
            material_map[material_id] = {
                "material_id": material_id,
                "material_name": material_name,
                "category": obj.get("properties", {}).get(
                    "materialCategory", "General"
                ),
                "area": 0,
                "volume": 0,
                "count": 0,
                "objects": [],
                "total_cost": 0,
            }

        existing = material_map[material_id]
        props = obj.get("properties", {})
        geometry = obj.get("geometry", {})

        # Calculate area based on type
        width = geometry.get("width") or props.get("width") or 0
        height = geometry.get("height") or props.get("height") or 0
        length = geometry.get("length") or props.get("length") or 0
        depth = geometry.get("depth") or props.get("depth") or 0

        area = 0
        if obj.get("type") in ["wall"]:
            area = mm2_to_m2(length * height)
        elif obj.get("type") in ["floor", "slab"]:
            area = mm2_to_m2(width * depth)
        elif obj.get("type") in ["door", "window"]:
            area = mm2_to_m2(width * height)
        else:
            area = mm2_to_m2(width * height)

        # Calculate volume
        thickness = geometry.get("thickness") or props.get("thickness") or width
        volume = 0
        if obj.get("type") == "wall":
            volume = mm3_to_m3(length * thickness * height)
        elif obj.get("type") in ["floor", "slab"]:
            volume = mm3_to_m3(width * depth * thickness)
        elif obj.get("type") == "column":
            volume = mm3_to_m3(width * depth * height)
        else:
            volume = mm3_to_m3(width * depth * height)

        existing["area"] += area
        existing["volume"] += volume
        existing["count"] += 1
        existing["objects"].append(obj.get("id", ""))
        existing["total_cost"] += props.get("unitCost", 0)

    return [
        MaterialQuantity(
            material_id=data["material_id"],
            material_name=data["material_name"],
            category=data["category"],
            area=data["area"],
            volume=data["volume"],
            count=data["count"],
            objects=data["objects"],
            total_cost=data["total_cost"],
        )
        for data in material_map.values()
    ]


def generate_schedule(object_type: str, objects: List[Dict]) -> List[Dict]:
    """
    Generate schedule for specific object type

    Args:
        object_type: Type of objects to include (e.g., 'door', 'window')
        objects: List of BIM object dictionaries

    Returns:
        List of schedule row dictionaries
    """
    rows = []

    for obj in objects:
        if obj.get("type", "").lower() != object_type.lower():
            continue

        props = obj.get("properties", {})
        geometry = obj.get("geometry", {})

        width = geometry.get("width") or props.get("width") or 0
        height = geometry.get("height") or props.get("height") or 0

        row = {
            "id": obj.get("id", str(uuid.uuid4())),
            "count": 1,
            "type": obj.get("type", object_type),
            "name": obj.get("name", f"{object_type.title()} {len(rows) + 1}"),
            "dimensions": f"{width} × {height}mm",
            "width": width,
            "height": height,
            "material": obj.get("material", "Unknown"),
            "level": props.get("level", "Level 1"),
            "unit_cost": props.get("unitCost", 0),
            "total_cost": props.get("unitCost", 0),
        }

        # Calculate area and volume
        if width and height:
            row["area"] = mm2_to_m2(width * height)
        if width and height and (geometry.get("depth") or props.get("depth")):
            depth = geometry.get("depth") or props.get("depth")
            row["volume"] = mm3_to_m3(width * height * depth)

        rows.append(row)

    return rows


def generate_full_quantity_takeoff(objects: List[Dict]) -> List[QuantityResult]:
    """
    Generate complete quantity takeoff for project

    Args:
        objects: List of BIM object dictionaries

    Returns:
        List of QuantityResult objects
    """
    results = []

    # Calculate wall areas
    walls = [obj for obj in objects if obj.get("type", "").lower() == "wall"]
    wall_areas = calculate_areas(walls)
    for area in wall_areas:
        wall = next((w for w in walls if w.get("id") == area.object_id), None)
        unit_cost = wall.get("properties", {}).get("unitCost", 0) if wall else 0
        results.append(
            QuantityResult(
                category="Walls",
                item=area.object_name,
                count=1,
                unit="m²",
                total=area.area,
                unit_cost=unit_cost,
                total_cost=area.area * unit_cost,
                breakdown={"level": "Unknown", "area": area.area},
            )
        )

    # Calculate floor areas
    floors = [
        obj for obj in objects if obj.get("type", "").lower() in ["floor", "slab"]
    ]
    floor_areas = calculate_areas(floors)
    for area in floor_areas:
        floor = next((f for f in floors if f.get("id") == area.object_id), None)
        unit_cost = floor.get("properties", {}).get("unitCost", 0) if floor else 0
        results.append(
            QuantityResult(
                category="Floors",
                item=area.object_name,
                count=1,
                unit="m²",
                total=area.area,
                unit_cost=unit_cost,
                total_cost=area.area * unit_cost,
                breakdown={"level": "Unknown", "area": area.area},
            )
        )

    # Calculate volumes
    volumes = calculate_volumes(objects)
    for vol in volumes:
        obj = next((o for o in objects if o.get("id") == vol.object_id), None)
        unit_cost = obj.get("properties", {}).get("unitCost", 0) if obj else 0
        results.append(
            QuantityResult(
                category="Concrete",
                item=f"{vol.object_name} ({vol.object_type})",
                count=1,
                unit="m³",
                total=vol.volume,
                unit_cost=unit_cost,
                total_cost=vol.volume * unit_cost,
                breakdown={"level": "Unknown", "volume": vol.volume},
            )
        )

    # Calculate material quantities
    material_quantities = calculate_material_quantities(objects)
    for mq in material_quantities:
        results.append(
            QuantityResult(
                category="Materials",
                item=mq.material_name,
                count=mq.count,
                unit="m²",
                total=mq.area,
                total_cost=mq.total_cost,
                breakdown={
                    "material": mq.material_name,
                    "area": mq.area,
                    "volume": mq.volume,
                },
            )
        )

    # Count doors
    doors = [obj for obj in objects if obj.get("type", "").lower() == "door"]
    if doors:
        total_door_cost = sum(d.get("properties", {}).get("unitCost", 0) for d in doors)
        results.append(
            QuantityResult(
                category="Doors",
                item="Doors",
                count=len(doors),
                unit="ea",
                total=len(doors),
                total_cost=total_door_cost,
            )
        )

    # Count windows
    windows = [obj for obj in objects if obj.get("type", "").lower() == "window"]
    if windows:
        total_window_cost = sum(
            w.get("properties", {}).get("unitCost", 0) for w in windows
        )
        results.append(
            QuantityResult(
                category="Windows",
                item="Windows",
                count=len(windows),
                unit="ea",
                total=len(windows),
                total_cost=total_window_cost,
            )
        )

    return results


def calculate_door_quantities(doors: List[Dict]) -> List[QuantityResult]:
    """Calculate door quantities by type"""
    door_map: Dict[str, Dict] = {}

    for door in doors:
        door_type = door.get("properties", {}).get("type", "Standard")
        if door_type not in door_map:
            door_map[door_type] = {"count": 0, "cost": 0}
        door_map[door_type]["count"] += 1
        door_map[door_type]["cost"] += door.get("properties", {}).get("unitCost", 0)

    return [
        QuantityResult(
            category="Doors",
            item=door_type,
            count=data["count"],
            unit="ea",
            total=data["count"],
            total_cost=data["cost"],
        )
        for door_type, data in door_map.items()
    ]


def calculate_window_quantities(windows: List[Dict]) -> List[QuantityResult]:
    """Calculate window quantities by type"""
    window_map: Dict[str, Dict] = {}

    for window in windows:
        window_type = window.get("properties", {}).get("type", "Fixed")
        if window_type not in window_map:
            window_map[window_type] = {"count": 0, "cost": 0}
        window_map[window_type]["count"] += 1
        window_map[window_type]["cost"] += window.get("properties", {}).get(
            "unitCost", 0
        )

    return [
        QuantityResult(
            category="Windows",
            item=window_type,
            count=data["count"],
            unit="ea",
            total=data["count"],
            total_cost=data["cost"],
        )
        for window_type, data in window_map.items()
    ]


def calculate_wall_areas(walls: List[Dict]) -> List[QuantityResult]:
    """Calculate wall areas specifically"""
    return [
        QuantityResult(
            category="Walls",
            item=wall.get("name", "Wall"),
            count=1,
            unit="m²",
            total=mm2_to_m2(
                (
                    wall.get("properties", {}).get("length")
                    or wall.get("properties", {}).get("width")
                    or 0
                )
                * (
                    wall.get("properties", {}).get("height")
                    or wall.get("geometry", {}).get("height")
                    or 3000
                )
            ),
            unit_cost=wall.get("properties", {}).get("unitCost", 0),
            total_cost=mm2_to_m2(
                (
                    wall.get("properties", {}).get("length")
                    or wall.get("properties", {}).get("width")
                    or 0
                )
                * (
                    wall.get("properties", {}).get("height")
                    or wall.get("geometry", {}).get("height")
                    or 3000
                )
            )
            * wall.get("properties", {}).get("unitCost", 0),
            breakdown={"level": wall.get("properties", {}).get("level", "Unknown")},
        )
        for wall in walls
    ]


def calculate_floor_areas(floors: List[Dict]) -> List[QuantityResult]:
    """Calculate floor areas specifically"""
    return [
        QuantityResult(
            category="Floors",
            item=floor.get("name", "Floor"),
            count=1,
            unit="m²",
            total=mm2_to_m2(
                (floor.get("properties", {}).get("width") or 0)
                * (
                    floor.get("properties", {}).get("depth")
                    or floor.get("properties", {}).get("length")
                    or 0
                )
            ),
            unit_cost=floor.get("properties", {}).get("unitCost", 0),
            total_cost=mm2_to_m2(
                (floor.get("properties", {}).get("width") or 0)
                * (
                    floor.get("properties", {}).get("depth")
                    or floor.get("properties", {}).get("length")
                    or 0
                )
            )
            * floor.get("properties", {}).get("unitCost", 0),
            breakdown={"level": floor.get("properties", {}).get("level", "Unknown")},
        )
        for floor in floors
    ]
