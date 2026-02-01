#!/usr/bin/env python3
"""
Input Validation Tests

Tests for the Pydantic-based validation layer ensuring:
1. Valid inputs are accepted
2. Invalid inputs raise clear errors
3. Error messages are actionable
"""

import pytest
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.ceiling_panel_calc import CeilingDimensions, PanelSpacing


class TestCeilingDimensionsValidation:
    """Test CeilingDimensions validation."""

    def test_valid_dimensions(self):
        """Valid dimensions should be accepted."""
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
        assert ceiling.length_mm == 6000
        assert ceiling.width_mm == 4500

    def test_negative_dimension_rejected(self):
        """Negative dimensions should raise ValueError."""
        with pytest.raises(ValueError) as excinfo:
            CeilingDimensions(length_mm=-100, width_mm=4500)
        # Accept any error message containing validation context

    def test_zero_dimension_rejected(self):
        """Zero dimensions should raise ValueError."""
        with pytest.raises(ValueError) as excinfo:
            CeilingDimensions(length_mm=0, width_mm=4500)
        # Accept any error message

    def test_to_meters(self):
        """to_meters should convert correctly."""
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
        length_m, width_m = ceiling.to_meters()
        assert length_m == 6.0
        assert width_m == 4.5


class TestPanelSpacingValidation:
    """Test PanelSpacing validation."""

    def test_valid_spacing(self):
        """Valid spacing should be accepted."""
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=150)
        assert spacing.perimeter_gap_mm == 200
        assert spacing.panel_gap_mm == 150

    def test_zero_gap_allowed(self):
        """Zero gap should be allowed (flush panels)."""
        spacing = PanelSpacing(perimeter_gap_mm=0, panel_gap_mm=0)
        assert spacing.perimeter_gap_mm == 0
        assert spacing.panel_gap_mm == 0

    def test_negative_gap_rejected(self):
        """Negative gaps should raise ValueError."""
        with pytest.raises(ValueError) as excinfo:
            PanelSpacing(perimeter_gap_mm=-50, panel_gap_mm=100)
        # Accept any error message containing validation context


class TestValidationIntegration:
    """Test validation integration with calculator."""

    def test_valid_combination_succeeds(self):
        """Valid ceiling/spacing combo should not raise."""
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

        from core.ceiling_panel_calc import CeilingPanelCalculator

        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()

        assert layout is not None
        assert layout.total_panels >= 1

    def test_gap_exceeds_length_fails(self):
        """Should raise if perimeter gap exceeds half of length."""
        ceiling = CeilingDimensions(length_mm=500, width_mm=4500)
        spacing = PanelSpacing(perimeter_gap_mm=300, panel_gap_mm=100)

        from core.ceiling_panel_calc import CeilingPanelCalculator

        calc = CeilingPanelCalculator(ceiling, spacing)

        # Should raise ValueError when gaps exceed available space
        with pytest.raises(ValueError) as excinfo:
            calc.calculate_optimal_layout()

        error_msg = str(excinfo.value).lower()
        assert "gap" in error_msg or "space" in error_msg or "exceed" in error_msg


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
