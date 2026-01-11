import random
import math
from datetime import datetime, timedelta
from collections import defaultdict

class ClimateScenarioModeler:
    def __init__(self):
        self.climate_variables = {
            "temperature": {"baseline": 22.0, "variance": 5.0},
            "humidity": {"baseline": 45.0, "variance": 15.0},
            "air_quality": {"baseline": 85.0, "variance": 10.0},
            "precipitation": {"baseline": 2.5, "variance": 3.0},
            "wind_speed": {"baseline": 8.0, "variance": 4.0}
        }
        self.scenarios = {
            "business_as_usual": {"temp_increase": 2.5, "extreme_events": 1.2},
            "moderate_action": {"temp_increase": 1.8, "extreme_events": 0.9},
            "aggressive_action": {"temp_increase": 1.0, "extreme_events": 0.6},
            "breakthrough_tech": {"temp_increase": 0.5, "extreme_events": 0.3}
        }

    def model_climate_scenarios(self, time_horizon=50, current_location="global"):
        # Generate climate projections for different scenarios
        projections = {}
        adaptation_strategies = {}

        for scenario_name, params in self.scenarios.items():
            projection = self._generate_climate_projection(scenario_name, params, time_horizon)
            projections[scenario_name] = projection

            strategies = self._develop_adaptation_strategies(scenario_name, projection)
            adaptation_strategies[scenario_name] = strategies

        # Identify optimal scenario and strategies
        optimal_scenario = self._identify_optimal_scenario(projections)

        return type('ClimateModelingResult', (), {
            'projections': projections,
            'adaptation_strategies': adaptation_strategies,
            'optimal_scenario': optimal_scenario,
            'impact_assessment': self._assess_overall_impact(projections),
            'recommendations': self._generate_climate_recommendations(optimal_scenario, projections[optimal_scenario])
        })()

    def _generate_climate_projection(self, scenario, params, time_horizon):
        projection = {}
        years = list(range(0, time_horizon + 1, 5))

        for year in years:
            year_projection = {}

            # Temperature projection with compounding effects
            temp_increase = params["temp_increase"] * (year / 50) ** 0.8  # Non-linear warming
            year_projection["temperature"] = self.climate_variables["temperature"]["baseline"] + temp_increase

            # Humidity changes based on temperature
            humidity_change = temp_increase * 2.5 * (1 + random.uniform(-0.2, 0.2))
            year_projection["humidity"] = max(20, min(90, self.climate_variables["humidity"]["baseline"] + humidity_change))

            # Air quality degradation
            air_quality_decline = params["temp_increase"] * 3.0 * (year / 50) * (1 + random.uniform(-0.3, 0.3))
            year_projection["air_quality"] = max(30, self.climate_variables["air_quality"]["baseline"] - air_quality_decline)

            # Precipitation variability
            precip_change = params["extreme_events"] * 15 * math.sin(year * 0.1) + random.uniform(-5, 5)
            year_projection["precipitation"] = max(0, self.climate_variables["precipitation"]["baseline"] + precip_change)

            # Wind speed changes
            wind_change = params["extreme_events"] * 8 * (1 + random.uniform(-0.4, 0.4))
            year_projection["wind_speed"] = max(2, self.climate_variables["wind_speed"]["baseline"] + wind_change)

            # Extreme weather events frequency
            year_projection["extreme_events_frequency"] = params["extreme_events"] * (1 + year / 100)

            # Calculate composite climate stress index
            stress_factors = {
                "heat_stress": max(0, (year_projection["temperature"] - 25) / 10),
                "humidity_stress": abs(year_projection["humidity"] - 50) / 50,
                "air_quality_stress": (100 - year_projection["air_quality"]) / 100,
                "precipitation_stress": abs(year_projection["precipitation"] - 2.5) / 5,
                "wind_stress": max(0, (year_projection["wind_speed"] - 15) / 10)
            }
            year_projection["climate_stress_index"] = sum(stress_factors.values()) / len(stress_factors)

            projection[year] = year_projection

        return projection

    def _develop_adaptation_strategies(self, scenario, projection):
        strategies = {
            "thermal_management": [],
            "air_quality_systems": [],
            "water_management": [],
            "structural_adaptations": [],
            "smart_systems": []
        }

        # Analyze end-of-horizon conditions
        final_year = max(projection.keys())
        final_conditions = projection[final_year]

        # Thermal management strategies
        if final_conditions["temperature"] > 28:
            strategies["thermal_management"].extend([
                "Advanced HVAC with predictive cooling",
                "Phase-change material integration",
                "Dynamic insulation systems",
                "Radiant cooling panels"
            ])
        elif final_conditions["temperature"] > 25:
            strategies["thermal_management"].extend([
                "Enhanced ventilation systems",
                "Cool roof technologies",
                "Thermal mass optimization"
            ])

        # Air quality systems
        if final_conditions["air_quality"] < 70:
            strategies["air_quality_systems"].extend([
                "HEPA filtration with UV-C sterilization",
                "Active carbon adsorption systems",
                "Nanotechnology air purification",
                "Bio-filter integration"
            ])
        elif final_conditions["air_quality"] < 80:
            strategies["air_quality_systems"].extend([
                "Advanced particulate filtration",
                "Ozone monitoring and control"
            ])

        # Water management
        if final_conditions["precipitation"] > 5 or final_conditions["precipitation"] < 1:
            strategies["water_management"].extend([
                "Rainwater harvesting systems",
                "Greywater recycling integration",
                "Humidity control optimization",
                "Drought-resistant design features"
            ])

        # Structural adaptations
        if final_conditions["wind_speed"] > 12 or final_conditions["extreme_events_frequency"] > 1.5:
            strategies["structural_adaptations"].extend([
                "Reinforced panel connections",
                "Flexible mounting systems",
                "Impact-resistant materials",
                "Modular replacement design"
            ])

        # Smart systems
        strategies["smart_systems"].extend([
            "AI-driven climate adaptation",
            "IoT sensor networks for real-time monitoring",
            "Predictive maintenance algorithms",
            "User behavior learning systems",
            "Energy optimization based on weather patterns"
        ])

        return strategies

    def _identify_optimal_scenario(self, projections):
        scenario_scores = {}

        for scenario, projection in projections.items():
            final_year = max(projection.keys())
            final_conditions = projection[final_year]

            # Score based on multiple criteria
            environmental_score = 100 - (final_conditions["climate_stress_index"] * 20)
            adaptation_complexity = len([s for strategies in self._develop_adaptation_strategies(scenario, projection).values() for s in strategies])
            cost_efficiency = 100 - (adaptation_complexity * 2)
            user_comfort = 100 - (final_conditions["temperature"] - 22) * 5

            overall_score = (environmental_score * 0.4 + cost_efficiency * 0.3 + user_comfort * 0.3)
            scenario_scores[scenario] = overall_score

        return max(scenario_scores.keys(), key=lambda k: scenario_scores[k])

    def _assess_overall_impact(self, projections):
        impacts = {}

        for scenario, projection in projections.items():
            final_year = max(projection.keys())
            final_conditions = projection[final_year]

            impacts[scenario] = {
                "environmental_impact": final_conditions["climate_stress_index"] * 25,
                "infrastructure_cost": final_conditions["extreme_events_frequency"] * 100000,
                "health_risk": (100 - final_conditions["air_quality"]) * 0.5,
                "energy_consumption_increase": final_conditions["temperature"] * 2.5,
                "maintenance_frequency_increase": final_conditions["climate_stress_index"] * 15
            }

        return impacts

    def _generate_climate_recommendations(self, optimal_scenario, projection):
        recommendations = [
            f"Adopt {optimal_scenario.replace('_', ' ').title()} climate scenario as baseline",
            "Implement multi-layered climate adaptation systems",
            "Develop climate-resilient material specifications",
            "Create predictive maintenance schedules based on weather patterns",
            "Establish user comfort monitoring and automatic adjustments",
            "Design for modularity to allow future climate adaptations",
            "Integrate renewable energy systems for climate independence",
            "Implement water conservation and harvesting technologies",
            "Use smart materials that respond to environmental changes",
            "Establish long-term monitoring and data collection systems"
        ]

        # Add scenario-specific recommendations
        if optimal_scenario == "aggressive_action":
            recommendations.extend([
                "Prioritize energy-efficient technologies",
                "Focus on carbon-neutral material sourcing",
                "Implement comprehensive recycling programs"
            ])
        elif optimal_scenario == "breakthrough_tech":
            recommendations.extend([
                "Invest in emerging climate technologies",
                "Adopt AI-driven optimization systems",
                "Create adaptive building envelopes"
            ])

        return recommendations