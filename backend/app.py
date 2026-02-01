"""
BIM Workbench Backend API
Flask application with RESTful endpoints for BIM operations
"""

from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from datetime import datetime
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# Create BIM Blueprint
bim_bp = Blueprint("bim", __name__, url_prefix="/api/bim")

# In-memory storage (replace with database in production)
projects_db = {}
objects_db = {}
layers_db = {}
materials_db = {}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def generate_id():
    """Generate unique identifier"""
    return str(uuid.uuid4())


def get_timestamp():
    """Get current ISO timestamp"""
    return datetime.utcnow().isoformat() + "Z"


def create_response(data=None, error=None, status_code=200):
    """Create standardized API response"""
    response = {"success": error is None}
    if data is not None:
        response["data"] = data
    if error is not None:
        response["error"] = {"message": error}
    return jsonify(response), status_code


def log_request(endpoint, method, data=None):
    """Log API request details"""
    logger.info(f"[{method}] {endpoint} - Request: {data}")


# ============================================================================
# PROJECT ROUTES
# ============================================================================


@bim_bp.route("/projects", methods=["POST"])
def create_project():
    """Create new project

    Request Body:
        - name (str): Project name
        - description (str, optional): Project description
        - unit (str): Measurement unit (mm, cm, m, ft, in)
        - dimensions (dict, optional): {width, height, depth}
        - metadata (dict, optional): Additional metadata

    Returns:
        Created project with id and timestamps
    """
    log_request("/api/bim/projects", "POST", request.json)

    try:
        data = request.get_json()

        if not data or "name" not in data:
            return create_response(error="Project name is required", status_code=400)

        if "unit" not in data:
            return create_response(
                error="Measurement unit is required", status_code=400
            )

        project_id = generate_id()
        timestamp = get_timestamp()

        project = {
            "id": project_id,
            "name": data["name"],
            "description": data.get("description", ""),
            "unit": data["unit"],
            "dimensions": data.get("dimensions", {}),
            "metadata": data.get("metadata", {}),
            "created_at": timestamp,
            "updated_at": timestamp,
            "objects": [],
            "layers": [],
            "materials": [],
        }

        projects_db[project_id] = project
        logger.info(f"Project created: {project_id}")

        return create_response(data=project, status_code=201)

    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    """Get project by ID

    Path Parameters:
        - project_id (str): Project identifier

    Returns:
        Full project with objects, layers, materials
    """
    log_request(f"/api/bim/projects/{project_id}", "GET")

    try:
        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        project = projects_db[project_id]

        # Fetch related objects
        project["objects"] = [
            objects_db[obj_id]
            for obj_id in objects_db
            if objects_db[obj_id].get("project_id") == project_id
        ]

        # Fetch related layers
        project["layers"] = [
            layers_db[layer_id]
            for layer_id in layers_db
            if layers_db[layer_id].get("project_id") == project_id
        ]

        return create_response(data=project)

    except Exception as e:
        logger.error(f"Error getting project: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects/<project_id>", methods=["PUT"])
def update_project(project_id):
    """Update project

    Path Parameters:
        - project_id (str): Project identifier

    Request Body:
        - name (str, optional): Project name
        - description (str, optional): Project description
        - unit (str, optional): Measurement unit
        - dimensions (dict, optional): Project dimensions
        - metadata (dict, optional): Additional metadata

    Returns:
        Updated project
    """
    log_request(f"/api/bim/projects/{project_id}", "PUT", request.json)

    try:
        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        data = request.get_json()
        project = projects_db[project_id]

        # Update allowed fields
        allowed_fields = ["name", "description", "unit", "dimensions", "metadata"]
        for field in allowed_fields:
            if field in data:
                project[field] = data[field]

        project["updated_at"] = get_timestamp()

        logger.info(f"Project updated: {project_id}")
        return create_response(data=project)

    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    """Delete project and all related data

    Path Parameters:
        - project_id (str): Project identifier

    Returns:
        Success confirmation
    """
    log_request(f"/api/bim/projects/{project_id}", "DELETE")

    try:
        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        # Delete related objects
        objects_to_delete = [
            obj_id
            for obj_id in objects_db
            if objects_db[obj_id].get("project_id") == project_id
        ]
        for obj_id in objects_to_delete:
            del objects_db[obj_id]

        # Delete related layers
        layers_to_delete = [
            layer_id
            for layer_id in layers_db
            if layers_db[layer_id].get("project_id") == project_id
        ]
        for layer_id in layers_to_delete:
            del layers_db[layer_id]

        # Delete project
        del projects_db[project_id]

        logger.info(f"Project deleted: {project_id}")
        return create_response(data={"success": True})

    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects", methods=["GET"])
def list_projects():
    """List all projects with pagination

    Query Parameters:
        - page (int): Page number (default: 1)
        - limit (int): Items per page (default: 20)
        - search (str): Search query (optional)

    Returns:
        Paginated list of projects
    """
    log_request("/api/bim/projects", "GET", dict(request.args))

    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        search = request.args.get("search", "").lower()

        # Filter projects
        projects = list(projects_db.values())

        if search:
            projects = [
                p
                for p in projects
                if search in p["name"].lower()
                or search in p.get("description", "").lower()
            ]

        # Paginate
        total = len(projects)
        start = (page - 1) * limit
        end = start + limit
        paginated = projects[start:end]

        return create_response(
            data={
                "projects": paginated,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit,
            }
        )

    except Exception as e:
        logger.error(f"Error listing projects: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# OBJECT ROUTES
# ============================================================================


@bim_bp.route("/objects", methods=["POST"])
def create_object():
    """Create new object in project

    Request Body:
        - project_id (str): Project identifier
        - type (str): Object type (wall, floor, ceiling, panel, etc.)
        - name (str): Object name
        - geometry (dict): Geometric data
        - properties (dict, optional): Custom properties
        - layer_id (str, optional): Layer assignment
        - material_id (str, optional): Material assignment

    Returns:
        Created object with id
    """
    log_request("/api/bim/objects", "POST", request.json)

    try:
        data = request.get_json()

        if not data or "project_id" not in data:
            return create_response(error="Project ID is required", status_code=400)

        if data["project_id"] not in projects_db:
            return create_response(error="Project not found", status_code=404)

        if "type" not in data or "name" not in data:
            return create_response(
                error="Object type and name are required", status_code=400
            )

        object_id = generate_id()
        timestamp = get_timestamp()

        obj = {
            "id": object_id,
            "project_id": data["project_id"],
            "type": data["type"],
            "name": data["name"],
            "geometry": data.get("geometry", {}),
            "properties": data.get("properties", {}),
            "layer_id": data.get("layer_id"),
            "material_id": data.get("material_id"),
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[object_id] = obj

        # Update project's objects list
        projects_db[data["project_id"]].setdefault("objects", []).append(object_id)

        logger.info(f"Object created: {object_id} in project {data['project_id']}")
        return create_response(data=obj, status_code=201)

    except Exception as e:
        logger.error(f"Error creating object: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/objects/<object_id>", methods=["GET"])
def get_object(object_id):
    """Get object by ID

    Path Parameters:
        - object_id (str): Object identifier

    Returns:
        Full object data
    """
    log_request(f"/api/bim/objects/{object_id}", "GET")

    try:
        if object_id not in objects_db:
            return create_response(error="Object not found", status_code=404)

        return create_response(data=objects_db[object_id])

    except Exception as e:
        logger.error(f"Error getting object: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/objects/<object_id>", methods=["PUT"])
def update_object(object_id):
    """Update object

    Path Parameters:
        - object_id (str): Object identifier

    Request Body:
        - name (str, optional): Object name
        - geometry (dict, optional): Geometric data
        - properties (dict, optional): Custom properties
        - layer_id (str, optional): Layer assignment
        - material_id (str, optional): Material assignment

    Returns:
        Updated object
    """
    log_request(f"/api/bim/objects/{object_id}", "PUT", request.json)

    try:
        if object_id not in objects_db:
            return create_response(error="Object not found", status_code=404)

        data = request.get_json()
        obj = objects_db[object_id]

        # Update allowed fields
        allowed_fields = ["name", "geometry", "properties", "layer_id", "material_id"]
        for field in allowed_fields:
            if field in data:
                obj[field] = data[field]

        obj["updated_at"] = get_timestamp()

        logger.info(f"Object updated: {object_id}")
        return create_response(data=obj)

    except Exception as e:
        logger.error(f"Error updating object: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/objects/<object_id>", methods=["DELETE"])
def delete_object(object_id):
    """Delete object

    Path Parameters:
        - object_id (str): Object identifier

    Returns:
        Success confirmation
    """
    log_request(f"/api/bim/objects/{object_id}", "DELETE")

    try:
        if object_id not in objects_db:
            return create_response(error="Object not found", status_code=404)

        obj = objects_db[object_id]
        project_id = obj.get("project_id")

        # Remove from project's objects list
        if project_id and project_id in projects_db:
            project = projects_db[project_id]
            if "objects" in project and object_id in project["objects"]:
                project["objects"].remove(object_id)

        del objects_db[object_id]

        logger.info(f"Object deleted: {object_id}")
        return create_response(data={"success": True})

    except Exception as e:
        logger.error(f"Error deleting object: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects/<project_id>/objects", methods=["GET"])
def get_project_objects(project_id):
    """Get all objects in project

    Path Parameters:
        - project_id (str): Project identifier

    Returns:
        List of objects
    """
    log_request(f"/api/bim/projects/{project_id}/objects", "GET")

    try:
        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        objects = [
            objects_db[obj_id]
            for obj_id in objects_db
            if objects_db[obj_id].get("project_id") == project_id
        ]

        return create_response(data={"objects": objects})

    except Exception as e:
        logger.error(f"Error getting project objects: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# LAYER ROUTES
# ============================================================================


@bim_bp.route("/layers", methods=["POST"])
def create_layer():
    """Create layer

    Request Body:
        - project_id (str): Project identifier
        - name (str): Layer name
        - color (str, optional): Layer color (hex)
        - visible (bool, optional): Layer visibility (default: true)
        - locked (bool, optional): Layer lock state (default: false)

    Returns:
        Created layer
    """
    log_request("/api/bim/layers", "POST", request.json)

    try:
        data = request.get_json()

        if not data or "project_id" not in data:
            return create_response(error="Project ID is required", status_code=400)

        if data["project_id"] not in projects_db:
            return create_response(error="Project not found", status_code=404)

        if "name" not in data:
            return create_response(error="Layer name is required", status_code=400)

        layer_id = generate_id()
        timestamp = get_timestamp()

        layer = {
            "id": layer_id,
            "project_id": data["project_id"],
            "name": data["name"],
            "color": data.get("color", "#000000"),
            "visible": data.get("visible", True),
            "locked": data.get("locked", False),
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        layers_db[layer_id] = layer

        # Update project's layers list
        projects_db[data["project_id"]].setdefault("layers", []).append(layer_id)

        logger.info(f"Layer created: {layer_id} in project {data['project_id']}")
        return create_response(data=layer, status_code=201)

    except Exception as e:
        logger.error(f"Error creating layer: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/projects/<project_id>/layers", methods=["GET"])
def get_project_layers(project_id):
    """Get project layers

    Path Parameters:
        - project_id (str): Project identifier

    Returns:
        List of layers
    """
    log_request(f"/api/bim/projects/{project_id}/layers", "GET")

    try:
        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        layers = [
            layers_db[layer_id]
            for layer_id in layers_db
            if layers_db[layer_id].get("project_id") == project_id
        ]

        return create_response(data={"layers": layers})

    except Exception as e:
        logger.error(f"Error getting project layers: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/layers/<layer_id>", methods=["PUT"])
def update_layer(layer_id):
    """Update layer

    Path Parameters:
        - layer_id (str): Layer identifier

    Request Body:
        - name (str, optional): Layer name
        - color (str, optional): Layer color
        - visible (bool, optional): Layer visibility
        - locked (bool, optional): Layer lock state

    Returns:
        Updated layer
    """
    log_request(f"/api/bim/layers/{layer_id}", "PUT", request.json)

    try:
        if layer_id not in layers_db:
            return create_response(error="Layer not found", status_code=404)

        data = request.get_json()
        layer = layers_db[layer_id]

        # Update allowed fields
        allowed_fields = ["name", "color", "visible", "locked"]
        for field in allowed_fields:
            if field in data:
                layer[field] = data[field]

        layer["updated_at"] = get_timestamp()

        logger.info(f"Layer updated: {layer_id}")
        return create_response(data=layer)

    except Exception as e:
        logger.error(f"Error updating layer: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/layers/<layer_id>", methods=["DELETE"])
def delete_layer(layer_id):
    """Delete layer

    Path Parameters:
        - layer_id (str): Layer identifier

    Returns:
        Success confirmation
    """
    log_request(f"/api/bim/layers/{layer_id}", "DELETE")

    try:
        if layer_id not in layers_db:
            return create_response(error="Layer not found", status_code=404)

        layer = layers_db[layer_id]
        project_id = layer.get("project_id")

        # Remove from project's layers list
        if project_id and project_id in projects_db:
            project = projects_db[project_id]
            if "layers" in project and layer_id in project["layers"]:
                project["layers"].remove(layer_id)

        del layers_db[layer_id]

        logger.info(f"Layer deleted: {layer_id}")
        return create_response(data={"success": True})

    except Exception as e:
        logger.error(f"Error deleting layer: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# MATERIAL ROUTES
# ============================================================================


@bim_bp.route("/materials", methods=["GET"])
def get_materials():
    """List available materials

    Returns:
        List of materials
    """
    log_request("/api/bim/materials", "GET")

    try:
        materials = list(materials_db.values())
        return create_response(data={"materials": materials})

    except Exception as e:
        logger.error(f"Error getting materials: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/materials", methods=["POST"])
def create_material():
    """Create custom material

    Request Body:
        - name (str): Material name
        - color (str): Material color (hex)
        - density (float, optional): Material density
        - cost_per_unit (float, optional): Cost per unit
        - properties (dict, optional): Additional properties

    Returns:
        Created material
    """
    log_request("/api/bim/materials", "POST", request.json)

    try:
        data = request.get_json()

        if not data or "name" not in data:
            return create_response(error="Material name is required", status_code=400)

        material_id = generate_id()
        timestamp = get_timestamp()

        material = {
            "id": material_id,
            "name": data["name"],
            "color": data.get("color", "#808080"),
            "density": data.get("density"),
            "cost_per_unit": data.get("cost_per_unit"),
            "properties": data.get("properties", {}),
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        materials_db[material_id] = material

        logger.info(f"Material created: {material_id}")
        return create_response(data=material, status_code=201)

    except Exception as e:
        logger.error(f"Error creating material: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/materials/<material_id>", methods=["GET"])
def get_material(material_id):
    """Get material by ID

    Path Parameters:
        - material_id (str): Material identifier

    Returns:
        Material data
    """
    log_request(f"/api/bim/materials/{material_id}", "GET")

    try:
        if material_id not in materials_db:
            return create_response(error="Material not found", status_code=404)

        return create_response(data=materials_db[material_id])

    except Exception as e:
        logger.error(f"Error getting material: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/materials/<material_id>", methods=["PUT"])
def update_material(material_id):
    """Update material

    Path Parameters:
    - material_id (str): Material identifier

    Request Body:
    - name (str, optional): Material name
    - color (str, optional): Material color
    - density (float, optional): Material density
    - cost_per_unit (float, optional): Cost per unit
    - properties (dict, optional): Additional properties

    Returns:
    Updated material
    """
    log_request(f"/api/bim/materials/{material_id}", "PUT", request.json)

    try:
        if material_id not in materials_db:
            return create_response(error="Material not found", status_code=404)

        data = request.get_json()
        material = materials_db[material_id]

        allowed_fields = ["name", "color", "density", "cost_per_unit", "properties"]
        for field in allowed_fields:
            if field in data:
                material[field] = data[field]

        material["updated_at"] = get_timestamp()

        logger.info(f"Material updated: {material_id}")
        return create_response(data=material)

    except Exception as e:
        logger.error(f"Error updating material: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/materials/<material_id>", methods=["DELETE"])
def delete_material(material_id):
    """Delete material

    Path Parameters:
    - material_id (str): Material identifier

    Returns:
    Success confirmation
    """
    log_request(f"/api/bim/materials/{material_id}", "DELETE")

    try:
        if material_id not in materials_db:
            return create_response(error="Material not found", status_code=404)

        del materials_db[material_id]

        logger.info(f"Material deleted: {material_id}")
        return create_response(data={"success": True})

    except Exception as e:
        logger.error(f"Error deleting material: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# EXPORT ROUTES
# ============================================================================


@bim_bp.route("/export/ifc", methods=["POST"])
def export_ifc():
    """Export project to IFC

    Request Body:
        - project_id (str): Project identifier

    Returns:
        File download or URL
    """
    log_request("/api/bim/export/ifc", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id")

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        logger.info(f"Exporting project {project_id} to IFC")

        # Return mock response (in production, generate actual IFC file)
        return create_response(
            data={
                "export_id": generate_id(),
                "format": "IFC",
                "project_id": project_id,
                "download_url": f"/api/bim/download/{generate_id()}",
                "message": "IFC export generated successfully",
            }
        )

    except Exception as e:
        logger.error(f"Error exporting to IFC: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/export/dxf", methods=["POST"])
def export_dxf():
    """Export project to DXF

    Request Body:
        - project_id (str): Project identifier

    Returns:
        File download or URL
    """
    log_request("/api/bim/export/dxf", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id")

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        logger.info(f"Exporting project {project_id} to DXF")

        return create_response(
            data={
                "export_id": generate_id(),
                "format": "DXF",
                "project_id": project_id,
                "download_url": f"/api/bim/download/{generate_id()}",
                "message": "DXF export generated successfully",
            }
        )

    except Exception as e:
        logger.error(f"Error exporting to DXF: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/export/svg", methods=["POST"])
def export_svg():
    """Export project to SVG blueprint

    Request Body:
        - project_id (str): Project identifier

    Returns:
        File download or URL
    """
    log_request("/api/bim/export/svg", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id")

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        logger.info(f"Exporting project {project_id} to SVG")

        return create_response(
            data={
                "export_id": generate_id(),
                "format": "SVG",
                "project_id": project_id,
                "download_url": f"/api/bim/download/{generate_id()}",
                "message": "SVG export generated successfully",
            }
        )

    except Exception as e:
        logger.error(f"Error exporting to SVG: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/export/json", methods=["POST"])
def export_json():
    """Export project to JSON

    Request Body:
        - project_id (str): Project identifier

    Returns:
        JSON project data
    """
    log_request("/api/bim/export/json", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id")

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        project = projects_db[project_id]

        # Get full project data
        full_project = project.copy()
        full_project["objects"] = [
            objects_db[obj_id]
            for obj_id in objects_db
            if objects_db[obj_id].get("project_id") == project_id
        ]
        full_project["layers"] = [
            layers_db[layer_id]
            for layer_id in layers_db
            if layers_db[layer_id].get("project_id") == project_id
        ]

        logger.info(f"Exporting project {project_id} to JSON")

        return create_response(data=full_project)

    except Exception as e:
        logger.error(f"Error exporting to JSON: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# IMPORT ROUTES
# ============================================================================


@bim_bp.route("/import/ifc", methods=["POST"])
def import_ifc():
    """Import IFC file

    Request Body (multipart/form-data):
        - file: IFC file to import
        - project_id (str, optional): Project to import into

    Returns:
        Imported project or objects
    """
    log_request("/api/bim/import/ifc", "POST")

    try:
        if "file" not in request.files:
            return create_response(error="No file provided", status_code=400)

        file = request.files["file"]
        project_id = request.form.get("project_id")

        logger.info(f"Importing IFC file: {file.filename} into project {project_id}")

        # In production, parse IFC file and create objects
        # For now, return mock response

        if project_id and project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        import_result = {
            "import_id": generate_id(),
            "format": "IFC",
            "filename": file.filename,
            "project_id": project_id or generate_id(),
            "objects_imported": 0,
            "message": "IFC import completed successfully",
        }

        return create_response(data=import_result)

    except Exception as e:
        logger.error(f"Error importing IFC: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/import/dxf", methods=["POST"])
def import_dxf():
    """Import DXF file

    Request Body (multipart/form-data):
        - file: DXF file to import
        - project_id (str, optional): Project to import into

    Returns:
        Imported project or objects
    """
    log_request("/api/bim/import/dxf", "POST")

    try:
        if "file" not in request.files:
            return create_response(error="No file provided", status_code=400)

        file = request.files["file"]
        project_id = request.form.get("project_id")

        logger.info(f"Importing DXF file: {file.filename} into project {project_id}")

        if project_id and project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        import_result = {
            "import_id": generate_id(),
            "format": "DXF",
            "filename": file.filename,
            "project_id": project_id or generate_id(),
            "objects_imported": 0,
            "message": "DXF import completed successfully",
        }

        return create_response(data=import_result)

    except Exception as e:
        logger.error(f"Error importing DXF: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# SCHEDULE ROUTES
# ============================================================================


@bim_bp.route("/schedules/export/excel", methods=["POST"])
def export_schedule_excel():
    """Export schedule to Excel format

    Request Body:
        - project_id (str): Project identifier
        - schedule_id (str, optional): Specific schedule to export
        - options (dict, optional): Export options (include_metadata, include_geometry)

    Returns:
        Excel file download or URL
    """
    log_request("/api/bim/schedules/export/excel", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id") if data else None

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        logger.info(f"Exporting schedule to Excel for project {project_id}")

        return create_response(
            data={
                "export_id": generate_id(),
                "format": "Excel",
                "project_id": project_id,
                "download_url": f"/api/bim/download/{generate_id()}",
                "message": "Excel export generated successfully",
            }
        )

    except Exception as e:
        logger.error(f"Error exporting schedule to Excel: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/schedules/report", methods=["POST"])
def generate_schedule_report():
    """Generate schedule report

    Request Body:
        - project_id (str): Project identifier
        - schedule_id (str, optional): Specific schedule for report
        - report_type (str): Type of report (summary, detailed, summary)
        - date_range (dict, optional): {start_date, end_date} filter

    Returns:
        Report data with statistics and details
    """
    log_request("/api/bim/schedules/report", "POST", request.json)

    try:
        data = request.get_json()
        project_id = data.get("project_id") if data else None

        if not project_id or project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        logger.info(f"Generating schedule report for project {project_id}")

        return create_response(
            data={
                "report_id": generate_id(),
                "project_id": project_id,
                "generated_at": get_timestamp(),
                "report_type": data.get("report_type", "summary")
                if data
                else "summary",
                "summary": {
                    "total_schedules": 0,
                    "total_items": 0,
                    "completed_items": 0,
                    "pending_items": 0,
                    "overdue_items": 0,
                },
                "message": "Schedule report generated successfully",
            }
        )

    except Exception as e:
        logger.error(f"Error generating schedule report: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/schedules/generate", methods=["POST"])
def generate_schedule():
    """Generate new schedule from project data

    Request Body:
        - project_id (str): Project identifier
        - schedule_type (str): Type of schedule (ceiling, materials, objects)
        - name (str): Schedule name
        - options (dict, optional): Generation options

    Returns:
        Created schedule with items
    """
    log_request("/api/bim/schedules/generate", "POST", request.json)

    try:
        data = request.get_json()

        if not data or "project_id" not in data:
            return create_response(error="Project ID is required", status_code=400)

        project_id = data["project_id"]

        if project_id not in projects_db:
            return create_response(error="Project not found", status_code=404)

        if "name" not in data:
            return create_response(error="Schedule name is required", status_code=400)

        schedule_id = generate_id()
        timestamp = get_timestamp()

        schedule = {
            "id": schedule_id,
            "project_id": project_id,
            "name": data["name"],
            "type": data.get("schedule_type", "general"),
            "items": [],
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        logger.info(f"Schedule generated: {schedule_id} for project {project_id}")

        return create_response(data=schedule, status_code=201)

    except Exception as e:
        logger.error(f"Error generating schedule: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# TOOL ROUTES
# ============================================================================


@bim_bp.route("/tools/arc", methods=["POST"])
def create_arc():
    """Create new arc

    Request Body:
        - start ([x, y, z]): Start point coordinates
        - end ([x, y, z]): End point coordinates
        - bulge (float): Bulge factor (arc curvature)

    Returns:
        Created arc with id
    """
    log_request("/api/bim/tools/arc", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "start" not in data:
            return create_response(error="Start point is required", status_code=400)

        if "end" not in data:
            return create_response(error="End point is required", status_code=400)

        if "bulge" not in data:
            return create_response(error="Bulge factor is required", status_code=400)

        arc_id = generate_id()
        timestamp = get_timestamp()

        arc = {
            "id": arc_id,
            "type": "arc",
            "start": data["start"],
            "end": data["end"],
            "bulge": data["bulge"],
            "center": None,
            "radius": None,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[arc_id] = arc

        logger.info(f"Arc created: {arc_id}")
        return create_response(data=arc, status_code=201)

    except Exception as e:
        logger.error(f"Error creating arc: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/tools/rectangle", methods=["POST"])
def create_rectangle():
    """Create new rectangle

    Request Body:
        - corner ([x, y, z]): Corner point coordinates
        - opposite_corner ([x, y, z]): Opposite corner point coordinates

    Returns:
        Created rectangle with id, width, height
    """
    log_request("/api/bim/tools/rectangle", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "corner" not in data:
            return create_response(error="Corner point is required", status_code=400)

        if "opposite_corner" not in data:
            return create_response(
                error="Opposite corner point is required", status_code=400
            )

        corner = data["corner"]
        opposite_corner = data["opposite_corner"]

        width = abs(opposite_corner[0] - corner[0])
        height = abs(opposite_corner[1] - corner[1])

        rectangle_id = generate_id()
        timestamp = get_timestamp()

        rectangle = {
            "id": rectangle_id,
            "type": "rectangle",
            "corner": corner,
            "opposite_corner": opposite_corner,
            "width": width,
            "height": height,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        logger.info(f"Rectangle created: {rectangle_id}")
        return create_response(data=rectangle, status_code=201)

    except Exception as e:
        logger.error(f"Error creating rectangle: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/tools/ellipse", methods=["POST"])
def create_ellipse():
    """Create new ellipse

    Request Body:
        - center ([x, y, z]): Center point coordinates
        - radiusX (float): X-axis radius in mm
        - radiusY (float): Y-axis radius in mm
        - rotation (float, optional): Rotation angle in radians

    Returns:
        Created ellipse with id, center, radii, rotation
    """
    log_request("/api/bim/tools/ellipse", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "center" not in data:
            return create_response(error="Center point is required", status_code=400)

        if "radiusX" not in data:
            return create_response(error="X-axis radius is required", status_code=400)

        if "radiusY" not in data:
            return create_response(error="Y-axis radius is required", status_code=400)

        center = data["center"]
        radiusX = data["radiusX"]
        radiusY = data["radiusY"]
        rotation = data.get("rotation", 0)

        ellipse_id = generate_id()
        timestamp = get_timestamp()

        ellipse = {
            "id": ellipse_id,
            "type": "ellipse",
            "center": center,
            "radiusX": radiusX,
            "radiusY": radiusY,
            "rotation": rotation,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[ellipse_id] = ellipse

        logger.info(f"Ellipse created: {ellipse_id}")
        return create_response(data=ellipse, status_code=201)

    except Exception as e:
        logger.error(f"Error creating ellipse: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/tools/circle", methods=["POST"])
def create_circle():
    """Create new circle

    Request Body:
        - center ([x, y, z]): Center point coordinates
        - radius (float): Circle radius in mm

    Returns:
        Created circle with id, center, radius
    """
    log_request("/api/bim/tools/circle", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "center" not in data:
            return create_response(error="Center point is required", status_code=400)

        if "radius" not in data:
            return create_response(error="Circle radius is required", status_code=400)

        center = data["center"]
        radius = data["radius"]

        circle_id = generate_id()
        timestamp = get_timestamp()

        circle = {
            "id": circle_id,
            "type": "circle",
            "center": center,
            "radius": radius,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[circle_id] = circle

        logger.info(f"Circle created: {circle_id}")
        return create_response(data=circle, status_code=201)

    except Exception as e:
        logger.error(f"Error creating circle: {str(e)}")
        return create_response(error=str(e), status_code=500)


@bim_bp.route("/tools/door", methods=["POST"])
def create_door():
    """Create new door

    Request Body:
        - position ([x, y, z]): Door position coordinates
        - width (float): Door width in mm
        - height (float): Door height in mm
        - direction (str): Swing direction ("in" or "out")

    Returns:
        Created door with id, position, dimensions
    """
    log_request("/api/bim/tools/door", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "position" not in data:
            return create_response(error="Position is required", status_code=400)

        if "width" not in data:
            return create_response(error="Door width is required", status_code=400)

        if "height" not in data:
            return create_response(error="Door height is required", status_code=400)

        if "direction" not in data:
            return create_response(error="Door direction is required", status_code=400)

        position = data["position"]
        width = data["width"]
        height = data["height"]
        direction = data["direction"]

        if direction not in ["in", "out"]:
            return create_response(
                error="Direction must be 'in' or 'out'", status_code=400
            )

        door_id = generate_id()
        timestamp = get_timestamp()

        door = {
            "id": door_id,
            "type": "door",
            "position": position,
            "width": width,
            "height": height,
            "direction": direction,
            "frame_width": 50,
            "material": "wood",
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[door_id] = door

        logger.info(f"Door created: {door_id}")
        return create_response(data=door, status_code=201)

    except Exception as e:
        logger.error(f"Error creating door: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# V1 API ROUTES
# ============================================================================


@app.route("/api/v1/bim/tools/ellipse", methods=["POST"])
def create_ellipse_v1():
    """Create new ellipse (v1 API)

    Request Body:
        - center ([x, y, z]): Center point coordinates
        - rx (float): X radius in mm
        - ry (float): Y radius in mm
        - rotation (float): Rotation angle in degrees

    Returns:
        Created ellipse with id, center, rx, ry, rotation
    """
    log_request("/api/v1/bim/tools/ellipse", "POST", request.json)

    try:
        data = request.get_json()

        if not data:
            return create_response(error="No data provided", status_code=400)

        if "center" not in data:
            return create_response(error="Center point is required", status_code=400)

        if "rx" not in data:
            return create_response(error="X radius (rx) is required", status_code=400)

        if "ry" not in data:
            return create_response(error="Y radius (ry) is required", status_code=400)

        center = data["center"]
        rx = data["rx"]
        ry = data["ry"]
        rotation = data.get("rotation", 0)

        ellipse_id = generate_id()
        timestamp = get_timestamp()

        ellipse = {
            "id": ellipse_id,
            "type": "ellipse",
            "center": center,
            "rx": rx,
            "ry": ry,
            "rotation": rotation,
            "created_at": timestamp,
            "updated_at": timestamp,
        }

        objects_db[ellipse_id] = ellipse

        logger.info(f"Ellipse created: {ellipse_id}")
        return create_response(data=ellipse, status_code=201)

    except Exception as e:
        logger.error(f"Error creating ellipse: {str(e)}")
        return create_response(error=str(e), status_code=500)


# ============================================================================
# REGISTER BLUEPRINT
# ============================================================================

app.register_blueprint(bim_bp)


# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """API health check"""
    return jsonify(
        {
            "status": "healthy",
            "service": "BIM Workbench API",
            "version": "1.0.0",
            "timestamp": get_timestamp(),
        }
    )


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return create_response(error="Endpoint not found", status_code=404)


@app.errorhandler(500)
def internal_error(error):
    return create_response(error="Internal server error", status_code=500)


if __name__ == "__main__":
    logger.info("Starting BIM Workbench API server...")
    app.run(host="0.0.0.0", port=5000, debug=True)
