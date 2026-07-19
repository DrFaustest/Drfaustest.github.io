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
  actionHistory: [],
  explorerName: 'Algorithm explorer',
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

  const explanation = el('section', {
    id: 'panel-explanation',
    className: 'panel action-explanation',
    'aria-labelledby': 'action-title',
    'aria-live': 'polite'
  },
    el('div', { className: 'action-heading' },
      el('div', {},
        el('p', { className: 'panel-header' }, 'What is happening?'),
        el('h3', { id: 'action-title' }, 'Ready to explore')
      ),
      el('span', { id: 'action-kind', className: 'action-kind', dataset: { tone: 'ready' } }, 'Ready')
    ),
    el('p', { id: 'action-summary', className: 'action-summary' }, 'Choose an action below. This panel will explain every visible change.'),
    el('dl', { className: 'action-details' },
      el('div', {}, el('dt', {}, 'Look here'), el('dd', { id: 'action-focus' }, 'The highlighted item in the visualization.')),
      el('div', {}, el('dt', {}, 'State change'), el('dd', { id: 'action-change' }, 'No change yet.')),
      el('div', {}, el('dt', {}, 'Why it matters'), el('dd', { id: 'action-why' }, 'Operations preserve the structure’s defining rules.'))
    ),
    el('details', { className: 'action-history' },
      el('summary', {}, 'Recent actions'),
      el('ol', { id: 'action-history-list' }, el('li', {}, 'No actions yet.'))
    )
  );
  const pseudo = el('section', { id: 'panel-pseudocode', className: 'panel', 'aria-labelledby': 'pseudo-title' },
    el('h3', { id: 'pseudo-title', className: 'panel-header' }, 'Code line in focus'),
    el('div', {
      id: 'pseudo-code',
      className: 'code',
      role: 'list',
      tabIndex: 0,
      'aria-label': 'Pseudocode steps'
    })
  );
  const stats = el('section', { id: 'panel-stats', className: 'panel', 'aria-labelledby': 'stats-title' },
    el('h3', { id: 'stats-title', className: 'panel-header' }, 'What the algorithm has done'),
    el('ul', { id: 'stats-list', className: 'stats-list' })
  );
  const actions = el('section', { id: 'panel-actions', className: 'panel', 'aria-labelledby': 'playback-title' },
    el('h3', { id: 'playback-title', className: 'panel-header' }, 'Step through the operation'),
    el('p', { className: 'panel-help' }, 'Use Next step to study one change at a time. Back one step reconstructs the earlier state.'),
    el('div', { className: 'playback-controls' },
      el('button', { id: 'step-prev', type: 'button', className: 'btn', 'aria-label': 'Back one algorithm step', onclick: () => step(-1) }, '← Back one step'),
      el('button', { id: 'step-next', type: 'button', className: 'btn', 'aria-label': 'Next algorithm step', onclick: () => step(1) }, 'Next step →'),
      el('button', { id: 'step-play', type: 'button', className: 'btn primary', 'aria-pressed': 'false', onclick: togglePlay }, 'Play steps'),
      el('button', { id: 'step-reset', type: 'button', className: 'btn', onclick: () => renderCurrentAgain(0) }, 'Start over')
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
    el('progress', { id: 'step-progress', className: 'step-progress', max: 1, value: 0, 'aria-label': 'Algorithm playback progress' }),
    el('p', { id: 'step-status', className: 'step-status' }, 'Choose an operation to begin.'),
    el('p', { id: 'operation-note', className: 'operation-note', 'aria-live': 'polite' })
  );
  controls.append(explanation, actions, pseudo, stats);
  updateStats();
  updatePlaybackStatus();
}

export function configureExplorer({ name, goal, focus, change, why } = {}) {
  ensurePanels();
  appState.explorerName = name || 'Algorithm explorer';
  appState.actionHistory = [];
  explainAction({
    title: `Ready: ${appState.explorerName}`,
    summary: goal || 'Choose an action and follow the highlighted state.',
    focus: focus || 'The visualization highlights the item currently being inspected.',
    change: change || 'The panel will describe the before-and-after state.',
    why: why || 'Each action is tied to the rule the structure must preserve.',
    tone: 'ready',
    record: false
  });
  renderActionHistory();
}

export function controlField(labelText, control) {
  return el('label', { className: 'control-field' }, el('span', {}, labelText), control);
}

export function controlGroup(title, hint, ...actions) {
  return el('section', { className: 'control-group-card' },
    el('h4', { className: 'control-group-title' }, title, hint ? el('span', {}, hint) : null),
    el('div', { className: 'control-actions' }, ...actions)
  );
}

export function createExplorerControls({ title, intro, fields = [], groups = [] }) {
  return el('section', { className: 'explorer-controls' },
    el('p', { className: 'control-eyebrow' }, '1 · Choose an action'),
    el('h3', {}, title),
    el('p', { className: 'control-intro' }, intro),
    fields.length ? el('div', { className: 'control-fields' }, ...fields) : null,
    ...groups,
    el('p', { className: 'control-help' }, '2 · Run an action  →  3 · Watch the highlight  →  4 · Read “What is happening?”')
  );
}

function renderActionHistory() {
  const list = qs('#action-history-list');
  if (!list) return;
  list.replaceChildren();
  if (!appState.actionHistory.length) {
    list.append(el('li', {}, 'No actions yet.'));
    return;
  }
  appState.actionHistory.slice(0, 5).forEach((item) => list.append(
    el('li', {}, el('strong', {}, item.title), el('span', {}, item.summary))
  ));
}

export function explainAction({ title, summary, focus, change, why, tone = 'info', record = true } = {}) {
  ensurePanels();
  const safeTitle = title || 'Action update';
  const safeSummary = summary || 'The visualization state was updated.';
  const titleNode = qs('#action-title');
  const summaryNode = qs('#action-summary');
  const focusNode = qs('#action-focus');
  const changeNode = qs('#action-change');
  const whyNode = qs('#action-why');
  const kindNode = qs('#action-kind');
  if (titleNode) titleNode.textContent = safeTitle;
  if (summaryNode) summaryNode.textContent = safeSummary;
  if (focusNode && focus) focusNode.textContent = focus;
  if (changeNode && change) changeNode.textContent = change;
  if (whyNode && why) whyNode.textContent = why;
  if (kindNode) {
    kindNode.textContent = tone === 'error' ? 'Needs input' : tone === 'complete' ? 'Complete' : tone === 'compare' ? 'Compare' : tone === 'move' ? 'State change' : tone === 'inspect' ? 'Inspect' : tone === 'ready' ? 'Ready' : 'Action';
    kindNode.dataset.tone = tone;
  }
  if (record) {
    appState.actionHistory.unshift({ title: safeTitle, summary: safeSummary });
    appState.actionHistory = appState.actionHistory.slice(0, 5);
    renderActionHistory();
  }
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

export function announce(message, details = {}) {
  ensurePanels();
  const note = qs('#operation-note');
  if (note) note.textContent = message;
  explainAction({
    title: details.title || (details.tone === 'error' ? 'Check the input' : 'Action update'),
    summary: message,
    focus: details.focus,
    change: details.change,
    why: details.why,
    tone: details.tone || 'info',
    record: details.record !== false
  });
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

function stepExplanation(stepData) {
  if (!stepData) return null;
  if (stepData.type === 'compare') return {
    title: 'Compare two values', summary: describeStep(stepData),
    focus: `Positions ${stepData.i} and ${stepData.j} are highlighted.`,
    change: 'A comparison reads values but does not move them.',
    why: 'The result decides whether the current order already satisfies the algorithm.', tone: 'compare'
  };
  if (stepData.type === 'swap') return {
    title: 'Move values into a better order', summary: describeStep(stepData),
    focus: `Watch positions ${stepData.i} and ${stepData.j} exchange values.`,
    change: 'The two values trade positions; every other position stays the same.',
    why: 'This removes one local ordering violation.', tone: 'move'
  };
  if (stepData.type === 'write') return {
    title: 'Write a value', summary: describeStep(stepData),
    focus: `Position ${stepData.i} receives the next selected value.`,
    change: `The value at position ${stepData.i} becomes ${stepData.value}.`,
    why: 'Merge-style algorithms build an ordered range one write at a time.', tone: 'move'
  };
  if (stepData.type === 'pivot') return {
    title: 'Choose a pivot', summary: describeStep(stepData),
    focus: `Position ${stepData.i} is the reference for this partition.`,
    change: 'No value moves yet; the pivot defines the comparison boundary.',
    why: 'Quick sort uses the pivot to separate smaller and larger values.', tone: 'inspect'
  };
  if (stepData.type === 'mark-sorted') return {
    title: 'Confirm a final position', summary: describeStep(stepData),
    focus: `Position ${stepData.i} is marked complete.`,
    change: 'This position no longer needs to participate in later steps.',
    why: 'The algorithm has proved that the value is in final order.', tone: 'complete'
  };
  return { title: 'Apply the next step', summary: describeStep(stepData), tone: 'info' };
}

function updatePlaybackStatus(stepData) {
  const status = qs('#step-status');
  const note = qs('#operation-note');
  const total = appState.steps.length;
  if (status) status.textContent = total
    ? `Step ${Math.min(appState.stepIndex, total)} of ${total}`
    : 'Choose an operation to begin.';
  const progress = qs('#step-progress');
  if (progress) {
    progress.max = Math.max(total, 1);
    progress.value = Math.min(appState.stepIndex, total);
  }
  if (note) note.textContent = describeStep(stepData);
  const explanation = stepExplanation(stepData);
  if (explanation) explainAction({ ...explanation, record: false });
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
  button.textContent = isPlaying ? 'Pause playback' : 'Play steps';
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
