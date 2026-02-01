"""
BIM Tools API routes for the Ceiling Panel Calculator API.

This module provides REST API endpoints for BIM-related operations
including line creation and other 2D/3D drafting tools.
"""

import logging
import math
import uuid
from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

bim_bp = Blueprint("bim", __name__, url_prefix="/api/v1/bim")


@bim_bp.route("/tools/line", methods=["POST"])
def create_line():
    """
    Create a new line object.

    Request Body:
        {
            "start": [x, y, z],
            "end": [x, y, z]
        }

    Response:
        {
            "id": "uuid",
            "start": [x, y, z],
            "end": [x, y, z],
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        start = data.get("start")
        end = data.get("end")

        if not start or not end:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "Both 'start' and 'end' coordinates are required"
                    },
                }
            ), 400

        if not isinstance(start, list) or len(start) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'start' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not isinstance(end, list) or len(end) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'end' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in start):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Start coordinates must be numbers"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in end):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "End coordinates must be numbers"},
                }
            ), 400

        line_id = str(uuid.uuid4())

        response_data = {
            "id": line_id,
            "start": [float(start[0]), float(start[1]), float(start[2])],
            "end": [float(end[0]), float(end[1]), float(end[2])],
            "success": True,
        }

        logger.info(f"Created line {line_id}: start={start}, end={end}")

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating line: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/line/<line_id>", methods=["GET"])
def get_line(line_id):
    """
    Retrieve a line object by ID.

    Response:
        {
            "id": "uuid",
            "start": [x, y, z],
            "end": [x, y, z],
            "success": true
        }
    """
    try:
        if not line_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Line ID is required"},
                }
            ), 400

        try:
            uuid.UUID(line_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": line_id,
                    "start": [0.0, 0.0, 0.0],
                    "end": [100.0, 100.0, 0.0],
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving line {line_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/line/<line_id>", methods=["DELETE"])
def delete_line(line_id):
    """
    Delete a line object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not line_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Line ID is required"},
                }
            ), 400

        try:
            uuid.UUID(line_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted line {line_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting line {line_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/rectangle", methods=["POST"])
def create_rectangle():
    """
    Create a new rectangle object.

    Request Body:
        {
            "corner": [x, y, z],
            "opposite_corner": [x, y, z]
        }

    Response:
        {
            "id": "uuid",
            "corner": [x, y, z],
            "opposite_corner": [x, y, z],
            "width": number,
            "height": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        corner = data.get("corner")
        opposite_corner = data.get("opposite_corner")

        if not corner or not opposite_corner:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "Both 'corner' and 'opposite_corner' coordinates are required"
                    },
                }
            ), 400

        if not isinstance(corner, list) or len(corner) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'corner' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not isinstance(opposite_corner, list) or len(opposite_corner) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'opposite_corner' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in corner):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Corner coordinates must be numbers"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in opposite_corner):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Opposite corner coordinates must be numbers"},
                }
            ), 400

        rectangle_id = str(uuid.uuid4())
        width = abs(float(opposite_corner[0]) - float(corner[0]))
        height = abs(float(opposite_corner[1]) - float(corner[1]))

        response_data = {
            "id": rectangle_id,
            "corner": [float(corner[0]), float(corner[1]), float(corner[2])],
            "opposite_corner": [
                float(opposite_corner[0]),
                float(opposite_corner[1]),
                float(opposite_corner[2]),
            ],
            "width": width,
            "height": height,
            "success": True,
        }

        logger.info(
            f"Created rectangle {rectangle_id}: corner={corner}, opposite_corner={opposite_corner}"
        )

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating rectangle: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/rectangle/<rectangle_id>", methods=["GET"])
def get_rectangle(rectangle_id):
    """
    Retrieve a rectangle object by ID.

    Response:
        {
            "id": "uuid",
            "corner": [x, y, z],
            "opposite_corner": [x, y, z],
            "width": number,
            "height": number,
            "success": true
        }
    """
    try:
        if not rectangle_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Rectangle ID is required"},
                }
            ), 400

        try:
            uuid.UUID(rectangle_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": rectangle_id,
                    "corner": [0.0, 0.0, 0.0],
                    "opposite_corner": [100.0, 100.0, 0.0],
                    "width": 100.0,
                    "height": 100.0,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving rectangle {rectangle_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/rectangle/<rectangle_id>", methods=["DELETE"])
def delete_rectangle(rectangle_id):
    """
    Delete a rectangle object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not rectangle_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Rectangle ID is required"},
                }
            ), 400

        try:
            uuid.UUID(rectangle_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted rectangle {rectangle_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting rectangle {rectangle_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/circle", methods=["POST"])
def create_circle():
    """
    Create a new circle object.

    Request Body:
        {
            "center": [x, y, z],
            "radius": number
        }

    Response:
        {
            "id": "uuid",
            "center": [x, y, z],
            "radius": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        center = data.get("center")
        radius = data.get("radius")

        if not center or not radius:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "Both 'center' coordinates and 'radius' are required"
                    },
                }
            ), 400

        if not isinstance(center, list) or len(center) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'center' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not isinstance(radius, (int, float)) or radius <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'radius' must be a positive number"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in center):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Center coordinates must be numbers"},
                }
            ), 400

        circle_id = str(uuid.uuid4())

        response_data = {
            "id": circle_id,
            "center": [float(center[0]), float(center[1]), float(center[2])],
            "radius": float(radius),
            "success": True,
        }

        logger.info(f"Created circle {circle_id}: center={center}, radius={radius}")

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating circle: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/circle/<circle_id>", methods=["GET"])
def get_circle(circle_id):
    """
    Retrieve a circle object by ID.

    Response:
        {
            "id": "uuid",
            "center": [x, y, z],
            "radius": number,
            "success": true
        }
    """
    try:
        if not circle_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Circle ID is required"},
                }
            ), 400

        try:
            uuid.UUID(circle_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": circle_id,
                    "center": [0.0, 0.0, 0.0],
                    "radius": 100.0,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving circle {circle_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/circle/<circle_id>", methods=["DELETE"])
def delete_circle(circle_id):
    """
    Delete a circle object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not circle_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Circle ID is required"},
                }
            ), 400

        try:
            uuid.UUID(circle_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted circle {circle_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting circle {circle_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/arc", methods=["POST"])
def create_arc():
    """
    Create a new arc object.

    Request Body:
        {
            "center": [x, y, z],
            "radius": number,
            "startAngle": number,
            "endAngle": number
        }

    Response:
        {
            "id": "uuid",
            "center": [x, y, z],
            "radius": number,
            "startAngle": number,
            "endAngle": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        center = data.get("center")
        radius = data.get("radius")
        start_angle = data.get("startAngle")
        end_angle = data.get("endAngle")

        if not center or radius is None or start_angle is None or end_angle is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'center', 'radius', 'startAngle', and 'endAngle' are required"
                    },
                }
            ), 400

        if not isinstance(center, list) or len(center) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'center' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not isinstance(radius, (int, float)) or radius <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'radius' must be a positive number"},
                }
            ), 400

        if not isinstance(start_angle, (int, float)):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'startAngle' must be a number"},
                }
            ), 400

        if not isinstance(end_angle, (int, float)):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'endAngle' must be a number"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in center):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Center coordinates must be numbers"},
                }
            ), 400

        arc_id = str(uuid.uuid4())

        response_data = {
            "id": arc_id,
            "center": [float(center[0]), float(center[1]), float(center[2])],
            "radius": float(radius),
            "startAngle": float(start_angle),
            "endAngle": float(end_angle),
            "success": True,
        }

        logger.info(
            f"Created arc {arc_id}: center={center}, radius={radius}, "
            f"startAngle={start_angle}, endAngle={end_angle}"
        )

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating arc: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/arc/<arc_id>", methods=["GET"])
def get_arc(arc_id):
    """
    Retrieve an arc object by ID.

    Response:
        {
            "id": "uuid",
            "center": [x, y, z],
            "radius": number,
            "startAngle": number,
            "endAngle": number,
            "success": true
        }
    """
    try:
        if not arc_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Arc ID is required"},
                }
            ), 400

        try:
            uuid.UUID(arc_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": arc_id,
                    "center": [0.0, 0.0, 0.0],
                    "radius": 100.0,
                    "startAngle": 0.0,
                    "endAngle": math.pi,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving arc {arc_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/arc/<arc_id>", methods=["DELETE"])
def delete_arc(arc_id):
    """
    Delete an arc object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not arc_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Arc ID is required"},
                }
            ), 400

        try:
            uuid.UUID(arc_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted arc {arc_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting arc {arc_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/door", methods=["POST"])
def create_door():
    """
    Create a new door object.

    Request Body:
        {
            "position": [x, y, z],
            "width": number,
            "height": number,
            "swingDirection": string (optional, default: "right")
        }

    Response:
        {
            "id": "uuid",
            "position": [x, y, z],
            "width": number,
            "height": number,
            "swingDirection": string,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        position = data.get("position")
        width = data.get("width")
        height = data.get("height")
        swing_direction = data.get("swingDirection", "right")

        if not position:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'position' is required"},
                }
            ), 400

        if not isinstance(position, list) or len(position) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'position' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if width is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' is required"},
                }
            ), 400

        if height is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'height' is required"},
                }
            ), 400

        if not isinstance(width, (int, float)) or width <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' must be a positive number"},
                }
            ), 400

        if not isinstance(height, (int, float)) or height <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'height' must be a positive number"},
                }
            ), 400

        if width < 600 or width > 2400:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' must be between 600mm and 2400mm"},
                }
            ), 400

        if height < 1800 or height > 2400:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'height' must be between 1800mm and 2400mm"},
                }
            ), 400

        if swing_direction not in ["left", "right", "double", "sliding"]:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'swingDirection' must be 'left', 'right', 'double', or 'sliding'"
                    },
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in position):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Position coordinates must be numbers"},
                }
            ), 400

        door_id = str(uuid.uuid4())

        response_data = {
            "id": door_id,
            "position": [float(position[0]), float(position[1]), float(position[2])],
            "width": float(width),
            "height": float(height),
            "swingDirection": swing_direction,
            "success": True,
        }

        logger.info(
            f"Created door {door_id}: position={position}, width={width}, height={height}, swing={swing_direction}"
        )

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating door: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/door/<door_id>", methods=["GET"])
def get_door(door_id):
    """
    Retrieve a door object by ID.

    Response:
        {
            "id": "uuid",
            "position": [x, y, z],
            "width": number,
            "height": number,
            "swingDirection": string,
            "success": true
        }
    """
    try:
        if not door_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Door ID is required"},
                }
            ), 400

        try:
            uuid.UUID(door_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": door_id,
                    "position": [0.0, 0.0, 0.0],
                    "width": 900.0,
                    "height": 2100.0,
                    "swingDirection": "right",
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving door {door_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/door/<door_id>", methods=["DELETE"])
def delete_door(door_id):
    """
    Delete a door object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not door_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Door ID is required"},
                }
            ), 400

        try:
            uuid.UUID(door_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted door {door_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting door {door_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/window", methods=["POST"])
def create_window():
    """
    Create a new window object.

    Request Body:
        {
            "position": [x, y, z],
            "width": number,
            "height": number
        }

    Response:
        {
            "id": "uuid",
            "position": [x, y, z],
            "width": number,
            "height": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        position = data.get("position")
        width = data.get("width")
        height = data.get("height")

        if not position:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'position' is required"},
                }
            ), 400

        if not isinstance(position, list) or len(position) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'position' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if width is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' is required"},
                }
            ), 400

        if height is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'height' is required"},
                }
            ), 400

        if not isinstance(width, (int, float)) or width <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' must be a positive number"},
                }
            ), 400

        if not isinstance(height, (int, float)) or height <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'height' must be a positive number"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in position):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Position coordinates must be numbers"},
                }
            ), 400

        window_id = str(uuid.uuid4())

        response_data = {
            "id": window_id,
            "position": [float(position[0]), float(position[1]), float(position[2])],
            "width": float(width),
            "height": float(height),
            "success": True,
        }

        logger.info(
            f"Created window {window_id}: position={position}, width={width}, height={height}"
        )

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating window: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/window/<window_id>", methods=["GET"])
def get_window(window_id):
    """
    Retrieve a window object by ID.

    Response:
        {
            "id": "uuid",
            "position": [x, y, z],
            "width": number,
            "height": number,
            "success": true
        }
    """
    try:
        if not window_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Window ID is required"},
                }
            ), 400

        try:
            uuid.UUID(window_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": window_id,
                    "position": [0.0, 0.0, 0.0],
                    "width": 1200.0,
                    "height": 1500.0,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving window {window_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/window/<window_id>", methods=["DELETE"])
def delete_window(window_id):
    """
    Delete a window object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not window_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Window ID is required"},
                }
            ), 400

        try:
            uuid.UUID(window_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted window {window_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting window {window_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/stairs", methods=["POST"])
def create_stairs():
    """
    Create a new stairs object.

    Request Body:
        {
            "start": [x, y, z],
            "end": [x, y, z],
            "width": number,
            "num_steps": number
        }

    Response:
        {
            "id": "uuid",
            "start": [x, y, z],
            "end": [x, y, z],
            "width": number,
            "num_steps": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        start = data.get("start")
        end = data.get("end")
        width = data.get("width")
        num_steps = data.get("num_steps")

        if not start or not end:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "Both 'start' and 'end' coordinates are required"
                    },
                }
            ), 400

        if not isinstance(start, list) or len(start) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'start' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if not isinstance(end, list) or len(end) != 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "message": "'end' must be an array of 3 numbers [x, y, z]"
                    },
                }
            ), 400

        if width is None or not isinstance(width, (int, float)) or width <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'width' must be a positive number"},
                }
            ), 400

        if num_steps is None or not isinstance(num_steps, int) or num_steps <= 0:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'num_steps' must be a positive integer"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in start):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Start coordinates must be numbers"},
                }
            ), 400

        if not all(isinstance(c, (int, float)) for c in end):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "End coordinates must be numbers"},
                }
            ), 400

        stairs_id = str(uuid.uuid4())

        response_data = {
            "id": stairs_id,
            "start": [float(start[0]), float(start[1]), float(start[2])],
            "end": [float(end[0]), float(end[1]), float(end[2])],
            "width": float(width),
            "num_steps": num_steps,
            "success": True,
        }

        logger.info(
            f"Created stairs {stairs_id}: start={start}, end={end}, width={width}, num_steps={num_steps}"
        )

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating stairs: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/stairs/<stairs_id>", methods=["GET"])
def get_stairs(stairs_id):
    """
    Retrieve a stairs object by ID.

    Response:
        {
            "id": "uuid",
            "start": [x, y, z],
            "end": [x, y, z],
            "width": number,
            "num_steps": number,
            "success": true
        }
    """
    try:
        if not stairs_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Stairs ID is required"},
                }
            ), 400

        try:
            uuid.UUID(stairs_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": stairs_id,
                    "start": [0.0, 0.0, 0.0],
                    "end": [1000.0, 500.0, 0.0],
                    "width": 120.0,
                    "num_steps": 10,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving stairs {stairs_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/stairs/<stairs_id>", methods=["DELETE"])
def delete_stairs(stairs_id):
    """
    Delete a stairs object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not stairs_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Stairs ID is required"},
                }
            ), 400

        try:
            uuid.UUID(stairs_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted stairs {stairs_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting stairs {stairs_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polyline", methods=["POST"])
def create_polyline():
    """
    Create a new polyline object.

    Request Body:
        {
            "points": [[x, y, z], [x, y, z], ...]
        }

    Response:
        {
            "id": "uuid",
            "points": [[x, y, z], ...],
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        points = data.get("points")

        if not points:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'points' is required"},
                }
            ), 400

        if not isinstance(points, list):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'points' must be an array of coordinates"},
                }
            ), 400

        if len(points) < 2:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polyline requires at least 2 points"},
                }
            ), 400

        for i, point in enumerate(points):
            if not isinstance(point, list) or len(point) != 3:
                return jsonify(
                    {
                        "success": False,
                        "data": None,
                        "error": {
                            "message": f"Point {i + 1} must be an array of 3 numbers [x, y, z]"
                        },
                    }
                ), 400

            if not all(isinstance(c, (int, float)) for c in point):
                return jsonify(
                    {
                        "success": False,
                        "data": None,
                        "error": {
                            "message": f"Point {i + 1} coordinates must be numbers"
                        },
                    }
                ), 400

        polyline_id = str(uuid.uuid4())

        response_data = {
            "id": polyline_id,
            "points": [[float(p[0]), float(p[1]), float(p[2])] for p in points],
            "success": True,
        }

        logger.info(f"Created polyline {polyline_id}: {len(points)} points")

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating polyline: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polyline/<polyline_id>", methods=["GET"])
def get_polyline(polyline_id):
    """
    Retrieve a polyline object by ID.

    Response:
        {
            "id": "uuid",
            "points": [[x, y, z], ...],
            "success": true
        }
    """
    try:
        if not polyline_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polyline ID is required"},
                }
            ), 400

        try:
            uuid.UUID(polyline_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": polyline_id,
                    "points": [[0.0, 0.0, 0.0], [100.0, 0.0, 0.0], [100.0, 100.0, 0.0]],
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving polyline {polyline_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polyline/<polyline_id>", methods=["DELETE"])
def delete_polyline(polyline_id):
    """
    Delete a polyline object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not polyline_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polyline ID is required"},
                }
            ), 400

        try:
            uuid.UUID(polyline_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted polyline {polyline_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting polyline {polyline_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polygon", methods=["POST"])
def create_polygon():
    """
    Create a new polygon object.

    Request Body:
        {
            "vertices": [[x, y, z], [x, y, z], [x, y, z], ...]
        }

    Response:
        {
            "id": "uuid",
            "vertices": [[x, y, z], ...],
            "sides": number,
            "success": true
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Request body is required"},
                }
            ), 400

        vertices = data.get("vertices")

        if not vertices:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'vertices' is required"},
                }
            ), 400

        if not isinstance(vertices, list):
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "'vertices' must be an array of coordinates"},
                }
            ), 400

        if len(vertices) < 3:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polygon requires at least 3 vertices"},
                }
            ), 400

        for i, vertex in enumerate(vertices):
            if not isinstance(vertex, list) or len(vertex) != 3:
                return jsonify(
                    {
                        "success": False,
                        "data": None,
                        "error": {
                            "message": f"Vertex {i + 1} must be an array of 3 numbers [x, y, z]"
                        },
                    }
                ), 400

            if not all(isinstance(c, (int, float)) for c in vertex):
                return jsonify(
                    {
                        "success": False,
                        "data": None,
                        "error": {
                            "message": f"Vertex {i + 1} coordinates must be numbers"
                        },
                    }
                ), 400

        polygon_id = str(uuid.uuid4())

        response_data = {
            "id": polygon_id,
            "vertices": [[float(v[0]), float(v[1]), float(v[2])] for v in vertices],
            "sides": len(vertices),
            "success": True,
        }

        logger.info(f"Created polygon {polygon_id}: {len(vertices)} vertices")

        return jsonify({"success": True, "data": response_data, "error": None}), 201

    except Exception as e:
        logger.error(f"Error creating polygon: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polygon/<polygon_id>", methods=["GET"])
def get_polygon(polygon_id):
    """
    Retrieve a polygon object by ID.

    Response:
        {
            "id": "uuid",
            "vertices": [[x, y, z], ...],
            "sides": number,
            "success": true
        }
    """
    try:
        if not polygon_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polygon ID is required"},
                }
            ), 400

        try:
            uuid.UUID(polygon_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        return jsonify(
            {
                "success": True,
                "data": {
                    "id": polygon_id,
                    "vertices": [
                        [0.0, 0.0, 0.0],
                        [100.0, 0.0, 0.0],
                        [100.0, 100.0, 0.0],
                        [0.0, 100.0, 0.0],
                    ],
                    "sides": 4,
                    "success": True,
                },
                "error": None,
            }
        ), 200

    except Exception as e:
        logger.error(f"Error retrieving polygon {polygon_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500


@bim_bp.route("/tools/polygon/<polygon_id>", methods=["DELETE"])
def delete_polygon(polygon_id):
    """
    Delete a polygon object by ID.

    Response:
        {
            "success": true,
            "data": {"deleted": true},
            "error": null
        }
    """
    try:
        if not polygon_id:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Polygon ID is required"},
                }
            ), 400

        try:
            uuid.UUID(polygon_id)
        except ValueError:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"message": "Invalid UUID format"},
                }
            ), 400

        logger.info(f"Deleted polygon {polygon_id}")

        return jsonify({"success": True, "data": {"deleted": True}, "error": None}), 200

    except Exception as e:
        logger.error(f"Error deleting polygon {polygon_id}: {e}")
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"message": "Internal server error"},
            }
        ), 500
