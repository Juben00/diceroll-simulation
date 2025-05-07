import time
import random

class Die:
    def __init__(self, id, sides=6):
        self.id = id
        self.sides = sides
        self.current_value = random.randint(1, sides)
        self.roll_history = []  # Track previous rolls
        self.color = self._generate_color()  # Generate a random color for the die
    
    def roll(self):
        """Roll the die and return the result"""
        self.current_value = random.randint(1, self.sides)
        self.roll_history.append(self.current_value)
        return self.current_value
    
    def _generate_color(self):
        """Generate a random hex color for the die"""
        colors = [
            "#4CAF50", "#2196F3", "#FFC107", "#E91E63", 
            "#9C27B0", "#FF5722", "#607D8B", "#795548"
        ]
        return random.choice(colors)

class Roll:
    def __init__(self, dice, timestamp=None):
        self.dice = dice  # List of Die objects
        self.values = [die.current_value for die in dice]
        self.sum = sum(self.values)
        self.timestamp = timestamp or time.time()
    
    def __repr__(self):
        return f"Roll(sum={self.sum}, values={self.values})"
