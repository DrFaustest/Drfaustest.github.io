// DOM Elements
const valuesInput = document.getElementById("values");
const kInput = document.getElementById("k");
const randNInput = document.getElementById("rand-n");
const randMaxInput = document.getElementById("rand-max");
const randSeedInput = document.getElementById("rand-seed");
const generateBtn = document.getElementById("generate");
const resetInputsBtn = document.getElementById("reset-inputs");

const decisionBtn = document.getElementById("run-decision");
const heuristicBtn = document.getElementById("run-heuristic");
const exactBtn = document.getElementById("run-exact");
const allBtn = document.getElementById("run-all");
const resetResultsBtn = document.getElementById("reset-results");

const summaryEl = document.getElementById("summary");
const decisionEl = document.getElementById("decision-result");
const heuristicEl = document.getElementById("heuristic-result");
const exactEl = document.getElementById("exact-result");
const speedEl = document.getElementById("speed");
const visualBalanceEl = document.getElementById("visual-balance");
const visualHeuristicEl = document.getElementById("visual-heuristic");
const visualWorkloadEl = document.getElementById("visual-workload");

// State
let lastExponentialMetrics = null;
let currentValues = [];
let cancelRequested = false;
let runningAlgorithm = null;

const defaultValues = [3, 1, 4, 2, 2];
valuesInput.value = defaultValues.join(", ");
currentValues = [...defaultValues];

// Utility Functions
function parseValues(text) {
  const tokens = text
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const values = tokens.map((token) => Number(token));
  if (values.some((v) => Number.isNaN(v) || !Number.isFinite(v))) {
    throw new Error("Values must be integers.");
  }
  return values.map((v) => Math.trunc(v));
}

function formatList(values) {
  return values.length ? `[${values.join(", ")}]` : "[]";
}

function formatPow2(n) {
  if (n < 0) return "?";
  if (n < 53) return Number(2 ** n).toLocaleString();
  return `2^${n} (huge)`;
}

function estimateRemaining(checked, total, elapsedMs) {
  if (checked === 0) return '?';
  const rate = checked / elapsedMs;
  const remaining = total - checked;
  const remainingMs = remaining / rate;
  const remainingSec = remainingMs / 1000;
  
  if (remainingSec < 60) return `${remainingSec.toFixed(1)}s`;
  if (remainingSec < 3600) return `${(remainingSec / 60).toFixed(1)}m`;
  if (remainingSec < 86400) return `${(remainingSec / 3600).toFixed(1)}h`;
  return `${(remainingSec / 86400).toFixed(1)}d`;
}

function mulberry32(seed) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Rendering Functions
function renderBalance(subsetA, subsetB) {
  if (subsetA.length === 0 && subsetB.length === 0) {
    visualBalanceEl.textContent = "Run an algorithm to see subset balance.";
    return;
  }
  const sumA = subsetA.reduce((acc, v) => acc + v, 0);
  const sumB = subsetB.reduce((acc, v) => acc + v, 0);
  const maxSum = Math.max(sumA, sumB, 1);
  const pctA = ((sumA / maxSum) * 100).toFixed(1);
  const pctB = ((sumB / maxSum) * 100).toFixed(1);

  visualBalanceEl.innerHTML = `
    <div class="bar-chart__row"><span>A (${sumA})</span><div class="bar-chart__bar"><div class="bar-chart__fill bar-chart__fill--a" style="width:${pctA}%"></div></div></div>
    <div class="bar-chart__row"><span>B (${sumB})</span><div class="bar-chart__bar"><div class="bar-chart__fill bar-chart__fill--b" style="width:${pctB}%"></div></div></div>
    <div class="bar-chart__row"><span>diff</span><strong>${Math.abs(sumA - sumB)}</strong></div>
  `;
}

function renderHeuristicSteps(values) {
  if (!values.length) {
    visualHeuristicEl.textContent = "Provide values to see the greedy placement order.";
    return;
  }

  const sorted = [...values].sort((a, b) => b - a);
  let sumA = 0;
  let sumB = 0;
  const steps = sorted.map((v) => {
    const target = sumA <= sumB ? "A" : "B";
    if (target === "A") {
      sumA += v;
    } else {
      sumB += v;
    }
    return `${v} → ${target} (A=${sumA}, B=${sumB})`;
  });

  visualHeuristicEl.innerHTML = steps
    .map((step) => `<div><code>${step}</code></div>`)
    .join("");
}

function renderWorkload(values) {
  const n = values.length;
  const scaledWidth = Math.min(100, (n / 32) * 100);
  visualWorkloadEl.innerHTML = `
    <div>n = ${n}</div>
    <div>2^n ≈ ${formatPow2(n)}</div>
    <div class="workload__bar" style="width:${scaledWidth}%"></div>
    <div class="hint">Bar scales up to n≈32; beyond that the search is effectively infeasible.</div>
  `;
}

function renderDecision(result) {
  const cancelledText = result.cancelled ? ' <span style="color: #e74c3c;">(CANCELLED)</span>' : '';
  decisionEl.innerHTML = `
    <h3>Decision (Exponential)${cancelledText}</h3>
    <div>possible: <strong>${result.possible}</strong></div>
    <div>diff: ${result.diff}</div>
    <div>checked: ${result.checked.toLocaleString()} / ${result.total ? result.total.toLocaleString() : '?'}</div>
    <div>time: ${(result.elapsedMs / 1000).toFixed(4)}s</div>
    <div>A: ${formatList(result.subsetA)}</div>
    <div>B: ${formatList(result.subsetB)}</div>
  `;
  renderBalance(result.subsetA, result.subsetB);
}

function renderDecisionProgress(checked, total, elapsed, progress) {
  decisionEl.innerHTML = `
    <h3>Decision (Exponential) <span style="color: #3498db;">RUNNING...</span></h3>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress.toFixed(2)}%"></div>
    </div>
    <div>Progress: <strong>${progress.toFixed(2)}%</strong></div>
    <div>checked: ${checked.toLocaleString()} / ${total.toLocaleString()}</div>
    <div>elapsed: ${(elapsed / 1000).toFixed(2)}s</div>
    <div>est. remaining: ${estimateRemaining(checked, total, elapsed)}</div>
    <button onclick="cancelComputation()" class="btn btn--ghost" style="margin-top: 10px;">Cancel</button>
  `;
}

function renderHeuristic(result) {
  heuristicEl.innerHTML = `
    <h3>Greedy Heuristic</h3>
    <div>diff: ${result.diff}</div>
    <div>A: ${formatList(result.subsetA)}</div>
    <div>B: ${formatList(result.subsetB)}</div>
  `;
  renderBalance(result.subsetA, result.subsetB);
  renderHeuristicSteps(currentValues);
}

function renderExact(result) {
  const cancelledText = result.cancelled ? ' <span style="color: #e74c3c;">(CANCELLED)</span>' : '';
  exactEl.innerHTML = `
    <h3>Exact Optimization${cancelledText}</h3>
    <div>diff: ${result.diff}</div>
    <div>checked: ${result.checked.toLocaleString()} / ${result.total ? result.total.toLocaleString() : '?'}</div>
    <div>time: ${(result.elapsedMs / 1000).toFixed(4)}s</div>
    <div>A: ${formatList(result.subsetA)}</div>
    <div>B: ${formatList(result.subsetB)}</div>
  `;
  renderBalance(result.subsetA, result.subsetB);
}

function renderExactProgress(checked, total, elapsed, progress, currentBest) {
  exactEl.innerHTML = `
    <h3>Exact Optimization <span style="color: #3498db;">RUNNING...</span></h3>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress.toFixed(2)}%"></div>
    </div>
    <div>Progress: <strong>${progress.toFixed(2)}%</strong></div>
    <div>best diff so far: <strong style="color: #f39c12;">${currentBest}</strong></div>
    <div>checked: ${checked.toLocaleString()} / ${total.toLocaleString()}</div>
    <div>elapsed: ${(elapsed / 1000).toFixed(2)}s</div>
    <div>est. remaining: ${estimateRemaining(checked, total, elapsed)}</div>
    <button onclick="cancelComputation()" class="btn btn--ghost" style="margin-top: 10px;">Cancel</button>
  `;
}

function updateSummary(values) {
  const n = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  summaryEl.innerHTML = `
    <div><strong>n</strong>: ${n}</div>
    <div><strong>sum</strong>: ${sum}</div>
    <div><strong>work factor</strong>: 2^n ≈ ${formatPow2(n)}</div>
  `;
  renderWorkload(values);
}

function updateSpeedInsight(values) {
  if (!lastExponentialMetrics) {
    speedEl.textContent = "Run an exponential algorithm to see growth estimates.";
    return;
  }

  const { checked, elapsedMs } = lastExponentialMetrics;
  const rate = checked / (elapsedMs / 1000);
  const n = values.length;
  const work = 2 ** n;
  const estSeconds = rate > 0 ? work / rate : null;

  speedEl.textContent = [
    `checked: ${checked.toLocaleString()}`,
    `elapsed: ${(elapsedMs / 1000).toFixed(3)}s`,
    `rate: ${rate.toFixed(0)} masks/sec`,
    `estimated full 2^n time: ${estSeconds ? estSeconds.toFixed(2) + "s" : "?"}`,
  ].join("\n");
}

// Algorithm Implementations
async function decisionPartitionExponentialAsync(values, k, progressCallback) {
  const n = values.length;
  const total = values.reduce((sum, v) => sum + v, 0);
  const totalPartitions = Math.pow(2, n);
  let checked = 0;
  const start = performance.now();
  const chunkSize = 10000;
  
  cancelRequested = false;

  for (let mask = 0; mask < totalPartitions; mask += 1) {
    if (cancelRequested) {
      const elapsed = performance.now() - start;
      return {
        possible: false,
        subsetA: [],
        subsetB: [],
        diff: -1,
        checked,
        elapsedMs: elapsed,
        cancelled: true
      };
    }

    let sumA = 0;
    const subsetA = [];
    const subsetB = [];
    for (let i = 0; i < n; i += 1) {
      if ((mask >> i) & 1) {
        sumA += values[i];
        subsetA.push(values[i]);
      } else {
        subsetB.push(values[i]);
      }
    }
    const sumB = total - sumA;
    const diff = Math.abs(sumA - sumB);
    checked += 1;

    if (checked % chunkSize === 0) {
      const elapsed = performance.now() - start;
      const progress = (checked / totalPartitions) * 100;
      if (progressCallback) {
        progressCallback(checked, totalPartitions, elapsed, progress);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (diff <= k) {
      const elapsed = performance.now() - start;
      return {
        possible: true,
        subsetA,
        subsetB,
        diff,
        checked,
        elapsedMs: elapsed,
        cancelled: false
      };
    }
  }

  const elapsed = performance.now() - start;
  return {
    possible: false,
    subsetA: [],
    subsetB: [],
    diff: -1,
    checked,
    elapsedMs: elapsed,
    cancelled: false
  };
}

function heuristicGreedyLpt(values) {
  const subsetA = [];
  const subsetB = [];
  let sumA = 0;
  let sumB = 0;

  const sorted = [...values].sort((a, b) => b - a);
  for (const v of sorted) {
    if (sumA <= sumB) {
      subsetA.push(v);
      sumA += v;
    } else {
      subsetB.push(v);
      sumB += v;
    }
  }

  return {
    subsetA,
    subsetB,
    diff: Math.abs(sumA - sumB),
  };
}

async function exactOptimizationExponentialAsync(values, progressCallback) {
  const n = values.length;
  const total = values.reduce((sum, v) => sum + v, 0);
  const totalPartitions = Math.pow(2, n);
  let bestDiff = null;
  let bestA = [];
  let bestB = [];
  let checked = 0;
  const start = performance.now();
  const chunkSize = 10000;
  
  cancelRequested = false;

  for (let mask = 0; mask < totalPartitions; mask += 1) {
    if (cancelRequested) {
      const elapsed = performance.now() - start;
      return {
        subsetA: bestA,
        subsetB: bestB,
        diff: bestDiff ?? 0,
        checked,
        elapsedMs: elapsed,
        cancelled: true
      };
    }

    let sumA = 0;
    const subsetA = [];
    const subsetB = [];
    for (let i = 0; i < n; i += 1) {
      if ((mask >> i) & 1) {
        sumA += values[i];
        subsetA.push(values[i]);
      } else {
        subsetB.push(values[i]);
      }
    }
    const sumB = total - sumA;
    const diff = Math.abs(sumA - sumB);
    checked += 1;

    if (bestDiff === null || diff < bestDiff) {
      bestDiff = diff;
      bestA = subsetA;
      bestB = subsetB;
    }

    if (checked % chunkSize === 0) {
      const elapsed = performance.now() - start;
      const progress = (checked / totalPartitions) * 100;
      if (progressCallback) {
        progressCallback(checked, totalPartitions, elapsed, progress, bestDiff);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  const elapsed = performance.now() - start;
  return {
    subsetA: bestA,
    subsetB: bestB,
    diff: bestDiff ?? 0,
    checked,
    elapsedMs: elapsed,
    cancelled: false
  };
}

// Event Handlers
function cancelComputation() {
  cancelRequested = true;
}

function resetResults() {
  cancelRequested = true;
  decisionEl.innerHTML = "";
  heuristicEl.innerHTML = "";
  exactEl.innerHTML = "";
  visualBalanceEl.textContent = "Run an algorithm to see subset balance.";
  visualHeuristicEl.textContent = "Run the greedy heuristic to view placement steps.";
  visualWorkloadEl.textContent = "Set values to visualize workload.";
  speedEl.textContent = "Run an exponential algorithm to see growth estimates.";
  lastExponentialMetrics = null;
  runningAlgorithm = null;
}

async function handleRunDecision() {
  if (runningAlgorithm) {
    alert('An algorithm is already running. Please wait or click Cancel.');
    return;
  }
  
  try {
    const values = parseValues(valuesInput.value);
    currentValues = values;
    const k = Number(kInput.value ?? 0);
    const n = values.length;
    const total = Math.pow(2, n);
    
    updateSummary(values);
    runningAlgorithm = 'decision';
    renderDecisionProgress(0, total, 0, 0);
    
    const result = await decisionPartitionExponentialAsync(values, k, 
      (checked, total, elapsed, progress) => {
        renderDecisionProgress(checked, total, elapsed, progress);
      }
    );
    
    result.total = total;
    lastExponentialMetrics = { checked: result.checked, elapsedMs: result.elapsedMs };
    renderDecision(result);
    updateSpeedInsight(values);
    runningAlgorithm = null;
  } catch (error) {
    alert(error.message);
    runningAlgorithm = null;
  }
}

function handleRunHeuristic() {
  try {
    const values = parseValues(valuesInput.value);
    currentValues = values;
    updateSummary(values);
    const result = heuristicGreedyLpt(values);
    renderHeuristic(result);
    updateSpeedInsight(values);
  } catch (error) {
    alert(error.message);
  }
}

async function handleRunExact() {
  if (runningAlgorithm) {
    alert('An algorithm is already running. Please wait or click Cancel.');
    return;
  }
  
  try {
    const values = parseValues(valuesInput.value);
    currentValues = values;
    const n = values.length;
    const total = Math.pow(2, n);
    
    updateSummary(values);
    runningAlgorithm = 'exact';
    renderExactProgress(0, total, 0, 0, '?');
    
    const result = await exactOptimizationExponentialAsync(values,
      (checked, total, elapsed, progress, bestDiff) => {
        renderExactProgress(checked, total, elapsed, progress, bestDiff);
      }
    );
    
    result.total = total;
    lastExponentialMetrics = { checked: result.checked, elapsedMs: result.elapsedMs };
    renderExact(result);
    updateSpeedInsight(values);
    runningAlgorithm = null;
  } catch (error) {
    alert(error.message);
    runningAlgorithm = null;
  }
}

async function handleRunAll() {
  if (runningAlgorithm) {
    alert('An algorithm is already running. Please wait or click Cancel.');
    return;
  }
  
  resetResults();
  await handleRunDecision();
  if (!cancelRequested) {
    handleRunHeuristic();
  }
  if (!cancelRequested) {
    await handleRunExact();
  }
}

function generateRandom() {
  const n = Math.max(1, Number(randNInput.value));
  const max = Math.max(1, Number(randMaxInput.value));
  const seedValue = randSeedInput.value === "" ? null : Number(randSeedInput.value);
  const rng = seedValue === null || Number.isNaN(seedValue) ? Math.random : mulberry32(seedValue);
  const values = Array.from({ length: n }, () => 1 + Math.floor(rng() * max));
  valuesInput.value = values.join(", ");
  currentValues = values;
  updateSummary(values);
  updateSpeedInsight(values);
  renderHeuristicSteps(values);
}

function resetInputs() {
  cancelRequested = true;
  valuesInput.value = defaultValues.join(", ");
  kInput.value = 1;
  randNInput.value = 10;
  randMaxInput.value = 20;
  randSeedInput.value = "";
  currentValues = [...defaultValues];
  updateSummary(currentValues);
  renderHeuristicSteps(currentValues);
  updateSpeedInsight(currentValues);
  resetResults();
}

// Event Listeners
generateBtn.addEventListener("click", generateRandom);
decisionBtn.addEventListener("click", handleRunDecision);
heuristicBtn.addEventListener("click", handleRunHeuristic);
exactBtn.addEventListener("click", handleRunExact);
allBtn.addEventListener("click", handleRunAll);
resetInputsBtn.addEventListener("click", resetInputs);
resetResultsBtn.addEventListener("click", resetResults);

// Make cancelComputation globally accessible
window.cancelComputation = cancelComputation;

// Initialize
updateSummary(defaultValues);
updateSpeedInsight(defaultValues);
renderHeuristicSteps(defaultValues);
renderBalance([], []);
