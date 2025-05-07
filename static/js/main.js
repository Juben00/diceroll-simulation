// static/js/main.js
const socket = io();

const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Modern color palette
const colors = {
  background: "#f8fafc",
  gridLine: "#e2e8f0",
  text: "#64748b",
  bar: {
    fill: "#6366f1",    // indigo-500
    stroke: "#4f46e5",  // indigo-600
    highlight: "#818cf8" // indigo-400
  },
  line: {
    actual: "#10b981",  // emerald-500
    expected: "#f43f5e" // rose-500
  }
};

let simulationState = null;
let animating = false;

socket.on("update", (state) => {
  simulationState = state;
  updateDiceDisplay(state.dice);
  updateStats(state.stats);
  updateRollHistory(state.history);
  drawFrequencyChart();
});

function drawFrequencyChart() {
  if (!simulationState || !simulationState.stats) return;
  
  const stats = simulationState.stats;
  const frequency = stats.frequency;
  const totalRolls = stats.total_rolls;
  
  // Clear canvas
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw grid
  drawGrid();
  
  // Calculate min and max sum values
  const minSum = Math.min(...Object.keys(frequency).map(Number));
  const maxSum = Math.max(...Object.keys(frequency).map(Number));
  
  // If no rolls yet, just return
  if (totalRolls === 0) {
    drawNoDataMessage();
    return;
  }
  
  // Calculate chart dimensions
  const margin = { top: 40, right: 50, bottom: 50, left: 50 };
  const chartWidth = canvasWidth - margin.left - margin.right;
  const chartHeight = canvasHeight - margin.top - margin.bottom;
  
  // Calculate max frequency for scaling
  const maxFrequency = Math.max(...Object.values(frequency));
  
  // Draw bars
  const barWidth = chartWidth / (maxSum - minSum + 3);  // +3 for slight padding
  
  // Draw x and y axis
  drawAxes(margin, chartWidth, chartHeight, minSum, maxSum, maxFrequency);
  
  // Draw title
  ctx.fillStyle = "#1e293b";  // slate-800
  ctx.font = "bold 16px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Dice Roll Sum Frequency Distribution (${totalRolls} Rolls)`, canvasWidth / 2, margin.top / 2);
  
  // Draw bars and labels
  for (let sum = minSum; sum <= maxSum; sum++) {
    const count = frequency[sum] || 0;
    const x = margin.left + (sum - minSum + 0.5) * barWidth;
    const barHeight = count ? (count / maxFrequency) * chartHeight : 0;
    const y = margin.top + chartHeight - barHeight;
    
    // Bar
    ctx.fillStyle = colors.bar.fill;
    ctx.strokeStyle = colors.bar.stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - barWidth/2 + 2, y, barWidth - 4, barHeight, 4);
    ctx.fill();
    ctx.stroke();
    
    // Sum label (x-axis)
    ctx.fillStyle = colors.text;
    ctx.font = "12px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sum.toString(), x, margin.top + chartHeight + 20);
    
    // Frequency label (on top of bar, if there's enough space)
    if (barHeight > 20) {
      ctx.fillStyle = "white";
      ctx.fillText(count.toString(), x, y + 15);
    }
  }
  
  // Draw expected probability line for 2 dice (if appropriate)
  if (simulationState.stats.theoretical_probability && totalRolls > 0) {
    drawTheoreticalProbabilityLine(margin, chartWidth, chartHeight, minSum, maxSum, maxFrequency);
  }
}

function drawGrid() {
  const gridRows = 10;
  const rowHeight = canvasHeight / gridRows;
  
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 0.5;
  
  // Horizontal lines
  for (let i = 1; i < gridRows; i++) {
    const y = i * rowHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function drawAxes(margin, chartWidth, chartHeight, minSum, maxSum, maxFrequency) {
  const axisColor = "#475569";  // slate-600
  
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  
  // Y axis
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.stroke();
  
  // X axis
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();
  
  // Y axis labels (frequency)
  ctx.fillStyle = axisColor;
  ctx.font = "12px 'Inter', sans-serif";
  ctx.textAlign = "right";
  
  const numYLabels = 5;
  for (let i = 0; i <= numYLabels; i++) {
    const value = (maxFrequency * i) / numYLabels;
    const y = margin.top + chartHeight - (i / numYLabels) * chartHeight;
    ctx.fillText(Math.round(value).toString(), margin.left - 10, y + 4);
    
    // Small tick mark
    ctx.beginPath();
    ctx.moveTo(margin.left - 5, y);
    ctx.lineTo(margin.left, y);
    ctx.stroke();
  }
  
  // Axis titles
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillStyle = "#334155";  // slate-700
  
  // Y axis title
  ctx.save();
  ctx.translate(margin.left - 35, margin.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Frequency", 0, 0);
  ctx.restore();
  
  // X axis title
  ctx.textAlign = "center";
  ctx.fillText("Sum Value", margin.left + chartWidth / 2, margin.top + chartHeight + 40);
}

function drawTheoreticalProbabilityLine(margin, chartWidth, chartHeight, minSum, maxSum, maxFrequency) {
  const probabilities = simulationState.stats.theoretical_probability;
  const totalRolls = simulationState.stats.total_rolls;
  
  ctx.strokeStyle = colors.line.expected;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  let firstPoint = true;
  for (let sum = minSum; sum <= maxSum; sum++) {
    if (probabilities[sum] !== undefined) {
      const expectedCount = probabilities[sum] * totalRolls;
      const x = margin.left + (sum - minSum + 0.5) * (chartWidth / (maxSum - minSum + 1));
      const y = margin.top + chartHeight - (expectedCount / maxFrequency) * chartHeight;
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
  
  ctx.stroke();
  
  // Add legend for theoretical line
  const legendX = margin.left + chartWidth - 150;
  const legendY = margin.top + 20;
  
  ctx.strokeStyle = colors.line.expected;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + 30, legendY);
  ctx.stroke();
  
  ctx.fillStyle = "#1e293b";
  ctx.font = "12px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Expected Probability", legendX + 40, legendY + 4);
}

function drawNoDataMessage() {
  ctx.fillStyle = "#94a3b8";  // slate-400
  ctx.font = "16px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Roll dice to see frequency distribution", canvasWidth / 2, canvasHeight / 2);
}

function updateDiceDisplay(dice) {
  if (!dice) return;
  
  const container = document.getElementById("diceContainer");
  container.innerHTML = ""; // Clear existing dice
  
  dice.forEach(die => {
    const dieEl = document.createElement("div");
    dieEl.className = "die-face relative w-24 h-24 m-2";
    dieEl.style.backgroundColor = die.color;
    dieEl.style.borderRadius = "12px";
    dieEl.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1), inset 0 0 8px rgba(255,255,255,0.5)";
    
    // Add dots or number based on die value
    const valueDisplay = document.createElement("div");
    valueDisplay.className = "absolute inset-0 flex items-center justify-center";
    valueDisplay.innerHTML = `<span class="text-white text-4xl font-bold">${die.value}</span>`;
    dieEl.appendChild(valueDisplay);
    
    container.appendChild(dieEl);
  });
}

function updateStats(stats) {
  if (!stats) return;
  
  document.getElementById("totalRolls").innerText = stats.total_rolls;
  
  // Find most common sum
  if (stats.total_rolls > 0) {
    const frequency = stats.frequency;
    let mostCommon = null;
    let maxCount = 0;
    
    Object.entries(frequency).forEach(([sum, count]) => {
      if (count > maxCount) {
        mostCommon = sum;
        maxCount = count;
      }
    });
    
    if (mostCommon) {
      const percentage = ((maxCount / stats.total_rolls) * 100).toFixed(1);
      document.getElementById("mostCommonSum").innerText = `${mostCommon} (${percentage}%)`;
    }
  }
}

function updateRollHistory(history) {
  if (!history || history.length === 0) return;
  
  const container = document.getElementById("rollHistory");
  container.innerHTML = "";
  
  history.forEach(roll => {
    const entry = document.createElement("div");
    entry.className = "py-1 border-b border-gray-100 flex justify-between";
    
    const values = document.createElement("span");
    values.className = "text-gray-800";
    values.innerText = `[${roll.values.join(", ")}]`;
    
    const sum = document.createElement("span");
    sum.className = "font-semibold text-indigo-600";
    sum.innerText = `Sum: ${roll.sum}`;
    
    entry.appendChild(values);
    entry.appendChild(sum);
    container.appendChild(entry);
  });
}

function animateDiceRoll() {
  if (animating) return;
  
  animating = true;
  const diceElements = document.querySelectorAll(".die-face");
  
  diceElements.forEach(die => {
    die.classList.add("rolling");
    setTimeout(() => {
      die.classList.remove("rolling");
    }, 600);
  });
  
  setTimeout(() => {
    animating = false;
  }, 600);
}

// Event listeners
document.getElementById("rollButton").addEventListener("click", () => {
  fetch("/roll", { method: "POST" })
    .then(response => response.json())
    .then(data => {
      animateDiceRoll();
    });
});

document.getElementById("resetButton").addEventListener("click", () => {
  fetch("/reset", { method: "POST" })
    .then(response => response.json())
    .then(data => {
      // Update will happen automatically via socket
    });
});

document.getElementById("configForm").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const numDice = document.getElementById("numDice").value;
  const sidesPerDie = document.getElementById("sidesPerDie").value;
  
  fetch("/configure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      num_dice: numDice,
      sides_per_die: sidesPerDie
    }),
  })
    .then(response => response.json())
    .then(data => {
      // Update will happen automatically via socket
    });
});

// Initialize empty chart
drawFrequencyChart();