#!/usr/bin/env python3
"""
Debug script to analyze the panel calculation algorithm
"""

from ceiling_panel_calc import *

def debug_algorithm():
    """Debug the panel calculation algorithm"""
    
    print("Debugging Panel Calculation Algorithm")
    print("=" * 50)
    
    # Test with the original parameters
    ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    
    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"Perimeter gap: {spacing.perimeter_gap_mm}mm")
    print(f"Panel gap: {spacing.panel_gap_mm}mm")
    
    # Calculate available space
    available_length = ceiling.length_mm - (2 * spacing.perimeter_gap_mm)
    available_width = ceiling.width_mm - (2 * spacing.perimeter_gap_mm)
    
    print(f"\nAvailable space: {available_length}mm × {available_width}mm")
    
    # Test different panel counts manually
    print("\nTesting different panel configurations:")
    
    for panels_length in range(1, 6):
        for panels_width in range(1, 6):
            # Calculate panel size with gaps
            panel_length = (available_length - (panels_length - 1) * spacing.panel_gap_mm) / panels_length
            panel_width = (available_width - (panels_width - 1) * spacing.panel_gap_mm) / panels_width
            
            if panel_length > 0 and panel_width > 0:
                # Calculate efficiency
                actual_ratio = panel_width / panel_length
                target_ratio = 1.0
                ratio_error = abs(actual_ratio - target_ratio)
                
                panel_area = panel_length * panel_width
                total_area = available_length * available_width
                efficiency = (panel_area / total_area) * (1 / (1 + ratio_error))
                
                print(f"  {panels_width}×{panels_length} panels: {panel_width:.0f}×{panel_length:.0f}mm, "
                      f"ratio={actual_ratio:.2f}, efficiency={efficiency:.4f}")

if __name__ == '__main__':
    debug_algorithm()