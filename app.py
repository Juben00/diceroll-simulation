# app.py
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from dice import DiceSimulator
import threading, time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Default dice simulation parameters
NUM_DICE = 2
SIDES_PER_DIE = 6
# Set the simulation speed
speed_factor = 1.0
simulator = DiceSimulator(num_dice=NUM_DICE, sides_per_die=SIDES_PER_DIE, speed=speed_factor)

def simulation_thread():
    while True:
        simulator.step()
        state = simulator.get_state()
        socketio.emit('update', state)
        time.sleep(simulator.effective_tick)  # Sleep for effective tick duration

@app.route('/')
def index():
    return render_template('index.html', num_dice=NUM_DICE, sides_per_die=SIDES_PER_DIE)

@app.route('/roll', methods=['POST'])
def roll_dice():
    """Endpoint to manually trigger a dice roll"""
    roll = simulator.roll_dice()
    return jsonify({
        'values': [die.current_value for die in simulator.dice],
        'sum': roll.sum
    }), 200

@app.route('/configure', methods=['POST'])
def configure():
    """Endpoint to reconfigure the dice simulation"""
    global simulator
    data = request.json
    num_dice = int(data.get('num_dice', NUM_DICE))
    sides_per_die = int(data.get('sides_per_die', SIDES_PER_DIE))
    
    # Create new simulator with updated parameters
    simulator = DiceSimulator(num_dice=num_dice, sides_per_die=sides_per_die, speed=speed_factor)
    
    return jsonify({'status': 'configuration updated'}), 200

@app.route('/reset', methods=['POST'])
def reset():
    """Endpoint to reset simulation statistics"""
    simulator.reset()
    return jsonify({'status': 'simulation reset'}), 200

if __name__ == '__main__':
    thread = threading.Thread(target=simulation_thread)
    thread.daemon = True
    thread.start()
    socketio.run(app, debug=True)
