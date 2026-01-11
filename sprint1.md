# Sprint 1: Critical Infrastructure & Bug Fixes

**Duration**: 2 weeks
**Goal**: Fix all syntax errors, establish proper architecture, and resolve critical issues

---

## Sprint Objectives

1. ✅ Fix all syntax errors preventing code execution
2. ✅ Establish proper project structure
3. ✅ Fix critical security vulnerabilities
4. ✅ Add comprehensive error handling
5. ✅ Implement proper logging system
6. ✅ Create configuration management
7. ✅ Add type safety to core modules

---

## Day-by-Day Breakdown

### Week 1: Emergency Fixes

#### Day 1-2: Syntax Error Resolution

**Morning (4 hours)**
- [ ] Fix reinforcement_optimizer.py syntax errors
  - [ ] Replace all `.3f` and `.1f` print statements with proper f-strings
  - [ ] Lines 438-442, 454-455, 485-486
  - [ ] Test: `python reinforcement_optimizer.py`

**Afternoon (4 hours)**
- [ ] Fix emotional_design_optimizer.py syntax errors
  - [ ] Replace all broken print statements (lines 749-805)
  - [ ] Test: `python emotional_design_optimizer.py`

**Evening (2 hours)**
- [ ] Fix climate_scenario_modeler.py syntax errors
  - [ ] Replace all broken print statements (lines 659-751)
  - [ ] Test: `python climate_scenario_modeler.py`

**Deliverable**: All files execute without syntax errors

---

#### Day 3-4: Dependency & Import Fixes

**Morning (4 hours)**
- [ ] Create requirements.txt with all dependencies
  ```
  paho-mqtt>=1.6.1
  numpy>=1.21.0
  pandas>=1.3.0
  cryptography>=3.4.0
  pytest>=6.0.0
  pytest-cov>=2.12.0
  ```
- [ ] Install all dependencies: `pip install -r requirements.txt`

**Afternoon (4 hours)**
- [ ] Fix phase1_mvp.py import issues
  - [ ] Add fallback implementations for missing imports
  - [ ] Create proper exception handling
  - [ ] Test: `python phase1_mvp.py`

**Evening (2 hours)**
- [ ] Fix iot_sensor_network.py import issues
  - [ ] Add try-catch for mqtt import
  - [ ] Add try-catch for sqlite3 import
  - [ ] Test: `python iot_sensor_network.py`

**Deliverable**: All modules can be imported without errors

---

#### Day 5: Security Vulnerability Fixes

**Full Day (8 hours)**

**Morning: Input Validation (4 hours)**
- [ ] Add validation to ceiling_panel_calc.py
  ```python
  def validate_dimensions(length: float, width: float) -> bool:
      if not isinstance(length, (int, float)):
          return False
      if length <= 0 or length > 100000:  # 100m max
          return False
      return True
  ```

- [ ] Add validation to iot_sensor_network.py
  ```python
  def validate_sensor_data(data: dict) -> bool:
      if not isinstance(data, dict):
          return False
      if len(data) > 100:  # Size limit
          return False
      # Add field validation
      return True
  ```

**Afternoon: Authentication & Encryption (4 hours)**
- [ ] Add MQTT authentication to iot_sensor_network.py
  ```python
  import os
  import ssl
  
  MQTT_USERNAME = os.getenv("MQTT_USERNAME")
  MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
  
  if MQTT_USERNAME and MQTT_PASSWORD:
      client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
  ```

- [ ] Fix encryption in ceiling_panel_calc.py
  ```python
  from cryptography.fernet import Fernet
  import os
  
  def encrypt_data(data: bytes) -> EncryptedData:
      key = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
      f = Fernet(key)
      encrypted = f.encrypt(data)
      return EncryptedData(
          algorithm="Fernet",
          key_size=256,
          data=encrypted
      )
  ```

**Deliverable**: Security vulnerabilities addressed

---

### Week 2: Architecture & Quality

#### Day 6-7: Project Structure Refactoring

**Morning (4 hours)**
- [ ] Create proper directory structure
  ```
  ceiling_project/
  ├── ceiling/
  │   ├── __init__.py
  │   ├── core/
  │   │   ├── __init__.py
  │   │   ├── calculator.py
  │   │   ├── optimizer.py
  │   │   └── models.py
  │   ├── iot/
  │   │   ├── __init__.py
  │   │   ├── network.py
  │   │   ├── sensors.py
  │   │   └── mqtt.py
  │   └── ai/
  │       ├── __init__.py
  │       ├── predictive.py
  │       ├── optimization.py
  │       └── generators.py
  ├── tests/
  │   ├── __init__.py
  │   ├── test_core.py
  │   ├── test_iot.py
  │   └── test_ai.py
  ├── config/
  │   ├── __init__.py
  │   └── settings.py
  ├── logs/
  │   └── .gitkeep
  └── main.py
  ```

**Afternoon (4 hours)**
- [ ] Move ceiling_panel_calc.py logic to ceiling/core/
- [ ] Move iot_sensor_network.py to ceiling/iot/
- [ ] Move AI modules to ceiling/ai/
- [ ] Update all imports

**Evening (2 hours)**
- [ ] Test all modules after refactoring
- [ ] Verify no circular imports

**Deliverable**: Clean, modular project structure

---

#### Day 8-9: Error Handling & Logging

**Morning (4 hours)**
- [ ] Implement comprehensive error handling
  ```python
  from typing import Optional, Tuple
  import logging
  
  logger = logging.getLogger(__name__)
  
  def calculate_optimal_layout_safe(
      self, 
      dimensions: Tuple[float, float],
      gaps: Tuple[float, float],
      strategy: str = "balanced"
  ) -> Optional[PanelLayout]:
      try:
          # Validate inputs
          if not self._validate_inputs(dimensions, gaps):
              logger.error(f"Invalid inputs: {dimensions}, {gaps}")
              return None
          
          # Perform calculation
          result = self._calculate_optimized_layout(dimensions, gaps, strategy)
          logger.info(f"Layout calculated: {result.total_panels} panels")
          return result
          
      except Exception as e:
          logger.error(f"Calculation failed: {e}", exc_info=True)
          return None
  ```

**Afternoon (4 hours)**
- [ ] Set up logging configuration
  ```python
  # config/logging_config.py
  import logging
  import sys
  from pathlib import Path
  
  def setup_logging():
      log_dir = Path("logs")
      log_dir.mkdir(exist_ok=True)
      
      logging.basicConfig(
          level=logging.INFO,
          format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
          handlers=[
              logging.FileHandler(log_dir / "app.log"),
              logging.StreamHandler(sys.stdout)
          ]
      )
  ```

- [ ] Add logging to all modules
  - [ ] ceiling/core/calculator.py
  - [ ] ceiling/iot/network.py
  - [ ] ceiling/ai/predictive.py

**Deliverable**: Robust error handling and logging system

---

#### Day 10: Configuration Management

**Full Day (8 hours)**

**Morning: Create Config System (4 hours)**
- [ ] Create config/settings.py
  ```python
  import os
  from dataclasses import dataclass
  from typing import Optional
  
  @dataclass
  class CeilingConfig:
      max_panel_dimension: int = 2400
      min_panel_count: int = 4
      max_panel_count: int = 16
      default_gap: int = 200
  
  @dataclass
  class IoTConfig:
      mqtt_host: str = os.getenv("MQTT_HOST", "localhost")
      mqtt_port: int = int(os.getenv("MQTT_PORT", "1883"))
      mqtt_username: Optional[str] = os.getenv("MQTT_USERNAME")
      mqtt_password: Optional[str] = os.getenv("MQTT_PASSWORD")
      db_path: str = os.getenv("DB_PATH", "sensor_network.db")
  
  @dataclass
  class AIConfig:
      rl_episodes: int = 100
      rl_learning_rate: float = 0.1
      gan_epochs: int = 50
  
  @dataclass
  class Config:
      ceiling: CeilingConfig = CeilingConfig()
      iot: IoTConfig = IoTConfig()
      ai: AIConfig = AIConfig()
  
  # Global config instance
  config = Config()
  ```

**Afternoon: Integrate Config (4 hours)**
- [ ] Update ceiling/core/calculator.py to use config
- [ ] Update ceiling/iot/network.py to use config
- [ ] Update ceiling/ai modules to use config
- [ ] Create .env.example file

**Deliverable**: Centralized configuration system

---

#### Day 11-12: Type Safety

**Morning (4 hours)**
- [ ] Add type hints to ceiling/core/calculator.py
  ```python
  from typing import List, Tuple, Optional, Dict, Any, Literal
  
  class CeilingPanelCalculator:
      def calculate_optimal_layout(
          self,
          target_aspect_ratio: float = 1.0,
          optimization_strategy: Literal["balanced", "minimize_seams", "minimize_panels"] = "balanced",
          use_genetic: bool = False
      ) -> Optional[PanelLayout]:
          """Calculate optimal panel layout with type safety."""
          ...
  ```

**Afternoon (4 hours)**
- [ ] Add type hints to ceiling/iot/network.py
- [ ] Add type hints to ceiling/ai/predictive.py
- [ ] Run mypy to verify: `mypy ceiling/`

**Evening (2 hours)**
- [ ] Fix any type errors found by mypy
- [ ] Add type stubs for external libraries if needed

**Deliverable**: Type-safe codebase

---

#### Day 13: Testing Foundation

**Full Day (8 hours)**

**Morning: Unit Test Framework (4 hours)**
- [ ] Install pytest: `pip install pytest pytest-cov`
- [ ] Create tests/test_core.py
  ```python
  import pytest
  from ceiling.core.calculator import CeilingPanelCalculator
  from ceiling.core.models import CeilingDimensions, PanelSpacing
  
  def test_calculate_optimal_layout_basic():
      ceiling = CeilingDimensions(length_mm=6000, width_mm=4000)
      spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
      calc = CeilingPanelCalculator(ceiling, spacing)
      
      result = calc.calculate_optimal_layout()
      
      assert result is not None
      assert result.total_panels > 0
      assert result.panel_width_mm <= 2400
      assert result.panel_length_mm <= 2400
  
  def test_calculate_optimal_layout_invalid_dimensions():
      ceiling = CeilingDimensions(length_mm=-1000, width_mm=4000)
      spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
      calc = CeilingPanelCalculator(ceiling, spacing)
      
      result = calc.calculate_optimal_layout()
      
      assert result is None  # Should handle invalid input gracefully
  ```

**Afternoon: Integration Tests (4 hours)**
- [ ] Create tests/test_iot.py
- [ ] Create tests/test_ai.py
- [ ] Run all tests: `pytest tests/ -v --cov=ceiling`

**Deliverable**: Comprehensive test suite with 80%+ coverage

---

#### Day 14: Documentation & Review

**Morning (4 hours)**
- [ ] Add docstrings to all public functions
- [ ] Create README.md with setup instructions
- [ ] Document configuration options

**Afternoon (4 hours)**
- [ ] Code review all changes
- [ ] Run full test suite
- [ ] Verify all syntax errors are fixed
- [ ] Create deployment checklist

**Evening (2 hours)**
- [ ] Create sprint review document
- [ ] Plan Sprint 2

**Deliverable**: Complete, documented, tested codebase

---

## Success Criteria

### Must Pass (Critical)
- [ ] All syntax errors fixed
- [ ] All modules import without errors
- [ ] Security vulnerabilities addressed
- [ ] All tests pass
- [ ] No mypy errors

### Should Pass (High Priority)
- [ ] 80%+ test coverage
- [ ] All functions have type hints
- [ ] All functions have docstrings
- [ ] Logging implemented
- [ ] Configuration system working

### Could Pass (Nice to Have)
- [ ] Performance benchmarks
- [ ] CI/CD pipeline setup
- [ ] Docker containerization
- [ ] API documentation

---

## Resources Needed

### Tools
- Python 3.9+
- pytest
- mypy
- cryptography library

### Environment Variables
```bash
# Required
MQTT_HOST=localhost
MQTT_PORT=1883
DB_PATH=sensor_network.db

# Optional (for security)
MQTT_USERNAME=
MQTT_PASSWORD=
ENCRYPTION_KEY=
```

### Time Allocation
- Total: 80 hours (2 weeks)
- Daily: 8 hours
- Buffer: 10 hours for unexpected issues

---

## Risk Mitigation

### Risk 1: Import errors persist
**Mitigation**: Create minimal fallback implementations

### Risk 2: Tests fail
**Mitigation**: Fix issues incrementally, don't proceed until green

### Risk 3: Type hints reveal major issues
**Mitigation**: May need to refactor core logic

### Risk 4: Security fixes break functionality
**Mitigation**: Add comprehensive integration tests

---

## Sprint Review Questions

1. Did we fix all syntax errors?
2. Can all modules be imported?
3. Are security vulnerabilities addressed?
4. Is test coverage >80%?
5. Is documentation complete?
6. Are type hints comprehensive?
7. Is logging working?
8. Is configuration system complete?

---

## Next Sprint Preview

**Sprint 2: Feature Implementation & Refinement**
- Implement missing Phase 1 features properly
- Add real blockchain verification (not simulated)
- Add real 3D rendering (not simulated)
- Add real AI features (not simulated)
- Performance optimization
- Integration testing

**Estimated Duration**: 2 weeks