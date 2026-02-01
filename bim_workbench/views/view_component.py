"""
Interactive View Display Component

Canvas-based 2D rendering for architectural views with
pan, zoom, and export capabilities.

Author: BIM Workbench
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any, Callable
from enum import Enum
from abc import ABC, abstractmethod

import json


class ExportFormat(Enum):
    """Supported export formats."""

    SVG = "svg"
    DXF = "dxf"
    PNG = "png"
    PDF = "pdf"


class PaperSize(Enum):
    """Standard paper sizes."""

    A0 = (841, 1189)
    A1 = (594, 841)
    A2 = (420, 594)
    A3 = (297, 420)
    A4 = (210, 297)
    ARCH_D = (610, 914)
    ARCH_E = (914, 1219)
    LETTER = (215.9, 279.4)
    LEGAL = (215.9, 355.6)
    TABLOID = (279.4, 431.8)


@dataclass
class ViewState:
    """Current view state for display."""

    offset_x: float = 0.0
    offset_y: float = 0.0
    zoom: float = 1.0
    rotation: float = 0.0

    def transform_point(self, x: float, y: float) -> Tuple[float, float]:
        """Transform screen point to model coordinates."""
        return ((x - self.offset_x) / self.zoom, (y - self.offset_y) / self.zoom)

    def inverse_transform(self, x: float, y: float) -> Tuple[float, float]:
        """Transform model point to screen coordinates."""
        return (x * self.zoom + self.offset_x, y * self.zoom + self.offset_y)

    def zoom_to_point(self, zoom_factor: float, center_x: float, center_y: float):
        """Zoom centered on a point."""
        # Zoom toward mouse position
        before = self.transform_point(center_x, center_y)
        self.zoom *= zoom_factor
        self.zoom = max(0.1, min(10.0, self.zoom))  # Clamp zoom
        after = self.inverse_transform(before[0], before[1])
        self.offset_x += center_x - after[0]
        self.offset_y += center_y - after[1]

    def pan(self, dx: float, dy: float):
        """Pan the view."""
        self.offset_x -= dx
        self.offset_y -= dy


@dataclass
class ViewLayer:
    """A display layer in the view."""

    name: str
    visible: bool = True
    color: str = "#000000"
    line_width: float = 1.0
    line_type: str = "solid"  # solid, dashed, dotted
    opacity: float = 1.0


@dataclass
class RenderOptions:
    """Options for rendering views."""

    background_color: str = "#FFFFFF"
    anti_aliasing: bool = True
    show_grid: bool = True
    grid_spacing: float = 1.0
    show_dimensions: bool = True
    show_annotations: bool = True
    show_title_block: bool = True
    render_quality: str = "high"  # low, medium, high


class ViewRenderer(ABC):
    """Abstract base class for view renderers."""

    @abstractmethod
    def begin_drawing(self):
        """Begin drawing session."""
        pass

    @abstractmethod
    def end_drawing(self):
        """End drawing session."""
        pass

    @abstractmethod
    def clear(self, color: str):
        """Clear canvas with color."""
        pass

    @abstractmethod
    def draw_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: str = "#000000",
        width: float = 1.0,
        line_type: str = "solid",
    ):
        """Draw a line."""
        pass

    @abstractmethod
    def draw_polygon(
        self,
        points: List[Tuple[float, float]],
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        """Draw a filled polygon."""
        pass

    @abstractmethod
    def draw_text(
        self,
        text: str,
        x: float,
        y: float,
        font_size: float = 12.0,
        color: str = "#000000",
        font_family: str = "Arial",
    ):
        """Draw text."""
        pass

    @abstractmethod
    def draw_circle(
        self,
        cx: float,
        cy: float,
        radius: float,
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        """Draw a circle."""
        pass

    @abstractmethod
    def set_clip_rect(self, x: float, y: float, width: float, height: float):
        """Set clipping rectangle."""
        pass

    @abstractmethod
    def get_image_data(self, x: float, y: float, width: float, height: float) -> bytes:
        """Get image data for export."""
        pass


class SVGRenderer(ViewRenderer):
    """SVG-based renderer for vector output."""

    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
        self.elements = []
        self.current_style = {
            "stroke": "#000000",
            "stroke_width": 1,
            "fill": None,
            "line_type": "solid",
        }

    def begin_drawing(self):
        self.elements = []

    def end_drawing(self):
        pass

    def clear(self, color: str):
        self.elements.append(f'<rect width="100%" height="100%" fill="{color}"/>')

    def draw_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: str = "#000000",
        width: float = 1.0,
        line_type: str = "solid",
    ):
        dasharray = ""
        if line_type == "dashed":
            dasharray = 'stroke-dasharray="5,5"'
        elif line_type == "dotted":
            dasharray = 'stroke-dasharray="2,2"'

        self.elements.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}" stroke-width="{width}" {dasharray}/>'
        )

    def draw_polygon(
        self,
        points: List[Tuple[float, float]],
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        points_str = " ".join(f"{x},{y}" for x, y in points)
        fill_attr = f'fill="{fill_color}"' if fill_color else 'fill="none"'
        self.elements.append(
            f'<polygon points="{points_str}" {fill_attr} '
            f'stroke="{stroke_color}" stroke-width="{stroke_width}"/>'
        )

    def draw_text(
        self,
        text: str,
        x: float,
        y: float,
        font_size: float = 12.0,
        color: str = "#000000",
        font_family: str = "Arial",
    ):
        self.elements.append(
            f'<text x="{x}" y="{y}" font-family="{font_family}" '
            f'font-size="{font_size}" fill="{color}">{text}</text>'
        )

    def draw_circle(
        self,
        cx: float,
        cy: float,
        radius: float,
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        fill_attr = f'fill="{fill_color}"' if fill_color else 'fill="none"'
        self.elements.append(
            f'<circle cx="{cx}" cy="{cy}" r="{radius}" '
            f'{fill_attr} stroke="{stroke_color}" stroke-width="{stroke_width}"/>'
        )

    def set_clip_rect(self, x, y, width, height):
        self.elements.append(
            f'<clipPath id="clip"><rect x="{x}" y="{y}" '
            f'width="{width}" height="{height}"/></clipPath>'
        )

    def get_image_data(self, x, y, width, height) -> bytes:
        return b""

    def get_svg(self) -> str:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'width="{self.width}" height="{self.height}">\n'
            + "\n".join(self.elements)
            + f"\n</svg>"
        )


class CanvasRenderer(ViewRenderer):
    """HTML5 Canvas-based renderer for raster output."""

    def __init__(self, canvas_element):
        import tempfile

        self.canvas = canvas_element
        self.ctx = canvas_element.get_context("2d")
        self.width = canvas_element.width
        self.height = canvas_element.height
        self.temp_file = None

    def begin_drawing(self):
        pass

    def end_drawing(self):
        pass

    def clear(self, color: str):
        self.ctx.fillStyle = color
        self.ctx.fillRect(0, 0, self.width, self.height)

    def draw_line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: str = "#000000",
        width: float = 1.0,
        line_type: str = "solid",
    ):
        self.ctx.strokeStyle = color
        self.ctx.lineWidth = width

        if line_type == "dashed":
            self.ctx.setLineDash([5, 5])
        elif line_type == "dotted":
            self.ctx.setLineDash([2, 2])
        else:
            self.ctx.setLineDash([])

        self.ctx.beginPath()
        self.ctx.moveTo(x1, y1)
        self.ctx.lineTo(x2, y2)
        self.ctx.stroke()

    def draw_polygon(
        self,
        points: List[Tuple[float, float]],
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        self.ctx.beginPath()
        self.ctx.moveTo(points[0][0], points[0][1])
        for x, y in points[1:]:
            self.ctx.lineTo(x, y)
        self.ctx.closePath()

        if fill_color:
            self.ctx.fillStyle = fill_color
            self.ctx.fill()

        self.ctx.strokeStyle = stroke_color
        self.ctx.lineWidth = stroke_width
        self.ctx.stroke()

    def draw_text(
        self,
        text: str,
        x: float,
        y: float,
        font_size: float = 12.0,
        color: str = "#000000",
        font_family: str = "Arial",
    ):
        self.ctx.font = f"{font_size}px {font_family}"
        self.ctx.fillStyle = color
        self.ctx.fillText(text, x, y)

    def draw_circle(
        self,
        cx: float,
        cy: float,
        radius: float,
        fill_color: Optional[str] = None,
        stroke_color: str = "#000000",
        stroke_width: float = 1.0,
    ):
        self.ctx.beginPath()
        self.ctx.arc(cx, cy, radius, 0, 2 * 3.14159)

        if fill_color:
            self.ctx.fillStyle = fill_color
            self.ctx.fill()

        self.ctx.strokeStyle = stroke_color
        self.ctx.lineWidth = stroke_width
        self.ctx.stroke()

    def set_clip_rect(self, x, y, width, height):
        self.ctx.save()
        self.ctx.beginPath()
        self.ctx.rect(x, y, width, height)
        self.ctx.clip()

    def get_image_data(self, x, y, width, height) -> bytes:
        return self.ctx.get_image_data(x, y, width, height).tobytes()


class ViewComponent:
    """
    Interactive 2D view display component.

    Provides canvas-based rendering with pan, zoom, and export
    capabilities for architectural views.

    Attributes:
        view_state: Current pan/zoom state
        layers: Display layers
        renderer: Current renderer instance
    """

    def __init__(
        self, width: float = 800, height: float = 600, render_backend: str = "svg"
    ):
        """
        Initialize view component.

        Args:
            width: Canvas width in pixels
            height: Canvas height in pixels
            render_backend: Renderer backend (svg, canvas)
        """
        self.width = width
        self.height = height
        self.render_backend = render_backend

        self.view_state = ViewState()
        self.layers: Dict[str, ViewLayer] = self._init_default_layers()
        self.render_options = RenderOptions()

        self.renderer = self._create_renderer()

        # Event callbacks
        self.on_view_change: Optional[Callable[[ViewState], None]] = None
        self.on_export_complete: Optional[Callable[[str, bytes], None]] = None

        # Current view data
        self.current_view: Optional[Any] = None

    def _init_default_layers(self) -> Dict[str, ViewLayer]:
        """Initialize default display layers."""
        return {
            "walls": ViewLayer("Walls", True, "#000000", 2.0),
            "windows": ViewLayer("Windows", True, "#0000FF", 1.5),
            "doors": ViewLayer("Doors", True, "#00AA00", 1.5),
            "dimensions": ViewLayer("Dimensions", True, "#666666", 1.0),
            "annotations": ViewLayer("Annotations", True, "#FF0000", 1.0),
            "grid": ViewLayer("Grid", True, "#CCCCCC", 0.5),
            "title_block": ViewLayer("Title Block", True, "#000000", 1.0),
        }

    def _create_renderer(self) -> ViewRenderer:
        """Create renderer instance."""
        if self.render_backend == "svg":
            return SVGRenderer(self.width, self.height)
        else:
            # Canvas renderer requires canvas element
            return SVGRenderer(self.width, self.height)

    def set_view(self, view: Any):
        """
        Set the current view to display.

        Args:
            view: View result from generator (PlanViewResult, etc.)
        """
        self.current_view = view
        self._fit_to_view()

    def _fit_to_view(self):
        """Fit view to canvas bounds."""
        if self.current_view is None:
            return

        # Get view bounds
        projection = getattr(self.current_view, "projection", None)
        if projection:
            bounds = projection.bounding_box
            if bounds and bounds[2] > bounds[0]:
                view_width = bounds[2] - bounds[0]
                view_height = bounds[3] - bounds[1]

                # Calculate zoom to fit
                scale_x = self.width / view_width if view_width > 0 else 1
                scale_y = self.height / view_height if view_height > 0 else 1
                scale = min(scale_x, scale_y) * 0.9  # 90% fill

                # Center the view
                center_x = (bounds[0] + bounds[2]) / 2
                center_y = (bounds[1] + bounds[3]) / 2

                self.view_state.zoom = scale
                self.view_state.offset_x = self.width / 2 - center_x * scale
                self.view_state.offset_y = self.height / 2 - center_y * scale

    def pan(self, dx: float, dy: float):
        """Pan the view by delta amounts."""
        self.view_state.pan(dx, dy)
        self._notify_view_change()

    def zoom(self, factor: float, center_x: float, center_y: float):
        """Zoom centered on a point."""
        self.view_state.zoom_to_point(factor, center_x, center_y)
        self._notify_view_change()

    def zoom_in(
        self, center_x: Optional[float] = None, center_y: Optional[float] = None
    ):
        """Zoom in by factor."""
        cx = center_x if center_x is not None else self.width / 2
        cy = center_y if center_y is not None else self.height / 2
        self.zoom(1.25, cx, cy)

    def zoom_out(
        self, center_x: Optional[float] = None, center_y: Optional[float] = None
    ):
        """Zoom out by factor."""
        cx = center_x if center_x is not None else self.width / 2
        cy = center_y if center_y is not None else self.height / 2
        self.zoom(0.8, cx, cy)

    def zoom_fit(self):
        """Zoom to fit entire view."""
        self._fit_to_view()
        self._notify_view_change()

    def set_scale(self, scale: float):
        """
        Set view scale (e.g., 1:100, 1:50).

        Args:
            scale: Scale factor (1:scale)
        """
        # Convert architectural scale to zoom factor
        # This is a placeholder - actual implementation would
        # consider paper size and actual dimensions
        self.view_state.zoom = scale / 100.0
        self._notify_view_change()

    def set_layer_visibility(self, layer_name: str, visible: bool):
        """Toggle layer visibility."""
        if layer_name in self.layers:
            self.layers[layer_name].visible = visible

    def render(self):
        """Render the current view."""
        self.renderer.begin_drawing()
        self.renderer.clear(self.render_options.background_color)

        if self.current_view is None:
            self.renderer.draw_text(
                "No view loaded", self.width / 2 - 40, self.height / 2, font_size=16
            )
            self.renderer.end_drawing()
            return

        # Render each visible layer
        for layer_name, layer in self.layers.items():
            if not layer.visible:
                continue
            self._render_layer(layer_name, layer)

        # Render title block if enabled
        if self.render_options.show_title_block:
            self._render_title_block()

        self.renderer.end_drawing()

    def _render_layer(self, layer_name: str, layer: ViewLayer):
        """Render a specific layer."""
        # Placeholder - would render actual view data
        pass

    def _render_title_block(self):
        """Render title block."""
        # Placeholder - would render from template
        pass

    def _notify_view_change(self):
        """Notify view change callback."""
        if self.on_view_change:
            self.on_view_change(self.view_state)

    def export(
        self,
        format: ExportFormat,
        filename: str,
        paper_size: Optional[PaperSize] = None,
        scale: float = 100.0,
    ) -> bytes:
        """
        Export view to file.

        Args:
            format: Export format
            filename: Output filename
            paper_size: Paper size for export
            scale: Drawing scale

        Returns:
            Exported file bytes
        """
        # Render at appropriate size for export
        if paper_size:
            self._setup_export_size(paper_size, scale)

        self.render()

        if format == ExportFormat.SVG:
            return self._export_svg()
        elif format == ExportFormat.DXF:
            return self._export_dxf(filename)
        elif format == ExportFormat.PNG:
            return self._export_png()
        else:
            return b""

    def _setup_export_size(self, paper_size: PaperSize, scale: float):
        """Setup renderer for export at paper size."""
        width, height = paper_size.value
        # Convert mm to pixels at 96 DPI
        self.width = int(width * 3.78)
        self.height = int(height * 3.78)
        self.renderer = self._create_renderer()

    def _export_svg(self) -> bytes:
        """Export as SVG."""
        if isinstance(self.renderer, SVGRenderer):
            svg_content = self.renderer.get_svg()
            return svg_content.encode("utf-8")
        return b""

    def _export_dxf(self, filename: str) -> bytes:
        """Export as DXF."""
        # Placeholder - would generate proper DXF
        return b""

    def _export_png(self) -> bytes:
        """Export as PNG."""
        # Placeholder - would generate PNG from canvas
        return b""

    def print_view(self):
        """Print the current view."""
        # Placeholder - would open print dialog
        pass

    def get_scale_options(self) -> List[Tuple[str, float]]:
        """Get available scale options."""
        return [
            ("1:500", 500.0),
            ("1:200", 200.0),
            ("1:100", 100.0),
            ("1:50", 50.0),
            ("1:20", 20.0),
            ("1:10", 10.0),
            ("1:5", 5.0),
            ("1:1", 1.0),
        ]


# Export public classes
__all__ = [
    "ViewComponent",
    "ViewState",
    "ViewLayer",
    "ViewRenderer",
    "SVGRenderer",
    "CanvasRenderer",
    "RenderOptions",
    "ExportFormat",
    "PaperSize",
]
