"""
Floor Plan Parser using Computer Vision.

Extracts room boundaries and dimensions from floor plan images.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to import OpenCV
try:
    import cv2
    import numpy as np
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False
    logger.warning("OpenCV not available. Vision features will be limited.")

# Try to import OCR
try:
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


@dataclass
class Room:
    """Detected room in floor plan."""
    name: str
    bounding_box: Tuple[int, int, int, int]  # x, y, width, height
    width_mm: Optional[float] = None
    length_mm: Optional[float] = None
    confidence: float = 0.0
    area_sqm: Optional[float] = None


@dataclass
class ParseResult:
    """Result of floor plan parsing."""
    rooms: List[Room] = field(default_factory=list)
    scale_detected: bool = False
    scale_factor: float = 1.0  # pixels to mm
    image_width: int = 0
    image_height: int = 0
    processing_time_ms: float = 0


class FloorPlanParser:
    """
    Parses floor plan images to extract room dimensions.

    Processing pipeline:
    1. Load and preprocess image
    2. Detect walls/boundaries using edge detection
    3. Find rooms using contour detection
    4. OCR for dimension text
    5. Match dimensions to rooms
    6. Apply scale factor
    """

    def __init__(self):
        self.min_room_area = 1000  # Minimum contour area in pixels
        self.scale_patterns = ['1:', '1/', 'scale']

    def parse(self, image_path: str) -> ParseResult:
        """
        Parse a floor plan image.

        Args:
            image_path: Path to the floor plan image

        Returns:
            ParseResult with detected rooms and dimensions
        """
        import time
        start_time = time.time()

        if not CV_AVAILABLE:
            logger.error("OpenCV required for floor plan parsing")
            return ParseResult()

        # Load image
        img = cv2.imread(image_path)
        if img is None:
            logger.error(f"Could not load image: {image_path}")
            return ParseResult()

        height, width = img.shape[:2]

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Preprocess
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # Edge detection
        edges = cv2.Canny(blur, 50, 150)

        # Dilate to connect broken lines
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=2)

        # Find contours
        contours, _ = cv2.findContours(
            dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # Filter and process rooms
        rooms = []
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area < self.min_room_area:
                continue

            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)

            # Create room object
            room = Room(
                name=f"Room {i + 1}",
                bounding_box=(x, y, w, h),
                confidence=min(area / 10000, 1.0)  # Rough confidence based on size
            )
            rooms.append(room)

        # Try to detect scale
        scale_detected, scale_factor = self._detect_scale(gray)

        # Apply scale to rooms
        if scale_detected:
            for room in rooms:
                x, y, w, h = room.bounding_box
                room.width_mm = w * scale_factor
                room.length_mm = h * scale_factor
                room.area_sqm = (room.width_mm * room.length_mm) / 1_000_000

        processing_time = (time.time() - start_time) * 1000

        return ParseResult(
            rooms=rooms,
            scale_detected=scale_detected,
            scale_factor=scale_factor,
            image_width=width,
            image_height=height,
            processing_time_ms=processing_time
        )

    def _detect_scale(self, gray_image) -> Tuple[bool, float]:
        """
        Detect scale from the image.

        Looks for scale indicators and dimension annotations.

        Returns:
            (detected, scale_factor) - whether detected and pixels-to-mm ratio
        """
        if not OCR_AVAILABLE:
            return False, 1.0

        try:
            # Run OCR
            text = pytesseract.image_to_string(gray_image)

            # Look for scale patterns like "1:100" or "Scale: 1/50"
            import re

            # Pattern for ratios like 1:100
            match = re.search(r'1\s*[:\/]\s*(\d+)', text, re.IGNORECASE)
            if match:
                ratio = int(match.group(1))
                # Assuming the drawing is at that scale
                # 1:100 means 1cm on paper = 100cm = 1000mm in reality
                # We estimate pixels based on standard DPI
                dpi = 96
                pixels_per_cm = dpi / 2.54
                scale_factor = ratio * 10 / pixels_per_cm  # mm per pixel
                return True, scale_factor

            # Look for dimension annotations like "5000mm" or "5m"
            mm_match = re.search(r'(\d{4,})\s*mm', text)
            if mm_match:
                # Found a dimension - estimate scale from typical room sizes
                return True, 10.0  # Default estimate

            return False, 1.0

        except Exception as e:
            logger.error(f"Scale detection failed: {e}")
            return False, 1.0

    def visualize_result(
        self,
        image_path: str,
        result: ParseResult,
        output_path: str
    ):
        """
        Visualize parsing result with annotations.

        Args:
            image_path: Original image path
            result: Parsing result
            output_path: Output path for annotated image
        """
        if not CV_AVAILABLE:
            return

        img = cv2.imread(image_path)
        if img is None:
            return

        # Draw detected rooms
        for room in result.rooms:
            x, y, w, h = room.bounding_box
            color = (0, 255, 0)  # Green
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)

            # Label
            label = room.name
            if room.width_mm and room.length_mm:
                label += f" ({room.width_mm:.0f}x{room.length_mm:.0f}mm)"
            cv2.putText(
                img, label, (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
            )

        cv2.imwrite(output_path, img)
        logger.info(f"Saved visualization to {output_path}")
