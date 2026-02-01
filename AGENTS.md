# AGENTS.md - Ceiling Panel Calculator

Guidelines for AI coding agents working in this repository.

## Build / Lint / Test Commands

```bash
# Install dependencies
make install              # pip install -r requirements.txt + pip install -e .

# Run all tests
make test                 # pytest tests/ -v --cov=. --cov-report=term-missing
pytest tests/ -v          # Run all tests with verbose output

# Run single test file
pytest tests/test_ceiling_calc.py -v
pytest tests/test_algorithm_correctness.py -v

# Run single test function
pytest tests/test_ceiling_calc.py::test_basic_functionality -v

# Run tests matching pattern
pytest -k "algorithm" -v  # Runs tests with "algorithm" in name

# Linting
make lint                 # flake8 . --max-line-length=100 && mypy . --ignore-missing-imports
flake8 . --max-line-length=100
mypy . --ignore-missing-imports

# Formatting
make format               # black . && isort .
black .                   # Code formatting
isort .                   # Import sorting

# Development server
make dev                  # python -m api.app

# Cleanup
make clean                # Remove __pycache__, .pyc, .pytest_cache, etc.
```

## Code Style Guidelines

### Imports
- **Order**: stdlib → third-party → local (enforced by isort)
- **Absolute imports** for project modules: `from core.ceiling_panel_calc import ...`
- **Use `from __future__ import annotations`** for forward references in Python < 3.10
- Use `typing` for type hints: `List`, `Dict`, `Optional`, `Tuple`, `Any`

### Formatting
- **Line length**: 100 characters (enforced by flake8/black)
- **Indent**: 4 spaces
- **Quotes**: Double quotes for strings (black default)
- **Trailing commas**: Required for multi-line structures

### Types & Naming
- **Dataclasses** for data structures: `@dataclass class CeilingDimensions`
- **Type hints** required on all functions and methods
- **Naming**:
  - `PascalCase` for classes
  - `snake_case` for functions/variables
  - `SCREAMING_SNAKE_CASE` for constants
  - `mm` suffix for millimeter values: `length_mm`, `panel_width_mm`
  - `_sqm` suffix for square meters: `total_coverage_sqm`

### Error Handling
- **Custom exceptions** in `core/exceptions.py`:
  - `BuildScaleError` (base)
  - `ValidationError` (input validation)
  - `CalculationError` (algorithm failures)
  - `ExportError` (file export failures)
- **Validate early**: Check inputs in `__init__` or dedicated `_validate_*` methods
- **Clear messages**: Include values in error messages: `f"Got {value}mm, expected < 2400mm"`

### Architecture Patterns
- **Core calculator**: `CeilingPanelCalculator` in `core/ceiling_panel_calc.py`
- **Validation**: Use Pydantic dataclasses in `core/validation.py` for API inputs
- **Configuration**: Algorithm config in `core/algorithm_config.py`, SVG config in `core/svg_config.py`
- **API responses**: Standardized format in `backend/app.py`:
  ```python
  {"success": bool, "data": {...}, "error": {"message": str}}
  ```

### Testing
- Use **pytest** with descriptive test names
- **Assertions** should verify correctness, not just execution
- Test files named `test_*.py` in `tests/` directory
- Use fixtures for common test data
- Include performance benchmarks for algorithm tests

### Logging
- Use `logging` module, not print statements
- Logger per module: `logger = logging.getLogger(__name__)`
- Levels: INFO for operations, DEBUG for details, ERROR for failures

### File Structure
```
/core/           # Core calculation engine
/tests/          # Test files
/backend/        # Flask API
/bim/            # BIM workbench components
/orchestration/  # System orchestration
/output/         # File generators (DXF, SVG)
```

### Key Constraints (Algorithm)
- Max panel dimension: **2400mm** (hard constraint)
- Min panel dimension: **100mm**
- Max ceiling dimension: **50000mm** (50m)
- Panel count should be reasonable (1-100 for typical ceilings)
- Efficiency = coverage / total_ceiling_area

### Common Patterns

**Dataclass with methods:**
```python
@dataclass
class CeilingDimensions:
    length_mm: float
    width_mm: float

    def to_meters(self) -> Tuple[float, float]:
        return self.length_mm / 1000, self.width_mm / 1000
```

**Validation pattern:**
```python
def _validate_inputs(self, config: AlgorithmConfig) -> None:
    available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
    if available_length <= 0:
        raise ValueError(
            f"Perimeter gap ({self.spacing.perimeter_gap_mm}mm x 2) exceeds "
            f"ceiling length ({self.ceiling.length_mm}mm)"
        )
```

**API response helper:**
```python
def success_response(data: Any) -> Dict:
    return {"success": True, "data": data, "error": None}

def error_response(message: str) -> Dict:
    return {"success": False, "data": None, "error": {"message": message}}
```
