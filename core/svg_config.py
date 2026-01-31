"""SVG generation configuration."""

from dataclasses import dataclass
from typing import Literal


@dataclass
class SVGConfig:
    """Configuration for SVG output generation.

    The scale factor converts mm to pixels. Different targets need different scales:
    - screen: 0.5 (96 DPI display)
    - print: 0.352 (72 DPI print)
    - high_res: 0.705 (144 DPI retina/high-res)
    """

    scale: float = 0.5
    target: Literal["screen", "print", "high_res", "custom"] = "screen"

    # Colors
    ceiling_fill: str = "#f0f0f0"
    ceiling_stroke: str = "#333333"
    panel_fill: str = "#e8f4f8"
    panel_stroke: str = "#0066cc"
    gap_stroke: str = "#999999"
    text_color: str = "#333333"

    # Styling
    stroke_width: float = 1.5
    font_size: int = 10
    font_family: str = "Arial, sans-serif"

    def __post_init__(self):
        """Auto-set scale based on target if not custom."""
        scale_map = {
            "screen": 0.5,
            "print": 0.352,
            "high_res": 0.705,
        }
        if self.target != "custom" and self.target in scale_map:
            self.scale = scale_map[self.target]

    @classmethod
    def for_screen(cls) -> "SVGConfig":
        """Create config optimized for screen display."""
        return cls(target="screen")

    @classmethod
    def for_print(cls) -> "SVGConfig":
        """Create config optimized for printing."""
        return cls(target="print", stroke_width=0.5)

    @classmethod
    def for_high_res(cls) -> "SVGConfig":
        """Create config optimized for high-resolution displays."""
        return cls(target="high_res")
