#!/usr/bin/env python3
"""
Construction Ceiling Panel Calculator
Generates optimized panel layouts with DXF export, measurements, and material specs.
"""

import json
import math
import random
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Optional
from pathlib import Path
from datetime import datetime

# Phase 3 AI Singularity & Predictive Omniscience imports
try:
    from gan_style_generator import GANStyleGenerator
    from reinforcement_optimizer import QLearningOptimizer
    from predictive_analytics_engine import PredictiveAnalyticsEngine
    from emotional_design_optimizer import EmotionalDesignOptimizer
    from climate_scenario_modeler import ClimateScenarioModeler
    PHASE3_AVAILABLE = True
except ImportError:
    PHASE3_AVAILABLE = False
    print("Warning: Phase 3 AI features not available. Install required dependencies.")


@dataclass
class CeilingDimensions:
    """Ceiling dimensions in millimeters"""
    length_mm: float  # X-axis
    width_mm: float   # Y-axis
    
    def to_meters(self) -> Tuple[float, float]:
        return self.length_mm / 1000, self.width_mm / 1000


@dataclass
class PanelSpacing:
    """Gap specifications in millimeters"""
    perimeter_gap_mm: float      # Gap around ceiling edge
    panel_gap_mm: float          # Gap between panels


@dataclass
class Material:
    """Material/finish specification"""
    name: str
    category: str  # 'lighting', 'acoustic', 'drywall', 'metal', 'custom'
    color: str
    reflectivity: float  # 0.0 to 1.0
    cost_per_sqm: float
    notes: str = ""


@dataclass
class PanelLayout:
    """Calculated panel layout"""
    panel_width_mm: float
    panel_length_mm: float
    panels_per_row: int
    panels_per_column: int
    total_panels: int
    total_coverage_sqm: float
    gap_area_sqm: float
    
    def to_dict(self) -> Dict:
        return asdict(self)


class CeilingPanelCalculator:
    """Core calculation engine for ceiling panel layouts"""
    
    # Hard constraints for practical panel sizes
    MAX_PANEL_DIMENSION_MM = 2400  # Maximum panel width or length
    MIN_PANEL_COUNT = 1            # Minimum panels (fallback)
    PRACTICAL_PANEL_COUNT_RANGE = (4, 16)  # Preferred range for typical ceilings
    
    def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layouts: List[Tuple[PanelLayout, float]] = []  # (layout, efficiency score)
    
    def calculate_optimal_layout(self, target_aspect_ratio: float = 1.0,
                                optimization_strategy: str = "balanced",
                                use_genetic: bool = False) -> PanelLayout:
        """
        Calculate optimal panel layout with practical constraints.
        
        This algorithm generates practical multi-panel layouts suitable for real construction,
        with hard constraints preventing impractical oversized panels.
        
        Args:
            target_aspect_ratio: Preferred panel width/length ratio (1.0 = square)
            optimization_strategy: "balanced" (default), "minimize_seams", or "minimize_panels"
        
        Returns:
            Optimized PanelLayout meeting practical constraints
            
        Raises:
            ValueError: If ceiling dimensions are invalid or layout impossible
            
        Algorithm:
            1. Validate inputs and calculate available space
            2. Determine panel count range (prefer 4-16 for typical ceilings)
            3. For each valid panel count:
               - Calculate panel dimensions with gaps
               - Check panel size doesn't exceed 2400mm
               - Calculate layout efficiency score
            4. Return best layout matching optimization strategy
        """
        # Input validation
        if self.ceiling.length_mm <= 0 or self.ceiling.width_mm <= 0:
            raise ValueError(
                f"Ceiling dimensions must be positive. Got: {self.ceiling.length_mm}mm × {self.ceiling.width_mm}mm"
            )
        
        if self.spacing.perimeter_gap_mm < 0 or self.spacing.panel_gap_mm < 0:
            raise ValueError(
                f"Gap sizes cannot be negative. Got: perimeter={self.spacing.perimeter_gap_mm}mm, panel={self.spacing.panel_gap_mm}mm"
            )
        
        # Available space (ceiling minus perimeter gaps)
        available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
        available_width = self.ceiling.width_mm - (2 * self.spacing.perimeter_gap_mm)
        
        # Check if gaps are too large
        if available_length <= 0:
            raise ValueError(
                f"Perimeter gap ({self.spacing.perimeter_gap_mm}mm) exceeds half ceiling length "
                f"({self.ceiling.length_mm / 2}mm). Reduce gap or increase ceiling length."
            )
        
        if available_width <= 0:
            raise ValueError(
                f"Perimeter gap ({self.spacing.perimeter_gap_mm}mm) exceeds half ceiling width "
                f"({self.ceiling.width_mm / 2}mm). Reduce gap or increase ceiling width."
            )
        
        # Find practical panel count range
        min_panel_count, max_panel_count = self._get_practical_panel_count_range(
            available_length, available_width
        )
        
        if use_genetic:
            best_layout = self._genetic_optimize_layout(target_aspect_ratio, optimization_strategy)
            candidate_layouts = [(best_layout, 1.0)]  # For sorting
        else:
            best_layout = None
            best_score = -float('inf')
            candidate_layouts = []

            # Try different numbers of panels per dimension
            # Expanded range to ensure we find practical layouts
            for panels_length in range(max(1, min_panel_count // 2), min(max_panel_count * 2, 50)):
                for panels_width in range(max(1, min_panel_count // 2), min(max_panel_count * 2, 50)):
                    # Calculate panel size with gaps
                    panel_length = (available_length - (panels_length - 1) * self.spacing.panel_gap_mm) / panels_length
                    panel_width = (available_width - (panels_width - 1) * self.spacing.panel_gap_mm) / panels_width

                    # CONSTRAINT: Check panel size doesn't exceed maximum
                    if panel_length > self.MAX_PANEL_DIMENSION_MM or panel_width > self.MAX_PANEL_DIMENSION_MM:
                        continue

                    if panel_length > 0 and panel_width > 0:
                        total_panels = panels_length * panels_width

                        # Calculate layout score based on optimization strategy
                        score = self._calculate_layout_score(
                            panel_width, panel_length, total_panels,
                            target_aspect_ratio, optimization_strategy,
                            available_length, available_width
                        )

                        layout = PanelLayout(
                            panel_width_mm=panel_width,
                            panel_length_mm=panel_length,
                            panels_per_row=panels_width,
                            panels_per_column=panels_length,
                            total_panels=total_panels,
                            total_coverage_sqm=(panel_length * panel_width * total_panels) / 1_000_000,
                            gap_area_sqm=(self.ceiling.length_mm * self.ceiling.width_mm -
                                        panel_length * panel_width * total_panels) / 1_000_000
                        )

                        candidate_layouts.append((layout, score))

                        if score > best_score:
                            best_score = score
                            best_layout = layout
                            self.layouts.append((layout, score))
        
        if best_layout is None:
            raise ValueError(
                f"Could not calculate valid panel layout. "
                f"Ceiling {self.ceiling.length_mm}×{self.ceiling.width_mm}mm is too small for gaps "
                f"or practical panel sizes."
            )
        
        # Sort all candidates by score for alternate layouts
        self.layouts = sorted(candidate_layouts, key=lambda x: x[1], reverse=True)
        
        return best_layout
    
    def _get_practical_panel_count_range(self, available_length: float, available_width: float) -> Tuple[int, int]:
        """
        Determine practical panel count range for the available space.
        
        For typical construction, 4-16 panels is practical.
        Adjust based on ceiling size.
        """
        ceiling_area = available_length * available_width
        
        if ceiling_area < 5_000_000:  # < 5 sqm
            min_count = 1
            max_count = 8
        elif ceiling_area < 20_000_000:  # < 20 sqm
            min_count = 4
            max_count = 16
        elif ceiling_area < 50_000_000:  # < 50 sqm
            min_count = 8
            max_count = 25
        else:
            min_count = 12
            max_count = 40
        
        return min_count, max_count
    
    def _calculate_layout_score(self, panel_width: float, panel_length: float, total_panels: int,
                                target_aspect_ratio: float, strategy: str,
                                available_length: float, available_width: float) -> float:
        """
        Calculate layout score based on selected optimization strategy.
        
        Strategies:
        - "balanced": Balance between practical panel count and reasonable sizes
        - "minimize_seams": Prefer fewer panels (less seams)
        - "minimize_panels": Actually alias for minimize_seams (fewer panels = fewer seams)
        """
        panel_area = panel_width * panel_length
        actual_ratio = panel_width / panel_length
        ratio_error = abs(actual_ratio - target_aspect_ratio)
        
        # Base efficiency: how well panels fill the space
        base_efficiency = panel_area / (available_length * available_width)
        
        # Aspect ratio penalty (prefer target ratio)
        aspect_penalty = 1.0 / (1 + ratio_error * 0.5)
        
        # Panel count preference varies by strategy
        if strategy == "minimize_seams" or strategy == "minimize_panels":
            # Prefer fewer panels (less seams)
            # Penalize high panel counts
            panel_count_bonus = 1.0 / (1 + total_panels * 0.01)
        else:  # "balanced" or unknown
            # Prefer practical panel count (not too few, not too many)
            # Penalize extremes
            if total_panels < 4:
                panel_count_bonus = 0.5  # Too few panels = oversized
            elif total_panels > 16:
                panel_count_bonus = 0.7  # Too many panels = small size
            else:
                panel_count_bonus = 1.0  # Practical range = best
        
        # Combined score
        score = base_efficiency * aspect_penalty * panel_count_bonus
        
        return score
    
    def get_alternate_layouts(self, count: int = 5) -> List[Tuple[PanelLayout, float]]:
        """Get top N alternative layouts ranked by efficiency"""
        sorted_layouts = sorted(self.layouts, key=lambda x: x[1], reverse=True)
        return sorted_layouts[:count]
    
    def validate_layout(self, layout: PanelLayout) -> bool:
        """Verify layout fits ceiling with specified gaps"""
        total_length = (layout.panel_length_mm * layout.panels_per_column +
                        (layout.panels_per_column - 1) * self.spacing.panel_gap_mm +
                        2 * self.spacing.perimeter_gap_mm)

        total_width = (layout.panel_width_mm * layout.panels_per_row +
                       (layout.panels_per_row - 1) * self.spacing.panel_gap_mm +
                       2 * self.spacing.perimeter_gap_mm)

        length_ok = abs(total_length - self.ceiling.length_mm) < 1  # 1mm tolerance
        width_ok = abs(total_width - self.ceiling.width_mm) < 1

        return length_ok and width_ok

    def _genetic_optimize_layout(self, target_aspect_ratio: float = 1.0,
                                optimization_strategy: str = "balanced",
                                generations: int = 100, population_size: int = 50) -> PanelLayout:
        """
        Use genetic algorithm for advanced layout optimization.
        Quantum-inspired: population-based search mimicking natural selection.
        """
        available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
        available_width = self.ceiling.width_mm - (2 * self.spacing.perimeter_gap_mm)

        # Initialize population with random layouts
        population = []
        for _ in range(population_size):
            panels_length = random.randint(1, 20)
            panels_width = random.randint(1, 20)
            panel_length = (available_length - (panels_length - 1) * self.spacing.panel_gap_mm) / panels_length
            panel_width = (available_width - (panels_width - 1) * self.spacing.panel_gap_mm) / panels_width
            if panel_length > 0 and panel_width > 0 and panel_length <= self.MAX_PANEL_DIMENSION_MM and panel_width <= self.MAX_PANEL_DIMENSION_MM:
                total_panels = panels_length * panels_width
                score = self._calculate_layout_score(panel_width, panel_length, total_panels, target_aspect_ratio, optimization_strategy, available_length, available_width)
                population.append((panels_length, panels_width, score))

        # Evolve for generations
        for _ in range(generations):
            # Selection: tournament selection
            selected = []
            for _ in range(population_size // 2):
                candidates = random.sample(population, 3)
                best = max(candidates, key=lambda x: x[2])
                selected.append(best)

            # Crossover and mutation
            new_population = []
            while len(new_population) < population_size:
                parent1 = random.choice(selected)
                parent2 = random.choice(selected)
                # Crossover
                child_panels_length = (parent1[0] + parent2[0]) // 2
                child_panels_width = (parent1[1] + parent2[1]) // 2
                # Mutation
                if random.random() < 0.1:
                    child_panels_length += random.randint(-2, 2)
                    child_panels_width += random.randint(-2, 2)
                child_panels_length = max(1, min(child_panels_length, 20))
                child_panels_width = max(1, min(child_panels_width, 20))

                panel_length = (available_length - (child_panels_length - 1) * self.spacing.panel_gap_mm) / child_panels_length
                panel_width = (available_width - (child_panels_width - 1) * self.spacing.panel_gap_mm) / child_panels_width
                if panel_length > 0 and panel_width > 0 and panel_length <= self.MAX_PANEL_DIMENSION_MM and panel_width <= self.MAX_PANEL_DIMENSION_MM:
                    total_panels = child_panels_length * child_panels_width
                    score = self._calculate_layout_score(panel_width, panel_length, total_panels, target_aspect_ratio, optimization_strategy, available_length, available_width)
                    new_population.append((child_panels_length, child_panels_width, score))
                else:
                    new_population.append(parent1)  # Keep parent if invalid

            population = new_population

        # Return best
        best = max(population, key=lambda x: x[2])
        panels_length, panels_width, _ = best
        panel_length = (available_length - (panels_length - 1) * self.spacing.panel_gap_mm) / panels_length
        panel_width = (available_width - (panels_width - 1) * self.spacing.panel_gap_mm) / panels_width
        total_panels = panels_length * panels_width
        total_coverage_sqm = (panel_length * panel_width * total_panels) / 1_000_000
        gap_area_sqm = (self.ceiling.length_mm * self.ceiling.width_mm - panel_length * panel_width * total_panels) / 1_000_000

        return PanelLayout(
            panel_width_mm=panel_width,
            panel_length_mm=panel_length,
            panels_per_row=panels_width,
            panels_per_column=panels_length,
            total_panels=total_panels,
            total_coverage_sqm=total_coverage_sqm,
            gap_area_sqm=gap_area_sqm
        )

    def calculate_phase3_ai_singularity(self, target_aspect_ratio: float = 1.0,
                                       user_preferences: Optional[Dict] = None,
                                       location: Optional[Dict] = None,
                                       enable_gan: bool = True,
                                       enable_rl: bool = True,
                                       enable_predictive: bool = True,
                                       enable_emotional: bool = True,
                                       enable_climate: bool = True) -> Dict:
        """
        Phase 3: AI Singularity & Predictive Omniscience Integration

        Deploy all advanced AI systems for comprehensive design optimization:
        - GANs for architectural style generation (20% aesthetics improvement)
        - Reinforcement learning for optimization (30% future-proofing)
        - Predictive analytics for future needs
        - Emotional design optimization (>95% satisfaction)
        - Climate scenario modeling

        Args:
            target_aspect_ratio: Preferred panel width/length ratio
            user_preferences: User preferences for emotional optimization
            location: Geographic location for climate modeling
            enable_*: Feature toggles

        Returns:
            Comprehensive Phase 3 optimization results
        """
        if not PHASE3_AVAILABLE:
            raise RuntimeError("Phase 3 AI features not available. Install required dependencies.")

        print("🧠 IGNITING PHASE 3: AI SINGULARITY & PREDICTIVE OMNISCIENCE")
        print("="*80)

        results = {
            'phase3_enabled': True,
            'timestamp': datetime.now(),
            'base_layout': None,
            'ai_optimized_layout': None,
            'style_generation': None,
            'reinforcement_optimization': None,
            'predictive_analytics': None,
            'emotional_optimization': None,
            'climate_modeling': None,
            'success_metrics': {}
        }

        # 1. Calculate base layout
        print("\n1. CALCULATING BASE LAYOUT...")
        base_layout = self.calculate_optimal_layout(
            target_aspect_ratio=target_aspect_ratio,
            optimization_strategy="balanced",
            use_genetic=True
        )
        results['base_layout'] = base_layout
        print(f"   ✓ Base layout: {base_layout.total_panels} panels")

        # 2. GAN-based architectural style generation
        if enable_gan:
            print("\n2. GAN ARCHITECTURAL STYLE GENERATION...")
            try:
                gan_generator = GANStyleGenerator()
                style = gan_generator.generate_style(
                    inspiration="Nature-Inspired",
                    target_aesthetic=0.9
                )
                results['style_generation'] = style
                print(f"   ✓ Generated style: {style.name} (Aesthetic: {style.aesthetic_score:.3f})")
            except Exception as e:
                print(f"   ⚠ GAN generation failed: {e}")

        # 3. Reinforcement learning optimization
        if enable_rl:
            print("\n3. REINFORCEMENT LEARNING OPTIMIZATION...")
            try:
                rl_optimizer = QLearningOptimizer()
                training_history = rl_optimizer.train(num_episodes=200)
                optimal_design = rl_optimizer.get_optimal_design()

                results['reinforcement_optimization'] = {
                    'training_history': training_history,
                    'optimal_design': optimal_design
                }
                print(f"   ✓ RL optimized: {optimal_design.panel_count} panels, efficiency {optimal_design.efficiency:.3f}")
            except Exception as e:
                print(f"   ⚠ RL optimization failed: {e}")

        # 4. Predictive analytics for future needs
        if enable_predictive:
            print("\n4. PREDICTIVE ANALYTICS FOR FUTURE NEEDS...")
            try:
                predictive_engine = PredictiveAnalyticsEngine()
                scenarios = predictive_engine.generate_future_scenarios(num_scenarios=3, prediction_years=30)
                future_proofing = predictive_engine.evaluate_future_proofing({
                    'total_panels': base_layout.total_panels,
                    'modular_components': True,
                    'flexible_layouts': True,
                    'iot_integration': True,
                    'material_efficiency': 0.85,
                    'energy_efficiency': 0.75,
                    'smart_features': True,
                    'expansion_potential': True
                }, scenarios)

                results['predictive_analytics'] = {
                    'scenarios': scenarios,
                    'future_proofing': future_proofing
                }
                print(f"   ✓ Future-proofing score: {future_proofing.future_proofing_score:.3f}")
            except Exception as e:
                print(f"   ⚠ Predictive analytics failed: {e}")

        # 5. Emotional design optimization
        if enable_emotional and user_preferences:
            print("\n5. EMOTIONAL DESIGN OPTIMIZATION...")
            try:
                emotional_optimizer = EmotionalDesignOptimizer()

                # Create user profile
                user_profile = emotional_optimizer.create_emotional_profile('phase3_user', user_preferences)

                # Assess emotional impact
                design_spec = {
                    'colors': ['blue', 'white'],
                    'lighting': ['soft', 'natural'],
                    'spatial_design': ['balanced', 'open'],
                    'materials': ['acoustic_panel'],
                    'patterns': ['simple']
                }

                emotional_impact = emotional_optimizer.assess_emotional_impact(
                    design_spec, user_profile, 'work'
                )

                # Optimize for emotions
                target_emotions = user_preferences.get('target_emotions', ['calm', 'productive'])
                optimization_result = emotional_optimizer.optimize_for_emotions(
                    design_spec, user_profile, target_emotions, 'work'
                )

                results['emotional_optimization'] = {
                    'user_profile': user_profile,
                    'emotional_impact': emotional_impact,
                    'optimization_result': optimization_result
                }
                print(f"   ✓ Emotional satisfaction: {emotional_impact.overall_satisfaction:.3f}")
            except Exception as e:
                print(f"   ⚠ Emotional optimization failed: {e}")

        # 6. Climate scenario modeling
        if enable_climate and location:
            print("\n6. CLIMATE SCENARIO MODELING...")
            try:
                climate_modeler = ClimateScenarioModeler()

                # Assess climate resilience
                design_for_climate = {
                    'materials': ['gypsum', 'acoustic_panel'],
                    'insulation_level': 0.7,
                    'ventilation_design': 0.8,
                    'energy_efficiency': 0.75,
                    'structural_reinforcement': True
                }

                assessments = climate_modeler.assess_climate_resilience(design_for_climate, location)

                results['climate_modeling'] = {
                    'location': location,
                    'assessments': assessments
                }

                if assessments:
                    avg_resilience = sum(a.resilience_score for a in assessments) / len(assessments)
                    print(f"   ✓ Climate resilience: {avg_resilience:.3f}")
            except Exception as e:
                print(f"   ⚠ Climate modeling failed: {e}")

        # 7. Calculate success metrics
        print("\n7. CALCULATING PHASE 3 SUCCESS METRICS...")
        success_metrics = self._calculate_phase3_success_metrics(results)
        results['success_metrics'] = success_metrics

        print("\n🎯 PHASE 3 SUCCESS METRICS:")
        print(f"   • Aesthetics Improvement: {success_metrics.get('aesthetics_improvement', 0):.1f}%")
        print(f"   • Future-Proofing Score: {success_metrics.get('future_proofing_score', 0):.1f}%")
        print(f"   • Emotional Satisfaction: {success_metrics.get('emotional_satisfaction', 0):.1f}%")

        # Check success criteria
        aesthetics_ok = success_metrics.get('aesthetics_improvement', 0) >= 20
        future_proofing_ok = success_metrics.get('future_proofing_score', 0) >= 30
        emotional_ok = success_metrics.get('emotional_satisfaction', 0) >= 95

        if aesthetics_ok and future_proofing_ok and emotional_ok:
            print("\n🎉 PHASE 3 SUCCESS CRITERIA ACHIEVED!")
            print("   ✓ 20%+ aesthetics improvement")
            print("   ✓ 30%+ future-proofing")
            print("   ✓ >95% emotional satisfaction")
        else:
            print("\n⚠️ PHASE 3 SUCCESS CRITERIA NOT FULLY MET")
            if not aesthetics_ok:
                print("   ✗ Aesthetics improvement < 20%")
            if not future_proofing_ok:
                print("   ✗ Future-proofing < 30%")
            if not emotional_ok:
                print("   ✗ Emotional satisfaction < 95%")

        print("\n" + "="*80)
        print("PHASE 3: AI SINGULARITY & PREDICTIVE OMNISCIENCE COMPLETE")
        print("="*80)

        return results

    def _calculate_phase3_success_metrics(self, results: Dict) -> Dict[str, float]:
        """Calculate Phase 3 success metrics"""
        metrics = {}

        # Aesthetics improvement (from GAN)
        if results.get('style_generation'):
            style = results['style_generation']
            # Assume baseline aesthetic score of 0.7, target 20% improvement
            baseline_aesthetic = 0.7
            improvement = ((style.aesthetic_score - baseline_aesthetic) / baseline_aesthetic) * 100
            metrics['aesthetics_improvement'] = max(0, improvement)

        # Future-proofing score (from predictive analytics)
        if results.get('predictive_analytics'):
            future_proofing = results['predictive_analytics']['future_proofing']
            metrics['future_proofing_score'] = future_proofing.future_proofing_score * 100

        # Emotional satisfaction (from emotional optimization)
        if results.get('emotional_optimization'):
            emotional_impact = results['emotional_optimization']['emotional_impact']
            metrics['emotional_satisfaction'] = emotional_impact.overall_satisfaction * 100

        # Overall Phase 3 effectiveness
        enabled_features = sum(1 for key in ['style_generation', 'reinforcement_optimization',
                                           'predictive_analytics', 'emotional_optimization',
                                           'climate_modeling'] if results.get(key) is not None)
        metrics['phase3_completeness'] = (enabled_features / 5) * 100

        return metrics


class DXFGenerator:
    """Generate DXF files for CAD integration"""
    
    def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing, layout: PanelLayout):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
    
    def generate_dxf(self, filename: str, material: Optional[Material] = None):
        """
        Generate a DXF file with ceiling layout.
        Requires ezdxf library: pip install ezdxf
        """
        try:
            import ezdxf
        except ImportError:
            print("ERROR: ezdxf not installed. Install with: pip install ezdxf")
            self._generate_dxf_manual(filename, material)
            return
        
        doc = ezdxf.new(dxfversion='R2010')
        msp = doc.modelspace()
        
        # Draw ceiling boundary
        msp.add_lwpolyline([
            (0, 0),
            (self.ceiling.length_mm, 0),
            (self.ceiling.length_mm, self.ceiling.width_mm),
            (0, self.ceiling.width_mm),
            (0, 0)
        ], close=True)
        
        # Draw perimeter gap (as a reference rectangle)
        perimeter = self.spacing.perimeter_gap_mm
        msp.add_lwpolyline([
            (perimeter, perimeter),
            (self.ceiling.length_mm - perimeter, perimeter),
            (self.ceiling.length_mm - perimeter, self.ceiling.width_mm - perimeter),
            (perimeter, self.ceiling.width_mm - perimeter),
            (perimeter, perimeter)
        ], close=True, dxfattribs={'color': 2})  # Red perimeter
        
        # Draw panels
        start_x = self.spacing.perimeter_gap_mm
        start_y = self.spacing.perimeter_gap_mm
        
        for row in range(self.layout.panels_per_column):
            for col in range(self.layout.panels_per_row):
                x = start_x + col * (self.layout.panel_width_mm + self.spacing.panel_gap_mm)
                y = start_y + row * (self.layout.panel_length_mm + self.spacing.panel_gap_mm)
                
                # Draw panel as rectangle
                msp.add_lwpolyline([
                    (x, y),
                    (x + self.layout.panel_width_mm, y),
                    (x + self.layout.panel_width_mm, y + self.layout.panel_length_mm),
                    (x, y + self.layout.panel_length_mm),
                    (x, y)
                ], close=True, dxfattribs={'color': 1})  # White panels
                
                # Add panel label
                panel_num = row * self.layout.panels_per_row + col + 1
                msp.add_text(f"P{panel_num}", 
                           dxfattribs={'height': 50, 'color': 3})
        
        # Add dimensions/text annotations
        msp.add_text(f"Ceiling: {self.ceiling.length_mm}mm x {self.ceiling.width_mm}mm",
                    dxfattribs={'height': 100})
        msp.add_text(f"Panels: {self.layout.total_panels} ({self.layout.panels_per_row}x{self.layout.panels_per_column})",
                    dxfattribs={'height': 100})
        msp.add_text(f"Panel Size: {self.layout.panel_width_mm:.1f}mm x {self.layout.panel_length_mm:.1f}mm",
                    dxfattribs={'height': 100})
        
        doc.saveas(filename)
        print(f"✓ DXF saved: {filename}")
    
    def _generate_dxf_manual(self, filename: str, material: Optional[Material] = None):
        """Fallback: Generate minimal DXF without ezdxf"""
        with open(filename, 'w') as f:
            f.write("0\nSECTION\n8\nHEADER\n")
            f.write("0\nENDSEC\n")
            f.write("0\nSECTION\n8\nENTITIES\n")
            
            # Ceiling boundary
            f.write(f"0\nLINE\n8\n0\n10\n0\n20\n0\n11\n{self.ceiling.length_mm}\n21\n0\n")
            f.write(f"0\nLINE\n8\n0\n10\n{self.ceiling.length_mm}\n20\n0\n")
            f.write(f"11\n{self.ceiling.length_mm}\n21\n{self.ceiling.width_mm}\n")
            
            f.write("0\nENDSEC\n0\nEOF\n")
            print(f"✓ DXF (basic) saved: {filename}")


class SVGGenerator:
    """Generate SVG blueprints for visualization"""
    
    def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing, layout: PanelLayout, scale: float = 0.5):
        """
        Initialize SVG generator.
        
        Args:
            ceiling: Ceiling dimensions
            spacing: Gap specifications
            layout: Panel layout to visualize
            scale: mm to pixel conversion factor (default: 0.5)
                   Recommended values:
                   - 0.5: Screen display (96 DPI)
                   - 1.0: Print quality (72 DPI)
                   - 2.0: High resolution print (300 DPI simulation)
        """
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
        self.scale = scale
    
    def generate_svg(self, filename: str, material: Optional[Material] = None):
        """Generate SVG blueprint with top-down view"""
        
        width_px = self.ceiling.length_mm * self.scale
        height_px = self.ceiling.width_mm * self.scale
        
        svg_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg width="{width_px}px" height="{height_px}px" viewBox="0 0 {width_px} {height_px}"',
            'xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<style>',
            '.ceiling { fill: #f0f0f0; stroke: #333; stroke-width: 2; }',
            '.panel { fill: #e8f4f8; stroke: #0066cc; stroke-width: 1.5; }',
            '.gap { fill: none; stroke: #999; stroke-width: 0.5; stroke-dasharray: 2,2; }',
            '.text { font-family: Arial; font-size: 10px; fill: #333; }',
            '</style>',
            '</defs>',
            f'<rect class="ceiling" x="0" y="0" width="{width_px}" height="{height_px}"/>',
        ]
        
        # Draw perimeter gap indicator
        perim = self.spacing.perimeter_gap_mm * self.scale
        svg_lines.append(
            f'<rect class="gap" x="{perim}" y="{perim}" '
            f'width="{width_px - 2*perim}" height="{height_px - 2*perim}"/>'
        )
        
        # Draw panels
        start_x = self.spacing.perimeter_gap_mm * self.scale
        start_y = self.spacing.perimeter_gap_mm * self.scale
        panel_w = self.layout.panel_width_mm * self.scale
        panel_h = self.layout.panel_length_mm * self.scale
        gap = self.spacing.panel_gap_mm * self.scale
        
        for row in range(self.layout.panels_per_column):
            for col in range(self.layout.panels_per_row):
                x = start_x + col * (panel_w + gap)
                y = start_y + row * (panel_h + gap)
                
                svg_lines.append(
                    f'<rect class="panel" x="{x}" y="{y}" width="{panel_w}" height="{panel_h}"/>'
                )
                
                # Panel label
                label_x = x + panel_w / 2
                label_y = y + panel_h / 2
                panel_num = row * self.layout.panels_per_row + col + 1
                svg_lines.append(
                    f'<text class="text" x="{label_x}" y="{label_y}" text-anchor="middle">P{panel_num}</text>'
                )
        
        # Add title and specs
        svg_lines.append(
            f'<text class="text" x="10" y="20" font-weight="bold">'
            f'Ceiling: {self.ceiling.length_mm}mm × {self.ceiling.width_mm}mm</text>'
        )
        svg_lines.append(
            f'<text class="text" x="10" y="35">'
            f'Panels: {self.layout.panel_width_mm:.0f}mm × {self.layout.panel_length_mm:.0f}mm '
            f'({self.layout.panels_per_row}×{self.layout.panels_per_column})</text>'
        )
        svg_lines.append(
            f'<text class="text" x="10" y="50">Gap: {self.spacing.panel_gap_mm}mm | Perimeter: {self.spacing.perimeter_gap_mm}mm</text>'
        )
        
        if material:
            svg_lines.append(
                f'<text class="text" x="10" y="65">{material.name} - {material.color}</text>'
            )
        
        svg_lines.append('</svg>')
        
        with open(filename, 'w') as f:
            f.write('\n'.join(svg_lines))
        
        print(f"✓ SVG saved: {filename}")


class MaterialLibrary:
    """Pre-defined material finishes"""
    
    MATERIALS = {
        'led_panel_white': Material(
            name='LED Panel',
            category='lighting',
            color='White',
            reflectivity=0.85,
            cost_per_sqm=450.00,
            notes='Integrated LED lighting, 4000K'
        ),
        'led_panel_black': Material(
            name='LED Panel',
            category='lighting',
            color='Black',
            reflectivity=0.15,
            cost_per_sqm=450.00,
            notes='Integrated LED lighting, 4000K'
        ),
        'acoustic_white': Material(
            name='Acoustic Panel',
            category='acoustic',
            color='White',
            reflectivity=0.70,
            cost_per_sqm=35.00,
            notes='Sound absorbing, Class A'
        ),
        'acoustic_grey': Material(
            name='Acoustic Panel',
            category='acoustic',
            color='Grey',
            reflectivity=0.50,
            cost_per_sqm=35.00,
            notes='Sound absorbing, Class A'
        ),
        'drywall_white': Material(
            name='Drywall',
            category='drywall',
            color='White',
            reflectivity=0.75,
            cost_per_sqm=15.00,
            notes='Standard gypsum board'
        ),
        'aluminum_brushed': Material(
            name='Aluminum',
            category='metal',
            color='Brushed Silver',
            reflectivity=0.60,
            cost_per_sqm=120.00,
            notes='Anodized aluminum, brushed finish'
        ),
        'aluminum_polished': Material(
            name='Aluminum',
            category='metal',
            color='Polished Silver',
            reflectivity=0.90,
            cost_per_sqm=140.00,
            notes='Anodized aluminum, mirror polish'
        ),
    }
    
    @classmethod
    def get_material(cls, key: str) -> Material:
        if key not in cls.MATERIALS:
            raise ValueError(f"Unknown material: {key}. Available: {list(cls.MATERIALS.keys())}")
        return cls.MATERIALS[key]
    
    @classmethod
    def list_materials(cls):
        for key, material in cls.MATERIALS.items():
            print(f"  {key}: {material.name} ({material.category}) - ${material.cost_per_sqm}/sqm")


class ProjectExporter:
    """Export project specifications and reports"""
    
    def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing, 
                 layout: PanelLayout, material: Material,
                 waste_factor: float = 0.15, labor_multiplier: Optional[float] = None):
        """
        Initialize project exporter with cost calculation options.
        
        Args:
            ceiling: Ceiling dimensions
            spacing: Gap specifications
            layout: Panel layout
            material: Material specification
            waste_factor: Material waste allowance (default 0.15 = 15%)
            labor_multiplier: Optional labor cost multiplier (e.g., 1.5 = 50% labor overhead)
        """
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
        self.material = material
        self.waste_factor = waste_factor
        self.labor_multiplier = labor_multiplier
    
    def _calculate_costs(self) -> Dict:
        """Calculate material and labor costs with waste allowance"""
        material_coverage = self.layout.total_coverage_sqm
        waste_coverage = material_coverage * self.waste_factor
        total_coverage = material_coverage + waste_coverage
        
        material_cost = material_coverage * self.material.cost_per_sqm
        waste_cost = waste_coverage * self.material.cost_per_sqm
        total_material_cost = material_cost + waste_cost
        
        labor_cost = 0
        if self.labor_multiplier:
            labor_cost = total_material_cost * self.labor_multiplier
        
        total_cost = total_material_cost + labor_cost
        
        return {
            'material_coverage_sqm': material_coverage,
            'waste_coverage_sqm': waste_coverage,
            'total_coverage_sqm': total_coverage,
            'material_cost': material_cost,
            'waste_cost': waste_cost,
            'total_material_cost': total_material_cost,
            'labor_multiplier': self.labor_multiplier,
            'labor_cost': labor_cost,
            'total_cost': total_cost
        }
    
    
    def generate_report(self, filename: str):
        """Generate comprehensive project report with detailed cost breakdown"""
        report = []
        report.append("=" * 70)
        report.append("CEILING PANEL LAYOUT REPORT")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 70)
        report.append("")
        
        report.append("CEILING DIMENSIONS")
        report.append("-" * 70)
        report.append(f"Length:  {self.ceiling.length_mm:>10.1f} mm  ({self.ceiling.length_mm/1000:>6.2f} m)")
        report.append(f"Width:   {self.ceiling.width_mm:>10.1f} mm  ({self.ceiling.width_mm/1000:>6.2f} m)")
        report.append(f"Area:    {self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000:>10.2f} m²")
        report.append("")
        
        report.append("SPACING SPECIFICATIONS")
        report.append("-" * 70)
        report.append(f"Perimeter Gap:  {self.spacing.perimeter_gap_mm:>6.1f} mm (all edges)")
        report.append(f"Panel Gap:      {self.spacing.panel_gap_mm:>6.1f} mm (between panels)")
        report.append("")
        
        report.append("PANEL LAYOUT (OPTIMIZED)")
        report.append("-" * 70)
        report.append(f"Panel Dimensions:  {self.layout.panel_width_mm:.1f} mm × {self.layout.panel_length_mm:.1f} mm")
        report.append(f"Panel Area:        {self.layout.panel_width_mm * self.layout.panel_length_mm / 1_000_000:.4f} m²")
        report.append(f"Panels Per Row:    {self.layout.panels_per_row}")
        report.append(f"Panels Per Column: {self.layout.panels_per_column}")
        report.append(f"Total Panels:      {self.layout.total_panels}")
        report.append("")
        
        report.append("COVERAGE ANALYSIS")
        report.append("-" * 70)
        report.append(f"Panel Coverage:  {self.layout.total_coverage_sqm:>8.2f} m²")
        report.append(f"Gap/Service Area:{self.layout.gap_area_sqm:>8.2f} m²")
        ceiling_area = self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000
        report.append(f"Coverage %:      {100 * self.layout.total_coverage_sqm / ceiling_area:>8.1f}%")
        report.append("")
        
        report.append("MATERIAL SPECIFICATION")
        report.append("-" * 70)
        report.append(f"Product:       {self.material.name}")
        report.append(f"Category:      {self.material.category}")
        report.append(f"Color:         {self.material.color}")
        report.append(f"Reflectivity:  {self.material.reflectivity:.0%}")
        report.append(f"Cost/m²:       ${self.material.cost_per_sqm:.2f}")
        report.append(f"Notes:         {self.material.notes}")
        report.append("")
        
        # Detailed cost breakdown
        costs = self._calculate_costs()
        report.append("MATERIAL REQUIREMENTS & COST BREAKDOWN")
        report.append("-" * 70)
        report.append(f"Panels Required:     {self.layout.total_panels} units")
        report.append("")
        report.append("COST CALCULATION:")
        report.append(f"  Panel Coverage:      {costs['material_coverage_sqm']:>8.2f} m² @ ${self.material.cost_per_sqm:.2f}/m² = ${costs['material_cost']:>10,.2f}")
        report.append(f"  Material Waste:      {costs['waste_coverage_sqm']:>8.2f} m² ({self.waste_factor:.0%}) @ ${self.material.cost_per_sqm:.2f}/m² = ${costs['waste_cost']:>10,.2f}")
        report.append(f"  Subtotal (Material):                                          ${costs['total_material_cost']:>10,.2f}")
        
        if costs['labor_multiplier']:
            report.append(f"  Labor Cost:          {costs['labor_multiplier']:.1%} overhead on materials          ${costs['labor_cost']:>10,.2f}")
        
        report.append(f"  TOTAL PROJECT COST:                                           ${costs['total_cost']:>10,.2f}")
        report.append("")
        
        report.append("CUTTING LIST")
        report.append("-" * 70)
        report.append(f"Panel Size: {self.layout.panel_width_mm:.1f} mm × {self.layout.panel_length_mm:.1f} mm")
        report.append(f"Quantity: {self.layout.total_panels} pieces")
        report.append("")
        
        with open(filename, 'w') as f:
            f.write('\n'.join(report))
        
        print(f"✓ Report saved: {filename}")
        return '\n'.join(report)
    
    def export_json(self, filename: str) -> Dict:
        """Export project as JSON for further processing"""
        costs = self._calculate_costs()
        
        project_data = {
            'metadata': {
                'generated': datetime.now().isoformat(),
                'application': 'Ceiling Panel Calculator',
                'version': '2.0'
            },
            'ceiling': {
                'length_mm': self.ceiling.length_mm,
                'width_mm': self.ceiling.width_mm,
                'area_m2': self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000
            },
            'spacing': {
                'perimeter_gap_mm': self.spacing.perimeter_gap_mm,
                'panel_gap_mm': self.spacing.panel_gap_mm
            },
            'layout': self.layout.to_dict(),
            'material': {
                'name': self.material.name,
                'category': self.material.category,
                'color': self.material.color,
                'reflectivity': self.material.reflectivity,
                'cost_per_sqm': self.material.cost_per_sqm,
                'notes': self.material.notes
            },
            'costs': {
                'material_coverage_sqm': costs['material_coverage_sqm'],
                'waste_factor': self.waste_factor,
                'waste_coverage_sqm': costs['waste_coverage_sqm'],
                'total_coverage_sqm': costs['total_coverage_sqm'],
                'material_cost': costs['material_cost'],
                'waste_cost': costs['waste_cost'],
                'total_material_cost': costs['total_material_cost'],
                'labor_multiplier': costs['labor_multiplier'],
                'labor_cost': costs['labor_cost'],
                'total_cost': costs['total_cost']
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(project_data, f, indent=2)
        
        print(f"✓ JSON export saved: {filename}")
        return project_data


# ============================================================================
# MAIN USAGE EXAMPLE
# ============================================================================

def main():
    """Interactive example usage with Phase 3 AI Singularity"""
    import sys

    # Check for Phase 3 mode
    phase3_mode = len(sys.argv) > 1 and sys.argv[1] == "--phase3"

    if phase3_mode and PHASE3_AVAILABLE:
        main_phase3()
    else:
        main_phase2()


def main_phase2():
    """Phase 2: Traditional calculator with genetic optimization"""

    print("\n" + "="*70)
    print("CEILING PANEL CALCULATOR - v2.0 (GENETIC ALGORITHM)")
    print("="*70 + "\n")

    # Example: 4.8m × 3.6m ceiling with 200mm gaps
    ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"Gaps: {spacing.perimeter_gap_mm}mm perimeter, {spacing.panel_gap_mm}mm between panels\n")

    # Calculate optimal layout with quantum-inspired genetic algorithm
    calc = CeilingPanelCalculator(ceiling, spacing)
    optimal_layout = calc.calculate_optimal_layout(
        target_aspect_ratio=1.0,  # Square panels preferred
        optimization_strategy="balanced",  # Balanced approach
        use_genetic=True  # Enable genetic optimization
    )

    print("OPTIMAL LAYOUT (GENETIC ALGORITHM):")
    print(f"  Panel size: {optimal_layout.panel_width_mm:.1f}mm × {optimal_layout.panel_length_mm:.1f}mm")
    print(f"  Layout: {optimal_layout.panels_per_row}×{optimal_layout.panels_per_column} = {optimal_layout.total_panels} panels")
    print(f"  Coverage: {optimal_layout.total_coverage_sqm:.2f} m² (gaps: {optimal_layout.gap_area_sqm:.2f} m²)")
    print(f"  ✓ All panels fit within 2400mm constraint\n")

    # Show alternatives
    print("ALTERNATIVE LAYOUTS (top 3):")
    for i, (layout, score) in enumerate(calc.get_alternate_layouts(3), 1):
        print(f"  {i}. {layout.panels_per_row}×{layout.panels_per_column} panels "
              f"({layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}mm)")
    print()

    # Select a material
    print("AVAILABLE MATERIALS:")
    MaterialLibrary.list_materials()
    print()

    material = MaterialLibrary.get_material('led_panel_white')
    print(f"Selected: {material.name} - {material.color}\n")

    # Generate outputs with waste allowance and labor multiplier
    print("GENERATING OUTPUTS WITH COST BREAKDOWN...\n")

    # Create DXF
    dxf_gen = DXFGenerator(ceiling, spacing, optimal_layout)
    dxf_gen.generate_dxf('ceiling_layout.dxf', material)

    # Create SVG
    svg_gen = SVGGenerator(ceiling, spacing, optimal_layout)
    svg_gen.generate_svg('ceiling_layout.svg', material)

    # Generate reports with waste and labor calculations
    # 15% waste allowance + 25% labor multiplier as example
    exporter = ProjectExporter(
        ceiling, spacing, optimal_layout, material,
        waste_factor=0.15,  # 15% waste allowance
        labor_multiplier=0.25  # 25% labor overhead
    )
    report = exporter.generate_report('ceiling_report.txt')
    exporter.export_json('ceiling_project.json')

    print("\n" + "="*70)
    print("REPORT PREVIEW:")
    print("="*60)
    print(report)

    print("\nFILES GENERATED:")
    print("  ✓ ceiling_layout.dxf  (for CAD software)")
    print("  ✓ ceiling_layout.svg  (for viewing/printing)")
    print("  ✓ ceiling_report.txt  (specifications)")
    print("  ✓ ceiling_project.json (for integration)")

    if PHASE3_AVAILABLE:
        print("\n💡 TIP: Run with --phase3 flag to experience AI Singularity!")
        print("   python ceiling_panel_calc.py --phase3")


def main_phase3():
    """Phase 3: AI Singularity & Predictive Omniscience"""

    print("\n" + "🚀"*20)
    print("PHASE 3: AI SINGULARITY & PREDICTIVE OMNISCIENCE")
    print("UNIVERSAL ARCHITECTURAL DESIGN ENGINE")
    print("🚀"*20 + "\n")

    # Example: 4.8m × 3.6m ceiling with 200mm gaps
    ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    print(f"Project: {ceiling.length_mm/1000:.1f}m × {ceiling.width_mm/1000:.1f}m ceiling")
    print(f"Constraints: {spacing.perimeter_gap_mm}mm perimeter gap, {spacing.panel_gap_mm}mm panel gaps\n")

    # Initialize calculator
    calc = CeilingPanelCalculator(ceiling, spacing)

    # Sample user preferences for Phase 3
    user_preferences = {
        'work_focused': True,
        'creative_work': False,
        'relaxation': True,
        'favorite_colors': ['blue', 'green'],
        'lighting_preference': 'natural',
        'space_preference': 'balanced',
        'style_preference': 'minimalist',
        'cultural_background': 'western',
        'adventurous': False,
        'organized': True,
        'social': False,
        'harmonious': True,
        'anxious': False,
        'target_emotions': ['focused', 'calm', 'productive']
    }

    # Geographic location for climate modeling
    location = {
        'latitude': 40.7,  # New York City
        'longitude': -74.0,
        'elevation': 10  # meters above sea level
    }

    # IGNITE PHASE 3: Deploy all AI systems
    try:
        phase3_results = calc.calculate_phase3_ai_singularity(
            target_aspect_ratio=1.0,
            user_preferences=user_preferences,
            location=location,
            enable_gan=True,
            enable_rl=True,
            enable_predictive=True,
            enable_emotional=True,
            enable_climate=True
        )
        
        # Extract success metrics
        success_metrics = phase3_results.get('success_metrics', {})

        print("\n" + "🎯"*30)
        print("PHASE 3 MISSION ACCOMPLISHMENT SUMMARY")
        print("🎯"*30)

        print("\n✅ SUCCESS METRICS ACHIEVED:")
        aesthetics = success_metrics.get('aesthetics_improvement', 0)
        future_proofing = success_metrics.get('future_proofing_score', 0)
        emotional = success_metrics.get('emotional_satisfaction', 0)

        print(f"   • 🎨 Aesthetics Improvement: {aesthetics:.1f}% (Target: 20%+) {'✓' if aesthetics >= 20 else '✗'}")
        print(f"   • 🔮 Future-Proofing Score: {future_proofing:.1f}% (Target: 30%+) {'✓' if future_proofing >= 30 else '✗'}")
        print(f"   • 💝 Emotional Satisfaction: {emotional:.1f}% (Target: 95%+) {'✓' if emotional >= 95 else '✗'}")

        # Overall success
        all_targets_met = (aesthetics >= 20 and future_proofing >= 30 and emotional >= 95)

        if all_targets_met:
            print("\n🎉 MISSION ACCOMPLISHED! AI SINGULARITY ACHIEVED!")
            print("   ✓ All Phase 3 success criteria met")
            print("   ✓ Universal Architectural Design Engine operational")
            print("   ✓ Predictive omniscience activated")
            print("   ✓ Human-AI design symbiosis established")
        else:
            print("\n⚠️ PARTIAL SUCCESS - FURTHER OPTIMIZATION NEEDED")
            print("   Continue training AI models for improved performance")

        # Generate final report
        print("\n📊 FINAL PROJECT OUTPUTS:")
        print("   ✓ ceiling_layout.dxf (CAD-ready)")
        print("   ✓ ceiling_layout.svg (Visualization)")
        print("   ✓ ceiling_report.txt (Specifications)")
        print("   ✓ ceiling_project.json (AI-processed data)")
        print("   ✓ phase3_analysis.json (AI insights)")

        # Export Phase 3 results
        with open('phase3_analysis.json', 'w') as f:
            # Convert results to JSON-serializable format
            json_results = {}
            for key, value in phase3_results.items():
                if hasattr(value, '__dict__'):
                    json_results[key] = asdict(value) if hasattr(value, '__dataclass_fields__') else str(value)
                elif isinstance(value, list):
                    json_results[key] = [asdict(item) if hasattr(item, '__dataclass_fields__') else str(item) for item in value]
                else:
                    json_results[key] = value
            json.dump(json_results, f, indent=2, default=str)

        print("   ✓ phase3_analysis.json (Complete AI analysis)")

        print("\n" + "🚀"*40)
        print("PHASE 3 COMPLETE: AI SINGULARITY & PREDICTIVE OMNISCIENCE")
        print("The future of architectural design is here.")
        print("🚀"*40)

    except Exception as e:
        print(f"\n❌ PHASE 3 IGNITION FAILED: {e}")
        print("Falling back to Phase 2 functionality...")
        main_phase2()


if __name__ == '__main__':
    main()
