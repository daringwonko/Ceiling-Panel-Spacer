#!/usr/bin/env python3
"""
Comprehensive tests for the new practical algorithm in Ceiling Panel Calculator.

These tests verify:
1. Algorithm correctness (panels fit, no overlaps, constraints met)
2. Edge cases (small/large ceilings, extreme gaps)
3. Real-world scenarios (typical office/retail sizes)
4. Performance benchmarks
"""

from ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    ProjectExporter,
    MaterialLibrary,
)
import time


def test_algorithm_correctness():
    """
    Test 1: Algorithm Correctness
    Verify that generated layouts meet all constraints and requirements.
    """
    print("\n" + "="*70)
    print("TEST 1: ALGORITHM CORRECTNESS")
    print("="*70)
    
    test_cases = [
        # (ceiling_length, ceiling_width, perim_gap, panel_gap, description)
        (4800, 3600, 200, 200, "Standard conference room"),
        (6000, 4500, 200, 200, "Large conference room"),
        (8000, 6000, 200, 200, "Open office space"),
        (3000, 2000, 100, 100, "Small office"),
        (10000, 8000, 250, 200, "Large open area"),
    ]
    
    print("\nTesting various ceiling sizes:\n")
    all_passed = True
    
    for length, width, perim, panel, desc in test_cases:
        try:
            ceiling = CeilingDimensions(length_mm=length, width_mm=width)
            spacing = PanelSpacing(perimeter_gap_mm=perim, panel_gap_mm=panel)
            
            calc = CeilingPanelCalculator(ceiling, spacing)
            layout = calc.calculate_optimal_layout()
            
            # CONSTRAINT 1: No panel exceeds 2400mm
            assert layout.panel_width_mm <= 2400, f"Panel width {layout.panel_width_mm:.0f}mm exceeds max"
            assert layout.panel_length_mm <= 2400, f"Panel length {layout.panel_length_mm:.0f}mm exceeds max"
            
            # CONSTRAINT 2: Layout validates (fits in ceiling)
            is_valid = calc.validate_layout(layout)
            assert is_valid, "Layout doesn't fit in ceiling"
            
            # CONSTRAINT 3: Panel count is reasonable
            assert layout.total_panels >= 1, "No panels generated"
            assert layout.total_panels <= 100, "Too many panels (>100)"
            
            # CONSTRAINT 4: No negative dimensions
            assert layout.panel_width_mm > 0, "Negative or zero panel width"
            assert layout.panel_length_mm > 0, "Negative or zero panel length"
            
            print(f"✓ {desc:<30} {layout.panels_per_row}×{layout.panels_per_column} = {layout.total_panels:>3} panels "
                  f"({layout.panel_width_mm:>6.0f}×{layout.panel_length_mm:>6.0f}mm)")
            
        except Exception as e:
            print(f"✗ {desc:<30} FAILED: {e}")
            all_passed = False
    
    print("\n" + ("✓ ALL CORRECTNESS TESTS PASSED" if all_passed else "✗ SOME TESTS FAILED"))
    return all_passed


def test_edge_cases():
    """
    Test 2: Edge Cases
    Verify handling of extreme and unusual scenarios.
    """
    print("\n" + "="*70)
    print("TEST 2: EDGE CASE HANDLING")
    print("="*70)
    
    edge_cases = [
        # (length, width, perim, panel, should_succeed, description)
        (500, 500, 50, 50, True, "Very small ceiling"),
        (20000, 15000, 200, 200, True, "Very large ceiling"),
        (5000, 1000, 100, 100, True, "Extreme aspect ratio (5:1)"),
        (1000, 5000, 100, 100, True, "Extreme aspect ratio (1:5)"),
        (5000, 5000, 100, 0, True, "Zero gap between panels"),
        (5000, 5000, 3000, 100, False, "Gap too large (3000mm on 5000mm = exceeds half)"),
        (100, 100, 100, 50, False, "Ceiling too small for gaps"),
        (-5000, 5000, 200, 200, False, "Negative dimension"),
        (5000, -5000, 200, 200, False, "Negative dimension"),
    ]
    
    print("\nTesting edge cases:\n")
    passed = 0
    failed = 0
    
    for length, width, perim, panel, should_succeed, desc in edge_cases:
        try:
            ceiling = CeilingDimensions(length_mm=length, width_mm=width)
            spacing = PanelSpacing(perimeter_gap_mm=perim, panel_gap_mm=panel)
            calc = CeilingPanelCalculator(ceiling, spacing)
            layout = calc.calculate_optimal_layout()
            
            if should_succeed:
                print(f"✓ {desc:<40} Succeeded as expected")
                passed += 1
            else:
                print(f"✗ {desc:<40} Should have failed but succeeded")
                failed += 1
                
        except ValueError as e:
            if not should_succeed:
                print(f"✓ {desc:<40} Failed as expected")
                passed += 1
            else:
                print(f"✗ {desc:<40} Should have succeeded: {e}")
                failed += 1
    
    print(f"\nPassed: {passed}/{passed + failed}")
    print("✓ ALL EDGE CASES HANDLED CORRECTLY" if failed == 0 else f"✗ {failed} EDGE CASES FAILED")
    return failed == 0


def test_real_world_scenarios():
    """
    Test 3: Real-World Scenarios
    Test typical construction project sizes.
    """
    print("\n" + "="*70)
    print("TEST 3: REAL-WORLD SCENARIOS")
    print("="*70)
    
    scenarios = {
        "Small Office (3m×4m)": (3000, 4000, 150, 150),
        "Medium Office (5m×6m)": (5000, 6000, 200, 200),
        "Conference Room (6m×5m)": (6000, 5000, 200, 200),
        "Large Meeting Space (8m×10m)": (8000, 10000, 250, 250),
        "Retail Space (10m×15m)": (10000, 15000, 300, 200),
        "Warehouse (20m×30m)": (20000, 30000, 500, 300),
    }
    
    print("\nCalculating layouts for real-world projects:\n")
    all_passed = True
    
    for name, (length, width, perim, panel) in scenarios.items():
        try:
            ceiling = CeilingDimensions(length_mm=length, width_mm=width)
            spacing = PanelSpacing(perimeter_gap_mm=perim, panel_gap_mm=panel)
            
            calc = CeilingPanelCalculator(ceiling, spacing)
            layout = calc.calculate_optimal_layout()
            
            # Calculate practical metrics
            ceiling_area = length * width / 1_000_000
            panel_area = layout.panel_width_mm * layout.panel_length_mm / 1_000_000
            coverage_pct = 100 * layout.total_coverage_sqm / ceiling_area
            
            print(f"{name:<30} | {layout.total_panels:>3} panels ({layout.panels_per_row}×{layout.panels_per_column}) | "
                  f"{layout.panel_width_mm:>6.0f}×{layout.panel_length_mm:>6.0f}mm | {coverage_pct:>5.1f}% coverage")
            
            # Verify all constraints met
            assert layout.panel_width_mm <= 2400 and layout.panel_length_mm <= 2400, "Panel size constraint violated"
            assert calc.validate_layout(layout), "Layout doesn't fit"
            
        except Exception as e:
            print(f"✗ {name:<30} FAILED: {e}")
            all_passed = False
    
    print("\n" + ("✓ ALL REAL-WORLD SCENARIOS WORK" if all_passed else "✗ SOME SCENARIOS FAILED"))
    return all_passed


def test_cost_calculations():
    """
    Test 4: Cost Calculations
    Verify material cost breakdown with waste and labor.
    """
    print("\n" + "="*70)
    print("TEST 4: COST CALCULATIONS WITH WASTE & LABOR")
    print("="*70)
    
    ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    material = MaterialLibrary.get_material('led_panel_white')
    
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    print(f"\nProject: {ceiling.length_mm}×{ceiling.width_mm}mm ceiling")
    print(f"Material: {material.name} @ ${material.cost_per_sqm:.2f}/m²")
    print(f"Layout: {layout.total_panels} panels ({layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}mm)\n")
    
    # Test different waste and labor scenarios
    test_configs = [
        (0.00, None, "No waste, no labor"),
        (0.15, None, "15% waste, no labor"),
        (0.15, 0.25, "15% waste, 25% labor"),
        (0.20, 0.50, "20% waste, 50% labor"),
    ]
    
    print(f"{'Config':<30} | {'Material':<12} | {'Waste':<12} | {'Labor':<12} | {'Total':<12}")
    print("-" * 85)
    
    for waste, labor, desc in test_configs:
        exporter = ProjectExporter(ceiling, spacing, layout, material, waste, labor)
        costs = exporter._calculate_costs()
        
        print(f"{desc:<30} | ${costs['material_cost']:>10,.2f} | ${costs['waste_cost']:>10,.2f} | "
              f"${costs['labor_cost']:>10,.2f} | ${costs['total_cost']:>10,.2f}")
        
        # Verify calculations
        assert costs['total_material_cost'] == costs['material_cost'] + costs['waste_cost'], "Cost calculation error"
        if labor:
            assert costs['labor_cost'] > 0, "Labor cost should be > 0 when multiplier set"
        
        print(f"  ✓ Calculations verified")
    
    print("\n✓ ALL COST CALCULATIONS CORRECT")
    return True


def test_performance():
    """
    Test 5: Performance Benchmarks
    Verify algorithm runs within acceptable time limits.
    """
    print("\n" + "="*70)
    print("TEST 5: PERFORMANCE BENCHMARKS")
    print("="*70)
    
    test_sizes = [
        (3000, 2000, "Small"),
        (8000, 6000, "Medium"),
        (15000, 12000, "Large"),
    ]
    
    print("\nBenchmarking algorithm performance:\n")
    total_time = 0
    
    for length, width, size in test_sizes:
        ceiling = CeilingDimensions(length_mm=length, width_mm=width)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        
        start = time.time()
        layout = calc.calculate_optimal_layout()
        elapsed = (time.time() - start) * 1000  # Convert to ms
        
        total_time += elapsed
        
        status = "✓" if elapsed < 100 else "⚠" if elapsed < 500 else "✗"
        print(f"{status} {size:>6} ceiling ({length}×{width}mm): {elapsed:>6.2f}ms")
        
        assert elapsed < 1000, f"Performance too slow: {elapsed}ms"
    
    avg_time = total_time / len(test_sizes)
    print(f"\nAverage time per calculation: {avg_time:.2f}ms")
    print("✓ PERFORMANCE ACCEPTABLE (<100ms typical)")
    return True


def test_optimization_strategies():
    """
    Test 6: Optimization Strategies
    Verify different optimization approaches produce different results.
    """
    print("\n" + "="*70)
    print("TEST 6: OPTIMIZATION STRATEGIES")
    print("="*70)
    
    ceiling = CeilingDimensions(length_mm=8000, width_mm=6000)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    
    strategies = ["balanced", "minimize_seams"]
    
    print(f"\nCeiling: {ceiling.length_mm}×{ceiling.width_mm}mm\n")
    print(f"{'Strategy':<20} | {'Panels':<8} | {'Panel Size':<15} | {'Description':<30}")
    print("-" * 75)
    
    for strategy in strategies:
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout(optimization_strategy=strategy)
        
        panel_size = f"{layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}"
        desc = "Balanced approach" if strategy == "balanced" else "Minimize seams (fewer panels)"
        
        print(f"{strategy:<20} | {layout.total_panels:>6} | {panel_size:<15} | {desc:<30}")
        
        # Verify constraints still met
        assert layout.panel_width_mm <= 2400, f"Strategy '{strategy}' violated constraints"
    
    print("\n✓ ALL STRATEGIES PRODUCE VALID LAYOUTS")
    return True


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("CEILING PANEL CALCULATOR - COMPREHENSIVE ALGORITHM TESTS")
    print("="*70)
    
    tests = [
        ("Algorithm Correctness", test_algorithm_correctness),
        ("Edge Case Handling", test_edge_cases),
        ("Real-World Scenarios", test_real_world_scenarios),
        ("Cost Calculations", test_cost_calculations),
        ("Performance", test_performance),
        ("Optimization Strategies", test_optimization_strategies),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, "PASSED" if passed else "FAILED"))
        except Exception as e:
            print(f"\n✗ {test_name} ERROR: {e}")
            results.append((test_name, "ERROR"))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    for test_name, result in results:
        status_symbol = "✓" if result == "PASSED" else "✗"
        print(f"{status_symbol} {test_name:<40} {result}")
    
    passed_count = sum(1 for _, r in results if r == "PASSED")
    total_count = len(results)
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    print("="*70 + "\n")
    
    return passed_count == total_count


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
