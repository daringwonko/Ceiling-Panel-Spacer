"""
Dimension Extractor for floor plan images.

Uses OCR and pattern matching to extract dimension annotations.
"""

import re
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False

try:
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


@dataclass
class Dimension:
    """Extracted dimension from floor plan."""
    value: float
    unit: str  # 'mm', 'm', 'cm', 'ft', 'in'
    value_mm: float  # Normalized to mm
    text: str
    position: Optional[Tuple[int, int]] = None
    confidence: float = 0.0


class DimensionExtractor:
    """
    Extracts dimension annotations from floor plan images.

    Supports various formats:
    - Metric: mm, cm, m
    - Imperial: ft, in, ' , "
    - Combined: 5' 6"
    """

    # Unit conversion to mm
    UNIT_TO_MM = {
        'mm': 1,
        'cm': 10,
        'm': 1000,
        'ft': 304.8,
        "'": 304.8,
        'in': 25.4,
        '"': 25.4,
    }

    # Regex patterns for dimensions
    PATTERNS = [
        # Metric: 5000mm, 500 cm, 5.5m, 5,500mm
        (r'([\d,\.]+)\s*(mm|cm|m)\b', 'metric'),
        # Imperial feet and inches: 10'6", 10' 6", 10ft 6in
        (r"(\d+)\s*['\u2019ft]\s*(\d+)\s*[\"\u201Din]?", 'imperial_combined'),
        # Feet only: 10', 10 ft
        (r"(\d+)\s*['\u2019]|\b(\d+)\s*ft\b", 'feet'),
        # Inches only: 6", 6 in
        (r'(\d+)\s*[""\u201D]|\b(\d+)\s*in\b', 'inches'),
        # Plain numbers (context-dependent)
        (r'\b(\d{3,5})\b', 'plain'),
    ]

    def extract(self, image_path: str) -> List[Dimension]:
        """
        Extract dimensions from a floor plan image.

        Args:
            image_path: Path to the image file

        Returns:
            List of extracted Dimension objects
        """
        if not CV_AVAILABLE or not OCR_AVAILABLE:
            logger.warning("OpenCV and pytesseract required for dimension extraction")
            return []

        # Load and preprocess image
        img = cv2.imread(image_path)
        if img is None:
            return []

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Enhance contrast for OCR
        enhanced = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        # Run OCR with detailed data
        data = pytesseract.image_to_data(enhanced, output_type=pytesseract.Output.DICT)

        # Extract text blocks
        text_blocks = []
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            if int(data['conf'][i]) > 30:  # Confidence threshold
                text_blocks.append({
                    'text': data['text'][i],
                    'x': data['left'][i],
                    'y': data['top'][i],
                    'conf': data['conf'][i]
                })

        # Parse dimensions from text
        full_text = ' '.join(data['text'])
        dimensions = self._parse_dimensions(full_text)

        return dimensions

    def _parse_dimensions(self, text: str) -> List[Dimension]:
        """Parse dimension values from text."""
        dimensions = []
        processed_positions = set()

        # Try each pattern
        for pattern, pattern_type in self.PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                start = match.start()
                if any(abs(start - p) < 5 for p in processed_positions):
                    continue  # Skip overlapping matches

                processed_positions.add(start)
                dim = self._create_dimension(match, pattern_type)
                if dim:
                    dimensions.append(dim)

        return dimensions

    def _create_dimension(self, match, pattern_type: str) -> Optional[Dimension]:
        """Create a Dimension object from a regex match."""
        try:
            if pattern_type == 'metric':
                value_str = match.group(1).replace(',', '')
                value = float(value_str)
                unit = match.group(2).lower()
                value_mm = value * self.UNIT_TO_MM.get(unit, 1)

                return Dimension(
                    value=value,
                    unit=unit,
                    value_mm=value_mm,
                    text=match.group(0),
                    confidence=0.9
                )

            elif pattern_type == 'imperial_combined':
                feet = int(match.group(1))
                inches = int(match.group(2))
                value_mm = feet * self.UNIT_TO_MM['ft'] + inches * self.UNIT_TO_MM['in']

                return Dimension(
                    value=feet + inches / 12,
                    unit='ft',
                    value_mm=value_mm,
                    text=match.group(0),
                    confidence=0.85
                )

            elif pattern_type == 'feet':
                value = int(match.group(1) or match.group(2))
                value_mm = value * self.UNIT_TO_MM['ft']

                return Dimension(
                    value=value,
                    unit='ft',
                    value_mm=value_mm,
                    text=match.group(0),
                    confidence=0.8
                )

            elif pattern_type == 'inches':
                value = int(match.group(1) or match.group(2))
                value_mm = value * self.UNIT_TO_MM['in']

                return Dimension(
                    value=value,
                    unit='in',
                    value_mm=value_mm,
                    text=match.group(0),
                    confidence=0.8
                )

            elif pattern_type == 'plain':
                # Plain numbers - assume mm if 4-5 digits
                value = int(match.group(1))
                if 1000 <= value <= 50000:  # Reasonable room dimension in mm
                    return Dimension(
                        value=value,
                        unit='mm',
                        value_mm=value,
                        text=match.group(0),
                        confidence=0.6
                    )

            return None

        except (ValueError, IndexError) as e:
            logger.debug(f"Failed to parse dimension: {e}")
            return None

    def extract_from_text(self, text: str) -> List[Dimension]:
        """
        Extract dimensions from text string.

        Useful for testing or processing text directly.
        """
        return self._parse_dimensions(text)
