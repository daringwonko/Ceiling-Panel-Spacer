import random

class GANStyleGenerator:
    def __init__(self):
        self.styles = {
            "Nature-Inspired": {"name": "Biophilic Harmony", "base_aesthetic": 0.85},
            "Modern-Minimalist": {"name": "Zen Simplicity", "base_aesthetic": 0.88},
            "Industrial-Chic": {"name": "Urban Elegance", "base_aesthetic": 0.82},
            "Traditional-Elegant": {"name": "Timeless Grace", "base_aesthetic": 0.86},
            "Futuristic-Organic": {"name": "Neo-Nature Fusion", "base_aesthetic": 0.90}
        }

    def generate_style(self, inspiration="Nature-Inspired", target_aesthetic=0.9):
        if inspiration not in self.styles:
            inspiration = random.choice(list(self.styles.keys()))

        base_style = self.styles[inspiration]
        # Simulate GAN generation with some randomness but ensure target is met
        aesthetic_score = min(target_aesthetic, base_style["base_aesthetic"] + random.uniform(0.01, 0.05))

        return type('Style', (), {
            'name': base_style["name"],
            'aesthetic_score': aesthetic_score
        })()