/** Shared DOM, playback, pseudocode, statistics, and teardown utilities. */

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'dataset' && value && typeof value === 'object') {
      for (const [dataKey, dataValue] of Object.entries(value)) node.dataset[dataKey] = dataValue;
    } else if (key === 'style' && value && typeof value === 'object') {
      Object.assign(node.style, value);
    } else if (key in node) {
      try { node[key] = value; } catch { node.setAttribute(key, value); }
    } else {
      node.setAttribute(key, value);
    }
  }
  children.flat().forEach((child) => {
    if (child == null || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
};

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, reducedMotion ? Math.min(ms, 40) : ms);
});

export const animSpeed = { instant: 15, ultra: 60, fast: 120, normal: 260, slow: 520 };
export let speed = reducedMotion ? 'ultra' : 'normal';

export const appState = {
  current: null,
  steps: [],
  stepIndex: 0,
  playing: false,
  playLoop: null,
  stats: { comparisons: 0, swaps: 0, operations: 0 },
  pseudoLines: [],
  pseudoMap: new Map(),
  teardown: null
};

export let drawBars = () => {};
export let applyStepState = () => {};
export let activateVertex = () => {};
export let updateGraphDistance = () => {};

function cancelPlayback() {
  appState.playing = false;
  window.clearTimeout(appState.playLoop);
  appState.playLoop = null;
}

export function resetStepEngine() {
  cancelPlayback();
  appState.steps = [];
  appState.stepIndex = 0;
  appState.stats = { comparisons: 0, swaps: 0, operations: 0 };
  updateStats();
  updatePlaybackStatus();
  togglePlayButton(false, true);
}

export function ensurePanels() {
  if (qs('#panel-pseudocode')) return;
  const controls = qs('#controls-area');
  if (!controls) return;

  const pseudo = el('section', { id: 'panel-pseudocode', className: 'panel', 'aria-labelledby': 'pseudo-title' },
    el('h3', { id: 'pseudo-title', className: 'panel-header' }, 'Pseudocode'),
    el('div', {
      id: 'pseudo-code',
      className: 'code',
      role: 'list',
      tabIndex: 0,
      'aria-label': 'Pseudocode steps'
    })
  );
  const stats = el('section', { id: 'panel-stats', className: 'panel', 'aria-labelledby': 'stats-title' },
    el('h3', { id: 'stats-title', className: 'panel-header' }, 'Operation counters'),
    el('ul', { id: 'stats-list', className: 'stats-list' })
  );
  const actions = el('section', { id: 'panel-actions', className: 'panel', 'aria-labelledby': 'playback-title' },
    el('h3', { id: 'playback-title', className: 'panel-header' }, 'Playback'),
    el('div', { className: 'playback-controls' },
      el('button', { id: 'step-prev', type: 'button', className: 'btn', 'aria-label': 'Previous algorithm step', onclick: () => step(-1) }, 'Previous'),
      el('button', { id: 'step-next', type: 'button', className: 'btn', 'aria-label': 'Next algorithm step', onclick: () => step(1) }, 'Next'),
      el('button', { id: 'step-play', type: 'button', className: 'btn primary', 'aria-pressed': 'false', onclick: togglePlay }, 'Play'),
      el('button', { id: 'step-reset', type: 'button', className: 'btn', onclick: () => renderCurrentAgain(0) }, 'Reset')
    ),
    el('label', { htmlFor: 'speed-select' }, 'Playback speed'),
    (() => {
      const select = el('select', { id: 'speed-select' });
      ['ultra', 'fast', 'normal', 'slow'].forEach((value) => select.append(
        el('option', { value, selected: value === speed }, value[0].toUpperCase() + value.slice(1))
      ));
      select.onchange = () => { speed = select.value; };
      return select;
    })(),
    el('p', { id: 'step-status', className: 'step-status' }, 'Generate or select an operation to begin.'),
    el('p', { id: 'operation-note', className: 'operation-note', 'aria-live': 'polite' })
  );
  controls.append(pseudo, stats, actions);
  updateStats();
  updatePlaybackStatus();
}

export function setPseudocode(lines) {
  ensurePanels();
  appState.pseudoLines = lines;
  appState.pseudoMap.clear();
  const container = qs('#pseudo-code');
  if (!container) return;
  container.replaceChildren();
  lines.forEach((line, index) => {
    const lineNode = el('div', { className: 'code-line', dataset: { i: index }, role: 'listitem' }, line.text);
    if (line.id) appState.pseudoMap.set(line.id, index);
    container.append(lineNode);
  });
}

export function highlightPseudo(idOrIndex) {
  qsa('#pseudo-code .code-line').forEach((line) => {
    line.classList.remove('hl');
    line.removeAttribute('aria-current');
  });
  if (idOrIndex == null) return;
  const index = typeof idOrIndex === 'number' ? idOrIndex : appState.pseudoMap.get(idOrIndex);
  const line = index == null ? null : qs(`#pseudo-code .code-line[data-i='${index}']`);
  if (!line) return;
  line.classList.add('hl');
  line.setAttribute('aria-current', 'step');
  line.scrollIntoView({ block: 'nearest' });
}

export function updateStats() {
  ensurePanels();
  const list = qs('#stats-list');
  if (!list) return;
  list.replaceChildren();
  const labels = { comparisons: 'Comparisons', swaps: 'Moves / swaps', operations: 'Steps applied' };
  Object.entries(appState.stats).forEach(([key, value]) => list.append(
    el('li', {}, el('span', {}, labels[key] || key), el('strong', {}, value))
  ));
}

export function incStat(name, delta = 1) {
  appState.stats[name] = (appState.stats[name] || 0) + delta;
  updateStats();
}

export function announce(message) {
  ensurePanels();
  const note = qs('#operation-note');
  if (note) note.textContent = message;
}

function describeStep(stepData) {
  if (!stepData) return '';
  if (stepData.message) return stepData.message;
  if (stepData.type === 'compare') return `Compare positions ${stepData.i} and ${stepData.j}.`;
  if (stepData.type === 'swap') return `Swap positions ${stepData.i} and ${stepData.j}.`;
  if (stepData.type === 'write') return `Write ${stepData.value} at position ${stepData.i}.`;
  if (stepData.type === 'pivot') return `Use position ${stepData.i} as the current pivot.`;
  if (stepData.type === 'mark-sorted') return `Position ${stepData.i} is now in final order.`;
  return `Apply ${stepData.type || 'algorithm'} step.`;
}

function updatePlaybackStatus(stepData) {
  const status = qs('#step-status');
  const note = qs('#operation-note');
  const total = appState.steps.length;
  if (status) status.textContent = total
    ? `Step ${Math.min(appState.stepIndex, total)} of ${total}`
    : 'Generate or select an operation to begin.';
  if (note) note.textContent = describeStep(stepData);
  const previous = qs('#step-prev');
  const next = qs('#step-next');
  if (previous) previous.disabled = !total || appState.stepIndex === 0;
  if (next) next.disabled = !total || appState.stepIndex >= total;
}

function finishPlayback() {
  cancelPlayback();
  togglePlayButton(false, false);
  updatePlaybackStatus(appState.steps[appState.stepIndex - 1]);
}

function scheduleNextStep() {
  window.clearTimeout(appState.playLoop);
  if (!appState.playing) return;
  if (appState.stepIndex >= appState.steps.length) {
    finishPlayback();
    return;
  }
  appState.playLoop = window.setTimeout(() => {
    const nextStep = appState.steps[appState.stepIndex];
    appState.stepIndex += 1;
    runStep(nextStep);
    scheduleNextStep();
  }, animSpeed[speed]);
}

export function togglePlay() {
  if (!appState.steps.length) return;
  if (appState.stepIndex >= appState.steps.length) renderCurrentAgain(0);
  appState.playing = !appState.playing;
  togglePlayButton(appState.playing, false);
  if (appState.playing) scheduleNextStep();
  else window.clearTimeout(appState.playLoop);
}

export function togglePlayButton(isPlaying, disabled = false) {
  const button = qs('#step-play');
  if (!button) return;
  button.disabled = disabled;
  button.textContent = isPlaying ? 'Pause' : 'Play';
  button.setAttribute('aria-pressed', String(isPlaying));
  qs('#panel-actions')?.setAttribute('aria-busy', String(isPlaying));
}

export function step(direction) {
  if (!appState.steps.length) return;
  cancelPlayback();
  togglePlayButton(false, false);
  if (direction > 0 && appState.stepIndex < appState.steps.length) {
    const nextStep = appState.steps[appState.stepIndex];
    appState.stepIndex += 1;
    runStep(nextStep);
  } else if (direction < 0 && appState.stepIndex > 0) {
    renderCurrentAgain(appState.stepIndex - 1);
  }
}

function statsThrough(targetIndex) {
  const applied = appState.steps.slice(0, targetIndex);
  return applied.reduce((stats, item) => {
    stats.operations += 1;
    if (item.type === 'compare') stats.comparisons += 1;
    if (item.type === 'swap' || item.type === 'write') stats.swaps += 1;
    return stats;
  }, { comparisons: 0, swaps: 0, operations: 0 });
}

export function renderCurrentAgain(targetIndex = 0) {
  cancelPlayback();
  const boundedTarget = Math.max(0, Math.min(targetIndex, appState.steps.length));
  appState.stepIndex = boundedTarget;
  if (appState.current === 'sorting') {
    drawBars(true);
    for (let index = 0; index < boundedTarget; index += 1) applyStepState(appState.steps[index], true);
  }
  appState.stats = statsThrough(boundedTarget);
  updateStats();
  highlightPseudo(boundedTarget ? appState.steps[boundedTarget - 1]?.pc : null);
  updatePlaybackStatus(boundedTarget ? appState.steps[boundedTarget - 1] : null);
  togglePlayButton(false, !appState.steps.length);
}

export function runStep(stepData) {
  applyStepState(stepData);
  if (stepData?.pc) highlightPseudo(stepData.pc);
  updatePlaybackStatus(stepData);
}

export function registerImplementations(api) {
  if (api.drawBars) drawBars = api.drawBars;
  if (api.applyStepState) applyStepState = api.applyStepState;
  if (api.activateVertex) activateVertex = api.activateVertex;
  if (api.updateGraphDistance) updateGraphDistance = api.updateGraphDistance;
}

export function setTeardown(callback) {
  appState.teardown = typeof callback === 'function' ? callback : null;
}

export function runTeardown() {
  cancelPlayback();
  if (typeof appState.teardown === 'function') {
    try { appState.teardown(); } catch (error) { console.error('[core] teardown error', error); }
  }
  appState.teardown = null;
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement
      && (target.matches('input, textarea, select, button') || target.isContentEditable);
    if (isEditing || !appState.steps.length) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
  });
}
