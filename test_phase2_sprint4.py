#!/usr/bin/env python3
"""
Phase 2 Sprint 4 Validation Tests
==================================
Tests full architectural design with structural and MEP systems.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_structural_engine():
    """Test structural engineering engine"""
    print("\n" + "="*80)
    print("TEST: Structural Engineering Engine")
    print("="*80)
    
    try:
        from structural_engine import StructuralEngine, Load, LoadType
        
        engine = StructuralEngine()
        
        # Test beam design
        loads = [
            Load(load_type=LoadType.DEAD, magnitude=5.0, location=(0, 0, 0), distribution="distributed"),
            Load(load_type=LoadType.LIVE, magnitude=3.0, location=(0, 0, 0), distribution="distributed"),
        ]
        
        beam = engine.design_beam(span=6.0, loads=loads, material_name="concrete_25")
        assert beam.width > 0, "Beam width invalid"
        assert beam.depth > 0, "Beam depth invalid"
        assert beam.safety_factor >= 1.5, "Safety factor too low"
        print(f"✓ Beam design: {beam.width}mm × {beam.depth}mm, SF: {beam.safety_factor:.2f}")
        
        # Test column design
        column = engine.design_column(height=3.0, axial_load=450.0, material_name="concrete_25")
        assert column.diameter > 0, "Column diameter invalid"
        assert column.safety_factor >= 2.0, "Column safety factor too low"
        print(f"✓ Column design: Ø{column.diameter}mm, SF: {column.safety_factor:.2f}")
        
        # Test foundation design
        foundation = engine.design_foundation(total_load=1800.0, soil_capacity=150.0)
        assert foundation.area > 0, "Foundation area invalid"
        assert foundation.width > 0, "Foundation width invalid"
        print(f"✓ Foundation design: {foundation.type}, {foundation.width:.2f}m × {foundation.depth:.2f}m")
        
        # Test report generation
        report = engine.generate_report()
        assert "STRUCTURAL ENGINEERING REPORT" in report, "Report generation failed"
        assert "TOTAL STRUCTURAL COST" in report, "Cost calculation missing"
        print(f"✓ Report generation: {len(report)} characters")
        
        print("\n✅ Structural Engine: ALL TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Structural Engine: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mep_engine():
    """Test MEP systems engine"""
    print("\n" + "="*80)
    print("TEST: MEP Systems Engine")
    print("="*80)
    
    try:
        from mep_systems import MEPSystemEngine, Room, HVACType, ElectricalPhase
        
        engine = MEPSystemEngine()
        
        # Create sample rooms
        rooms = [
            Room(name="Living Room", area=16.0, volume=48.0, occupancy=4, has_window=True),
            Room(name="Kitchen", area=8.0, volume=24.0, occupancy=2, has_window=True),
            Room(name="Bedroom", area=12.0, volume=36.0, occupancy=2, has_window=True),
            Room(name="Bathroom", area=4.0, volume=12.0, occupancy=1, has_window=False),
        ]
        
        # Test HVAC design
        hvac = engine.design_hvac(rooms, system_type=HVACType.VRF)
        assert hvac.cooling_capacity > 0, "HVAC cooling capacity invalid"
        assert hvac.duct_size[0] > 0, "Duct width invalid"
        assert hvac.energy_efficiency >= 3.0, "Efficiency too low"
        print(f"✓ HVAC design: {hvac.cooling_capacity:.2f}kW, COP: {hvac.energy_efficiency:.1f}")
        
        # Test electrical design
        electrical = engine.design_electrical(rooms, building_type="residential")
        assert electrical.total_load > 0, "Electrical load invalid"
        assert electrical.main_breaker > 0, "Main breaker invalid"
        assert len(electrical.circuits) > 0, "No circuits designed"
        print(f"✓ Electrical design: {electrical.total_load:.2f}kW, {len(electrical.circuits)} circuits")
        
        # Test plumbing design
        fixtures = {"toilet": 2, "sink": 3, "shower": 2, "bathtub": 1}
        plumbing = engine.design_plumbing(rooms, fixtures)
        assert plumbing.flow_rate > 0, "Flow rate invalid"
        assert sum(plumbing.fixture_count.values()) > 0, "No fixtures"
        print(f"✓ Plumbing design: {plumbing.flow_rate:.1f} L/min, {sum(plumbing.fixture_count.values())} fixtures")
        
        # Test report generation
        report = engine.generate_report()
        assert "MEP SYSTEMS REPORT" in report, "Report generation failed"
        assert "TOTAL MEP COST" in report, "Cost calculation missing"
        print(f"✓ Report generation: {len(report)} characters")
        
        print("\n✅ MEP Engine: ALL TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ MEP Engine: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False

def test_full_architecture():
    """Test full architectural design engine"""
    print("\n" + "="*80)
    print("TEST: Full Architectural Design Engine")
    print("="*80)
    
    try:
        from full_architecture import FullArchitecturalEngine, BuildingType
        
        engine = FullArchitecturalEngine()
        
        # Design a 2-story residential building
        building = engine.design_building(
            building_type=BuildingType.RESIDENTIAL,
            dimensions=(12.0, 8.0),
            num_floors=2,
            program={
                "bedroom": 4,
                "bathroom": 2,
                "kitchen": 1,
                "living": 1,
            }
        )
        
        # Validate building
        assert len(building.floors) == 2, "Wrong number of floors"
        assert building.total_area > 0, "Total area invalid"
        assert building.total_height > 0, "Total height invalid"
        assert len(building.structural_elements) > 0, "No structural elements"
        assert len(building.mep_systems) > 0, "No MEP systems"
        assert len(building.vertical_circulation) > 0, "No vertical circulation"
        assert building.total_cost > 0, "Total cost invalid"
        
        print(f"✓ Building designed: {building.total_area:.1f}m², {len(building.floors)} floors")
        print(f"  Structural elements: {len(building.structural_elements)}")
        print(f"  MEP systems: {len(building.mep_systems)}")
        print(f"  Vertical circulation: {len(building.vertical_circulation)}")
        print(f"  Total cost: ${building.total_cost:,.2f}")
        
        # Test code compliance
        compliance = engine.check_code_compliance(building)
        assert "overall" in compliance, "Compliance check failed"
        print(f"  Code compliance: {'PASS' if compliance['overall'] else 'FAIL'}")
        
        # Test report generation
        report = engine.generate_building_report(building)
        assert "FULL BUILDING DESIGN REPORT" in report, "Report generation failed"
        assert "TOTAL COST" in report, "Cost missing from report"
        print(f"✓ Report generation: {len(report)} characters")
        
        print("\n✅ Full Architecture: ALL TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Full Architecture: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False

def test_integration():
    """Test integration with Phase 1 systems"""
    print("\n" + "="*80)
    print("TEST: Phase 1 & Phase 2 Integration")
    print("="*80)
    
    try:
        from full_architecture import FullArchitecturalEngine, BuildingType
        from ceiling_panel_calc import CeilingPanelCalculator
        
        engine = FullArchitecturalEngine()
        
        # Design building
        building = engine.design_building(
            building_type=BuildingType.RESIDENTIAL,
            dimensions=(10.0, 8.0),
            num_floors=1,
            program={"bedroom": 2, "bathroom": 1, "kitchen": 1, "living": 1}
        )
        
        # Test ceiling integration
        floor = building.floors[0]
        calc = CeilingPanelCalculator(floor.ceiling_dimensions, 
                                     PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200))
        layout = calc.calculate_optimal_layout()
        
        assert layout.total_panels > 0, "Ceiling calculation failed"
        print(f"✓ Ceiling integration: {layout.total_panels} panels")
        
        # Test structural integration
        structural_cost = engine.structural_engine.calculate_total_cost()
        assert structural_cost > 0, "Structural cost invalid"
        print(f"✓ Structural integration: ${structural_cost:,.2f}")
        
        # Test MEP integration
        mep_cost = engine.mep_engine.calculate_total_cost()
        assert mep_cost > 0, "MEP cost invalid"
        print(f"✓ MEP integration: ${mep_cost:,.2f}")
        
        # Verify total cost includes all systems
        expected_total = (building.total_area * 1500) + structural_cost + mep_cost + sum(c.cost for c in building.vertical_circulation)
        assert abs(building.total_cost - expected_total) < 1, "Total cost calculation error"
        print(f"✓ Total cost verification: ${building.total_cost:,.2f}")
        
        print("\n✅ Integration: ALL TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Integration: FAILED - {e}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all Phase 2 Sprint 4 tests"""
    print("\n" + "="*80)
    print("PHASE 2 SPRINT 4 - FULL VALIDATION SUITE")
    print("="*80)
    
    tests = [
        ("Structural Engineering Engine", test_structural_engine),
        ("MEP Systems Engine", test_mep_engine),
        ("Full Architectural Design", test_full_architecture),
        ("Phase 1 & 2 Integration", test_integration),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ CRITICAL ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
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
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Phase 2 Sprint 4 complete!")
        print("\nFeatures Implemented:")
        print("  ✓ Structural engineering (beams, columns, foundations)")
        print("  ✓ MEP systems (HVAC, electrical, plumbing)")
        print("  ✓ Multi-story building design")
        print("  ✓ Vertical circulation (stairs, elevators)")
        print("  ✓ Code compliance checking")
        print("  ✓ Complete cost estimation")
        print("\nReady for Phase 2 Sprint 5: IoT Integration!")
    else:
        print(f"\n⚠️  {total - passed} tests failed")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)