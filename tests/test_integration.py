#!/usr/bin/env python3
"""
Integration Tests for Ceiling Panel Calculator System.

Comprehensive tests covering:
- End-to-end workflows
- Component integration
- Data flow validation
- Performance benchmarks
- Error handling
"""

import unittest
import sys
import os
import time
import json
from datetime import datetime
from pathlib import Path


class TestCoreCalculation(unittest.TestCase):
    """Test core ceiling panel calculation."""

    def test_basic_calculation(self):
        """Test basic panel calculation."""
        from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator, Material, MATERIALS

        dims = Dimensions(width_mm=4800, length_mm=3600)
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=50)

        calculator = CeilingPanelCalculator(dims, gap)
        result = calculator.calculate()

        self.assertIsNotNone(result)
        self.assertGreater(result.panel_count, 0)
        self.assertGreater(result.panel_width_mm, 0)
        self.assertGreater(result.panel_length_mm, 0)

    def test_large_ceiling(self):
        """Test large ceiling calculation."""
        from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator

        dims = Dimensions(width_mm=10000, length_mm=8000)
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=100)

        calculator = CeilingPanelCalculator(dims, gap)
        result = calculator.calculate()

        self.assertIsNotNone(result)
        # Large ceilings should have multiple panels
        self.assertGreater(result.panel_count, 1)

    def test_calculation_with_material(self):
        """Test calculation with material selection."""
        from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator, MATERIALS

        dims = Dimensions(width_mm=5000, length_mm=4000)
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=50)
        material = MATERIALS.get('led_panel_white')

        calculator = CeilingPanelCalculator(dims, gap)
        result = calculator.calculate()

        self.assertIsNotNone(result)
        if material:
            # Verify area calculation
            expected_area = (result.panel_width_mm * result.panel_length_mm *
                           result.panel_count) / 1_000_000
            self.assertAlmostEqual(result.total_coverage_sqm, expected_area, places=1)


class TestFileGeneration(unittest.TestCase):
    """Test file generation capabilities."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = Path("test_output")
        self.test_dir.mkdir(exist_ok=True)

    def tearDown(self):
        """Clean up test files."""
        import shutil
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def test_svg_generation(self):
        """Test SVG file generation."""
        from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator, SVGGenerator

        dims = Dimensions(width_mm=3000, length_mm=2500)
        gap = Gap(edge_gap_mm=150, spacing_gap_mm=50)

        calculator = CeilingPanelCalculator(dims, gap)
        result = calculator.calculate()

        svg_gen = SVGGenerator()
        svg_path = self.test_dir / "test_layout.svg"
        svg_gen.generate(str(svg_path), dims, gap, result)

        self.assertTrue(svg_path.exists())
        self.assertGreater(svg_path.stat().st_size, 0)

        # Verify SVG content
        content = svg_path.read_text()
        self.assertIn("<svg", content)
        self.assertIn("</svg>", content)


class TestQuantumOptimizer(unittest.TestCase):
    """Test quantum-inspired optimizer."""

    def test_basic_optimization(self):
        """Test basic optimization."""
        from quantum_optimizer import QuantumInspiredOptimizer

        optimizer = QuantumInspiredOptimizer(population_size=30)

        def objective(params):
            x, y = params
            return -(x - 3)**2 - (y - 2)**2  # Minimum at (3, 2)

        result = optimizer.optimize(
            objective_func=objective,
            bounds=[(0, 10), (0, 10)],
            max_iterations=50,
            minimize=False
        )

        # Should find near optimal
        self.assertAlmostEqual(result.best_solution[0], 3, delta=1.5)
        self.assertAlmostEqual(result.best_solution[1], 2, delta=1.5)

    def test_ceiling_optimizer(self):
        """Test ceiling layout optimizer."""
        from quantum_optimizer import CeilingLayoutOptimizer

        optimizer = CeilingLayoutOptimizer()

        result = optimizer.optimize_layout(
            ceiling_length_mm=5000,
            ceiling_width_mm=4000,
            perimeter_gap_mm=200,
            panel_gap_mm=50
        )

        self.assertIn('panels_x', result)
        self.assertIn('panels_y', result)
        self.assertGreater(result['total_panels'], 0)
        self.assertLessEqual(result['panel_width_mm'], 2400)


class Test3DRenderer(unittest.TestCase):
    """Test 3D rendering capabilities."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = Path("test_output")
        self.test_dir.mkdir(exist_ok=True)

    def tearDown(self):
        """Clean up test files."""
        import shutil
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def test_mesh_generation(self):
        """Test 3D mesh generation."""
        from renderer_3d import CeilingPanel3DGenerator

        generator = CeilingPanel3DGenerator()

        mesh = generator.generate_layout_mesh(
            panels_x=2,
            panels_y=2,
            panel_width_mm=600,
            panel_height_mm=600,
            include_frame=True
        )

        self.assertGreater(len(mesh.vertices), 0)
        self.assertGreater(len(mesh.faces), 0)
        self.assertGreater(len(mesh.materials), 0)

    def test_obj_export(self):
        """Test OBJ file export."""
        from renderer_3d import CeilingPanel3DGenerator, MeshExporter

        generator = CeilingPanel3DGenerator()
        mesh = generator.generate_layout_mesh(2, 2, 500, 500)

        obj_path = self.test_dir / "test.obj"
        MeshExporter.to_obj(mesh, str(obj_path))

        self.assertTrue(obj_path.exists())

        content = obj_path.read_text()
        self.assertIn("v ", content)  # Vertices
        self.assertIn("f ", content)  # Faces

    def test_stl_export(self):
        """Test STL file export."""
        from renderer_3d import CeilingPanel3DGenerator, MeshExporter

        generator = CeilingPanel3DGenerator()
        mesh = generator.generate_layout_mesh(2, 2, 500, 500)

        stl_path = self.test_dir / "test.stl"
        MeshExporter.to_stl(mesh, str(stl_path), binary=True)

        self.assertTrue(stl_path.exists())
        self.assertGreater(stl_path.stat().st_size, 80)  # At least header


class TestBlockchain(unittest.TestCase):
    """Test blockchain verification system."""

    def test_certificate_registration(self):
        """Test material certificate registration."""
        from blockchain_verifier import MaterialBlockchain, MaterialCertificate

        blockchain = MaterialBlockchain(difficulty=1)

        cert = MaterialCertificate(
            material_id="TEST-001",
            material_type="Test Panel",
            manufacturer="Test Corp",
            batch_number="BATCH-001",
            production_date="2024-01-01",
            certifications=["ISO 9001"],
            properties={"thickness": 25},
            inspector_id="INS-001",
            inspection_date="2024-01-02"
        )

        cert_hash = blockchain.register_certificate(cert)

        self.assertIsNotNone(cert_hash)
        self.assertEqual(len(cert_hash), 64)  # SHA-256 hex

    def test_chain_integrity(self):
        """Test blockchain integrity verification."""
        from blockchain_verifier import MaterialBlockchain, MaterialCertificate

        blockchain = MaterialBlockchain(difficulty=1)

        # Add some data
        cert = MaterialCertificate(
            material_id="TEST-002",
            material_type="Test",
            manufacturer="Corp",
            batch_number="B001",
            production_date="2024-01-01",
            certifications=[],
            properties={},
            inspector_id="INS",
            inspection_date="2024-01-01"
        )
        blockchain.register_certificate(cert)
        blockchain.mine_pending_transactions()

        # Verify chain
        self.assertTrue(blockchain.verify_chain())


class TestCodeAnalyzer(unittest.TestCase):
    """Test code analyzer."""

    def test_file_analysis(self):
        """Test single file analysis."""
        from code_analyzer import CodeAnalyzer

        analyzer = CodeAnalyzer()

        # Analyze this test file
        metrics, issues = analyzer.analyze_file(__file__)

        self.assertIsNotNone(metrics)
        self.assertGreater(metrics.lines_of_code, 0)
        self.assertGreater(metrics.function_count, 0)

    def test_complexity_calculation(self):
        """Test complexity visitor."""
        from code_analyzer import ComplexityVisitor
        import ast

        code = """
def complex_function(x):
    if x > 0:
        if x > 10:
            return "big"
        else:
            return "small"
    elif x < 0:
        return "negative"
    else:
        return "zero"
"""
        tree = ast.parse(code)
        func = tree.body[0]

        visitor = ComplexityVisitor()
        visitor.visit(func)

        # Should have complexity > 1 due to conditionals
        self.assertGreater(visitor.complexity, 1)


class TestMultiStoryDesigner(unittest.TestCase):
    """Test multi-story building designer."""

    def test_basic_building(self):
        """Test basic building creation."""
        from multi_story_designer import MultiStoryDesigner, SpaceType

        designer = MultiStoryDesigner()
        designer.set_site(2000, 800)

        designer.add_floor(0, "Ground", 4.0)
        designer.add_floor(1, "First", 3.5)

        designer.add_space_to_floor(0, "S01", "Lobby", SpaceType.COMMON, 200, 20)
        designer.add_space_to_floor(1, "S02", "Office", SpaceType.OFFICE, 500, 50)

        stats = designer.get_building_stats()

        self.assertEqual(stats.total_floors, 2)
        self.assertGreater(stats.total_net_area_sqm, 0)

    def test_code_compliance(self):
        """Test building code compliance check."""
        from multi_story_designer import MultiStoryDesigner, SpaceType, VerticalTransportType

        designer = MultiStoryDesigner()
        designer.set_site(5000, 1000)

        for i in range(5):
            designer.add_floor(i, f"Floor {i}", 4.0)
            designer.add_space_to_floor(i, f"O{i}", "Office", SpaceType.OFFICE, 800, 80)

        # Without elevators/stairs, should have compliance issues
        issues = designer.check_code_compliance()
        self.assertGreater(len(issues), 0)


class TestSitePlanner(unittest.TestCase):
    """Test site planning module."""

    def test_site_analysis(self):
        """Test site analysis."""
        from site_planner import SitePlanner, SiteCharacteristics, ZoningType

        planner = SitePlanner()

        site = SiteCharacteristics(
            total_area_sqm=3000,
            frontage_m=40,
            depth_m=75
        )
        planner.set_site(site)
        planner.set_zoning(ZoningType.COMMERCIAL)

        result = planner.analyze_site(
            proposed_gfa_sqm=6000,
            proposed_height_m=25,
            proposed_footprint_sqm=1500
        )

        self.assertIsNotNone(result)
        self.assertGreater(result.buildable_area_sqm, 0)
        self.assertGreater(result.max_gross_floor_area_sqm, 0)


class TestMonitoringDashboard(unittest.TestCase):
    """Test monitoring dashboard."""

    def test_sensor_registration(self):
        """Test sensor registration."""
        from monitoring_dashboard import MonitoringDashboard, MetricType

        dashboard = MonitoringDashboard()

        dashboard.register_sensor(
            "TEMP-01", "Test Temp", MetricType.TEMPERATURE, "Room 1", "°C"
        )

        self.assertIn("TEMP-01", dashboard.sensors)
        self.assertEqual(dashboard.sensors["TEMP-01"]['status'], 'online')

    def test_alert_generation(self):
        """Test alert generation on threshold breach."""
        from monitoring_dashboard import MonitoringDashboard, MetricType, SensorReading
        from datetime import datetime

        dashboard = MonitoringDashboard()
        dashboard.register_sensor("TEMP-01", "Test", MetricType.TEMPERATURE, "R1", "°C")

        # Ingest reading above threshold
        reading = SensorReading(
            sensor_id="TEMP-01",
            metric_type=MetricType.TEMPERATURE,
            value=35,  # Above critical max (32)
            unit="°C",
            timestamp=datetime.now()
        )
        dashboard.ingest_reading(reading)

        alerts = dashboard.get_active_alerts()
        self.assertGreater(len(alerts), 0)


class TestSystemOrchestrator(unittest.TestCase):
    """Test system orchestrator."""

    def test_component_registration(self):
        """Test component registration."""
        from system_orchestrator import SystemOrchestrator, ComponentStatus

        orchestrator = SystemOrchestrator()

        class MockComponent:
            def initialize(self):
                pass

        orchestrator.register_component("test", "mock", MockComponent())

        self.assertIn("test", orchestrator.components)

    def test_workflow_execution(self):
        """Test workflow execution."""
        from system_orchestrator import SystemOrchestrator, WorkflowDefinition, WorkflowStep

        orchestrator = SystemOrchestrator()

        class StepComponent:
            def execute(self, **kwargs):
                return {"result": "success"}

        orchestrator.register_component("step_comp", "test", StepComponent())
        orchestrator.initialize_all()

        workflow = WorkflowDefinition(
            name="test_workflow",
            description="Test",
            steps=[
                WorkflowStep(name="step1", component="step_comp", method="execute")
            ]
        )
        orchestrator.register_workflow(workflow)

        execution = orchestrator.execute_workflow("test_workflow")

        self.assertEqual(execution.status.value, "completed")


class TestPerformance(unittest.TestCase):
    """Performance benchmark tests."""

    def test_calculation_performance(self):
        """Test calculation performance."""
        from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator

        dims = Dimensions(width_mm=10000, length_mm=8000)
        gap = Gap(edge_gap_mm=200, spacing_gap_mm=50)

        start = time.time()

        for _ in range(100):
            calculator = CeilingPanelCalculator(dims, gap)
            calculator.calculate()

        elapsed = time.time() - start

        # Should complete 100 calculations in under 2 seconds
        self.assertLess(elapsed, 2.0)

    def test_optimizer_performance(self):
        """Test optimizer performance."""
        from quantum_optimizer import CeilingLayoutOptimizer

        optimizer = CeilingLayoutOptimizer()

        start = time.time()

        result = optimizer.optimize_layout(
            ceiling_length_mm=8000,
            ceiling_width_mm=6000
        )

        elapsed = time.time() - start

        # Should complete in under 5 seconds
        self.assertLess(elapsed, 5.0)
        self.assertIn('execution_time_ms', result)


def run_tests():
    """Run all integration tests."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestCoreCalculation))
    suite.addTests(loader.loadTestsFromTestCase(TestFileGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestQuantumOptimizer))
    suite.addTests(loader.loadTestsFromTestCase(Test3DRenderer))
    suite.addTests(loader.loadTestsFromTestCase(TestBlockchain))
    suite.addTests(loader.loadTestsFromTestCase(TestCodeAnalyzer))
    suite.addTests(loader.loadTestsFromTestCase(TestMultiStoryDesigner))
    suite.addTests(loader.loadTestsFromTestCase(TestSitePlanner))
    suite.addTests(loader.loadTestsFromTestCase(TestMonitoringDashboard))
    suite.addTests(loader.loadTestsFromTestCase(TestSystemOrchestrator))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformance))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
