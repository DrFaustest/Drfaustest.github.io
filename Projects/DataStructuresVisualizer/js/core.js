/**
 * Core module
 *  - Shared DOM helpers
 *  - Global application (visualizer) state
 *  - Step playback engine (used by sorting + can be extended)
 *  - Pseudocode + stats panel management
 *
 * Other visualizer modules import only what they need from here.
 */

/** Query a single element. */
export const qs = (selector, root = document) => root.querySelector(selector);
/** Query all elements (returns real array). */
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Small hyperscript-like helper to create elements declaratively.
 * Supports: dataset, style objects, property assignment or attribute fallback.
 */
export const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'dataset' && value && typeof value === 'object') {
      for (const [dataKey, dataVal] of Object.entries(value)) node.dataset[dataKey] = dataVal;
    } else if (key === 'style' && value && typeof value === 'object') {
      Object.assign(node.style, value);
    } else if (key in node) {
      try { node[key] = value; } catch { node.setAttribute(key, value); }
    } else {
      node.setAttribute(key, value);
    }
  }
  children.flat().forEach(child => node.append(child && child.nodeType ? child : document.createTextNode(String(child))));
  return node;
};

/** Promise based delay (used for async algorithm animations). */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Named animation speed presets (ms between steps). */
export const animSpeed = { ultra: 60, fast: 120, normal: 260, slow: 520 };
export let speed = 'normal'; // current selected speed key

/** Central mutable state for the active visualizer. */
export const appState = {
  current: null,                // id of current visualizer ("array", "sorting", etc.)
  steps: [],                    // recorded steps for playback
  stepIndex: 0,                 // index of next step to execute
  playing: false,               // is auto-play active
  playLoop: null,               // interval handle
  stats: { comparisons: 0, swaps: 0, operations: 0 }, // cumulative counters
  pseudoLines: [],              // current pseudocode lines (for re-render on changes)
  pseudoMap: new Map()          // id -> line index mapping for highlight lookups
};
/** Reset step playback (used when generating a new set of sorting steps). */
export function resetStepEngine() {
  appState.steps = [];
  appState.stepIndex = 0;
  appState.playing = false;
  clearInterval(appState.playLoop);
  appState.stats = { comparisons: 0, swaps: 0, operations: 0 };
  updateStats();
  togglePlayButton(false, true);
}
/** Ensure side panels (pseudocode, stats, playback) exist; create lazily. */
export function ensurePanels() {
  if (qs('#panel-pseudocode')) return;
  const controls = qs('#controls-area');
  if (!controls) return;
  const pseudo = el('div', { id: 'panel-pseudocode', className: 'panel' },
    el('div', { className: 'panel-header' }, 'Pseudocode'),
    el('pre', { id: 'pseudo-code', className: 'code' })
  );
  const stats = el('div', { id: 'panel-stats', className: 'panel' },
    el('div', { className: 'panel-header' }, 'Stats'),
    el('ul', { id: 'stats-list', className: 'stats-list' })
  );
  const actions = el('div', { id: 'panel-actions', className: 'panel' },
    el('div', { className: 'panel-header' }, 'Playback'),
    el('div', { className: 'playback-controls' },
      el('button', { id: 'step-prev', className: 'btn', onclick: () => step(-1) }, 'Prev'),
      el('button', { id: 'step-next', className: 'btn', onclick: () => step(1) }, 'Next'),
      el('button', { id: 'step-play', className: 'btn primary', onclick: togglePlay }, 'Play'),
      el('button', { id: 'step-reset', className: 'btn', onclick: () => renderCurrentAgain() }, 'Reset')
    ),
    el('label', { htmlFor: 'speed-select', style: { marginTop: '.5rem' } }, 'Speed:'),
    (() => {
      const select = el('select', { id: 'speed-select' });
      ['ultra', 'fast', 'normal', 'slow'].forEach(v => select.append(el('option', { value: v, selected: v === speed }, v)));
      select.onchange = () => speed = select.value;
      return select;
    })()
  );
  controls.append(pseudo, stats, actions);
  updateStats();
}
/** Provide a new set of pseudocode lines (array of {text, id?}). */
export function setPseudocode(lines) {
  ensurePanels();
  appState.pseudoLines = lines;
  appState.pseudoMap.clear();
  const pre = qs('#pseudo-code');
  pre.innerHTML = '';
  lines.forEach((ln, i) => {
    const lineDiv = el('div', { className: 'code-line', dataset: { i } }, ln.text);
    if (ln.id) appState.pseudoMap.set(ln.id, i);
    pre.append(lineDiv);
  });
}
/** Highlight a pseudocode line by id (preferred) or numeric index. */
export function highlightPseudo(idOrIndex) {
  qsa('#pseudo-code .code-line').forEach(l => l.classList.remove('hl'));
  if (idOrIndex == null) return;
  const idx = typeof idOrIndex === 'number' ? idOrIndex : appState.pseudoMap.get(idOrIndex);
  if (idx != null) {
    const line = qs(`#pseudo-code .code-line[data-i='${idx}']`);
    if (line) line.classList.add('hl');
    line?.scrollIntoView({ block: 'nearest' });
  }
}
/** Re-render stats list from current counters. */
export function updateStats() {
  ensurePanels();
  const ul = qs('#stats-list');
  if (!ul) return;
  ul.innerHTML = '';
  Object.entries(appState.stats).forEach(([k, v]) => ul.append(el('li', {}, `${k}: ${v}`)));
}
/** Increment a named statistic counter. */
export function incStat(name, delta = 1) { appState.stats[name] = (appState.stats[name] || 0) + delta; updateStats(); }

/** Toggle auto-play of recorded steps. */
export function togglePlay() {
  if (!appState.steps.length) return;
  appState.playing = !appState.playing;
  togglePlayButton(appState.playing, false);
  if (appState.playing) {
    appState.playLoop = setInterval(() => {
      if (appState.stepIndex >= appState.steps.length) {
        appState.playing = false; togglePlayButton(false); clearInterval(appState.playLoop); return;
      }
      runStep(appState.steps[appState.stepIndex++]);
      if(appState.current==='sorting' && appState.stepIndex===appState.steps.length){
        // clear transient visuals (partition outlines & merge buffer)
        document.querySelectorAll('#bars .bar.partition').forEach(b=>b.classList.remove('partition'));
        const mb=document.getElementById('merge-buffer'); if(mb) mb.innerHTML='';
      }
    }, animSpeed[speed]);
  } else { clearInterval(appState.playLoop); }
}
/** Update play / pause button visual state. */
export function togglePlayButton(isPlaying, disabled) {
  const btn = qs('#step-play');
  if (!btn) return;
  if (disabled) { btn.disabled = true; btn.textContent = 'Play'; return; }
  btn.disabled = false; btn.textContent = isPlaying ? 'Pause' : 'Play';
}
/** Execute a single step forward (dir>0) or backward (dir<0). */
export function step(dir) {
  if (!appState.steps.length) return;
  if (dir > 0 && appState.stepIndex < appState.steps.length) { runStep(appState.steps[appState.stepIndex++]); }
  else if (dir < 0 && appState.stepIndex > 0) { renderCurrentAgain(appState.stepIndex - 1); appState.stepIndex--; }
}
/** Re-render base visualization and re-apply steps up to targetIndex (rewind). */
export function renderCurrentAgain(targetIndex = 0) {
  if (appState.current === 'sorting') { drawBars(true); for (let i = 0; i < targetIndex; i++) applyStepState(appState.steps[i], true); }
  highlightPseudo(null);
}
/** Execute a recorded step and highlight its pseudocode (if present). */
export function runStep(step) { applyStepState(step); if (step.pc) highlightPseudo(step.pc); }
// Sorting related placeholders (overridden when sorting module loaded)
// Function references that modules can register to integrate with the core engine.
export let drawBars = () => {};          // sorting: draw current bar set
export let applyStepState = () => {};    // sorting: apply a single step
// Graph related placeholders
export let activateVertex = () => {};     // graph: mark a vertex active
export let updateGraphDistance = () => {}; // graph: show distance label
// Allow modules to wire implementations
/** Called by feature modules to provide concrete implementations for hooks. */
export function registerImplementations(api) {
  if (api.drawBars) drawBars = api.drawBars;
  if (api.applyStepState) applyStepState = api.applyStepState;
  if (api.activateVertex) activateVertex = api.activateVertex;
  if (api.updateGraphDistance) updateGraphDistance = api.updateGraphDistance;
}
