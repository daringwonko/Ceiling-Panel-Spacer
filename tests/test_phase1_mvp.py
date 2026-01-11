#!/usr/bin/env python3
"""
Quick test of Phase 1 MVP implementation
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all imports work"""
    print("Testing imports...")
    try:
        from universal_interfaces import UniversalArchitecturalDesignEngine
        print("✓ Universal interfaces imported")
    except ImportError as e:
        print(f"✗ Universal interfaces import failed: {e}")
        return False
    
    try:
        from phase1_mvp import Phase1MVP
        print("✓ Phase1MVP imported")
    except ImportError as e:
        print(f"✗ Phase1MVP import failed: {e}")
        return False
    
    return True

def test_basic_functionality():
    """Test basic Phase 1 functionality"""
    print("\nTesting basic functionality...")
    
    try:
        from phase1_mvp import Phase1MVP
        from universal_interfaces import DesignConstraints
        
        # Create Phase 1 MVP
        mvp = Phase1MVP()
        print("✓ Phase1MVP created")
        
        # Test quantum optimization
        constraints = DesignConstraints(
            dimensions=(6.0, 4.0, 0.1),
            materials=["LED Panel"],
            budget=15000,
            sustainability_target=0.85,
            aesthetic_preference="balanced"
        )
        
        result = mvp.quantum_optimize(constraints)
        print(f"✓ Quantum optimization works: score={result.optimization_score:.2f}")
        
        # Test multi-objective
        pareto = mvp.multi_objective_optimize(["efficiency", "cost"])
        print(f"✓ Multi-objective works: {len(pareto.designs)} designs")
        
        # Test creative generation
        creative = mvp.generate_creatively(constraints)
        print(f"✓ Creative generation works: score={creative.creativity_score:.2f}")
        
        # Test material verification
        verification = mvp.verify_materials(creative.design)
        print(f"✓ Material verification works: verified={verification.verified}")
        
        # Test 3D rendering
        scene = mvp.render_3d(creative.design)
        print(f"✓ 3D rendering works: {len(scene.vertices)} vertices")
        
        # Test code review
        review = mvp.review_and_fix("def test():\n    print('hello')")
        print(f"✓ Code review works: {review.issues_found} issues found")
        
        # Test comprehensive tests
        tests = mvp.run_comprehensive_tests("ceiling_panel_calc")
        print(f"✓ Comprehensive tests work: {tests.coverage:.1%} coverage")
        
        # Test encryption
        encrypted = mvp.encrypt_quantum_safe(b"test data")
        print(f"✓ Quantum encryption works: {encrypted.algorithm}")
        
        # Test performance optimization
        optimized = mvp.optimize_performance("def test(): pass")
        print(f"✓ Performance optimization works: {optimized.performance_improvement:.1f}x")
        
        print("\n🎉 ALL PHASE 1 MVP TESTS PASSED!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_backward_compatibility():
    """Test that existing ceiling calculator still works"""
    print("\nTesting backward compatibility...")
    
    try:
        from ceiling_panel_calc import CeilingDimensions, PanelSpacing, CeilingPanelCalculator
        
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        
        print(f"✓ Original calculator works: {layout.total_panels} panels")
        return True
        
    except Exception as e:
        print(f"✗ Backward compatibility test failed: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("PHASE 1 MVP - QUICK TEST")
    print("="*60)
    
    success = True
    
    success &= test_imports()
    success &= test_basic_functionality()
    success &= test_backward_compatibility()
    
    print("\n" + "="*60)
    if success:
        print("✅ ALL TESTS PASSED - Phase 1 MVP is ready!")
    else:
        print("❌ SOME TESTS FAILED - Check implementation")
    print("="*60)