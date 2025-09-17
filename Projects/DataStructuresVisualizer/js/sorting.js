import { el, setPseudocode, highlightPseudo, appState, incStat, qs, registerImplementations } from './core.js';

// Working array (not mutated during step generation; we clone for steps).
let baseArray = [];
let depthMap = new Map();
let resizeObserver;

export function renderSortingVisualizer(visualArea, controlsArea) {
  // Choose an initial size that fits current viewport (mobile-first).
  const approxBarTargetWidth = 22; // px target width before responsive shrinking
  const containerWidth = visualArea.clientWidth || window.innerWidth;
  const estimatedCount = Math.max(8, Math.min(60, Math.floor((containerWidth - 40) / approxBarTargetWidth)));
  baseArray = Array.from({ length: estimatedCount }, () => Math.floor(Math.random() * 90) + 10);
  const title = el('h2', {}, 'Sorting Algorithms');
  const barsContainer = el('div', { id: 'bars', className: 'bar-container' });
  const controlsForm = el('div', {},
    el('button', { className: 'btn', onclick: shuffleBars }, 'Shuffle'),
    el('label', { style: { marginLeft: '.5rem' } }, 'Size:'),
    (() => {
      const sizeInput = el('input', { id: 'sort-size', type: 'number', min: 4, max: 200, value: baseArray.length, style: { width: '70px' } });
      sizeInput.addEventListener('change', () => {
        let n = Number(sizeInput.value);
        if (Number.isNaN(n) || n < 4) n = 18; if (n > 200) n = 200;
        sizeInput.value = n;
        baseArray = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);
        drawBars();
      });
      return sizeInput;
    })(),
    el('select', { id: 'algo', onchange: updateSortPseudocode },
      el('option', { value: 'bubble' }, 'Bubble'),
      el('option', { value: 'insertion' }, 'Insertion'),
      el('option', { value: 'merge' }, 'Merge'),
      el('option', { value: 'quick' }, 'Quick')
    ),
    el('button', { className: 'btn primary', onclick: startSort }, 'Generate Steps')
  );
  const legend = el('div', { id: 'depth-legend', className: 'depth-legend' },
    el('span', { className: 'swatch' }, el('span', { className: 'box' }), 'depth 0'),
    el('span', { className: 'swatch' }, el('span', { className: 'box d1' }), '1'),
    el('span', { className: 'swatch' }, el('span', { className: 'box d2' }), '2'),
    el('span', { className: 'swatch' }, el('span', { className: 'box d3' }), '3'),
    el('span', { className: 'swatch' }, el('span', { className: 'box d4' }), '4+')
  );
  const mergeBuffer = el('div', { id: 'merge-buffer', className: 'merge-buffer' });
  visualArea.append(title, barsContainer, legend, mergeBuffer);
  controlsArea.append(el('h3', {}, 'Sorting Controls'), controlsForm);
  drawBars();
  // Redraw bars on resize (debounced via ResizeObserver for container width changes)
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => drawBars(true));
    resizeObserver.observe(barsContainer);
  } else {
    window.addEventListener('resize', () => drawBars(true));
  }
  updateSortPseudocode();
}

function updateSortPseudocode(){
  const algo = qs('#algo')?.value || 'bubble';
  if(algo==='bubble') setPseudocode([
    { text: 'while True:', id: 'loop_i' },
    { text: '    swapped = False', id: 'loop_j' },
    { text: '    for j in range(0,n-1):', id: 'cond_swap' },
    { text: '        if A[j] > A[j+1]: swap', id: 'mark' }
  ]);
  else if(algo==='insertion') setPseudocode([
    { text: 'for i in range(1,n):', id: 'loop_i' },
    { text: '    key = A[i]', id: 'loop_j' },
    { text: '    while j>=0 and A[j]>key:', id: 'cond_swap' },
    { text: '        A[j+1] = A[j]; j -= 1', id: 'mark' }
  ]);
  else if(algo==='merge') setPseudocode([
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
  else if(algo==='quick') setPseudocode([
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

// --- Rendering Helpers ---
function drawBars(reset) {
  const bars = qs('#bars'); if (!bars) return; bars.innerHTML = '';
  const maxVal = Math.max(...baseArray, 100);
  // Compute dynamic width so that bars always fit without horizontal scroll.
  const containerWidth = bars.clientWidth || bars.parentElement.clientWidth || window.innerWidth;
  const gap = 6; // must match CSS gap (desktop)
  const totalGap = gap * (baseArray.length - 1);
  let barWidth = Math.floor((containerWidth - totalGap - 4) / baseArray.length); // 4px padding fudge
  const minBarWidth = 6; const maxBarWidth = 40;
  if (barWidth < minBarWidth) barWidth = minBarWidth; else if (barWidth > maxBarWidth) barWidth = maxBarWidth;
  baseArray.forEach((value, index) => {
    const height = (value / maxVal) * 240 + 10; // keep height scaling for now
    const depthClass = depthMap.get(index) != null ? ` depth-${depthMap.get(index)%5}` : '';
    bars.append(el('div', { className: 'bar'+depthClass, style: { height: `${height}px`, width: `${barWidth}px` }, dataset: { i: index } }));
  });
  if (!reset) document.querySelectorAll('.bar').forEach(b => b.classList.remove('sorted', 'active'));
}
function shuffleBars() {
  const sizeInput = qs('#sort-size');
  const n = sizeInput ? Number(sizeInput.value) : 18;
  baseArray = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);
  depthMap = new Map();
  const buf = qs('#merge-buffer'); if(buf) buf.innerHTML='';
  drawBars();
  appState.steps = []; appState.stepIndex = 0;
}
function highlightBars(i, j) {
  document.querySelectorAll('.bar').forEach(b => b.classList.remove('active'));
  document.querySelector(`.bar[data-i='${i}']`)?.classList.add('active');
  document.querySelector(`.bar[data-i='${j}']`)?.classList.add('active');
}
function swapBars(i, j) { [baseArray[i], baseArray[j]] = [baseArray[j], baseArray[i]]; drawBars(true); highlightBars(i, j); }
function markBarSorted(i) { const b = document.querySelector(`.bar[data-i='${i}']`); if (b) b.classList.add('sorted'); }

// --- Step Generation Trigger ---
function startSort() {
  appState.steps = []; appState.stepIndex = 0;
  depthMap = new Map();
  const buf = qs('#merge-buffer'); if(buf) buf.innerHTML='';
  const algo = qs('#algo').value; const original = [...baseArray];
  switch (algo) { case 'bubble': genBubbleSteps(); break; case 'insertion': genInsertionSteps(); break; case 'merge': genMergeSteps(); break; case 'quick': genQuickSteps(); break; }
  baseArray = [...original]; drawBars(); highlightPseudo('loop_i');
}

// --- Step Generators ---
function genBubbleSteps() {
  const arr = [...baseArray]; const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'cond_swap' });
      if (arr[j] > arr[j + 1]) { [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'mark' }); }
    }
    appState.steps.push({ type: 'mark-sorted', i: n - 1 - i, pc: 'loop_j' });
  }
}
function genInsertionSteps() {
  const arr = [...baseArray];
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) {
      appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'cond_swap' });
      arr[j + 1] = arr[j];
      appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'mark' });
      j--;
    }
    arr[j + 1] = key;
  }
  for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}
function genMergeSteps() {
  const arr = [...baseArray];
  depthMap = new Map();
  function merge(left, right, depth=0) {
    if (right - left <= 0) return;
    for(let i=left;i<=right;i++) depthMap.set(i, depth);
    const mid = Math.floor((left + right) / 2);
    merge(left, mid, depth+1); merge(mid + 1, right, depth+1);
    const temp = []; let i = left, j = mid + 1;
    while (i <= mid && j <= right) {
      appState.steps.push({ type: 'compare', i, j, pc: 'mg_cmp' });
      if (arr[i] <= arr[j]) temp.push(arr[i++]); else temp.push(arr[j++]);
    }
    while (i <= mid) temp.push(arr[i++]);
    while (j <= right) temp.push(arr[j++]);
    for (let k = left; k <= right; k++) {
      const newVal = temp[k - left];
      if (arr[k] !== newVal) { arr[k] = newVal; appState.steps.push({ type: 'write', i: k, value: newVal, pc: 'mg_tail', buf: temp.slice(), range:[left,right] }); }
    }
  }
  merge(0, arr.length - 1, 0);
  for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}
function genQuickSteps() {
  const arr = [...baseArray];
  depthMap = new Map();
  function qsRec(left, right, depth=0) {
    if (left >= right) return;
    for(let k=left;k<=right;k++) depthMap.set(k, depth);
    let i = left, j = right, pivotIndex = Math.floor((left + right) / 2), pivot = arr[pivotIndex];
  appState.steps.push({ type: 'pivot', i: pivotIndex, pc: 'p_pivot', depth, left, right });
    while (i <= j) {
      while (arr[i] < pivot) { appState.steps.push({ type: 'compare', i, j: i, pc: 'p_i' }); i++; }
      while (arr[j] > pivot) { appState.steps.push({ type: 'compare', i: j, j, pc: 'p_j' }); j--; }
      if (i <= j) { if (i !== j) { [arr[i], arr[j]] = [arr[j], arr[i]]; appState.steps.push({ type: 'swap', i, j, pc: 'p_swap' }); } i++; j--; }
    }
    qsRec(left, j, depth+1); qsRec(i, right, depth+1);
  }
  qsRec(0, arr.length - 1, 0);
  for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}

// --- Step Application (used by core playback) ---
function applyStepState(step, fast) {
  switch (step.type) {
    case 'compare':
      highlightBars(step.i, step.j); if (!fast) incStat('comparisons'); break;
    case 'swap':
      swapBars(step.i, step.j); if (!fast) incStat('swaps'); break;
    case 'write':
      baseArray[step.i] = step.value; drawBars(true); highlightBars(step.i, step.i); if (!fast) incStat('swaps'); if(step.buf) renderMergeBuffer(step.buf, step.range); break;
    case 'pivot':
      drawBars(true);
      const pivotEl = document.querySelector(`.bar[data-i='${step.i}']`);
      if(pivotEl) pivotEl.classList.add('active');
      if(step.left!=null){
        document.querySelectorAll('#bars .bar').forEach(b=> b.classList.remove('partition'));
        for(let k=step.left;k<=step.right;k++) document.querySelector(`.bar[data-i='${k}']`)?.classList.add('partition');
      }
      break;
    case 'mark-sorted':
      markBarSorted(step.i);
      // if final step reached, clear transient visuals
      if(appState.stepIndex >= appState.steps.length){
        document.querySelectorAll('#bars .bar.partition').forEach(b=>b.classList.remove('partition'));
        const mb = document.getElementById('merge-buffer'); if(mb) mb.innerHTML='';
      }
      break;
    default: break;
  }
  if (!fast) incStat('operations');
}

function renderMergeBuffer(buf, range){
  const container = qs('#merge-buffer'); if(!container) return;
  container.innerHTML='';
  buf.forEach(v=> container.append(el('div',{className:'merge-cell'}, v)));
  if(range) container.append(el('div',{style:{fontSize:'.55rem',opacity:.6,writingMode:'vertical-rl',transform:'rotate(180deg)'}}, `${range[0]}-${range[1]}`));
}

registerImplementations({ drawBars, applyStepState });
export { drawBars, applyStepState };
