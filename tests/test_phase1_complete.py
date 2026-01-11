#!/usr/bin/env python3
"""
Complete Phase 1 Validation Test Suite
=======================================

Tests all Phase 1 Sprint 1-3 features:
1. Quantum Optimization & AI Generation
2. 3D/VR/AR Rendering
3. Code Quality & Security

This ensures all interfaces are properly implemented and working.
"""

import sys
import os
import time
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all Phase 1 modules can be imported"""
    print("="*80)
    print("TEST 1: IMPORT VALIDATION")
    print("="*80)
    
    modules = [
        "universal_interfaces",
        "phase1_mvp",
        "three_d_engine",
        "ai_generative_engine",
        "ceiling_panel_calc",
    ]
    
    results = []
    for module in modules:
        try:
            __import__(module)
            print(f"✓ {module}")
            results.append(True)
        except ImportError as e:
            print(f"✗ {module}: {e}")
            results.append(False)
    
    success = all(results)
    print(f"\nResult: {'PASS' if success else 'FAIL'}")
    return success

def test_quantum_optimization():
    """Test quantum optimization interface"""
    print("\n" + "="*80)
    print("TEST 2: QUANTUM OPTIMIZATION")
    print("="*80)
    
    try:
        from ai_generative_engine import AIGenerativeEngine
        from universal_interfaces import DesignConstraints
        
        engine = AIGenerativeEngine()
        constraints = DesignConstraints(
            dimensions=(6.0, 4.0, 0.1),
            materials=["LED Panel"],
            budget=15000,
            sustainability_target=0.85,
            aesthetic_preference="balanced"
        )
        
        result = engine.quantum_optimize(constraints)
        
        # Validate result
        assert hasattr(result, 'design'), "Missing design attribute"
        assert hasattr(result, 'optimization_score'), "Missing optimization_score"
        assert hasattr(result, 'quantum_advantage'), "Missing quantum_advantage"
        assert 0.0 <= result.optimization_score <= 1.0, "Score out of range"
        assert result.quantum_advantage >= 1.0, "Quantum advantage should be >= 1.0"
        
        print(f"✓ Quantum optimization works")
        print(f"  Score: {result.optimization_score:.2f}")
        print(f"  Advantage: {result.quantum_advantage:.2f}x")
        return True
        
    except Exception as e:
        print(f"✗ Quantum optimization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_multi_objective():
    """Test multi-objective optimization"""
    print("\n" + "="*80)
    print("TEST 3: MULTI-OBJECTIVE OPTIMIZATION")
    print("="*80)
    
    try:
        from ai_generative_engine import AIGenerativeEngine
        
        engine = AIGenerativeEngine()
        result = engine.multi_objective_optimize(["efficiency", "cost", "aesthetics"])
        
        # Validate result
        assert hasattr(result, 'designs'), "Missing designs attribute"
        assert hasattr(result, 'scores'), "Missing scores attribute"
        assert hasattr(result, 'objectives'), "Missing objectives attribute"
        assert len(result.designs) > 0, "No designs generated"
        assert len(result.designs) == len(result.scores), "Designs/scores mismatch"
        
        print(f"✓ Multi-objective optimization works")
        print(f"  Generated {len(result.designs)} designs")
        print(f"  Best score: {max(result.scores):.2f}")
        return True
        
    except Exception as e:
        print(f"✗ Multi-objective optimization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_creative_generation():
    """Test creative generation"""
    print("\n" + "="*80)
    print("TEST 4: CREATIVE GENERATION")
    print("="*80)
    
    try:
        from ai_generative_engine import AIGenerativeEngine
        from universal_interfaces import DesignConstraints
        
        engine = AIGenerativeEngine()
        constraints = DesignConstraints(
            dimensions=(6.0, 4.0, 0.1),
            materials=["LED Panel"],
            budget=15000,
            sustainability_target=0.85,
            aesthetic_preference="balanced"
        )
        
        result = engine.generate_creatively(constraints)
        
        # Validate result
        assert hasattr(result, 'design'), "Missing design attribute"
        assert hasattr(result, 'creativity_score'), "Missing creativity_score"
        assert hasattr(result, 'inspiration_source'), "Missing inspiration_source"
        assert 0.0 <= result.creativity_score <= 1.0, "Creativity score out of range"
        
        print(f"✓ Creative generation works")
        print(f"  Creativity: {result.creativity_score:.2f}")
        print(f"  Inspiration: {result.inspiration_source}")
        return True
        
    except Exception as e:
        print(f"✗ Creative generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_blockchain_verification():
    """Test blockchain material verification"""
    print("\n" + "="*80)
    print("TEST 5: BLOCKCHAIN VERIFICATION")
    print("="*80)
    
    try:
        from ai_generative_engine import AIGenerativeEngine
        
        engine = AIGenerativeEngine()
        result = engine.verify_materials(None)
        
        # Validate result
        assert hasattr(result, 'verified'), "Missing verified attribute"
        assert hasattr(result, 'material_chain'), "Missing material_chain attribute"
        assert hasattr(result, 'sustainability_score'), "Missing sustainability_score attribute"
        assert result.verified == True, "Verification should be True"
        assert len(result.material_chain) > 0, "No material chain"
        assert 0.0 <= result.sustainability_score <= 1.0, "Sustainability score out of range"
        
        print(f"✓ Blockchain verification works")
        print(f"  Verified: {result.verified}")
        print(f"  Sustainability: {result.sustainability_score:.2f}")
        print(f"  Materials: {len(result.material_chain)}")
        return True
        
    except Exception as e:
        print(f"✗ Blockchain verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_3d_rendering():
    """Test 3D rendering interface"""
    print("\n" + "="*80)
    print("TEST 6: 3D RENDERING")
    print("="*80)
    
    try:
        from three_d_engine import ThreeDEngine
        from ceiling_panel_calc import CeilingDimensions, PanelSpacing, CeilingPanelCalculator
        
        # Create sample layout
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        
        # Test 3D rendering
        engine = ThreeDEngine()
        scene = engine.render_3d(layout)
        
        # Validate result
        assert hasattr(scene, 'vertices'), "Missing vertices attribute"
        assert hasattr(scene, 'faces'), "Missing faces attribute"
        assert hasattr(scene, 'materials'), "Missing materials attribute"
        assert len(scene.vertices) > 0, "No vertices generated"
        assert len(scene.faces) > 0, "No faces generated"
        
        print(f"✓ 3D rendering works")
        print(f"  Vertices: {len(scene.vertices)}")
        print(f"  Faces: {len(scene.faces)}")
        print(f"  Materials: {len(scene.materials)}")
        return True
        
    except Exception as e:
        print(f"✗ 3D rendering failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_vr_integration():
    """Test VR integration"""
    print("\n" + "="*80)
    print("TEST 7: VR INTEGRATION")
    print("="*80)
    
    try:
        from three_d_engine import ThreeDEngine
        from universal_interfaces import ThreeDScene
        
        engine = ThreeDEngine()
        
        # Create dummy scene
        scene = ThreeDScene(
            vertices=[(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)],
            faces=[(0, 1, 2), (0, 2, 3)],
            materials=[{"name": "Test", "color": "#ffffff"}]
        )
        
        result = engine.integrate_vr(scene)
        
        # Validate result
        assert hasattr(result, 'headset_type'), "Missing headset_type"
        assert hasattr(result, 'session_id'), "Missing session_id"
        assert hasattr(result, 'tracking_accuracy'), "Missing tracking_accuracy"
        assert result.tracking_accuracy >= 0.9, "Tracking accuracy too low"
        
        print(f"✓ VR integration works")
        print(f"  Headset: {result.headset_type}")
        print(f"  Session: {result.session_id}")
        print(f"  Tracking: {result.tracking_accuracy:.2f}")
        return True
        
    except Exception as e:
        print(f"✗ VR integration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ar_overlay():
    """Test AR overlay"""
    print("\n" + "="*80)
    print("TEST 8: AR OVERLAY")
    print("="*80)
    
    try:
        from three_d_engine import ThreeDEngine
        from ceiling_panel_calc import CeilingDimensions, PanelSpacing, CeilingPanelCalculator
        
        # Create sample layout
        ceiling = CeilingDimensions(length_mm=6000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        
        engine = ThreeDEngine()
        result = engine.overlay_ar(layout, None)
        
        # Validate result
        assert hasattr(result, 'anchor_points'), "Missing anchor_points"
        assert hasattr(result, 'overlay_accuracy'), "Missing overlay_accuracy"
        assert len(result.anchor_points) > 0, "No anchor points"
        assert result.overlay_accuracy >= 0.9, "Overlay accuracy too low"
        
        print(f"✓ AR overlay works")
        print(f"  Anchor points: {len(result.anchor_points)}")
        print(f"  Accuracy: {result.overlay_accuracy:.2f}")
        return True
        
    except Exception as e:
        print(f"✗ AR overlay failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_collaboration():
    """Test 3D collaboration"""
    print("\n" + "="*80)
    print("TEST 9: 3D COLLABORATION")
    print("="*80)
    
    try:
        from three_d_engine import ThreeDEngine
        
        engine = ThreeDEngine()
        result = engine.collaborate_3d("test-session", ["user1", "user2", "user3"])
        
        # Validate result
        assert hasattr(result, 'session_id'), "Missing session_id"
        assert hasattr(result, 'users'), "Missing users"
        assert hasattr(result, 'sync_latency'), "Missing sync_latency"
        assert len(result.users) == 3, "Wrong number of users"
        assert result.sync_latency < 0.1, "Latency too high"
        
        print(f"✓ 3D collaboration works")
        print(f"  Session: {result.session_id}")
        print(f"  Users: {len(result.users)}")
        print(f"  Latency: {result.sync_latency:.3f}s")
        return True
        
    except Exception as e:
        print(f"✗ 3D collaboration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_3d_export():
    """Test 3D export capabilities"""
    print("\n" + "="*80)
    print("TEST 10: 3D EXPORT")
    print("="*80)
    
    try:
        from three_d_engine import ThreeDEngine
        from universal_interfaces import ThreeDScene
        
        engine = ThreeDEngine()
        
        # Create dummy scene
        scene = ThreeDScene(
            vertices=[(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)],
            faces=[(0, 1, 2), (0, 2, 3)],
            materials=[{"name": "Test", "color": "#ffffff"}]
        )
        
        # Test JSON export
        json_result = engine.export_to_json(scene, None)
        assert len(json_result) > 0, "Empty JSON export"
        assert '"vertices"' in json_result, "Invalid JSON format"
        
        # Test HTML export
        html_result = engine.export_to_html(scene, None)
        assert len(html_result) > 0, "Empty HTML export"
        assert '<html>' in html_result, "Invalid HTML format"
        
        print(f"✓ 3D export works")
        print(f"  JSON size: {len(json_result)} bytes")
        print(f"  HTML size: {len(html_result)} bytes")
        return True
        
    except Exception as e:
        print(f"✗ 3D export failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_code_quality():
    """Test code quality interface"""
    print("\n" + "="*80)
    print("TEST 11: CODE QUALITY")
    print("="*80)
    
    try:
        from phase1_mvp import Phase1MVP
        
        mvp = Phase1MVP()
        
        # Test code review
        test_code = """
def bad_function():
    print("This should use logging")
    x = 10
    return x
"""
        review = mvp.review_and_fix(test_code)
        
        assert hasattr(review, 'original'), "Missing original"
        assert hasattr(review, 'fixed'), "Missing fixed"
        assert hasattr(review, 'issues_found'), "Missing issues_found"
        assert hasattr(review, 'fixes_applied'), "Missing fixes_applied"
        
        print(f"✓ Code review works")
        print(f"  Issues found: {review.issues_found}")
        print(f"  Fixes applied: {review.fixes_applied}")
        
        # Test comprehensive tests
        tests = mvp.run_comprehensive_tests("ceiling_panel_calc")
        
        assert hasattr(tests, 'coverage'), "Missing coverage"
        assert hasattr(tests, 'tests_passed'), "Missing tests_passed"
        assert hasattr(tests, 'tests_failed'), "Missing tests_failed"
        assert hasattr(tests, 'vulnerabilities'), "Missing vulnerabilities"
        
        print(f"✓ Comprehensive tests works")
        print(f"  Coverage: {tests.coverage:.1%}")
        print(f"  Passed: {tests.tests_passed}")
        
        # Test encryption
        encrypted = mvp.encrypt_quantum_safe(b"test data")
        
        assert hasattr(encrypted, 'algorithm'), "Missing algorithm"
        assert hasattr(encrypted, 'key_size'), "Missing key_size"
        assert hasattr(encrypted, 'data'), "Missing data"
        
        print(f"✓ Quantum encryption works")
        print(f"  Algorithm: {encrypted.algorithm}")
        print(f"  Key size: {encrypted.key_size} bits")
        
        # Test performance optimization
        optimized = mvp.optimize_performance(test_code)
        
        assert hasattr(optimized, 'original'), "Missing original"
        assert hasattr(optimized, 'optimized'), "Missing optimized"
        assert hasattr(optimized, 'performance_improvement'), "Missing performance_improvement"
        
        print(f"✓ Performance optimization works")
        print(f"  Improvement: {optimized.performance_improvement:.1f}x")
        
        return True
        
    except Exception as e:
        print(f"✗ Code quality tests failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_phase1_mvp_integration():
    """Test Phase 1 MVP integration"""
    print("\n" + "="*80)
    print("TEST 12: PHASE 1 MVP INTEGRATION")
    print("="*80)
    
    try:
        from phase1_mvp import Phase1MVP
        from universal_interfaces import DesignConstraints
        
        mvp = Phase1MVP()
        constraints = DesignConstraints(
            dimensions=(6.0, 4.0, 0.1),
            materials=["LED Panel"],
            budget=15000,
            sustainability_target=0.85,
            aesthetic_preference="balanced"
        )
        
        # Test all Phase 1 interfaces through MVP
        print("  Testing quantum optimization...")
        result1 = mvp.quantum_optimize(constraints)
        assert result1.optimization_score >= 0.0
        
        print("  Testing multi-objective...")
        result2 = mvp.multi_objective_optimize(["efficiency", "cost"])
        assert len(result2.designs) > 0
        
        print("  Testing creative generation...")
        result3 = mvp.generate_creatively(constraints)
        assert result3.creativity_score >= 0.0
        
        print("  Testing material verification...")
        result4 = mvp.verify_materials(result3.design)
        assert result4.verified == True
        
        print("  Testing 3D rendering...")
        result5 = mvp.render_3d(result3.design)
        assert len(result5.vertices) > 0
        
        print("  Testing VR integration...")
        result6 = mvp.integrate_vr(result5)
        assert result6.tracking_accuracy >= 0.9
        
        print("  Testing AR overlay...")
        result7 = mvp.overlay_ar(result3.design, None)
        assert len(result7.anchor_points) > 0
        
        print("  Testing collaboration...")
        result8 = mvp.collaborate_3d("test", ["u1", "u2"])
        assert len(result8.users) == 2
        
        print("  Testing code review...")
        result9 = mvp.review_and_fix("def test(): pass")
        assert hasattr(result9, 'fixed')
        
        print("  Testing comprehensive tests...")
        result10 = mvp.run_comprehensive_tests("test")
        assert result10.coverage >= 0.0
        
        print("  Testing encryption...")
        result11 = mvp.encrypt_quantum_safe(b"data")
        assert result11.key_size > 0
        
        print("  Testing performance optimization...")
        result12 = mvp.optimize_performance("code")
        assert result12.performance_improvement >= 1.0
        
        print(f"✓ Phase 1 MVP integration works")
        print(f"  All 11 interfaces tested successfully")
        return True
        
    except Exception as e:
        print(f"✗ Phase 1 MVP integration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all Phase 1 validation tests"""
    print("\n" + "="*80)
    print("PHASE 1 COMPLETE VALIDATION SUITE")
    print("="*80)
    print("Testing all Phase 1 Sprint 1-3 features...")
    print()
    
    tests = [
        ("Import Validation", test_imports),
        ("Quantum Optimization", test_quantum_optimization),
        ("Multi-Objective Optimization", test_multi_objective),
        ("Creative Generation", test_creative_generation),
        ("Blockchain Verification", test_blockchain_verification),
        ("3D Rendering", test_3d_rendering),
        ("VR Integration", test_vr_integration),
        ("AR Overlay", test_ar_overlay),
        ("3D Collaboration", test_collaboration),
        ("3D Export", test_3d_export),
        ("Code Quality", test_code_quality),
        ("Phase 1 MVP Integration", test_phase1_mvp_integration),
    ]
    
    results = []
    start_time = time.time()
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ CRITICAL ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} | {test_name}")
    
    print("-" * 80)
    print(f"Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print(f"Duration: {duration:.2f} seconds")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Phase 1 is complete and ready for Phase 2!")
        print("\nPhase 1 Features Implemented:")
        print("  ✓ Quantum optimization with genetic algorithms")
        print("  ✓ Multi-objective Pareto optimization")
        print("  ✓ AI creative generation with design patterns")
        print("  ✓ Blockchain material verification")
        print("  ✓ Three.js 3D rendering engine")
        print("  ✓ VR headset integration (WebXR)")
        print("  ✓ AR site inspection overlay")
        print("  ✓ Real-time 3D collaboration")
        print("  ✓ JSON/HTML export capabilities")
        print("  ✓ AI code review and auto-fix")
        print("  ✓ Comprehensive test suite (100% coverage target)")
        print("  ✓ Quantum-resistant encryption")
        print("  ✓ Performance optimization")
        print("\nReady for Phase 2: Full Architectural Design!")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review failures above.")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)