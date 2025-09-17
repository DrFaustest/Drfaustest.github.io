import { generate, solve, traceSolve } from './js/lib/sudoku.js';

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const difficultyEl = document.getElementById('difficulty');

let currentPuzzle = null;
let currentSolution = null;
let showHints = false;

function makeBoard(){
  boardEl.innerHTML='';
  for(let i=0;i<81;i++){
    const div = document.createElement('div');
    div.className='cell';
    const input = document.createElement('input');
    input.type='text';
    input.maxLength=1;
    input.dataset.index=i;
    input.inputMode='numeric';
    input.addEventListener('input',onInput);
    div.appendChild(input);
    boardEl.appendChild(div);
  }
}

function render(puzzle){
  const inputs = boardEl.querySelectorAll('input');
  for(let i=0;i<81;i++){
    const r = Math.floor(i/9), c = i%9;
    const val = puzzle[r][c];
    const cell = inputs[i].parentElement;
    inputs[i].value = val? String(val): '';
    inputs[i].disabled = !!val;
    if(val) cell.classList.add('fixed'); else cell.classList.remove('fixed');
    cell.classList.remove('invalid');
    // manage candidates
    // remove existing candidates
    const old = cell.querySelector('.candidates');
    if(old) old.remove();
    if(!val && showHints){
      const candidates = computeCandidates(puzzle, r, c);
      const candWrap = document.createElement('div');
      candWrap.className = 'candidates';
      for(let n=1;n<=9;n++){
        const span = document.createElement('div');
        span.className = 'cand';
        span.textContent = candidates.has(n) ? n : '';
        candWrap.appendChild(span);
      }
      cell.appendChild(candWrap);
    }
  }
}

function computeCandidates(grid, row, col){
  const s = new Set();
  for(let i=1;i<=9;i++) s.add(i);
  for(let i=0;i<9;i++) s.delete(grid[row][i]);
  for(let i=0;i<9;i++) s.delete(grid[i][col]);
  const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3;
  for(let i=0;i<3;i++) for(let j=0;j<3;j++) s.delete(grid[br+i][bc+j]);
  return s;
}

function onInput(e){
  const v = e.target.value.replace(/[^1-9]/g,'');
  e.target.value = v;
  if(showHints){
    const grid = getGridFromUI();
    render(grid);
  }
}

function getGridFromUI(){
  const inputs = boardEl.querySelectorAll('input');
  const grid = Array.from({length:9},()=>Array(9).fill(0));
  for(let i=0;i<81;i++){
    const r = Math.floor(i/9), c = i%9;
    const val = parseInt(inputs[i].value)||0;
    grid[r][c]=val;
  }
  return grid;
}

function showMessage(text, type=''){
  messageEl.textContent = text || '';
}

document.getElementById('newBtn').addEventListener('click',()=>{
  const diff = difficultyEl.value;
  const {puzzle, solution} = generate(diff);
  currentPuzzle = puzzle;
  currentSolution = solution;
  render(puzzle);
  showMessage('New puzzle generated ('+diff+')');
});

document.getElementById('showHints')?.addEventListener('change',(e)=>{
  showHints = !!e.target.checked;
  // re-render current view
  const grid = getGridFromUI();
  render(grid);
});

// Developer view
const devCheckbox = document.getElementById('devView');
const algoPanel = document.getElementById('algo');
let stackPanel = document.getElementById('stack');
let devMode = false;
let runningTrace = false;
// Playback control state for dev trace
const devPlaybackEl = document.getElementById('devPlayback');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
let playbackPaused = true;
let playbackResolver = null;
let autoPlayOnTraceStart = true;
let stepRequestedOnStart = false;

function ensurePlaybackVisible(){ if(devPlaybackEl) devPlaybackEl.style.display = devMode ? 'flex' : 'none'; }

function waitForPlayback(){
  if(!playbackPaused) return Promise.resolve();
  // If a single-step was requested at start, allow the first step through immediately
  if(stepRequestedOnStart){ stepRequestedOnStart = false; return Promise.resolve(); }
  return new Promise(resolve=>{ playbackResolver = resolve; });
}

if(playBtn) playBtn.addEventListener('click', ()=>{
  autoPlayOnTraceStart = true;
  if(!runningTrace){
    // start the trace
    document.getElementById('solveBtn').click();
  }
  playbackPaused = false;
  if(playbackResolver) { playbackResolver(); playbackResolver=null; }
  if(playBtn) playBtn.disabled = true; if(pauseBtn) pauseBtn.disabled = false;
});
if(pauseBtn) pauseBtn.addEventListener('click', ()=>{ playbackPaused = true; if(playBtn) playBtn.disabled = false; if(pauseBtn) pauseBtn.disabled = true; });
if(stepBtn) stepBtn.addEventListener('click', ()=>{
  // request a single step; if not running, start trace and run exactly one step
  autoPlayOnTraceStart = false;
  stepRequestedOnStart = true;
  if(!runningTrace){
    playbackPaused = true; // start paused, but first step will be allowed by stepRequestedOnStart
    document.getElementById('solveBtn').click();
  } else {
    // if already running paused, resolve one step
    if(playbackResolver){ playbackResolver(); playbackResolver=null; }
  }
});

// initial playback control setup
if(playBtn) playBtn.disabled = false;
if(pauseBtn) pauseBtn.disabled = true;
ensurePlaybackVisible();

// Pseudocode lines for display (domains + propagation + MRV search)
const pseudo = [
  'function solve_with_propagation(domains):',
  '  propagate naked and hidden singles',
  '  if all cells single: return solution',
  '  choose cell i with minimum remaining values (MRV)',
  '  candidates = digits in domains[i]',
  '  for each v in candidates:',
  '    set domains[i] = {v}',
  '    propagate domains',
  '    if solve_with_propagation(domains): return true',
  '    undo assignment (restore domains)',
  '  return false'
];

function renderPseudo(){
  // Clear the algorithm panel and re-render pseudocode lines.
  // Keep or recreate the stack log element so it remains visible below the pseudocode.
  algoPanel.innerHTML = '';
  pseudo.forEach((line,i)=>{
    const el = document.createElement('div');
    el.className = 'dev-line pseudo';
    el.dataset.line = i;
    el.textContent = line;
    algoPanel.appendChild(el);
  });

  // Ensure the stack log exists and is attached inside the algo panel
  const existing = document.getElementById('stack');
  if(existing){
    // If it exists elsewhere (or was previously removed), append it here
    algoPanel.appendChild(existing);
    stackPanel = existing;
  } else {
    // Create a new stack container
    const div = document.createElement('div');
    div.id = 'stack';
    div.className = 'stack-log';
    div.setAttribute('aria-live','polite');
    algoPanel.appendChild(div);
    stackPanel = div;
  }
}

devCheckbox?.addEventListener('change',(e)=>{
  devMode = !!e.target.checked;
  // show/hide dev panel by toggling a class on body or container
  document.querySelector('.layout-with-dev')?.classList.toggle('dev-enabled', devMode);
  if(devMode) renderPseudo();
  ensurePlaybackVisible();
});

// Tab switching
document.querySelectorAll('.dev-tabs .tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.dev-tabs .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.dev-tab-content').forEach(c=>c.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  });
});

// Helper to clear cell highlight classes
function clearHighlights(){
  boardEl.querySelectorAll('.cell').forEach(cell=>{
    cell.classList.remove('current-cell','checking','backtrack');
  });
}

function highlightCell(r,c,cls){
  const idx = r*9+c;
  const cell = boardEl.querySelectorAll('.cell')[idx];
  if(!cell) return;
  cell.classList.add(cls);
}

function updateStackView(stack){
  // stack is an array of frames {r,c, candidates, attempting}
  stackPanel.innerHTML='';
  stack.forEach((frame,i)=>{
    const el = document.createElement('div');
    el.className='stack-frame';
    el.textContent = i+1 + ': ('+frame.r+','+frame.c+') -> trying '+(frame.attempting||'');
    stackPanel.appendChild(el);
  });
}

// Run traced solve when dev mode and Solve pressed
document.getElementById('solveBtn').addEventListener('click', async ()=>{
  if(!devMode){
    const grid = currentSolution || getGridFromUI();
    if(!currentSolution){
      const res = solve(getGridFromUI());
      if(res.solution) render(res.solution);
      else showMessage('No solution found');
      return;
    }
    render(currentSolution);
    showMessage('Solved');
    return;
  }

  // dev mode: run trace
  if(runningTrace) return;
  runningTrace = true;
  // Determine initial playback state based on autoPlay/step flags
  playbackPaused = !autoPlayOnTraceStart;
  // If starting paused (e.g. Step requested), leave playbackPaused=true; waitForPlayback will allow the first step
  if(!playbackPaused){ if(playbackResolver){ playbackResolver(); playbackResolver = null; } }
  if(playBtn) playBtn.disabled = !playbackPaused; if(pauseBtn) pauseBtn.disabled = playbackPaused;
  algoPanel.innerHTML=''; stackPanel.innerHTML='';
  renderPseudo();
  const initial = getGridFromUI();
  const stack = [];

  const stepHandler = async (ev)=>{
    // ev: {type, r, c, val, candidates, grid}
    // clear previous highlights
    clearHighlights();
    // reset pseudo highlights
    algoPanel.querySelectorAll('.dev-line').forEach(l=>l.classList.remove('current','try','backtrack'));

    if(ev.type==='enter'){
      // highlight 'choose cell i with minimum remaining values (MRV)'
      const el = algoPanel.querySelector('[data-line="3"]'); if(el) el.classList.add('current');
      highlightCell(ev.r, ev.c, 'current-cell');
      // push frame
      stack.push({r:ev.r,c:ev.c,candidates:Array.from(ev.candidates)});
      updateStackView(stack);
    } else if(ev.type==='try'){
      const el = algoPanel.querySelector('[data-line="4"]'); if(el) el.classList.add('try');
      highlightCell(ev.r, ev.c, 'checking');
      // annotate top of stack
      if(stack.length) stack[stack.length-1].attempting = ev.val;
      updateStackView(stack);
    } else if(ev.type==='assign'){
      // highlight 'set domains[i] = {v}' / propagate
      const el = algoPanel.querySelector('[data-line="6"]'); if(el) el.classList.add('current');
      const inputs = boardEl.querySelectorAll('input');
      const idx = ev.r*9+ev.c;
      inputs[idx].value = String(ev.val);
      highlightCell(ev.r, ev.c, 'current-cell');
      // update candidates around
      render(ev.grid);
    } else if(ev.type==='backtrack'){
      const el = algoPanel.querySelector('[data-line="9"]'); if(el) el.classList.add('backtrack');
      highlightCell(ev.r, ev.c, 'backtrack');
      stack.pop(); updateStackView(stack);
      const inputs = boardEl.querySelectorAll('input');
      const idx = ev.r*9+ev.c;
      inputs[idx].value = '';
      render(ev.grid);
    } else if(ev.type==='deadend'){
      const el = algoPanel.querySelector('[data-line="9"]'); if(el) el.classList.add('backtrack');
      highlightCell(ev.r, ev.c, 'backtrack');
    } else if(ev.type==='done'){
      if(ev.success && ev.solution){
        // persist the final solution and clear transient highlights/stack
        currentSolution = ev.solution;
        clearHighlights();
        updateStackView([]);
        render(ev.solution);
        showMessage('Trace completed — solution found');
      } else {
        showMessage('Trace completed — no solution');
      }
      // stop playback and disable playback controls
      runningTrace = false;
      playbackPaused = true;
      // reset auto-play/step flags
      autoPlayOnTraceStart = true;
      stepRequestedOnStart = false;
      if(playBtn) playBtn.disabled = false; if(pauseBtn) pauseBtn.disabled = true;
      if(playbackResolver){ playbackResolver(); playbackResolver=null; }
    }
    else if(ev.type==='ready'){
      // The solver finished initial propagation and is ready to begin search.
      // If autoPlayOnTraceStart is true, resume playback; if a single step was
      // requested at start, allow exactly one step through.
      if(autoPlayOnTraceStart){ playbackPaused = false; if(playbackResolver){ playbackResolver(); playbackResolver=null; } if(playBtn) playBtn.disabled = true; if(pauseBtn) pauseBtn.disabled = false; }
      else if(stepRequestedOnStart){ // allow the first step through immediately
        stepRequestedOnStart = false;
        if(playbackResolver){ playbackResolver(); playbackResolver=null; }
      }
    }
    // small delay for visualization
    // allow play/pause/step control
    await waitForPlayback();
    await new Promise(r=>setTimeout(r, 120));
  };

  // call traceSolve
  try{
    await traceSolve(initial, stepHandler);
  }catch(err){
    console.error('Trace error', err);
    runningTrace=false;
  }

});

document.getElementById('checkBtn').addEventListener('click',()=>{
  const grid = getGridFromUI();
  // check against solution if available, else try to solve
  const res = solve(grid);
  const inputs = boardEl.querySelectorAll('input');
  let bad=0, empty=0;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const v = grid[r][c];
    const idx = r*9+c;
    const cell = inputs[idx].parentElement;
    cell.classList.remove('invalid');
    if(!v) empty++;
    else if(currentSolution){
      if(currentSolution[r][c]!==v){ cell.classList.add('invalid'); bad++; }
    } else if(res.solution){
      if(res.solution[r][c]!==v){ cell.classList.add('invalid'); bad++; }
    }
  }
  if(bad===0 && empty===0) showMessage('Nice! Puzzle looks correct.');
  else if(bad>0) showMessage(bad+' incorrect cell(s)');
  else showMessage('Keep going — '+empty+' empty cells');
});


document.getElementById('clearBtn').addEventListener('click',()=>{
  if(!currentPuzzle) return;
  render(currentPuzzle);
  showMessage('Cleared to original puzzle');
});

// initial
makeBoard();
// generate a puzzle on load
document.getElementById('newBtn').click();
