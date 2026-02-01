"""
Title Block and View Composition Templates

Provides SVG templates for architectural drawing title blocks,
north arrows, and view composition utilities.

Author: BIM Workbench
Version: 0.1.0
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
from pathlib import Path

from .paper_sizes import (
    PaperSize,
    get_paper_size,
    get_margins,
    get_title_block_height,
)


@dataclass
class TitleBlockData:
    """Data for title block template."""

    project_name: str = "Untitled Project"
    drawing_number: str = "A-001"
    drawing_title: str = "Floor Plan"
    client_name: str = ""
    designer: str = ""
    checked_by: str = ""
    date: str = ""
    revision: str = "A"
    scale_text: str = "1:100"
    page: int = 1
    total_pages: int = 1
    company_name: str = ""

    # Computed values (set automatically)
    paper_size: str = "A1"
    orientation: str = "portrait"


class TitleBlockTemplate:
    """
    Title block SVG template generator.

    Creates properly formatted title blocks for architectural drawings
    with all required fields and standard layout.
    """

    def __init__(self, template_path: Optional[str] = None):
        """
        Initialize title block template.

        Args:
            template_path: Path to custom SVG template (optional)
        """
        if template_path:
            self.template = Path(template_path).read_text()
        else:
            self.template = self._get_default_template()

    def _get_default_template(self) -> str:
        """Get default title block SVG template."""
        return """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width_mm}" height="{height_mm}" viewBox="0 0 {width_mm} {height_mm}">
  <!-- Background -->
  <rect x="0" y="0" width="{width_mm}" height="{height_mm}" fill="white"/>
  
  <!-- Title Block Border -->
  <rect x="{margin_left}" y="{margin_bottom}" 
        width="{usable_width}" height="{title_block_height}" 
        fill="none" stroke="black" stroke-width="2"/>
  
  <!-- Title Block Title Bar -->
  <rect x="{margin_left}" y="{margin_bottom}" 
        width="200" height="{title_block_height}" 
        fill="#333333"/>
  <text x="{margin_left + 10}" y="{margin_bottom + 15}" 
        fill="white" font-family="Arial" font-size="10" font-weight="bold">
    PROJECT INFORMATION
  </text>
  
  <!-- Project Name -->
  <text x="{margin_left + 220}" y="{margin_bottom + 12}" 
        fill="black" font-family="Arial" font-size="8">PROJECT:</text>
  <text x="{margin_left + 265}" y="{margin_bottom + 12}" 
        fill="black" font-family="Arial" font-size="9" font-weight="bold">
    {project_name}
  </text>
  
  <!-- Drawing Number -->
  <text x="{margin_left + 220}" y="{margin_bottom + 24}" 
        fill="black" font-family="Arial" font-size="8">DRAWING NO.:</text>
  <text x="{margin_left + 280}" y="{margin_bottom + 24}" 
        fill="black" font-family="Arial" font-size="9">
    {drawing_number}
  </text>
  
  <!-- Client -->
  <text x="{margin_left + 220}" y="{margin_bottom + 36}" 
        fill="black" font-family="Arial" font-size="8">CLIENT:</text>
  <text x="{margin_left + 265}" y="{margin_bottom + 36}" 
        fill="black" font-family="Arial" font-size="9">
    {client_name}
  </text>
  
  <!-- Scale Bar -->
  <g transform="translate({margin_left + 400}, {margin_bottom + 10})">
    <text x="0" y="0" fill="black" font-family="Arial" font-size="7">SCALE:</text>
    <rect x="40" y="-6" width="80" height="10" fill="none" stroke="black" stroke-width="0.5"/>
    <line x1="40" y1="4" x2="40" y2="-6" stroke="black" stroke-width="0.5"/>
    <line x1="120" y1="-6" x2="120" y2="4" stroke="black" stroke-width="0.5"/>
    <text x="70" y="-8" fill="black" font-family="Arial" font-size="6">{scale_text}</text>
  </g>
  
  <!-- Date and Revision -->
  <g transform="translate({margin_left + 500}, {margin_bottom + 10})">
    <text x="0" y="0" fill="black" font-family="Arial" font-size="7">DATE:</text>
    <text x="30" y="0" fill="black" font-family="Arial" font-size="8">{date}</text>
    <text x="0" y="12" fill="black" font-family="Arial" font-size="7">REV:</text>
    <rect x="25" y="2" width="25" height="10" fill="none" stroke="black" stroke-width="0.5"/>
    <text x="30" y="10" fill="black" font-family="Arial" font-size="7">{revision}</text>
  </g>
  
  <!-- Drawing Title -->
  <text x="{margin_left + 10}" y="{margin_bottom + title_block_height_minus_12}" 
        fill="black" font-family="Arial" font-size="14" font-weight="bold">
    {drawing_title}
  </text>
  
  <!-- Designer/Author -->
  <text x="{margin_left + 10}" y="{margin_bottom + title_block_height_minus_28}" 
        fill="black" font-family="Arial" font-size="8">DESIGNED BY:</text>
  <text x="{margin_left + 65}" y="{margin_bottom + title_block_height_minus_28}" 
        fill="black" font-family="Arial" font-size="8">
    {designer}
  </text>
  
  <!-- Checked By -->
  <text x="{margin_left + 180}" y="{margin_bottom + title_block_height_minus_28}" 
        fill="black" font-family="Arial" font-size="8">CHECKED BY:</text>
  <text x="{margin_left + 235}" y="{margin_bottom + title_block_height_minus_28}" 
        fill="black" font-family="Arial" font-size="8">
    {checked_by}
  </text>
  
  <!-- Page Number -->
  <text x="{margin_left + usable_width_minus_40}" y="{margin_bottom + title_block_height_minus_12}" 
        fill="black" font-family="Arial" font-size="8">
    SHEET {page} OF {total_pages}
  </text>
</svg>"""

    def generate(
        self,
        data: TitleBlockData,
        paper_size: str = "A1",
        orientation: str = "portrait",
    ) -> str:
        """
        Generate title block SVG for given data.

        Args:
            data: Title block content data
            paper_size: Paper size name
            orientation: "portrait" or "landscape"

        Returns:
            SVG content as string
        """
        ps = get_paper_size(paper_size)
        width, height = ps.get_size(orientation)

        margins = get_margins(paper_size)
        margin_left, margin_right, margin_top, margin_bottom = margins

        title_height = get_title_block_height(paper_size)
        usable_width = width - margin_left - margin_right

        # Format date if not provided
        from datetime import date

        if not data.date:
            data.date = date.today().strftime("%Y-%m-%d")

        # Replace placeholders
        svg = self.template
        replacements = {
            "width_mm": width,
            "height_mm": height,
            "margin_left": margin_left,
            "margin_right": margin_right,
            "margin_top": margin_top,
            "margin_bottom": margin_bottom,
            "title_block_height": title_height,
            "title_block_height_minus_12": title_height - 12,
            "title_block_height_minus_28": title_height - 28,
            "usable_width": usable_width,
            "usable_width_minus_40": usable_width - 40,
            "project_name": data.project_name,
            "drawing_number": data.drawing_number,
            "drawing_title": data.drawing_title,
            "client_name": data.client_name or "",
            "designer": data.designer or "",
            "checked_by": data.checked_by or "",
            "date": data.date,
            "revision": data.revision,
            "scale_text": data.scale_text,
            "page": str(data.page),
            "total_pages": str(data.total_pages),
        }

        for key, value in replacements.items():
            svg = svg.replace(f"{{{key}}}", str(value))

        return svg

    def save(
        self,
        data: TitleBlockData,
        paper_size: str = "A1",
        orientation: str = "portrait",
        filepath: str = "title_block.svg",
    ):
        """
        Generate and save title block SVG.

        Args:
            data: Title block content data
            paper_size: Paper size name
            orientation: "portrait" or "landscape"
            filepath: Output file path
        """
        svg = self.generate(data, paper_size, orientation)
        Path(filepath).write_text(svg)
        return svg


class ViewComposer:
    """
    Composes view content with title block and annotations.

    Combines projected view geometry with title blocks, north arrows,
    scale bars, and other standard architectural drawing elements.
    """

    def __init__(self):
        """Initialize view composer."""
        self.title_block = TitleBlockTemplate()
        self.north_arrow_path = self._get_north_arrow_path()

    def _get_north_arrow_path(self) -> str:
        """Get path to north arrow SVG."""
        return str(Path(__file__).parent / "north_arrow.svg")

    def compose_view(
        self,
        view_svg: str,
        data: TitleBlockData,
        paper_size: str = "A1",
        orientation: str = "portrait",
        north_arrow_position: str = "lower_right",
        include_north_arrow: bool = True,
        scale_bar: bool = True,
    ) -> str:
        """
        Compose complete drawing with view, title block, and annotations.

        Args:
            view_svg: SVG content of the view
            data: Title block data
            paper_size: Paper size
            orientation: Page orientation
            north_arrow_position: Position of north arrow
            include_north_arrow: Whether to include north arrow
            scale_bar: Whether to include scale bar

        Returns:
            Complete composed SVG
        """
        # Get paper dimensions
        ps = get_paper_size(paper_size)
        width, height = ps.get_size(orientation)

        # Generate title block
        title_block_svg = self.title_block.generate(data, paper_size, orientation)

        # Parse view and title block SVGs
        # Note: In production, use proper SVG parsing library
        # This is a simplified placeholder

        # Combine SVGs
        composed = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <!-- View Area -->
  <svg x="0" y="0" width="{width}" height="{height - get_title_block_height(paper_size)}">
    {view_svg}
  </svg>
  
  <!-- Title Block Area -->
  <svg x="0" y="{height - get_title_block_height(paper_size)}" 
       width="{width}" height="{get_title_block_height(paper_size)}">
    {title_block_svg}
  </svg>
</svg>'''

        return composed

    def add_north_arrow(
        self, svg_content: str, position: str = "lower_right", scale: float = 1.0
    ) -> str:
        """
        Add north arrow to SVG.

        Args:
            svg_content: SVG content
            position: Position keyword
            scale: Scale factor

        Returns:
            Modified SVG with north arrow
        """
        north_arrow = Path(self.north_arrow_path).read_text()

        # Position mapping
        positions = {
            "upper_right": (0.85, 0.05),
            "upper_left": (0.05, 0.05),
            "lower_right": (0.85, 0.85),
            "lower_left": (0.05, 0.85),
        }

        if position not in positions:
            position = "lower_right"

        x_pct, y_pct = positions[position]

        # Insert north arrow into SVG
        # This is simplified - proper implementation would parse and modify SVG

        return svg_content

    def add_scale_bar(
        self,
        svg_content: str,
        scale_text: str = "1:100",
        position: str = "lower_center",
    ) -> str:
        """
        Add scale bar to SVG.

        Args:
            svg_content: SVG content
            scale_text: Scale text to display
            position: Position keyword

        Returns:
            Modified SVG with scale bar
        """
        # Placeholder - would add proper scale bar
        return svg_content


# Export
__all__ = [
    "TitleBlockData",
    "TitleBlockTemplate",
    "ViewComposer",
]
