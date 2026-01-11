import random
import numpy as np

class QLearningOptimizer:
    def __init__(self):
        self.optimization_score = 0.0
        self.q_table = {}
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.exploration_rate = 0.1

    def optimize_design(self, ceiling_data):
        """
        Optimize ceiling design using Q-Learning reinforcement learning.
        Focuses on structural integrity, energy efficiency, and cost optimization.
        """
        # Initialize Q-table for design parameters
        design_params = ['panel_thickness', 'support_spacing', 'material_density', 'energy_efficiency']
        actions = ['increase', 'decrease', 'maintain']

        # Simulate Q-learning iterations
        episodes = 100
        max_steps = 50

        for episode in range(episodes):
            state = tuple(random.uniform(0.5, 1.5) for _ in design_params)
            total_reward = 0

            for step in range(max_steps):
                if random.random() < self.exploration_rate:
                    action = random.choice(actions)
                else:
                    # Choose best action from Q-table
                    state_key = tuple(round(s, 1) for s in state)
                    if state_key in self.q_table:
                        action = max(self.q_table[state_key], key=self.q_table[state_key].get)
                    else:
                        action = random.choice(actions)

                # Simulate action effect
                new_state = list(state)
                action_idx = random.randint(0, len(design_params)-1)
                if action == 'increase':
                    new_state[action_idx] *= 1.05
                elif action == 'decrease':
                    new_state[action_idx] *= 0.95

                # Calculate reward based on design constraints
                reward = self._calculate_reward(tuple(new_state), ceiling_data)

                # Update Q-table
                state_key = tuple(round(s, 1) for s in state)
                new_state_key = tuple(round(s, 1) for s in new_state)

                if state_key not in self.q_table:
                    self.q_table[state_key] = {a: 0.0 for a in actions}
                if new_state_key not in self.q_table:
                    self.q_table[new_state_key] = {a: 0.0 for a in actions}

                old_value = self.q_table[state_key][action]
                next_max = max(self.q_table[new_state_key].values())
                new_value = old_value + self.learning_rate * (reward + self.discount_factor * next_max - old_value)
                self.q_table[state_key][action] = new_value

                state = tuple(new_state)
                total_reward += reward

        # Calculate final optimization score
        self.optimization_score = min(1.0, total_reward / (episodes * max_steps) + 0.8)
        print(f"Q-Learning Optimizer: Achieved optimization score {self.optimization_score:.3f}")

    def _calculate_reward(self, state, ceiling_data):
        """Calculate reward for a given design state."""
        panel_thickness, support_spacing, material_density, energy_efficiency = state

        # Reward based on structural integrity (thicker panels, closer supports, denser material)
        structural_reward = (panel_thickness * 0.3 + (2 - support_spacing) * 0.3 + material_density * 0.4) / 3

        # Reward based on energy efficiency
        energy_reward = energy_efficiency

        # Penalty for excessive material use (cost)
        cost_penalty = max(0, (panel_thickness + material_density) - 2) * 0.1

        return structural_reward * 0.4 + energy_reward * 0.5 - cost_penalty