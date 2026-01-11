#!/usr/bin/env python3
"""
Quantum-Inspired Optimization Framework for Ceiling Panel Layout.

Implements real quantum-inspired algorithms including:
- Quantum tunneling simulation for escaping local optima
- Superposition-inspired population diversity
- Entanglement-inspired correlation between solutions
- Quantum annealing simulation for global optimization
"""

import numpy as np
import random
import math
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Callable, Dict, Any
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class QuantumState:
    """Represents a quantum state in the optimization landscape."""
    position: np.ndarray
    amplitude: float = 1.0
    phase: float = 0.0
    fitness: float = 0.0

    def collapse(self) -> np.ndarray:
        """Collapse quantum state to classical solution."""
        return self.position.copy()

    def interfere_with(self, other: 'QuantumState') -> 'QuantumState':
        """Quantum interference between two states."""
        phase_diff = self.phase - other.phase
        # Constructive/destructive interference based on phase
        interference_factor = math.cos(phase_diff)

        new_amplitude = math.sqrt(
            self.amplitude**2 + other.amplitude**2 +
            2 * self.amplitude * other.amplitude * interference_factor
        )

        # Position is weighted average based on amplitudes
        weight = self.amplitude / (self.amplitude + other.amplitude + 1e-10)
        new_position = weight * self.position + (1 - weight) * other.position

        return QuantumState(
            position=new_position,
            amplitude=new_amplitude,
            phase=(self.phase + other.phase) / 2,
            fitness=(self.fitness + other.fitness) / 2
        )


@dataclass
class OptimizationResult:
    """Result of quantum optimization."""
    best_solution: np.ndarray
    best_fitness: float
    iterations: int
    convergence_history: List[float] = field(default_factory=list)
    final_population: List[np.ndarray] = field(default_factory=list)
    execution_time_ms: float = 0.0


class QuantumInspiredOptimizer:
    """
    Real quantum-inspired optimization using:
    - Quantum tunneling simulation (random jumps through barriers)
    - Superposition-inspired population diversity
    - Entanglement-inspired correlation between solutions
    - Quantum annealing for temperature-based exploration
    """

    def __init__(
        self,
        population_size: int = 50,
        quantum_tunneling_rate: float = 0.1,
        initial_temperature: float = 1.0,
        cooling_rate: float = 0.95,
        entanglement_strength: float = 0.3
    ):
        self.population_size = population_size
        self.quantum_tunneling_rate = quantum_tunneling_rate
        self.initial_temperature = initial_temperature
        self.cooling_rate = cooling_rate
        self.entanglement_strength = entanglement_strength

        self.temperature = initial_temperature
        self.quantum_states: List[QuantumState] = []
        self.best_ever: Optional[QuantumState] = None

    def optimize(
        self,
        objective_func: Callable[[np.ndarray], float],
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        minimize: bool = True
    ) -> OptimizationResult:
        """
        Perform quantum-inspired optimization.

        Args:
            objective_func: Function to optimize, takes numpy array, returns float
            bounds: List of (min, max) tuples for each dimension
            max_iterations: Maximum number of iterations
            minimize: If True, minimize objective; if False, maximize

        Returns:
            OptimizationResult with best solution and metadata
        """
        start_time = datetime.now()

        # Sign flip for minimization
        sign = 1 if minimize else -1

        # Initialize quantum population
        self.quantum_states = self._initialize_quantum_population(bounds)
        self.temperature = self.initial_temperature

        convergence_history = []

        for iteration in range(max_iterations):
            # Evaluate fitness (collapse quantum states)
            for state in self.quantum_states:
                state.fitness = sign * objective_func(state.collapse())

            # Track best
            current_best = max(self.quantum_states, key=lambda s: s.fitness)
            if self.best_ever is None or current_best.fitness > self.best_ever.fitness:
                self.best_ever = QuantumState(
                    position=current_best.position.copy(),
                    amplitude=current_best.amplitude,
                    phase=current_best.phase,
                    fitness=current_best.fitness
                )

            convergence_history.append(sign * self.best_ever.fitness)

            # Quantum operations
            self.quantum_states = self._quantum_selection()
            self.quantum_states = self._quantum_crossover()
            self.quantum_states = self._quantum_tunneling(iteration, bounds)
            self.quantum_states = self._quantum_interference()

            # Annealing
            self.temperature *= self.cooling_rate

            # Check convergence
            if self._has_converged():
                logger.info(f"Converged at iteration {iteration}")
                break

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        return OptimizationResult(
            best_solution=self.best_ever.collapse(),
            best_fitness=sign * self.best_ever.fitness,
            iterations=iteration + 1,
            convergence_history=convergence_history,
            final_population=[s.collapse() for s in self.quantum_states],
            execution_time_ms=execution_time
        )

    def _initialize_quantum_population(
        self,
        bounds: List[Tuple[float, float]]
    ) -> List[QuantumState]:
        """Initialize population in quantum superposition state."""
        states = []
        dims = len(bounds)

        for _ in range(self.population_size):
            # Uniform sampling simulates superposition
            position = np.array([
                random.uniform(low, high)
                for low, high in bounds
            ])

            # Random phase and amplitude
            phase = random.uniform(0, 2 * math.pi)
            amplitude = random.uniform(0.5, 1.0)

            states.append(QuantumState(
                position=position,
                amplitude=amplitude,
                phase=phase
            ))

        return states

    def _quantum_selection(self) -> List[QuantumState]:
        """Quantum tournament selection with amplitude-weighted probability."""
        selected = []
        tournament_size = 3

        for _ in range(self.population_size):
            # Random tournament
            candidates = random.sample(self.quantum_states, tournament_size)

            # Selection probability weighted by amplitude and fitness
            weights = [
                (c.amplitude ** 2) * (c.fitness + 1e-10)
                for c in candidates
            ]
            total_weight = sum(weights)

            if total_weight > 0:
                probs = [w / total_weight for w in weights]
                winner_idx = np.random.choice(len(candidates), p=probs)
                winner = candidates[winner_idx]
            else:
                winner = max(candidates, key=lambda c: c.fitness)

            # Clone with small phase perturbation
            new_state = QuantumState(
                position=winner.position.copy(),
                amplitude=winner.amplitude,
                phase=winner.phase + random.gauss(0, 0.1),
                fitness=winner.fitness
            )
            selected.append(new_state)

        return selected

    def _quantum_crossover(self) -> List[QuantumState]:
        """Quantum-inspired crossover simulating entanglement."""
        offspring = []

        # Shuffle for random pairing
        shuffled = self.quantum_states.copy()
        random.shuffle(shuffled)

        for i in range(0, len(shuffled), 2):
            if i + 1 < len(shuffled):
                parent1, parent2 = shuffled[i], shuffled[i + 1]

                # Entanglement-inspired mixing
                alpha = random.random()

                # Position mixing
                pos1 = alpha * parent1.position + (1 - alpha) * parent2.position
                pos2 = (1 - alpha) * parent1.position + alpha * parent2.position

                # Phase correlation (entanglement)
                if random.random() < self.entanglement_strength:
                    # Correlated phases
                    phase1 = (parent1.phase + parent2.phase) / 2
                    phase2 = phase1 + math.pi  # Opposite phase
                else:
                    phase1 = parent1.phase
                    phase2 = parent2.phase

                # Average amplitudes with noise
                amp1 = (parent1.amplitude + parent2.amplitude) / 2 + random.gauss(0, 0.05)
                amp2 = (parent1.amplitude + parent2.amplitude) / 2 + random.gauss(0, 0.05)

                offspring.append(QuantumState(position=pos1, amplitude=max(0.1, amp1), phase=phase1))
                offspring.append(QuantumState(position=pos2, amplitude=max(0.1, amp2), phase=phase2))
            else:
                offspring.append(shuffled[i])

        return offspring

    def _quantum_tunneling(
        self,
        iteration: int,
        bounds: List[Tuple[float, float]]
    ) -> List[QuantumState]:
        """Simulate quantum tunneling - random jumps through energy barriers."""
        tunneled = []

        for state in self.quantum_states:
            if random.random() < self.quantum_tunneling_rate * self.temperature:
                # Quantum tunneling: jump through barrier
                # Magnitude decreases with temperature (annealing)
                jump_magnitude = self.temperature * 0.5

                # Random direction jump
                tunnel_vector = np.random.normal(0, jump_magnitude, size=len(state.position))
                new_position = state.position + tunnel_vector

                # Clamp to bounds
                new_position = np.array([
                    np.clip(new_position[i], bounds[i][0], bounds[i][1])
                    for i in range(len(bounds))
                ])

                # Phase shift from tunneling
                new_phase = state.phase + math.pi / 4

                tunneled.append(QuantumState(
                    position=new_position,
                    amplitude=state.amplitude * 0.9,  # Slight amplitude decrease
                    phase=new_phase
                ))
            else:
                tunneled.append(state)

        return tunneled

    def _quantum_interference(self) -> List[QuantumState]:
        """Apply quantum interference between nearby solutions."""
        interfered = []

        for i, state in enumerate(self.quantum_states):
            if random.random() < 0.3:  # 30% chance of interference
                # Find nearby state
                other_idx = (i + 1) % len(self.quantum_states)
                other = self.quantum_states[other_idx]

                # Apply interference
                new_state = state.interfere_with(other)
                interfered.append(new_state)
            else:
                interfered.append(state)

        return interfered

    def _has_converged(self) -> bool:
        """Check if population has converged."""
        if len(self.quantum_states) < 2:
            return False

        fitnesses = [s.fitness for s in self.quantum_states]
        return np.std(fitnesses) < 0.001


class CeilingLayoutOptimizer:
    """
    Quantum-inspired optimizer specifically for ceiling panel layouts.
    """

    def __init__(self):
        self.optimizer = QuantumInspiredOptimizer(
            population_size=75,
            quantum_tunneling_rate=0.15,
            initial_temperature=2.0,
            cooling_rate=0.98,
            entanglement_strength=0.25
        )

    def optimize_layout(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 200,
        target_aspect_ratio: float = 1.5,
        max_panel_size_mm: float = 2400
    ) -> Dict[str, Any]:
        """
        Optimize ceiling panel layout using quantum-inspired algorithm.

        Args:
            ceiling_length_mm: Ceiling length in millimeters
            ceiling_width_mm: Ceiling width in millimeters
            perimeter_gap_mm: Gap at edges
            panel_gap_mm: Gap between panels
            target_aspect_ratio: Preferred panel aspect ratio
            max_panel_size_mm: Maximum panel dimension

        Returns:
            Dictionary with optimized layout parameters
        """
        # Available space
        available_length = ceiling_length_mm - 2 * perimeter_gap_mm
        available_width = ceiling_width_mm - 2 * perimeter_gap_mm

        def objective(params: np.ndarray) -> float:
            """Objective function: minimize waste and deviation from target."""
            panels_x, panels_y = int(max(1, params[0])), int(max(1, params[1]))

            # Calculate panel dimensions
            total_gaps_x = (panels_x - 1) * panel_gap_mm
            total_gaps_y = (panels_y - 1) * panel_gap_mm

            panel_width = (available_length - total_gaps_x) / panels_x
            panel_height = (available_width - total_gaps_y) / panels_y

            # Penalties
            waste = 0

            # Penalty for exceeding max size
            if panel_width > max_panel_size_mm or panel_height > max_panel_size_mm:
                waste += 1000 * (max(panel_width, panel_height) - max_panel_size_mm)

            # Penalty for bad aspect ratio
            actual_ratio = max(panel_width, panel_height) / min(panel_width, panel_height)
            ratio_penalty = abs(actual_ratio - target_aspect_ratio) * 100

            # Penalty for very small panels
            if panel_width < 200 or panel_height < 200:
                waste += 500

            # Reward for fewer panels (less installation cost)
            panel_count = panels_x * panels_y

            # Coverage efficiency
            coverage = (panel_width * panel_height * panel_count) / (available_length * available_width)
            coverage_penalty = (1 - coverage) * 200

            return waste + ratio_penalty + coverage_penalty + panel_count * 5

        # Bounds for panel counts
        max_panels_x = int(available_length / 200)  # At least 200mm panels
        max_panels_y = int(available_width / 200)

        bounds = [
            (1, max(2, max_panels_x)),
            (1, max(2, max_panels_y))
        ]

        # Optimize
        result = self.optimizer.optimize(
            objective_func=objective,
            bounds=bounds,
            max_iterations=150,
            minimize=True
        )

        # Extract best solution
        best_panels_x = int(max(1, result.best_solution[0]))
        best_panels_y = int(max(1, result.best_solution[1]))

        # Calculate final dimensions
        total_gaps_x = (best_panels_x - 1) * panel_gap_mm
        total_gaps_y = (best_panels_y - 1) * panel_gap_mm

        panel_width = (available_length - total_gaps_x) / best_panels_x
        panel_height = (available_width - total_gaps_y) / best_panels_y

        return {
            "panels_x": best_panels_x,
            "panels_y": best_panels_y,
            "total_panels": best_panels_x * best_panels_y,
            "panel_width_mm": round(panel_width, 2),
            "panel_height_mm": round(panel_height, 2),
            "aspect_ratio": round(max(panel_width, panel_height) / min(panel_width, panel_height), 3),
            "coverage_sqm": round((panel_width * panel_height * best_panels_x * best_panels_y) / 1_000_000, 3),
            "optimization_iterations": result.iterations,
            "execution_time_ms": round(result.execution_time_ms, 2),
            "fitness": round(result.best_fitness, 4)
        }


def demonstrate_quantum_optimizer():
    """Demonstrate quantum-inspired optimization."""
    print("="*80)
    print("QUANTUM-INSPIRED CEILING PANEL OPTIMIZER")
    print("="*80)

    optimizer = CeilingLayoutOptimizer()

    # Test cases
    test_cases = [
        {"length": 4800, "width": 3600, "desc": "Small Conference Room"},
        {"length": 8000, "width": 6000, "desc": "Medium Office"},
        {"length": 12000, "width": 10000, "desc": "Large Hall"},
    ]

    for case in test_cases:
        print(f"\n--- {case['desc']} ({case['length']}mm x {case['width']}mm) ---")

        result = optimizer.optimize_layout(
            ceiling_length_mm=case["length"],
            ceiling_width_mm=case["width"],
            perimeter_gap_mm=200,
            panel_gap_mm=50
        )

        print(f"  Layout: {result['panels_x']}x{result['panels_y']} = {result['total_panels']} panels")
        print(f"  Panel Size: {result['panel_width_mm']}mm x {result['panel_height_mm']}mm")
        print(f"  Aspect Ratio: {result['aspect_ratio']}")
        print(f"  Coverage: {result['coverage_sqm']} sqm")
        print(f"  Optimization: {result['optimization_iterations']} iterations in {result['execution_time_ms']}ms")

    print("\n" + "="*80)
    print("QUANTUM-INSPIRED OPTIMIZATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_quantum_optimizer()
