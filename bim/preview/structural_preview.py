"""Preview system for structural BIM objects.

Provides real-time visual feedback during structural object creation.
"""

from typing import Optional, Dict, Any, List, Tuple
import math


class StructuralPreview:
    """Preview renderer for structural objects during creation.

    Handles preview rendering for walls, beams, columns, and slabs
    during the drawing/creation process.
    """

    def __init__(self, renderer):
        """Initialize preview system.

        Args:
            renderer: 3D rendering context
        """
        self.renderer = renderer
        self.current_preview: Optional[Dict[str, Any]] = None
        self.preview_color = {
            "wall": (0.7, 0.85, 1.0, 0.5),  # Light blue
            "beam": (1.0, 0.65, 0.0, 0.6),  # Orange
            "column": (0.0, 0.8, 0.0, 0.4),  # Green
            "slab": (0.0, 0.9, 0.9, 0.3),  # Cyan
        }

    def update_preview(self, preview_data: Dict[str, Any]) -> None:
        """Update preview with new data.

        Args:
            preview_data: Preview data dictionary
        """
        self.current_preview = preview_data
        self._render_preview()

    def clear_preview(self) -> None:
        """Clear current preview."""
        self.current_preview = None
        if self.renderer:
            self.renderer.clear_preview()

    def _render_preview(self) -> None:
        """Render current preview."""
        if not self.current_preview or not self.renderer:
            return

        preview_type = self.current_preview.get("type", "")

        if preview_type == "wall_preview":
            self._render_wall_preview()
        elif preview_type == "beam_preview":
            self._render_beam_preview()
        elif preview_type == "column_preview":
            self._render_column_preview()
        elif preview_type == "slab_preview":
            self._render_slab_preview()

    def _render_wall_preview(self) -> None:
        """Render wall preview."""
        data = self.current_preview
        start = data.get("start_point", (0, 0, 0))
        end = data.get("end_point", (0, 0, 0))
        height = data.get("height", 2800)
        thickness = data.get("thickness", 200)
        color = data.get("color", "lightblue")

        # Calculate wall direction
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        length = math.sqrt(dx**2 + dy**2)

        if length == 0:
            return

        # Normalize direction
        ux, uy = dx / length, dy / length

        # Perpendicular for thickness
        tx = -uy * (thickness / 2)
        ty = ux * (thickness / 2)

        # Calculate wall corners
        base_z = start[2]
        top_z = base_z + height

        corners = [
            (start[0] + tx, start[1] + ty, base_z),  # Bottom-left
            (end[0] + tx, end[1] + ty, base_z),  # Bottom-right
            (end[0] - tx, end[1] - ty, base_z),  # Bottom-right-back
            (start[0] - tx, start[1] - ty, base_z),  # Bottom-left-back
            (start[0] + tx, start[1] + ty, top_z),  # Top-left
            (end[0] + tx, end[1] + ty, top_z),  # Top-right
            (end[0] - tx, end[1] - ty, top_z),  # Top-right-back
            (start[0] - tx, start[1] - ty, top_z),  # Top-left-back
        ]

        # Render wireframe box
        self.renderer.draw_wireframe_box(corners, color=self.preview_color["wall"])

        # Render base line
        self.renderer.draw_line(start, end, color=(0.5, 0.5, 0.5, 1.0), width=2)

        # Render dimension text
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        self.renderer.draw_text(
            f"L: {length:.0f}mm", (mid_x, mid_y, base_z), color=(0, 0, 0, 1.0), size=12
        )

    def _render_beam_preview(self) -> None:
        """Render beam preview."""
        data = self.current_preview
        start = data.get("start_point", (0, 0, 0))
        end = data.get("end_point", (0, 0, 0))
        profile_width = data.get("profile_width", 200)
        profile_height = data.get("profile_height", 400)
        color = data.get("color", "orange")

        # Calculate beam axis
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        dz = end[2] - start[2]
        length = math.sqrt(dx**2 + dy**2 + dz**2)

        if length == 0:
            return

        # Normalize axis
        ax, ay, az = dx / length, dy / length, dz / length

        # Find perpendicular vectors for profile
        # If beam is roughly horizontal, use Z as up
        if abs(az) < 0.9:
            up = (0, 0, 1)
        else:
            up = (1, 0, 0)

        # Calculate side vector (perpendicular to axis and up)
        side = (
            ay * up[2] - az * up[1],
            az * up[0] - ax * up[2],
            ax * up[1] - ay * up[0],
        )
        side_len = math.sqrt(sum(s**2 for s in side))
        if side_len > 0:
            side = tuple(s / side_len for s in side)

        # Recalculate up
        up = (
            side[1] * az - side[2] * ay,
            side[2] * ax - side[0] * az,
            side[0] * ay - side[1] * ax,
        )

        # Scale by profile dimensions
        w2 = profile_width / 2
        h2 = profile_height / 2

        # Calculate profile corners at start and end
        profile_start = []
        profile_end = []

        for sx, sy, sz in [side, (-side[0], -side[1], -side[2])]:
            for ux, uy, uz in [up, (-up[0], -up[1], -up[2])]:
                p_start = (
                    start[0] + sx * w2 + ux * h2,
                    start[1] + sy * w2 + uy * h2,
                    start[2] + sz * w2 + uz * h2,
                )
                p_end = (
                    end[0] + sx * w2 + ux * h2,
                    end[1] + sy * w2 + uy * h2,
                    end[2] + sz * w2 + uz * h2,
                )
                profile_start.append(p_start)
                profile_end.append(p_end)

        # Render profile outlines
        self.renderer.draw_polygon(
            profile_start, color=self.preview_color["beam"], fill=True
        )
        self.renderer.draw_polygon(
            profile_end, color=self.preview_color["beam"], fill=True
        )

        # Render beam center line
        self.renderer.draw_line(start, end, color=(0.8, 0.4, 0.0, 1.0), width=2)

        # Render dimension
        mid = (
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2,
            (start[2] + end[2]) / 2,
        )
        self.renderer.draw_text(
            f"L: {length:.0f}mm", mid, color=(0, 0, 0, 1.0), size=12
        )

    def _render_column_preview(self) -> None:
        """Render column preview."""
        data = self.current_preview
        position = data.get("position", (0, 0))
        height = data.get("height", 3000)
        profile_type = data.get("profile_type", "rectangle")
        width = data.get("width", 300)
        depth = data.get("depth", 300)
        base_elevation = data.get("base_elevation", 0)
        color = data.get("color", "green")

        x, y = position
        z_bottom = base_elevation
        z_top = z_bottom + height

        if profile_type == "rectangle":
            w2 = width / 2
            d2 = depth / 2

            # Base corners
            base_corners = [
                (x - w2, y - d2, z_bottom),
                (x + w2, y - d2, z_bottom),
                (x + w2, y + d2, z_bottom),
                (x - w2, y + d2, z_bottom),
            ]

            # Top corners
            top_corners = [
                (x - w2, y - d2, z_top),
                (x + w2, y - d2, z_top),
                (x + w2, y + d2, z_top),
                (x - w2, y + d2, z_top),
            ]

        else:  # circle
            radius = width / 2
            base_corners = []
            top_corners = []

            for i in range(8):
                angle = 2 * math.pi * i / 8
                px = x + radius * math.cos(angle)
                py = y + radius * math.sin(angle)
                base_corners.append((px, py, z_bottom))
                top_corners.append((px, py, z_top))

        # Render base outline
        self.renderer.draw_polygon(
            base_corners, color=self.preview_color["column"], fill=True
        )

        # Render top outline
        self.renderer.draw_polygon(
            top_corners, color=self.preview_color["column"], fill=True
        )

        # Render vertical edges
        for i in range(len(base_corners)):
            self.renderer.draw_line(
                base_corners[i], top_corners[i], color=(0.0, 0.6, 0.0, 0.8), width=1
            )

        # Render height dimension
        self.renderer.draw_text(
            f"H: {height:.0f}mm", (x, y, z_top + 200), color=(0, 0, 0, 1.0), size=12
        )

    def _render_slab_preview(self) -> None:
        """Render slab preview."""
        data = self.current_preview
        points = data.get("boundary_points", [])
        thickness = data.get("thickness", 200)
        elevation = data.get("elevation", 3000)
        area = data.get("area", 0)
        color = data.get("color", "cyan")

        if len(points) < 2:
            return

        # Top face points
        top_points = [(p[0], p[1], elevation) for p in points]

        # Bottom face points
        bottom_elevation = elevation - thickness
        bottom_points = [(p[0], p[1], bottom_elevation) for p in points]

        # Render top face
        self.renderer.draw_polygon(
            top_points, color=self.preview_color["slab"], fill=True
        )

        # Render boundary edges
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            # Top edge
            self.renderer.draw_line(
                top_points[i], top_points[j], color=(0.0, 0.7, 0.7, 0.8), width=2
            )
            # Vertical edge
            self.renderer.draw_line(
                top_points[i], bottom_points[i], color=(0.0, 0.5, 0.5, 0.5), width=1
            )

        # Render area text
        if area > 0 and len(points) >= 3:
            # Calculate centroid for text placement
            cx = sum(p[0] for p in points) / len(points)
            cy = sum(p[1] for p in points) / len(points)
            self.renderer.draw_text(
                f"A: {area / 1e6:.2f}m²",
                (cx, cy, elevation + 100),
                color=(0, 0, 0, 1.0),
                size=12,
            )

    def get_preview_info(self) -> Dict[str, Any]:
        """Get information about current preview.

        Returns:
            Dictionary with preview type and measurements
        """
        if not self.current_preview:
            return {"active": False}

        info = {
            "active": True,
            "type": self.current_preview.get("type", "unknown"),
        }

        if "length" in self.current_preview:
            info["length"] = self.current_preview["length"]
        if "area" in self.current_preview:
            info["area"] = self.current_preview["area"]
        if "height" in self.current_preview:
            info["height"] = self.current_preview["height"]

        return info
