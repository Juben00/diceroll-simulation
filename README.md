# Dice Roll Simulation

A comprehensive dice rolling simulation application that allows configuring multiple dice with various parameters and provides detailed visualization of outcomes, frequency distribution, and probability statistics.

## Features

- Simulate rolling multiple dice with configurable number of sides
- Real-time visualization of dice roll outcomes
- Statistical analysis including frequency distribution
- Comparison with theoretical probabilities
- Adjustable simulation speed
- Manual and automatic rolling modes

## Installation

1. Clone this repository
2. Install required dependencies:
   ```
   pip install flask
   ```
3. Run the application:
   ```
   python app.py
   ```

## Usage

1. Access the dashboard at http://localhost:5000/
2. Configure simulation parameters:
   - Number of dice
   - Number of sides per die
   - Simulation speed
3. Use the "Roll Dice" button to manually trigger rolls
4. Toggle automatic simulation mode as needed
5. Reset statistics to start a new simulation session

## Configuration Options

The simulation supports configuration of the following parameters:
- **Number of dice**: Control how many dice are rolled simultaneously
- **Number of sides per die**: Configure custom dice (6-sided, 20-sided, etc.)
- **Simulation speed**: Adjust how quickly automatic rolls are generated

## Statistics and Metrics

The application provides comprehensive statistics:
- Total rolls performed
- Frequency distribution of sum values
- Frequency distribution of individual die values
- Most common outcomes
- Comparison with theoretical probabilities

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML, JavaScript
- **Data Visualization**: Interactive charts
- **Concurrency**: Python threading

## License

[MIT License](LICENSE)
