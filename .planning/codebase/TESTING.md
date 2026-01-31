# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- **Primary:** `pytest>=6.0.0` (configured in `requirements.txt`)
- **Secondary:** `unittest` (standard library) for integration tests
- **Coverage:** `pytest-cov>=2.12.0`
- **Async support:** `pytest-asyncio>=0.18.0`

**Config location:** No dedicated `pytest.ini` or `pyproject.toml` found; configuration uses defaults or command-line args

**Run Commands:**
```bash
# Run all tests
python -m pytest tests/

# Run with coverage
pytest --cov=core --cov=api tests/

# Run specific test file
python tests/test_ceiling_calc.py

# Run unittest-based tests
python tests/test_integration.py
python -m unittest tests.test_integration

# Run phase-based tests (custom test runners)
python tests/test_phase1_mvp.py
python tests/test_phase2_sprint4.py
python tests/test_algorithm_correctness.py
```

## Test File Organization

**Location:**
- All tests in `/home/tomas/Ceiling Panel Spacer/tests/` directory
- Test files use `test_` prefix: `test_ceiling_calc.py`, `test_api.py`
- Co-located tests with module tests via imports

**Naming:**
- Test files: `test_{module_name}.py` or `test_{feature_area}.py`
- Test functions: `test_{descriptive_name}()` (pytest style)
- Test methods: `def test_{name}(self)` (unittest style)
- Test classes: `Test{FeatureArea}` (unittest style, PascalCase)

**Structure:**
```
tests/
├── __init__.py
├── test_ceiling_calc.py          # Basic functionality tests
├── test_edge_cases.py            # Edge case handling
├── test_algorithm_correctness.py # Algorithm validation with assertions
├── test_integration.py           # Full unittest-based integration tests
├── test_api.py                   # API endpoint tests (pytest + fixtures)
├── test_phase1_mvp.py            # Phase-based development tests
├── test_phase1_complete.py
├── test_phase2_sprint4.py
├── test_phase2_sprint5.py
├── test_phase2_sprint6.py
└── test_phase3_sprint7.py
```

## Test Structure

**Pytest Style (preferred for new tests):**
```python
# From tests/test_api.py
import pytest

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_health_check(self, client):
        """Test main health endpoint."""
        response = client.get('/api/v1/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['data']['status'] == 'healthy'
```

**Standalone Test Script (for quick validation):**
```python
# From tests/test_ceiling_calc.py
def test_basic_functionality():
    """Test the basic functionality with different parameters"""
    from ceiling_panel_calc import *
    
    # Test 1: Small ceiling with tight gaps
    ceiling1 = CeilingDimensions(length_mm=3000, width_mm=2000)
    spacing1 = PanelSpacing(perimeter_gap_mm=100, panel_gap_mm=100)
    
    calc1 = CeilingPanelCalculator(ceiling1, spacing1)
    layout1 = calc1.calculate_optimal_layout(target_aspect_ratio=1.0)
    
    print(f"  Panel size: {layout1.panel_width_mm:.1f}mm × {layout1.panel_length_mm:.1f}mm")

if __name__ == '__main__':
    test_basic_functionality()
```

**Unittest Style (for comprehensive test suites):**
```python
# From tests/test_integration.py
import unittest
from pathlib import Path

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
        from ceiling_panel_calc import SVGGenerator
        
        svg_gen = SVGGenerator(ceiling, spacing, layout)
        svg_path = self.test_dir / "test_layout.svg"
        svg_gen.generate_svg(str(svg_path), material)
        
        self.assertTrue(svg_path.exists())
        self.assertGreater(svg_path.stat().st_size, 0)
```

**Assert Patterns:**
```python
# Basic assertions
assert layout.panel_count > 0
assert result is not None
assert response.status_code == 200

# Numerical assertions with tolerance
self.assertAlmostEqual(result.total_coverage_sqm, expected_area, places=1)
assert elapsed < 1000, f"Performance too slow: {elapsed}ms"

# Exception assertions (pytest style)
with pytest.raises(ValueError):
    MaterialLibrary.get_material('nonexistent')

# Collection assertions
assert len(alerts) > 0
assert 'panels_x' in result
self.assertIn("TEMP-01", dashboard.sensors)
```

## Mocking

**Framework:** Not explicitly found; relies on:
- **Manual mocking:** Creating mock objects manually
- **Monkeypatching:** `monkeypatch` fixture in pytest (if used)

**Patterns:**
```python
# Manual mock class
class MockComponent:
    def initialize(self):
        pass
    
    def execute(self, **kwargs):
        return {"result": "success"}

# Test with mock
orchestrator.register_component("test", "mock", MockComponent())
```

**What to Mock:**
- External service dependencies
- File system operations (use temp directories)
- Time-dependent functions
- Random number generators for reproducibility

**What NOT to Mock:**
- Core calculation algorithms (these should be tested directly)
- Dataclass instantiations
- Pure functions

## Fixtures and Factories

**Test Data:**
```python
# Inline test data (common pattern)
test_cases = [
    # (ceiling_length, ceiling_width, perim_gap, panel_gap, description)
    (4800, 3600, 200, 200, "Standard conference room"),
    (6000, 4500, 200, 200, "Large conference room"),
    (3000, 2000, 100, 100, "Small office"),
]

# Parameterized test pattern
for length, width, perim, panel, desc in test_cases:
    ceiling = CeilingDimensions(length_mm=length, width_mm=width)
    spacing = PanelSpacing(perimeter_gap_mm=perim, panel_gap_mm=panel)
    # ... test logic
```

**Fixtures location:** Defined in test files or `conftest.py` (if present)

**Common fixtures:**
```python
@pytest.fixture
def app():
    """Create test application."""
    app = create_app({'TESTING': True})
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()
```

## Coverage

**Requirements:** No explicit coverage target found in configuration

**View Coverage:**
```bash
# Generate coverage report
pytest --cov=core --cov=api --cov-report=html tests/

# View in browser
open htmlcov/index.html

# Terminal coverage
pytest --cov=core tests/ -v
```

## Test Types

**Unit Tests:**
- Location: `test_ceiling_calc.py`, `test_algorithm_correctness.py`
- Scope: Individual functions/methods
- Pattern: Test one calculation at a time with specific inputs

**Integration Tests:**
- Location: `test_integration.py`
- Scope: Multiple components working together
- Pattern: Full workflows with setUp/tearDown

**API Tests:**
- Location: `test_api.py`
- Scope: HTTP endpoints
- Pattern: Use Flask test client with pytest fixtures

**Algorithm Correctness Tests:**
- Location: `test_algorithm_correctness.py`
- Scope: Mathematical correctness and constraints
- Pattern: Assert constraints are met, not just execution:
```python
# CONSTRAINT 1: No panel exceeds 2400mm
assert layout.panel_width_mm <= 2400
assert layout.panel_length_mm <= 2400

# CONSTRAINT 2: Layout validates
is_valid = calc.validate_layout(layout)
assert is_valid

# CONSTRAINT 3: Panel count reasonable
assert layout.total_panels >= 1
assert layout.total_panels <= 100
```

**Phase-based Tests:**
- Files: `test_phase1_mvp.py`, `test_phase2_sprint4.py`, etc.
- Scope: Feature progression testing
- Pattern: Custom `TestRunner` class with `test_*` functions returning boolean

## Common Patterns

**Async Testing:**
```python
# Not prominently used; most tests are synchronous
# If needed, use pytest-asyncio decorator
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_call()
    assert result is not None
```

**Error Testing:**
```python
# From tests/test_edge_cases.py
try:
    ceiling = CeilingDimensions(length_mm=1000, width_mm=1000)
    spacing = PanelSpacing(perimeter_gap_mm=600, panel_gap_mm=200)
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    print(f"  Result: {layout.panel_width_mm:.1f}mm")
except Exception as e:
    print(f"  Error (expected): {e}")

# From tests/test_algorithm_correctness.py
try:
    layout = calc.calculate_optimal_layout()
    if should_succeed:
        passed += 1
    else:
        print(f"  Should have failed but succeeded")
except ValueError as e:
    if not should_succeed:
        print(f"  Failed as expected")
        passed += 1
```

**Performance Testing:**
```python
def test_performance():
    import time
    
    start = time.time()
    for _ in range(100):
        calculator = CeilingPanelCalculator(dims, gap)
        calculator.calculate()
    elapsed = time.time() - start
    
    assert elapsed < 2.0  # Should complete 100 calculations in under 2 seconds
```

**File Generation Testing:**
```python
def setUp(self):
    self.test_dir = Path("test_output")
    self.test_dir.mkdir(exist_ok=True)

def tearDown(self):
    import shutil
    if self.test_dir.exists():
        shutil.rmtree(self.test_dir)

def test_svg_generation(self):
    svg_path = self.test_dir / "test_layout.svg"
    generator.generate_svg(str(svg_path), material)
    
    self.assertTrue(svg_path.exists())
    self.assertGreater(svg_path.stat().st_size, 0)
    
    # Verify content
    content = svg_path.read_text()
    self.assertIn("<svg", content)
    self.assertIn("</svg>", content)
```

**Test Discovery:**
```python
# From test_integration.py
def run_tests():
    """Run all integration tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestCoreCalculation))
    suite.addTests(loader.loadTestsFromTestCase(TestFileGeneration))
    # ... more tests
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
```

## Test Output

**Test output directory:** `test_output/` (in `.gitignore`)

**Clean up:**
- Tests should clean up generated files in `tearDown()`
- Temporary directories should be removed after tests

**Git-ignored test artifacts:**
```
test_output/
.pytest_cache/
.coverage
htmlcov/
*.dxf
*.svg
*.stl
*.obj
```

## Testing Best Practices Observed

1. **Test categorization:** Use class-level docstrings to group tests
2. **Descriptive names:** Test names describe what is being tested
3. **Assertions over prints:** Prefer assertions over print statements
4. **Setup/teardown:** Use proper fixture lifecycle management
5. **Path handling:** Use `pathlib.Path` for cross-platform compatibility
6. **Exit codes:** Return proper exit codes for CI/CD integration

---

*Testing analysis: 2026-01-31*
