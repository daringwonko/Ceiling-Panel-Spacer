"""
Paper Size Definitions for Architectural Drawings

Standard paper sizes including ISO A-series, US ARCH series,
and common North American sizes.

Author: BIM Workbench
Version: 0.1.0
"""

from dataclasses import dataclass
from typing import Tuple, Dict, List


@dataclass
class PaperSize:
    """Paper size definition."""

    name: str
    width_mm: float
    height_mm: float
    portrait: Tuple[float, float]
    landscape: Tuple[float, float]
    category: str = "standard"

    @property
    def aspect_ratio(self) -> float:
        """Return aspect ratio (width/height)."""
        return self.width_mm / self.height_mm

    def get_size(self, orientation: str = "portrait") -> Tuple[float, float]:
        """Get size for specified orientation."""
        if orientation.lower() == "landscape":
            return self.landscape
        return self.portrait


# ISO A-series (International)
ISO_A_SIZES = [
    PaperSize(
        name="A0",
        width_mm=841,
        height_mm=1189,
        portrait=(841, 1189),
        landscape=(1189, 841),
        category="ISO A",
    ),
    PaperSize(
        name="A1",
        width_mm=594,
        height_mm=841,
        portrait=(594, 841),
        landscape=(841, 594),
        category="ISO A",
    ),
    PaperSize(
        name="A2",
        width_mm=420,
        height_mm=594,
        portrait=(420, 594),
        landscape=(594, 420),
        category="ISO A",
    ),
    PaperSize(
        name="A3",
        width_mm=297,
        height_mm=420,
        portrait=(297, 420),
        landscape=(420, 297),
        category="ISO A",
    ),
    PaperSize(
        name="A4",
        width_mm=210,
        height_mm=297,
        portrait=(210, 297),
        landscape=(297, 210),
        category="ISO A",
    ),
]

# US ARCH series (Architectural)
US_ARCH_SIZES = [
    PaperSize(
        name="ARCH A",
        width_mm=228.6,
        height_mm=304.8,
        portrait=(228.6, 304.8),
        landscape=(304.8, 228.6),
        category="US ARCH",
    ),
    PaperSize(
        name="ARCH B",
        width_mm=304.8,
        height_mm=457.2,
        portrait=(304.8, 457.2),
        landscape=(457.2, 304.8),
        category="US ARCH",
    ),
    PaperSize(
        name="ARCH C",
        width_mm=457.2,
        height_mm=609.6,
        portrait=(457.2, 609.6),
        landscape=(609.6, 457.2),
        category="US ARCH",
    ),
    PaperSize(
        name="ARCH D",
        width_mm=609.6,
        height_mm=914.4,
        portrait=(609.6, 914.4),
        landscape=(914.4, 609.6),
        category="US ARCH",
    ),
    PaperSize(
        name="ARCH E",
        width_mm=914.4,
        height_mm=1219.2,
        portrait=(914.4, 1219.2),
        landscape=(1219.2, 914.4),
        category="US ARCH",
    ),
    PaperSize(
        name="ARCH E1",
        width_mm=762,
        height_mm=1066.8,
        portrait=(762, 1066.8),
        landscape=(1066.8, 762),
        category="US ARCH",
    ),
]

# North American sizes
US_SIZES = [
    PaperSize(
        name="Letter",
        width_mm=215.9,
        height_mm=279.4,
        portrait=(215.9, 279.4),
        landscape=(279.4, 215.9),
        category="US Letter",
    ),
    PaperSize(
        name="Legal",
        width_mm=215.9,
        height_mm=355.6,
        portrait=(215.9, 355.6),
        landscape=(355.6, 215.9),
        category="US Legal",
    ),
    PaperSize(
        name="Tabloid",
        width_mm=279.4,
        height_mm=431.8,
        portrait=(279.4, 431.8),
        landscape=(431.8, 279.4),
        category="US Tabloid",
    ),
]

# All paper sizes combined
ALL_PAPER_SIZES = ISO_A_SIZES + US_ARCH_SIZES + US_SIZES

# Paper size lookup by name
PAPER_SIZE_MAP: Dict[str, PaperSize] = {ps.name: ps for ps in ALL_PAPER_SIZES}


def get_paper_size(name: str) -> PaperSize:
    """
    Get paper size by name.

    Args:
        name: Paper size name (A0, A1, ARCH D, Letter, etc.)

    Returns:
        PaperSize definition

    Raises:
        ValueError: If paper size not found
    """
    if name not in PAPER_SIZE_MAP:
        available = ", ".join(PAPER_SIZE_MAP.keys())
        raise ValueError(f"Unknown paper size: {name}\nAvailable sizes: {available}")
    return PAPER_SIZE_MAP[name]


def get_paper_sizes_by_category(category: str) -> List[PaperSize]:
    """
    Get all paper sizes in a category.

    Args:
        category: Category name (ISO A, US ARCH, US Letter)

    Returns:
        List of PaperSize in that category
    """
    return [ps for ps in ALL_PAPER_SIZES if ps.category == category]


def get_common_sizes() -> List[PaperSize]:
    """Get most commonly used architectural paper sizes."""
    return [
        PAPER_SIZE_MAP["A1"],
        PAPER_SIZE_MAP["A2"],
        PAPER_SIZE_MAP["ARCH D"],
        PAPER_SIZE_MAP["Letter"],
    ]


def mm_to_points(mm: float) -> float:
    """Convert millimeters to typographic points (1pt = 0.35mm)."""
    return mm * 2.83465


def mm_to_inches(mm: float) -> float:
    """Convert millimeters to inches."""
    return mm / 25.4


def inches_to_mm(inches: float) -> float:
    """Convert inches to millimeters."""
    return inches * 25.4


# Recommended margins by paper size
RECOMMENDED_MARGINS: Dict[str, Tuple[float, float, float, float]] = {
    # (left, right, top, bottom) in mm
    "A0": (20, 20, 20, 20),
    "A1": (20, 20, 20, 20),
    "A2": (15, 15, 15, 15),
    "A3": (15, 15, 15, 15),
    "A4": (15, 15, 15, 15),
    "ARCH D": (25, 25, 25, 25),
    "ARCH E": (25, 25, 25, 25),
    "Letter": (25.4, 25.4, 25.4, 25.4),
    "Legal": (25.4, 25.4, 25.4, 25.4),
    "Tabloid": (25.4, 25.4, 25.4, 25.4),
}


def get_margins(paper_size: str) -> Tuple[float, float, float, float]:
    """Get recommended margins for paper size."""
    return RECOMMENDED_MARGINS.get(paper_size, (20, 20, 20, 20))


# Title block sizes by paper size
TITLE_BLOCK_HEIGHT: Dict[str, float] = {
    "A0": 50,
    "A1": 45,
    "A2": 40,
    "A3": 35,
    "A4": 30,
    "ARCH D": 50,
    "ARCH E": 50,
    "Letter": 40,
    "Legal": 40,
    "Tabloid": 45,
}


def get_title_block_height(paper_size: str) -> float:
    """Get recommended title block height for paper size."""
    return TITLE_BLOCK_HEIGHT.get(paper_size, 40)


# Export
__all__ = [
    "PaperSize",
    "ISO_A_SIZES",
    "US_ARCH_SIZES",
    "US_SIZES",
    "ALL_PAPER_SIZES",
    "PAPER_SIZE_MAP",
    "get_paper_size",
    "get_paper_sizes_by_category",
    "get_common_sizes",
    "mm_to_points",
    "mm_to_inches",
    "inches_to_mm",
    "RECOMMENDED_MARGINS",
    "get_margins",
    "TITLE_BLOCK_HEIGHT",
    "get_title_block_height",
]
