# Contributing to Ceiling Panel Calculator

Thank you for your interest in contributing to the Ceiling Panel Calculator! This document provides guidelines for developers, contributors, and maintainers.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Guidelines](#code-guidelines)
4. [Testing Requirements](#testing-requirements)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Architecture Overview](#architecture-overview)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Python 3.8+
- Git
- Basic understanding of ceiling/panel installation concepts
- Familiarity with Python dataclasses and type hints

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd ceiling

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install ezdxf

# Run tests
python3 test_algorithm_correctness.py
```

---

## Development Setup

### Project Structure

```
ceiling/
├── ceiling_panel_calc.py          # Core calculation engine
├── config_manager.py               # Configuration system
├── examples.py                     # Example code/documentation
├── test_algorithm_correctness.py  # Main test suite (NEW)
├── test_ceiling_calc.py           # Additional tests
├── test_edge_cases.py             # Edge case tests
├── ALGORITHM.md                    # Algorithm documentation
├── API.md                          # API reference
├── LIMITATIONS.md                  # Limitations & roadmap
├── CONTRIBUTING.md                 # This file
├── default_config.json             # Default configuration
└── README.md                       # User guide
```

### Environment Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install development dependencies
pip install ezdxf pytest pytest-cov
```

---

## Code Guidelines

### Style Standards

We follow PEP 8 with these specific conventions:

#### Imports

```python
# Standard library first
import json
import math
from pathlib import Path

# Third-party libraries
import ezdxf

# Local imports
from ceiling_panel_calc import CeilingDimensions
```

#### Type Hints

All functions must have type hints:

```python
# ✓ Good
def calculate_layout(
    length: float, 
    width: float, 
    gap: float = 200
) -> PanelLayout:
    """Calculate panel layout for ceiling."""
    ...

# ✗ Bad
def calculate_layout(length, width, gap=200):
    """Calculate panel layout for ceiling."""
    ...
```

#### Docstrings

Use Google-style docstrings:

```python
def calculate_optimal_layout(
    self, 
    optimization_strategy: str = 'balanced'
) -> PanelLayout:
    """
    Calculate optimal panel layout.
    
    This method finds the best panel arrangement given ceiling
    dimensions, spacing constraints, and optimization strategy.
    The algorithm enforces a hard 2400mm constraint on panel
    dimensions to ensure practical handling and standard sizing.
    
    Args:
        optimization_strategy: Optimization approach:
            - 'balanced': Default, balances panel count and sizing
            - 'minimize_seams': Prefer fewer panels
    
    Returns:
        PanelLayout: Optimal layout meeting all constraints
    
    Raises:
        ValueError: If layout is impossible with given constraints,
                   e.g., if perimeter gaps exceed available space
    
    Constraints:
        - All panel dimensions ≤ 2400mm (hard constraint)
        - Panel dimensions > 0
        - Available space > 0 after accounting for gaps
    
    Examples:
        >>> ceiling = CeilingDimensions(5000, 4000)
        >>> spacing = PanelSpacing(200, 200)
        >>> calc = CeilingPanelCalculator(ceiling, spacing)
        >>> layout = calc.calculate_optimal_layout()
        >>> print(f"{layout.total_panels} panels")
        16 panels
    """
    ...
```

#### Naming Conventions

```python
# Constants: UPPER_CASE
MAX_PANEL_DIMENSION_MM = 2400
DEFAULT_WASTE_FACTOR = 0.15

# Classes: PascalCase
class CeilingPanelCalculator:
    ...

# Functions/Methods: snake_case
def calculate_optimal_layout(self):
    ...

# Private methods: _leading_underscore
def _calculate_layout_score(self, layout):
    ...

# Variables: snake_case
total_panels = 16
available_space = 5000
```

#### Line Length

- Maximum 100 characters per line
- Exception: Long strings or URLs (keep on one line)

```python
# ✓ Good - broken into multiple lines
long_value = (
    some_calculation() +
    another_calculation() +
    final_adjustment()
)

# ✗ Bad - too long
very_long_variable_name = some_function(param1) + another_function(param2) + yet_another_function(param3)
```

---

## Testing Requirements

### Test Coverage Targets

- **Minimum:** 80% code coverage
- **Target:** 90%+ code coverage
- **Critical paths:** 100% coverage

### Test Organization

Tests are organized into focused test suites:

```
test_algorithm_correctness.py    # Algorithm validation
├── test_algorithm_correctness()      # 5 test cases
├── test_edge_cases()                 # 9 test cases
├── test_real_world_scenarios()       # 6 scenarios
├── test_cost_calculations()          # 4 configurations
├── test_performance()                # 3 benchmarks
└── test_optimization_strategies()    # 2 strategies

test_ceiling_calc.py             # Unit tests for CeilingPanelCalculator
test_edge_cases.py               # Edge cases and error handling
```

### Writing Tests

```python
def test_something_specific():
    """Test description of what is being tested."""
    # Arrange: Set up test data
    ceiling = CeilingDimensions(length_mm=5000, width_mm=4000)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    
    # Act: Execute the code being tested
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    # Assert: Verify the results
    assert layout.panel_width_mm <= 2400, "Panel width exceeds maximum"
    assert layout.total_panels >= 1, "At least one panel required"
    assert layout.total_panels <= 100, "Too many panels generated"
```

### Test Naming Convention

```python
# test_<class_or_function>_<scenario>_<expected_result>

test_calculate_optimal_layout_small_ceiling_returns_four_panels()
test_calculate_optimal_layout_large_gap_raises_value_error()
test_project_exporter_with_labor_multiplier_calculates_cost()
```

### Running Tests

```bash
# Run all tests
python3 test_algorithm_correctness.py

# Run specific test file
python3 test_ceiling_calc.py

# Run with verbose output
python3 -m pytest test_algorithm_correctness.py -v

# Check coverage
python3 -m pytest --cov=ceiling_panel_calc test_algorithm_correctness.py
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **refactor:** Code refactoring
- **perf:** Performance improvement
- **test:** Adding/updating tests
- **docs:** Documentation changes
- **chore:** Build, dependencies, tooling

### Examples

```
feat(algorithm): add minimize_seams optimization strategy

Implement new optimization strategy that prioritizes fewer panels
and minimizes seams. Useful for installations where connection
visibility is a concern.

Adds _calculate_layout_score() method with strategy parameter.
Updates calculate_optimal_layout() to accept optimization_strategy.

Refs: #42
```

```
fix(config): handle missing labor_multiplier in JSON config

Previously would crash if labor_multiplier was missing from config.
Now correctly defaults to None (no labor cost calculation).

Fixes #89
```

### Commit Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit message is clear and descriptive
- [ ] No debug code or print statements left

---

## Pull Request Process

### Before Submitting

1. **Update from main branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run full test suite**
   ```bash
   python3 test_algorithm_correctness.py
   python3 test_ceiling_calc.py
   python3 test_edge_cases.py
   ```

3. **Check code style**
   ```bash
   # PEP 8 compliance
   python3 -m flake8 ceiling_panel_calc.py
   ```

4. **Verify documentation**
   - Update docstrings
   - Update ALGORITHM.md if algorithm changes
   - Update API.md if API changes
   - Update LIMITATIONS.md if new limitations found

### PR Description Template

```markdown
## Description
Brief description of the change

## Related Issues
Fixes #123
Related to #456

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Added unit tests
- [ ] Verified test coverage > 80%
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] No new dependencies added
```

### Review Process

1. Automated tests must pass
2. Code review by at least one maintainer
3. Address feedback and update PR
4. Approval and merge

---

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────┐
│ Main Entry Point                         │
│ (examples.py, config_manager.py)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ CeilingPanelCalculator                  │
│ - Input validation                       │
│ - Practical panel count range detection  │
│ - Layout candidate generation            │
│ - Scoring & optimization                │
│ - Layout validation                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ ProjectExporter                         │
│ - Cost calculations                      │
│ - Report generation                     │
│ - Multi-format export (JSON, DXF, SVG) │
└──────────────┬──────────────────────────┘
               │
               ▼
        [Output Files]
```

### Data Flow

```
User Input
    │
    ▼
ConfigManager (loads config)
    │
    ▼
CeilingDimensions + PanelSpacing
    │
    ▼
CeilingPanelCalculator (generates layout)
    │
    ▼
PanelLayout
    │
    ▼
ProjectExporter (calculates costs, exports)
    │
    ▼
JSON/DXF/SVG/Report Files
```

### Key Classes & Responsibilities

| Class | Responsibility |
|-------|-----------------|
| `CeilingDimensions` | Store ceiling size |
| `PanelSpacing` | Store gap specifications |
| `CeilingPanelCalculator` | Calculate optimal panel layout |
| `Material` | Store material specification |
| `PanelLayout` | Represent calculated layout result |
| `ProjectExporter` | Export to multiple formats |
| `MaterialLibrary` | Manage material database |
| `ConfigManager` | Configuration management |

---

## Common Tasks

### Adding a New Optimization Strategy

1. **Update algorithm in CeilingPanelCalculator:**

```python
def _calculate_layout_score(
    self, 
    layout_area: float, 
    total_panels: int,
    strategy: str = 'balanced'
) -> float:
    """Calculate layout score based on strategy."""
    
    if strategy == 'balanced':
        return self._score_balanced(layout_area, total_panels)
    elif strategy == 'minimize_seams':
        return self._score_minimize_seams(total_panels)
    elif strategy == 'new_strategy':
        return self._score_new_strategy(layout_area, total_panels)
    else:
        raise ValueError(f"Unknown strategy: {strategy}")

def _score_new_strategy(self, area: float, panels: int) -> float:
    """Implement new optimization strategy."""
    # Your implementation here
    pass
```

2. **Add tests:**

```python
def test_optimization_strategies():
    """Test that new_strategy produces valid layouts."""
    layout = calc.calculate_optimal_layout(
        optimization_strategy='new_strategy'
    )
    assert layout.panel_width_mm <= 2400
```

3. **Update documentation:**
   - Add to ALGORITHM.md explaining strategy
   - Update API.md with examples
   - Update help text in config_manager.py

### Adding a New Material

```python
# In MaterialLibrary class
custom_material = Material(
    name="custom_acoustic",
    category="acoustic",
    color="off_white",
    reflectivity=0.5,
    cost_per_sqm=250.0,
    notes="Fire rated, 0.85 NRC"
)
MaterialLibrary.add_custom_material(custom_material)
```

### Modifying the Algorithm

1. **Understand current algorithm** (read ALGORITHM.md)
2. **Make changes in CeilingPanelCalculator.calculate_optimal_layout()**
3. **Add comprehensive tests** covering new behavior
4. **Verify constraints still met:**
   - Panel dimensions ≤ 2400mm
   - All panels positive size
   - Layout fits in available space
5. **Update ALGORITHM.md** with new details
6. **Run full test suite** to ensure no regressions

### Adding a New Export Format

1. **Create method in ProjectExporter:**

```python
def export_pdf(self, output_file: str) -> None:
    """Export ceiling layout to PDF format."""
    # Implementation using reportlab or similar
    pass
```

2. **Add to examples:**

```python
exporter.export_pdf('layout.pdf')
```

3. **Update API.md** with new method documentation
4. **Add tests** for new format

---

## Troubleshooting

### Common Issues

#### Issue: Tests fail with "No module named ezdxf"

**Solution:**
```bash
pip install ezdxf
```

#### Issue: Algorithm produces invalid layouts

**Debug steps:**
1. Check input validation (CeilingDimensions, PanelSpacing)
2. Print intermediate values (available_length, available_width)
3. Run with verbose output to see candidate layouts
4. Add assertions after each calculation step

#### Issue: Performance is slow

**Investigation:**
1. Run test_algorithm_correctness.py performance test
2. Profile with cProfile:
   ```python
   import cProfile
   cProfile.run('calc.calculate_optimal_layout()')
   ```
3. Check if search space is too large

#### Issue: Cost calculations don't match manual calculation

**Debug:**
```python
costs = exporter._calculate_costs()
print(f"Material: {costs['material_cost']}")
print(f"Waste: {costs['waste_cost']}")
print(f"Labor: {costs['labor_cost']}")
print(f"Total: {costs['total_cost']}")
```

---

## Contact & Questions

- **Issues:** Submit via GitHub Issues
- **Discussions:** Use GitHub Discussions
- **Email:** [maintainer email would go here]

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes for significant contributions

Thank you for contributing to make Ceiling Panel Calculator better!

---

## Version Information

- **Document Version:** 1.0
- **Last Updated:** January 2024
- **Status:** Active Development

