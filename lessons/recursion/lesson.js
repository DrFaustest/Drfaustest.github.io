import { hanoiTrace, mazeTrace, mazePreset } from './algorithms.js';
import { sudokuPreset, parseSudoku, randomSudoku } from './sudoku.js';

const $ = id => document.getElementById(id);
const files = { hanoi: 'tower_of_hanoi.py', maze: 'maze.py', sudoku: 'sudoku.py' };
const sources = {};
let sudokuWorker = null, sudokuTimeout = null;
const colors = ['#146757', '#286b87', '#965326', '#695788', '#8b4449', '#596634'];
let lesson = 'hanoi', grid = mazePreset('branches'), steps = [], position = 0;
let sudoku = sudokuPreset('quick');
let timer = null, selectedFrame = null, loadVersion = 0;

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function format(value, name = '') {
  const tuple = values => `(${values.map(v => typeof v === 'string' ? JSON.stringify(v) : v).join(', ')})`;
  if (name === 'goal') return tuple(value);
  if (name === 'moves' || name === 'empty') return `[${value.map(tuple).join(', ')}]`;
  if (name === 'maze' || name === 'grid' || name === 'board') return `[\n${value.map(row => `  [${row.join(', ')}]`).join(',\n')}\n]`;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'string' && value.startsWith('<function')) return value;
  return JSON.stringify(value);
}

function pause() {
  clearTimeout(timer); timer = null;
  $('play').textContent = '▶ Play';
  $('explanation').setAttribute('aria-live', 'polite');
}

function rebuild() {
  pause(); position = 0; selectedFrame = null;
  sudokuWorker?.terminate(); sudokuWorker = null; clearTimeout(sudokuTimeout);
  if (lesson === 'sudoku') {
    steps = [];
    for (const id of ['reset','back','play','next','finish','timeline']) $(id).disabled = true;
    $('cancel-sudoku').disabled = false;
    $('sudoku-status').textContent = 'Preparing the trace… You can cancel or choose another layout.';
    $('explanation').textContent = 'Preparing this puzzle’s execution trace.';
    $('step-label').textContent = 'Preparing trace'; $('line-status').textContent = '';
    $('stack').replaceChildren(); $('variables').replaceChildren(); $('trace-console').replaceChildren();
    $('program-output').textContent = ''; $('follow-frame').disabled = true;
    $('stack-depth').textContent = ''; $('frame-label').textContent = '';
    document.querySelectorAll('.active-line').forEach(line => line.classList.remove('active-line'));
    renderSudoku({board:sudoku,current:null,placements:0,backtracks:0});
    const worker = new Worker(new URL('sudoku-worker.js', import.meta.url), {type:'module'});
    sudokuWorker = worker;
    const finish = message => {
      if (sudokuWorker !== worker) return;
      worker.terminate(); sudokuWorker = null; clearTimeout(sudokuTimeout);
      $('cancel-sudoku').disabled = true;
      if (message.error) { $('sudoku-status').textContent = message.error; $('explanation').textContent = 'No completed trace is loaded. Choose another layout or adjust the givens.'; return; }
      steps = message.steps;
      for (const id of ['reset','play','timeline']) $(id).disabled = false;
      $('timeline').max = steps.length - 1;
      $('sudoku-status').textContent = 'Ready: ' + steps.length + ' recorded states. Step through or press Play.';
      render();
    };
    worker.onmessage = event => finish(event.data);
    worker.onerror = event => { event.preventDefault(); finish({error:'Could not prepare this trace. Choose a layout to retry.'}); };
    sudokuTimeout = setTimeout(() => finish({error:'This trace took too long. Add a few givens or choose a teaching layout. No conclusion about solvability was reached.'}), 10000);
    worker.postMessage(sudoku);
    return;
  }
  for (const id of ['reset','play','timeline']) $(id).disabled = false;
  steps = lesson === 'hanoi' ? hanoiTrace(Number($('disk-count').value)) : mazeTrace(grid);
  $('timeline').max = steps.length - 1;
  render();
}

function go(nextPosition) {
  if (!steps.length) return;
  position = Math.max(0, Math.min(steps.length - 1, nextPosition));
  selectedFrame = null;
  render();
}

function tick() {
  if (position >= steps.length - 1) { pause(); return; }
  timer = setTimeout(() => { go(position + 1); tick(); }, Number($('speed').value));
}

function togglePlay() {
  if (!steps.length) return;
  if (timer) { pause(); return; }
  if (position === steps.length - 1) go(0);
  $('explanation').setAttribute('aria-live', 'off');
  $('play').textContent = 'Ⅱ Pause';
  tick();
}

function renderTower(step) {
  const tower = $('tower'); tower.replaceChildren();
  const counts = [];
  Object.entries(step.pegs).forEach(([name, disks]) => {
    const peg = node('div', undefined, 'peg');
    peg.append(node('span', name, 'peg-label'));
    for (const size of disks) {
      const disk = node('div', String(size), 'disk');
      disk.style.width = `${24 + size * 11}%`;
      disk.style.setProperty('--disk-color', colors[size - 1]);
      peg.append(disk);
    }
    tower.append(peg);
    counts.push(`${name}: [${disks.join(', ')}]`);
  });
  tower.setAttribute('aria-label', `Tower state, bottom to top. ${counts.join('. ')}`);
  $('peg-values').replaceChildren(...counts.map(text => node('span', text)));
  $('state-metric').textContent = `${step.moves.length} / ${2 ** Number($('disk-count').value) - 1} moves`;
}

function buildMaze() {
  const board = $('maze-grid'); board.replaceChildren();
  board.style.gridTemplateColumns = '1.4rem repeat(6, minmax(0, 1fr))';
  board.append(node('span', '', 'axis-label'));
  for (let c = 0; c < 6; c++) board.append(node('span', String(c), 'axis-label'));
  grid.forEach((row, r) => {
    board.append(node('span', String(r), 'axis-label'));
    row.forEach((_, c) => {
    const cell = node('button', '', 'maze-cell');
    cell.type = 'button'; cell.dataset.row = r; cell.dataset.col = c;
    cell.tabIndex = r === 0 && c === 0 ? 0 : -1;
    cell.addEventListener('click', () => {
      if (!$('edit-maze').checked || (r === 0 && c === 0) || (r === 5 && c === 5)) return;
      grid[r][c] = 1 - grid[r][c]; rebuild();
    });
    board.append(cell);
    });
  });
}

function renderMaze(step) {
  const current = step.current?.join(',');
  for (const cell of $('maze-grid').children) {
    if (!cell.classList.contains('maze-cell')) continue;
    const r = Number(cell.dataset.row), c = Number(cell.dataset.col), key = r + ',' + c;
    const start = key === '0,0', goal = key === '5,5', wall = step.maze[r][c] === 1, filled = step.maze[r][c] === 2, dead = step.maze[r][c] === 3;
    cell.textContent = start ? 'S' : goal ? 'G' : current === key ? '@' : filled ? '·' : dead ? '·' : '';
    cell.className = ['maze-cell', wall && 'wall', filled && 'filled', dead && 'visited', current === key && 'current'].filter(Boolean).join(' ');
    cell.setAttribute('aria-label', 'Row ' + r + ', column ' + c + ': ' + (start ? 'start, ' : goal ? 'goal, ' : '') + (wall ? 'wall' : filled ? 'end' : dead ? 'visited' : 'open') + (current === key ? ', current call' : ''));
    cell.setAttribute('aria-disabled', String(!$('edit-maze').checked || start || goal));
  }
  $('state-metric').textContent = step.maze.flat().filter(value => value === 3).length + ' visited cells';
}

function renderSudoku(step) {
  const board = $('sudoku-grid'); board.replaceChildren();
  board.append(node('span', '', 'axis-label'));
  for (let c = 0; c < 9; c++) board.append(node('span', String(c), 'axis-label'));
  step.board.forEach((row, r) => {
    board.append(node('span', String(r), 'axis-label'));
    row.forEach((value, c) => {
      const current = step.current?.[0] === r && step.current?.[1] === c;
      const cell = node('span', value ? String(value) : '·', `sudoku-cell${sudoku[r][c] ? ' given' : value ? ' trial' : ''}${current ? ' current' : ''}`);
      if (c === 2 || c === 5) cell.classList.add('box-right');
      if (r === 2 || r === 5) cell.classList.add('box-bottom');
      cell.setAttribute('aria-label', `Row ${r}, column ${c}: ${value || 'empty'}${sudoku[r][c] ? ', given' : value ? ', trial placement' : ''}${current ? ', current cell' : ''}`);
      board.append(cell);
    });
  });
  $('state-metric').textContent = `${step.placements} placements / ${step.backtracks} backtracks`;
}

function renderStack(step) {
  const active = step.stack.length - 1;
  const inspected = selectedFrame === null ? active : Math.min(selectedFrame, active);
  $('stack-depth').textContent = `${step.stack.length} frame${step.stack.length === 1 ? '' : 's'}`;
  $('stack').replaceChildren();
  if (!step.stack.length) $('stack').append(node('p', 'All calls have returned. The stack is empty.', 'panel-help'));
  for (let i = active; i >= 0; i--) {
    const frame = step.stack[i];
    const button = node('button'); button.type = 'button';
    button.append(node('span', frame.name), node('small', i === active ? 'ACTIVE' : 'WAITING'));
    button.setAttribute('aria-pressed', String(i === inspected));
    button.dataset.frame = i;
    button.addEventListener('click', () => { pause(); selectedFrame = i; renderStack(steps[position]); $('stack').querySelector(`[data-frame="${i}"]`).focus(); });
    $('stack').append(button);
  }
  if (selectedFrame === null) $('stack').scrollTop = 0;
  renderVariables(step, inspected);
}

function renderVariables(step, inspected) {
  const container = $('variables'); container.replaceChildren();
  $('follow-frame').disabled = selectedFrame === null || !step.stack.length;
  if (!step.stack.length) {
    if (lesson === 'sudoku') {
      $('frame-label').textContent = `Returned ${step.solved ? 'True' : 'False'} · final board`;
      container.append(node('pre', format(step.board, 'board')));
      return;
    }
    $('frame-label').textContent = lesson === 'hanoi' ? 'Printed moves (visualization log)' : 'Returned ' + (step.found ? 'True' : 'False') + ' · final maze';
    const output = lesson === 'hanoi' ? step.moves : step.maze;
    container.append(node('pre', format(output, lesson === 'hanoi' ? 'moves' : 'maze')));
    return;
  }
  const frame = step.stack[inspected];
  const previous = steps[position - 1]?.stack[inspected];
  $('frame-label').textContent = `${frame.name} · Δ = changed or newly available`;
  function appendVariables(locals, oldLocals = {}) {
    const priority = ['n', 'source', 'destination', 'auxiliary', 'x', 'y', 'grid', 'moves', 'index', 'row', 'col', 'number', 'box_row', 'box_col', 'r', 'box', 'empty', 'board', 'goal', 'maze'];
    for (const name of priority.filter(key => key in locals)) {
      const value = locals[name];
      const changed = position > 0 && JSON.stringify(value) !== JSON.stringify(oldLocals[name]);
      const row = node('div', undefined, `variable-row${changed ? ' changed' : ''}`);
      const label = node('span', name);
      if (changed) { const marker = node('span', ' Δ', 'change-marker'); marker.title = 'Changed or newly available'; label.append(marker); }
      row.append(label, node('span', format(value, name)));
      container.append(row);
    }
  }
  appendVariables(frame.locals, previous?.name === frame.name ? previous.locals : {});

}

function transition(previous, current) {
  if (!previous) return 'Ready. Predict the highlighted line, then choose Step.';
  const fromLine = previous.line ? `L${previous.line} → ` : '';
  const beforeDepth = previous.stack.length, afterDepth = current.stack.length;
  if (current.kind === 'done') return `${fromLine}${current.text}`;
  if (afterDepth > beforeDepth) return `${fromLine}Call entered: ${current.stack.at(-1).name}. Parent is waiting.`;
  if (afterDepth < beforeDepth) {
    const result = lesson === 'hanoi' ? 'None' : (lesson === 'maze' ? [5,11,22] : [25]).includes(previous.line) ? 'False' : 'True';
    return `${fromLine}${beforeDepth - afterDepth} call(s) returned ${result}. Resume ${current.stack.at(-1).name}.`;
  }
  if (lesson === 'hanoi' && current.moves.length > previous.moves.length) {
    const [disk, source, target] = current.moves.at(-1);
    return `${fromLine}Printed move. Disk ${disk}: ${source} → ${target}.`;
  }
  if (lesson === 'maze' && previous.line === 14) return fromLine + 'Cell (' + previous.current.join(', ') + ') marked visited (3).';
  if (lesson === 'sudoku') {
    if (current.placements > previous.placements) return `${fromLine}Placed ${previous.stack.at(-1).locals.number} at (${previous.current.join(', ')}).`;
    if (current.backtracks > previous.backtracks) return `${fromLine}Cleared (${previous.current.join(', ')}). Try the next candidate.`;
  }
  return `${fromLine}Paused before line ${current.line}. ${current.text}`;
}

function render() {
  if (!steps.length) return;
  const step = steps[position];
  $('back').disabled = position === 0;
  $('next').disabled = position === steps.length - 1;
  $('finish').disabled = position === steps.length - 1;
  $('timeline').value = position;
  $('step-label').textContent = `State ${position + 1} of ${steps.length}`;
  $('line-status').textContent = step.line ? `Next: line ${step.line}` : 'Execution complete';
  $('event-label').textContent = step.kind === 'done' ? 'Result' : 'Next to execute';
  $('explanation').textContent = step.text;
  if (lesson === 'hanoi') renderTower(step); else if (lesson === 'maze') renderMaze(step); else renderSudoku(step);
  renderStack(step);
  $('trace-console').replaceChildren(...steps.slice(Math.max(0, position - 3), position + 1).map((entry, i) => {
    const index = Math.max(0, position - 3) + i;
    return node('li', `${String(index + 1).padStart(3, '0')}  ${transition(steps[index - 1], entry)}`);
  }));
  $('program-output').textContent = step.stdout?.join('\n') || (lesson === 'sudoku' ? 'This function returns True or False; it does not print.' : 'No output yet.');
  $('trace-console').scrollTop = $('trace-console').scrollHeight;
  document.querySelectorAll('.code-line').forEach(line => {
    const active = Number(line.dataset.line) === step.line;
    line.classList.toggle('active-line', active);
    if (active) line.setAttribute('aria-current', 'step'); else line.removeAttribute('aria-current');
  });
  const activeLine = $('python-code').querySelector('.active-line');
  if (activeLine) {
    const pane = $('python-code'), top = activeLine.offsetTop - pane.offsetTop;
    if (top < pane.scrollTop || top + activeLine.offsetHeight > pane.scrollTop + pane.clientHeight) pane.scrollTop = Math.max(0, top - pane.clientHeight / 2);
  }
}

function colorize(line) {
  const fragment = document.createDocumentFragment();
  const tokens = /(#.*$|"[^"\n]*"|'[^'\n]*'|\b(?:def|if|not|and|or|in|for|continue|return|else|True|False|None)\b|\b\d+\b)/g;
  let cursor = 0;
  for (const match of line.matchAll(tokens)) {
    fragment.append(document.createTextNode(line.slice(cursor, match.index)));
    const token = match[0];
    const kind = token.startsWith('#') ? 'comment' : /^["']/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : 'keyword';
    fragment.append(node('span', token, `syntax-${kind}`)); cursor = match.index + token.length;
  }
  fragment.append(document.createTextNode(line.slice(cursor)));
  return fragment;
}

async function loadCode() {
  const version = ++loadVersion, requestedLesson = lesson;
  $('copy-code').disabled = true;
  $('code-title').textContent = files[lesson];
  $('download-code').href = `lessons/recursion/${files[lesson]}`;
  $('python-code').textContent = 'Loading Python source…';
  $('source-status').replaceChildren();
  try {
    if (!sources[lesson]) {
      const response = await fetch(new URL(files[lesson], import.meta.url));
      if (!response.ok) throw new Error('Source unavailable');
      sources[requestedLesson] = await response.text();
    }
    if (version !== loadVersion) return;
    $('python-code').replaceChildren();
    const [first, last] = { hanoi: [1, 7], maze: [1, 22], sudoku: [10, 25] }[lesson];
    sources[lesson].split(/\r?\n/).forEach((line, index) => {
      if (index + 1 < first || index + 1 > last) return;
      const codeLine = node('div', undefined, 'code-line'); codeLine.dataset.line = index + 1;
      const content = node('span', undefined, 'code-content');
      content.append(colorize(line));
      codeLine.append(node('span', String(index + 1), 'line-number'), content);
      $('python-code').append(codeLine);
    });
    $('source-status').textContent = 'Function shown. Copy and download include the complete runnable script.';
    if (lesson === 'hanoi') $('iterative-code').textContent = sources.hanoi.split(/\r?\n/).slice(14,36).join('\n');
    $('copy-code').disabled = false; render();
  } catch {
    if (version !== loadVersion) return;
    $('python-code').textContent = 'Could not load the Python source. Check your connection and retry.';
    const retry = node('button', 'Retry loading code'); retry.type = 'button'; retry.addEventListener('click', loadCode);
    $('source-status').replaceChildren(retry);
  }
}

function switchLesson(name, updateHash = true) {
  pause(); lesson = name;
  document.querySelectorAll('[data-lesson]').forEach(tab => {
    const selected = tab.dataset.lesson === name;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== name);
  document.querySelectorAll('[data-reading]').forEach(panel => panel.hidden = panel.dataset.reading !== name);
  $('tower-view').hidden = name !== 'hanoi'; $('maze-view').hidden = name !== 'maze';
  $('sudoku-view').hidden = name !== 'sudoku';
  if (updateHash) history.replaceState(null, '', `#${name}`);
  rebuild(); loadCode();
}

$('next').addEventListener('click', () => { pause(); go(position + 1); });
$('back').addEventListener('click', () => { pause(); go(position - 1); });
$('reset').addEventListener('click', () => { pause(); go(0); });
$('finish').addEventListener('click', () => { pause(); go(steps.length - 1); });
$('play').addEventListener('click', togglePlay);
$('timeline').addEventListener('input', event => { pause(); go(Number(event.target.value)); });
$('disk-count').addEventListener('change', rebuild);
function selectSudoku(board) {
  sudoku = board;
  $('custom-sudoku').value = board.map(row => row.join('')).join('\n');
  rebuild();
}
$('sudoku-preset').addEventListener('change', () => { if ($('sudoku-preset').value !== 'custom') selectSudoku(sudokuPreset($('sudoku-preset').value)); });
$('new-sudoku').addEventListener('click', () => { $('sudoku-preset').value = 'custom'; selectSudoku(randomSudoku()); });
$('apply-sudoku').addEventListener('click', () => {
  pause();
  try { const board = parseSudoku($('custom-sudoku').value); $('sudoku-preset').value = 'custom'; selectSudoku(board); }
  catch (error) { $('sudoku-status').textContent = error.message + ' The displayed puzzle is unchanged.'; }
});
$('cancel-sudoku').addEventListener('click', () => {
  sudokuWorker?.terminate(); sudokuWorker = null; clearTimeout(sudokuTimeout);
  $('explanation').textContent = 'No trace is loaded. Choose a layout to begin.';
  $('cancel-sudoku').disabled = true; $('sudoku-status').textContent = 'Trace cancelled. Choose a layout or apply your puzzle to restart.';
});
$('custom-sudoku').value = sudoku.map(row => row.join('')).join('\n');
$('follow-frame').addEventListener('click', () => { selectedFrame = null; if (steps.length) renderStack(steps[position]); });
$('maze-preset').addEventListener('change', () => { grid = mazePreset($('maze-preset').value); buildMaze(); rebuild(); });
$('restore-maze').addEventListener('click', () => { grid = mazePreset($('maze-preset').value); buildMaze(); rebuild(); });
$('edit-maze').addEventListener('change', () => { pause(); renderMaze(steps[position]); });
$('copy-code').addEventListener('click', async () => {
  const copying = lesson;
  try {
    await navigator.clipboard.writeText(sources[copying]);
    if (copying === lesson) $('source-status').textContent = 'Copied the complete Python script.';
  } catch { $('source-status').textContent = 'Clipboard access was unavailable. Use Download .py to save the full script.'; }
});
document.querySelectorAll('[data-lesson]').forEach(tab => {
  tab.addEventListener('click', () => switchLesson(tab.dataset.lesson));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const names = Object.keys(files);
    const name = event.key === 'Home' ? names[0] : event.key === 'End' ? names.at(-1) : names[(names.indexOf(lesson) + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length];
    switchLesson(name); $(`tab-${name}`).focus();
  });
});
$('maze-grid').addEventListener('keydown', event => {
  const deltas = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (!deltas[event.key] || !event.target.classList.contains('maze-cell')) return;
  event.preventDefault(); event.stopPropagation();
  const [dr, dc] = deltas[event.key];
  const r = Math.max(0, Math.min(5, Number(event.target.dataset.row) + dr));
  const c = Math.max(0, Math.min(5, Number(event.target.dataset.col) + dc));
  const next = $('maze-grid').querySelector(`[data-row="${r}"][data-col="${c}"]`);
  event.target.tabIndex = -1; next.tabIndex = 0; next.focus();
});
$('debugger').addEventListener('keydown', event => {
  if (event.target.closest('input, select, textarea, #maze-grid, .python-code')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); pause(); go(position + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('hashchange', () => { if (Object.keys(files).includes(location.hash.slice(1))) switchLesson(location.hash.slice(1), false); });
buildMaze();
switchLesson(Object.keys(files).includes(location.hash.slice(1)) ? location.hash.slice(1) : 'hanoi', false);
