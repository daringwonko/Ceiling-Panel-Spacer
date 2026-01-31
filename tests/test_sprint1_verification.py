"""
Sprint 1 Verification Tests
Test the key accomplishments of Sprint 1 cleanup
"""

import pytest
import tempfile
import os
from pathlib import Path


class TestCoreAlgorithm:
    """Test the core ceiling calculation algorithm"""

    def test_algorithm_validates_inputs(self):
        """Test that algorithm validates inputs properly"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        # Test negative dimensions
        dims = Dimensions(width_mm=-100, length_mm=1000)
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=10)
        calc = CeilingPanelCalculator(dims, gap, get_material("standard_tiles"))

        with pytest.raises(Exception):  # Should raise ValidationError
            calc.calculate()

    def test_algorithm_creates_multi_panel_layout(self):
        """Test that algorithm creates realistic multi-panel layouts"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        dims = Dimensions(width_mm=4800, length_mm=3600)  # 4.8m x 3.6m room
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=10)
        calc = CeilingPanelCalculator(dims, gap, get_material("standard_tiles"))
        result = calc.calculate()

        # Should not create a single massive panel
        assert result.panel_count > 1
        assert result.panel_width_mm <= 2400  # Max practical size
        assert result.panel_length_mm <= 2400
        assert result.coverage_percentage > 80  # Good coverage

    def test_algorithm_handles_realistic_sizes(self):
        """Test algorithm with typical real-world ceiling sizes"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        test_cases = [
            (2400, 1800),  # Small room
            (4800, 3600),  # Medium room
            (7200, 4800),  # Large room
        ]

        for width, length in test_cases:
            dims = Dimensions(width_mm=width, length_mm=length)
            gap = Gap(edge_gap_mm=200, spacing_gap_mm=10)
            calc = CeilingPanelCalculator(dims, gap, get_material("standard_tiles"))
            result = calc.calculate()

            assert result.panel_count >= 1
            assert result.panel_width_mm <= 2400
            assert result.panel_length_mm <= 2400


class TestExportFormats:
    """Test export functionality"""

    def test_json_export_returns_dict(self):
        """Test that JSON export returns dict, not None"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        dims = Dimensions(width_mm=2400, length_mm=1800)
        calc = CeilingPanelCalculator(
            dims, Gap(200, 10), get_material("standard_tiles")
        )
        result = calc.calculate()

        json_data = calc.export_json("dummy.json")
        assert json_data is not None
        assert isinstance(json_data, dict)
        assert "layout" in json_data
        assert "material" in json_data

    def test_svg_export_creates_file(self):
        """Test SVG export creates valid file"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        with tempfile.NamedTemporaryFile(suffix=".svg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            dims = Dimensions(width_mm=2400, length_mm=1800)
            calc = CeilingPanelCalculator(
                dims, Gap(200, 10), get_material("standard_tiles")
            )
            result = calc.calculate()

            calc.export_svg(tmp_path)

            assert os.path.exists(tmp_path)
            with open(tmp_path, "r") as f:
                content = f.read()
                assert "<svg" in content
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class TestCostCalculations:
    """Test cost calculation with waste factor"""

    def test_waste_factor_applied(self):
        """Test that cost calculation includes waste allowance"""
        from core.ceiling_panel_calc import CeilingPanelCalculator
        from core.validation import Dimensions, Gap, get_material

        dims = Dimensions(width_mm=2400, length_mm=1800)
        calc = CeilingPanelCalculator(
            dims, Gap(200, 10), get_material("standard_tiles")
        )
        result = calc.calculate()

        report_with_waste = calc.generate_report(include_waste_factor=True)
        report_without_waste = calc.generate_report(include_waste_factor=False)

        # With waste factor should be higher cost
        assert (
            report_with_waste["total_material_cost"]
            > report_without_waste["total_material_cost"]
        )

        # Waste factor should increase cost by approximately 15%
        expected_waste_cost = report_without_waste["total_material_cost"] * 1.15
        assert (
            abs(report_with_waste["total_material_cost"] - expected_waste_cost) < 0.01
        )


class TestInfrastructure:
    """Test infrastructure components complete"""

    def test_exceptions_hierarchy(self):
        """Test exception classes are properly defined"""
        from src.core.exceptions import (
            BuildScaleError,
            ValidationError,
            CalculationError,
        )

        # Test exception inheritance
        assert issubclass(ValidationError, BuildScaleError)
        assert issubclass(CalculationError, BuildScaleError)

        # Test exception creation
        error = ValidationError("Test message")
        assert str(error) == "Test message"

    def test_logging_configuration(self):
        """Test logging setup works"""
        from src.core.logging import get_logger, setup_logging

        logger = get_logger(__name__)
        assert logger is not None

        # Test setup_logging
        setup_logging()
        logger.info("Test log message")

    def test_config_loading(self):
        """Test configuration loading"""
        from src.core.config import settings

        assert hasattr(settings, "database_path")
        assert hasattr(settings, "jwt_secret")
        assert (
            settings.jwt_secret != "your-secret-key-here"
        )  # Should be from env or changed


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
