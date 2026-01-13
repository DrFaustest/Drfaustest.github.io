import { el, setPseudocode, highlightPseudo, appState, incStat, qs, registerImplementations, updateStats, setTeardown, animSpeed, speed as globalSpeed } from './core.js';

let baseArray = [];
let depthMap = new Map();
let resizeObserver;
let originalArray = [];
let currentAlgorithm = 'bubble';
let speed = globalSpeed;

// Determine array size based on device width
function getArraySize() {
  return window.innerWidth < 768 ? 65 : 100;
}

export function initSingleAlgorithm(algorithm) {
  currentAlgorithm = algorithm;
  appState.current = 'sorting';
  
  // Initialize array with responsive size
  const arraySize = getArraySize();
  baseArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 90) + 10);
  originalArray = [...baseArray];
  
  const vizArea = qs('#visualization-area');
  if (!vizArea) return;
  
  drawBars();
  setPseudocodeForAlgorithm(algorithm);
  updateStats();
  setupControls();
  setupResize(vizArea);
  
  // Auto-generate steps on load
  startSort();
  
  setTeardown(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    baseArray = [];
    originalArray = [];
    depthMap = new Map();
  });
}

function setupControls() {
  const shuffleBtn = qs('#btn-shuffle');
  const prevBtn = qs('#step-prev');
  const playBtn = qs('#step-play');
  const stopBtn = qs('#step-stop');
  const nextBtn = qs('#step-next');
  const resetBtn = qs('#step-reset');
  const speedSelect = qs('#speed-select');
  
  if (shuffleBtn) shuffleBtn.onclick = shuffleBars;
  if (prevBtn) prevBtn.onclick = () => step(-1);
  if (playBtn) playBtn.onclick = togglePlay;
  if (stopBtn) stopBtn.onclick = stopPlayback;
  if (nextBtn) nextBtn.onclick = () => step(1);
  if (resetBtn) resetBtn.onclick = resetAndShuffle;
  if (speedSelect) {
    speedSelect.value = speed;
    speedSelect.onchange = () => { speed = speedSelect.value; };
  }
}

function setupResize(container) {
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => drawBars(true));
    resizeObserver.observe(container);
  } else {
    const resizeHandler = () => drawBars(true);
    window.addEventListener('resize', resizeHandler);
  }
  
  // Handle orientation changes on mobile - may need to adjust array size
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      const newSize = getArraySize();
      if (newSize !== baseArray.length) {
        shuffleBars();
      } else {
        drawBars(true);
      }
    }, 100);
  });
}

function drawBars(reset) {
  const bars = qs('#visualization-area');
  if (!bars) return;
  bars.innerHTML = '';
  
  if (baseArray.length === 0) return;
  
  const maxVal = Math.max(...baseArray, 100);
  const containerWidth = bars.clientWidth || bars.parentElement?.clientWidth || window.innerWidth - 100;
  const gap = 2;
  const totalGap = gap * (baseArray.length - 1);
  let barWidth = Math.floor((containerWidth - totalGap - 40) / baseArray.length);
  const minBarWidth = 4;
  const maxBarWidth = 15;
  if (barWidth < minBarWidth) barWidth = minBarWidth;
  else if (barWidth > maxBarWidth) barWidth = maxBarWidth;
  
  // Calculate optimal bar height based on viewport
  // Mobile: reduced height to fit without scrolling, Desktop: normal height
  const isMobile = window.innerWidth < 768;
  const barHeight = isMobile ? 180 : 280;
  
  baseArray.forEach((value, index) => {
    const height = (value / maxVal) * barHeight + 10;
    const depthClass = depthMap.get(index) != null ? ` depth-${depthMap.get(index) % 5}` : '';
    bars.append(el('div', {
      className: 'bar' + depthClass,
      style: { height: `${height}px`, width: `${barWidth}px` },
      dataset: { i: index }
    }));
  });
  
  if (!reset) {
    document.querySelectorAll('.bar').forEach(b => {
      b.classList.remove('sorted', 'active', 'partition');
    });
  }
}

function shuffleBars() {
  const arraySize = getArraySize();
  baseArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 90) + 10);
  originalArray = [...baseArray];
  depthMap = new Map();
  clearTransientVisuals();
  drawBars();
  resetPlayback();
  startSort();
}

function resetAndShuffle() {
  stopPlayback();
  shuffleBars();
  startSort();
}

function clearTransientVisuals() {
  const buf = qs('#merge-buffer');
  if (buf) buf.innerHTML = '';
  document.querySelectorAll('.bar.partition').forEach(b => b.classList.remove('partition'));
  document.querySelectorAll('.bar.active').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bar.sorted').forEach(b => b.classList.remove('sorted'));
}

function resetPlayback() {
  appState.steps = [];
  appState.stepIndex = 0;
  appState.stats = { comparisons: 0, swaps: 0, operations: 0 };
  appState.playing = false;
  clearInterval(appState.playLoop);
  updateStats();
  togglePlayButton(false, true);
}

function highlightBars(i, j) {
  document.querySelectorAll('.bar').forEach(b => b.classList.remove('active'));
  const bar1 = document.querySelector(`.bar[data-i='${i}']`);
  const bar2 = document.querySelector(`.bar[data-i='${j}']`);
  if (bar1) bar1.classList.add('active');
  if (bar2 && i !== j) bar2.classList.add('active');
}

function swapBars(i, j) {
  [baseArray[i], baseArray[j]] = [baseArray[j], baseArray[i]];
  drawBars(true);
  highlightBars(i, j);
}

function markBarSorted(i) {
  const b = document.querySelector(`.bar[data-i='${i}']`);
  if (b) b.classList.add('sorted');
}

function startSort() {
  baseArray = [...originalArray];
  depthMap = new Map();
  clearTransientVisuals();
  resetPlayback();
  
  switch (currentAlgorithm) {
    case 'bubble': genBubbleSteps(); break;
    case 'insertion': genInsertionSteps(); break;
    case 'selection': genSelectionSteps(); break;
    case 'merge': genMergeSteps(); break;
    case 'quick': genQuickSteps(); break;
    case 'heap': genHeapSteps(); break;
  }
  
  baseArray = [...originalArray];
  drawBars();
  highlightPseudo('loop_i');
  togglePlayButton(false, false);
}

// Step generation functions (same as before)
function genBubbleSteps() {
  const arr = [...baseArray];
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'cond_swap' });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'mark' });
      }
    }
    appState.steps.push({ type: 'mark-sorted', i: n - 1 - i, pc: 'loop_j' });
  }
}

function genInsertionSteps() {
  const arr = [...baseArray];
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1;
    appState.steps.push({ type: 'compare', i: i, j: i, pc: 'cond_swap' });
    while (j >= 0 && arr[j] > key) {
      appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'cond_swap' });
      arr[j + 1] = arr[j];
      appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'mark' });
      j--;
    }
    arr[j + 1] = key;
    appState.steps.push({ type: 'write', i: j + 1, value: key, pc: 'mark' });
  }
  for (let i = 0; i < arr.length; i++) {
    appState.steps.push({ type: 'mark-sorted', i });
  }
}

function genSelectionSteps() {
  const arr = [...baseArray];
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    appState.steps.push({ type: 'compare', i: i, j: i, pc: 'loop_i' });
    for (let j = i + 1; j < arr.length; j++) {
      appState.steps.push({ type: 'compare', i: minIdx, j: j, pc: 'cond_cmp' });
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        appState.steps.push({ type: 'compare', i: minIdx, j: minIdx, pc: 'min_update' });
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      appState.steps.push({ type: 'swap', i: i, j: minIdx, pc: 'mark' });
    }
    appState.steps.push({ type: 'mark-sorted', i, pc: 'mark' });
  }
  appState.steps.push({ type: 'mark-sorted', i: arr.length - 1 });
}

function genMergeSteps() {
  const arr = [...baseArray];
  depthMap = new Map();
  
  function merge(left, right, depth = 0) {
    if (right - left <= 0) return;
    for (let i = left; i <= right; i++) depthMap.set(i, depth);
    const mid = Math.floor((left + right) / 2);
    merge(left, mid, depth + 1);
    merge(mid + 1, right, depth + 1);
    const temp = [];
    let i = left, j = mid + 1;
    while (i <= mid && j <= right) {
      appState.steps.push({ type: 'compare', i, j, pc: 'mg_cmp' });
      if (arr[i] <= arr[j]) temp.push(arr[i++]);
      else temp.push(arr[j++]);
    }
    while (i <= mid) temp.push(arr[i++]);
    while (j <= right) temp.push(arr[j++]);
    for (let k = left; k <= right; k++) {
      const newVal = temp[k - left];
      if (arr[k] !== newVal) {
        arr[k] = newVal;
        appState.steps.push({
          type: 'write',
          i: k,
          value: newVal,
          pc: 'mg_tail',
          buf: temp.slice(),
          range: [left, right]
        });
      }
    }
  }
  merge(0, arr.length - 1, 0);
  for (let i = 0; i < arr.length; i++) {
    appState.steps.push({ type: 'mark-sorted', i });
  }
}

function genQuickSteps() {
  const arr = [...baseArray];
  depthMap = new Map();
  
  function qsRec(left, right, depth = 0) {
    if (left >= right) return;
    for (let k = left; k <= right; k++) depthMap.set(k, depth);
    
    let i = left, j = right;
    const pivotIndex = Math.floor((left + right) / 2);
    const pivot = arr[pivotIndex];
    
    appState.steps.push({
      type: 'pivot',
      i: pivotIndex,
      pc: 'p_pivot',
      depth,
      left,
      right
    });
    
    while (i <= j) {
      while (arr[i] < pivot) {
        appState.steps.push({ type: 'compare', i, j: i, pc: 'p_i' });
        i++;
      }
      while (arr[j] > pivot) {
        appState.steps.push({ type: 'compare', i: j, j, pc: 'p_j' });
        j--;
      }
      if (i <= j) {
        appState.steps.push({ type: 'compare', i, j, pc: 'p_cmp' });
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          appState.steps.push({ type: 'swap', i, j, pc: 'p_swap' });
        }
        i++;
        j--;
      }
    }
    
    qsRec(left, j, depth + 1);
    qsRec(i, right, depth + 1);
  }
  
  qsRec(0, arr.length - 1, 0);
  for (let i = 0; i < arr.length; i++) {
    appState.steps.push({ type: 'mark-sorted', i });
  }
}

function genHeapSteps() {
  const arr = [...baseArray];
  const n = arr.length;
  depthMap = new Map();
  
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, i, n);
  }
  
  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    appState.steps.push({ type: 'compare', i: 0, j: i, pc: 'h_swap' });
    [arr[0], arr[i]] = [arr[i], arr[0]];
    appState.steps.push({ type: 'swap', i: 0, j: i, pc: 'h_swap' });
    heapify(arr, 0, i);
    appState.steps.push({ type: 'mark-sorted', i });
  }
  appState.steps.push({ type: 'mark-sorted', i: 0 });
  
  function heapify(arr, i, n) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n) {
      appState.steps.push({ type: 'compare', i: left, j: largest, pc: 'h_left' });
      if (arr[left] > arr[largest]) {
        largest = left;
        appState.steps.push({ type: 'compare', i: largest, j: largest, pc: 'h_left_set' });
      }
    }
    
    if (right < n) {
      appState.steps.push({ type: 'compare', i: right, j: largest, pc: 'h_right' });
      if (arr[right] > arr[largest]) {
        largest = right;
        appState.steps.push({ type: 'compare', i: largest, j: largest, pc: 'h_right_set' });
      }
    }
    
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      appState.steps.push({ type: 'swap', i, j: largest, pc: 'h_heapify' });
      heapify(arr, largest, n);
    }
  }
}

function applyStepState(step, fast) {
  if (!step) return;
  switch (step.type) {
    case 'compare':
      highlightBars(step.i, step.j);
      if (!fast) incStat('comparisons');
      break;
    case 'swap':
      swapBars(step.i, step.j);
      if (!fast) incStat('swaps');
      break;
    case 'write':
      baseArray[step.i] = step.value;
      drawBars(true);
      highlightBars(step.i, step.i);
      if (!fast) incStat('swaps');
      if (step.buf) renderMergeBuffer(step.buf, step.range);
      break;
    case 'pivot':
      drawBars(true);
      const pivotEl = document.querySelector(`.bar[data-i='${step.i}']`);
      if (pivotEl) pivotEl.classList.add('active');
      if (step.left != null) {
        document.querySelectorAll('.bar').forEach(b => b.classList.remove('partition'));
        for (let k = step.left; k <= step.right; k++) {
          const bar = document.querySelector(`.bar[data-i='${k}']`);
          if (bar) bar.classList.add('partition');
        }
      }
      break;
    case 'mark-sorted':
      markBarSorted(step.i);
      if (appState.stepIndex >= appState.steps.length) {
        document.querySelectorAll('.bar.partition').forEach(b => b.classList.remove('partition'));
        const mb = document.getElementById('merge-buffer');
        if (mb) mb.innerHTML = '';
      }
      break;
  }
  if (!fast) incStat('operations');
}

function renderMergeBuffer(buf, range) {
  const container = qs('#merge-buffer');
  if (!container) return;
  container.innerHTML = '';
  buf.forEach(v => container.append(el('div', { className: 'merge-cell' }, v)));
  if (range) {
    container.append(
      el('div', {
        style: {
          fontSize: '.55rem',
          opacity: .6,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)'
        }
      }, `${range[0]}-${range[1]}`)
    );
  }
}

function togglePlay() {
  if (!appState.steps.length) return;
  appState.playing = !appState.playing;
  togglePlayButton(appState.playing, false);
  if (appState.playing) {
    appState.playLoop = setInterval(() => {
      if (appState.stepIndex >= appState.steps.length) {
        appState.playing = false;
        togglePlayButton(false);
        clearInterval(appState.playLoop);
        return;
      }
      runStep(appState.steps[appState.stepIndex++]);
      if (appState.current === 'sorting' && appState.stepIndex === appState.steps.length) {
        document.querySelectorAll('.bar.partition').forEach(b => b.classList.remove('partition'));
        const mb = document.getElementById('merge-buffer');
        if (mb) mb.innerHTML = '';
      }
    }, animSpeed[speed]);
  } else {
    clearInterval(appState.playLoop);
  }
}

function stopPlayback() {
  if (appState.playing) {
    appState.playing = false;
    clearInterval(appState.playLoop);
    togglePlayButton(false, false);
  }
}

function togglePlayButton(isPlaying, disabled) {
  const btn = qs('#step-play');
  if (!btn) return;
  if (disabled) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-play"></i> Play';
    return;
  }
  btn.disabled = false;
  btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Play';
}

function step(dir) {
  if (!appState.steps.length) return;
  if (dir > 0 && appState.stepIndex < appState.steps.length) {
    runStep(appState.steps[appState.stepIndex++]);
  } else if (dir < 0 && appState.stepIndex > 0) {
    renderCurrentAgain(appState.stepIndex - 1);
    appState.stepIndex--;
  }
}

function renderCurrentAgain(targetIndex = 0) {
  if (targetIndex === 0) {
    appState.stats = { comparisons: 0, swaps: 0, operations: 0 };
    updateStats();
  }
  if (appState.current === 'sorting') {
    drawBars(true);
    for (let i = 0; i < targetIndex; i++) applyStepState(appState.steps[i], true);
  }
  highlightPseudo(null);
}

function runStep(step) {
  applyStepState(step);
  if (step.pc) highlightPseudo(step.pc);
}

function setPseudocodeForAlgorithm(algo) {
  if (algo === 'bubble') {
    setPseudocode([
      { text: 'while True:', id: 'loop_i' },
      { text: '    swapped = False', id: 'loop_j' },
      { text: '    for j in range(0,n-1):', id: 'cond_swap' },
      { text: '        if A[j] > A[j+1]: swap', id: 'mark' }
    ]);
  }
  else if (algo === 'insertion') {
    setPseudocode([
      { text: 'for i in range(1,n):', id: 'loop_i' },
      { text: '    key = A[i]', id: 'loop_j' },
      { text: '    while j>=0 and A[j]>key:', id: 'cond_swap' },
      { text: '        A[j+1] = A[j]; j -= 1', id: 'mark' }
    ]);
  }
  else if (algo === 'selection') {
    setPseudocode([
      { text: 'for i in range(0,n-1):', id: 'loop_i' },
      { text: '    min_idx = i', id: 'min_init' },
      { text: '    for j in range(i+1,n):', id: 'loop_j' },
      { text: '        if A[j] < A[min_idx]:', id: 'cond_cmp' },
      { text: '            min_idx = j', id: 'min_update' },
      { text: '    swap A[i] & A[min_idx]', id: 'mark' }
    ]);
  }
  else if (algo === 'merge') {
    setPseudocode([
      { text: 'def merge_sort(A):', id: 'm_def' },
      { text: '  if len(A)<=1: return A', id: 'm_base' },
      { text: '  mid = len(A)//2', id: 'm_mid' },
      { text: '  L = merge_sort(A[:mid])', id: 'm_left' },
      { text: '  R = merge_sort(A[mid:])', id: 'm_right' },
      { text: '  return merge(L,R)', id: 'm_merge' },
      { text: 'merge(L,R):', id: 'mg0' },
      { text: '  while i<len(L) and j<len(R):', id: 'mg_loop' },
      { text: '    if L[i] <= R[j]: take L[i]', id: 'mg_cmp' },
      { text: '  append leftovers', id: 'mg_tail' }
    ]);
  }
  else if (algo === 'quick') {
    setPseudocode([
      { text: 'def quick_sort(lo,hi):', id: 'q_def' },
      { text: '  if lo >= hi: return', id: 'q_base' },
      { text: '  p = partition(lo,hi)', id: 'q_part' },
      { text: '  quick_sort(lo,p-1)', id: 'q_left' },
      { text: '  quick_sort(p+1,hi)', id: 'q_right' },
      { text: 'partition(lo,hi):', id: 'p_def' },
      { text: '  pivot = A[mid]', id: 'p_pivot' },
      { text: '  while i<=j:', id: 'p_loop' },
      { text: '    move i while A[i]<pivot', id: 'p_i' },
      { text: '    move j while A[j]>pivot', id: 'p_j' },
      { text: '    if i<=j: swap & i++,j--', id: 'p_swap' }
    ]);
  }
  else if (algo === 'heap') {
    setPseudocode([
      { text: 'def heap_sort(A):', id: 'h_def' },
      { text: '  for i in range(n//2,-1,-1):', id: 'h_build' },
      { text: '    heapify(A, i, n)', id: 'h_heapify' },
      { text: '  for i in range(n-1, 0, -1):', id: 'h_loop' },
      { text: '    swap A[0] & A[i]', id: 'h_swap' },
      { text: '    heapify(A, 0, i)', id: 'h_reduce' },
      { text: 'heapify(A, i, n):', id: 'heapify' },
      { text: '  largest = i', id: 'h_init' },
      { text: '  if 2i+1<n & A[2i+1]>A[i]:', id: 'h_left' },
      { text: '    largest = 2i+1', id: 'h_left_set' },
      { text: '  if 2i+2<n & A[2i+2]>A[largest]:', id: 'h_right' },
      { text: '    largest = 2i+2', id: 'h_right_set' }
    ]);
  }
}

registerImplementations({ drawBars, applyStepState });
export { drawBars, applyStepState };
