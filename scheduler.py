# scheduler.py
from models import Die, Roll
import random
import time
import math
from collections import Counter, defaultdict

class DiceSimulator:
    def __init__(self, num_dice=2, sides_per_die=6, speed=1.0):
        """
        Initialize the dice simulator
        
        Parameters:
        num_dice: Number of dice to roll
        sides_per_die: Number of sides per die
        speed: Speed of the simulation (multiplier)
        """
        self.num_dice = num_dice
        self.sides_per_die = sides_per_die
        self.dice = [Die(i, sides_per_die) for i in range(num_dice)]
        
        # Statistics
        self.total_rolls = 0
        self.roll_history = []
        self.frequency = Counter()  # Counts frequency of each sum
        self.value_frequency = defaultdict(Counter)  # Counts frequency of each value per die
        
        # Simulation parameters
        self.speed = speed
        self.base_tick = 0.5  # seconds per tick at base speed
        self.effective_tick = self.base_tick / self.speed
        self.roll_interval_ticks = max(1, math.ceil(1.0 / self.effective_tick))
        self.step_count = 0
        
        # Calculated statistics
        self.min_sum = num_dice
        self.max_sum = num_dice * sides_per_die
        self.theoretical_probabilities = self._calculate_theoretical_probabilities()

    def _calculate_theoretical_probabilities(self):
        """Calculate theoretical probabilities for dice sums"""
        # For simple case of 1-2 dice
        if self.num_dice == 1:
            return {i: 1/self.sides_per_die for i in range(1, self.sides_per_die + 1)}
        
        # For 2 dice (simple calculation)
        elif self.num_dice == 2:
            probabilities = {}
            total_outcomes = self.sides_per_die ** 2
            
            for i in range(2, 2 * self.sides_per_die + 1):
                # Count ways to get sum i with 2 dice
                count = sum(1 for a in range(1, self.sides_per_die + 1) 
                           for b in range(1, self.sides_per_die + 1) if a + b == i)
                probabilities[i] = count / total_outcomes
            
            return probabilities
        
        # For more dice, return simplified estimate
        else:
            return {i: 0 for i in range(self.num_dice, self.num_dice * self.sides_per_die + 1)}

    def roll_dice(self):
        """Roll all dice and record statistics"""
        for die in self.dice:
            die.roll()
        
        # Create a new roll and record it
        roll = Roll(self.dice)
        self.roll_history.append(roll)
        self.total_rolls += 1
        
        # Update statistics
        self.frequency[roll.sum] += 1
        
        # Update individual die value frequencies
        for i, die in enumerate(self.dice):
            self.value_frequency[i][die.current_value] += 1
            
        return roll

    def step(self):
        """Perform one step of the simulation"""
        self.step_count += 1
        
        # Roll dice at specified intervals
        if self.step_count % self.roll_interval_ticks == 0:
            return self.roll_dice()
        
        return None

    def get_state(self):
        """Get the current state of the simulation"""
        # Calculate relative frequencies (as percentages)
        relative_freq = {}
        if self.total_rolls > 0:
            for sum_value in range(self.min_sum, self.max_sum + 1):
                relative_freq[sum_value] = (self.frequency[sum_value] / self.total_rolls) * 100
        
        # Get last 10 rolls for history display
        recent_rolls = self.roll_history[-10:] if self.roll_history else []
        
        state = {
            'dice': [
                {
                    'id': die.id,
                    'sides': die.sides,
                    'value': die.current_value,
                    'color': die.color
                } for die in self.dice
            ],
            'stats': {
                'total_rolls': self.total_rolls,
                'frequency': dict(self.frequency),
                'relative_frequency': relative_freq,
                'theoretical_probability': self.theoretical_probabilities
            },
            'history': [
                {
                    'values': roll.values,
                    'sum': roll.sum,
                    'timestamp': roll.timestamp
                } for roll in recent_rolls
            ],
            'value_frequency': {
                i: dict(freq) for i, freq in self.value_frequency.items()
            }
        }
        return state
    
    def reset(self):
        """Reset all statistics while keeping dice configuration"""
        self.total_rolls = 0
        self.roll_history = []
        self.frequency = Counter()
        self.value_frequency = defaultdict(Counter)
        self.step_count = 0
        # Roll dice once to start fresh
        for die in self.dice:
            die.roll_history = []
            die.roll()
