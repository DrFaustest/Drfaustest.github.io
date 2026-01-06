import { el, setPseudocode, animSpeed, speed, wait, registerImplementations, highlightPseudo, setTeardown } from './core.js';
// NOTE: Pure algorithm logic imported from lib/graph-algorithms.js so visualization reuses tested code.
import { bfs as pureBFS, dfs as pureDFS, dijkstra as pureDijkstra } from './lib/graph-algorithms.js';

// Central graph state object.
let graphState = null;
const SVG_NS = 'http://www.w3.org/2000/svg';
let edgeModalOverlay = null;
let edgeModalRefs = null;

export function renderGraphVisualizer(visualArea, controlsArea) {
  const title = el('h2', {}, 'Graph (BFS / DFS / Dijkstra)');
  const canvas = el('div', { className: 'graph-canvas', id: 'graph-canvas' });
  const controlsForm = el('div', {},
    el('button', { className: 'btn', onclick: createVertex }, 'Add Vertex'),
    el('button', { className: 'btn', onclick: openEdgeModal }, 'Edge Builder'),
    (() => {
      const wrapper = el('label', { className: 'graph-toggle' },
        el('input', {
          type: 'checkbox',
          id: 'graph-directed-toggle',
          onchange: (ev) => toggleDirected(ev.target.checked)
        }),
        el('span', { className: 'toggle-label' }, 'Directed')
      );
      return wrapper;
    })(),
    el('input', { id: 'start-vertex', placeholder: 'Start (id)', type: 'number', min: 0, style: { marginLeft: '.5rem' } }),
    el('button', { className: 'btn', onclick: runBFS }, 'BFS'),
    el('button', { className: 'btn', onclick: runDFS }, 'DFS'),
    el('button', { className: 'btn', onclick: runDijkstra }, 'Dijkstra'),
    el('button', { className: 'btn', onclick: highlightShortestPath }, 'Show Path'),
  el('button', { className: 'btn', onclick: () => generateRandomGraph(false) }, 'Random Graph'),
  el('button', { className: 'btn', onclick: () => generateRandomGraph(true) }, 'Random Weighted Graph'),
    el('button', { className: 'btn', onclick: clearGraphHighlights }, 'Clear')
  );
  visualArea.append(title, canvas);
  controlsArea.append(el('h3', {}, 'Graph Controls'), controlsForm);
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), lastDijkstra: null, directed: false };
  ensureEdgeModal();
  showGraphBasePseudo();
  const resizeHandler = () => updateEdgePositions();
  window.addEventListener('resize', resizeHandler);
  setTeardown(() => {
    window.removeEventListener('resize', resizeHandler);
    graphState = null;
    teardownEdgeModal();
  });
}

function toggleDirected(isDirected) {
  if (!graphState) return;
  if (graphState.directed === isDirected) return;
  graphState.directed = isDirected;
  // Remove existing edges since semantics differ between directed/undirected
  graphState.edges.forEach(edge => edge.el.remove());
  graphState.edges = [];
  graphState.weights.clear();
  graphState.adj.forEach(set => set.clear());
  graphState.lastDijkstra = null;
  clearGraphHighlights();
}

function ensureEdgeModal() {
  if (edgeModalOverlay) return;
  const weightToggle = el('input', { type: 'checkbox', id: 'edge-weighted-toggle' });
  const weightInput = el('input', { id: 'edge-weight-input', type: 'number', min: 1, disabled: true, value: 1 });
  weightToggle.addEventListener('change', () => {
    weightInput.disabled = !weightToggle.checked;
    if (weightToggle.checked && !weightInput.value) weightInput.value = 1;
  });

  const startSelect = el('select', { id: 'edge-start' });
  const endSelect = el('select', { id: 'edge-end' });

  const form = el('form', { id: 'edge-builder-form' },
    el('label', {}, 'Start Node', startSelect),
    el('label', {}, 'End Node', endSelect),
    el('label', { className: 'edge-weight-toggle' },
      weightToggle,
      el('span', {}, 'Weighted'),
      weightInput
    ),
    el('div', { className: 'edge-modal-actions' },
      el('button', { type: 'submit', className: 'btn primary' }, 'Add Edge'),
      el('button', { type: 'button', className: 'btn', onclick: closeEdgeModal }, 'Cancel')
    )
  );

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!graphState) return;
    const start = Number(startSelect.value);
    const end = Number(endSelect.value);
    const weighted = weightToggle.checked;
    const weightVal = weighted ? Number(weightInput.value) : 1;
    if (Number.isNaN(start) || Number.isNaN(end)) { alert('Select valid vertices.'); return; }
    if (start === end) { alert('Start and end must differ.'); return; }
    if (!graphState.adj.has(start) || !graphState.adj.has(end)) { alert('Vertex id not found.'); return; }
    if (weighted && (Number.isNaN(weightVal) || weightVal <= 0)) { alert('Provide a positive weight.'); return; }
    const added = addEdge(start, end, weighted ? weightVal : 1, { weighted });
    if (!added) { alert('Edge already exists.'); return; }
    closeEdgeModal();
  });

  edgeModalOverlay = el('div', { id: 'edge-modal-overlay', className: 'edge-modal-overlay hidden', role: 'dialog', 'aria-modal': 'true' },
    el('div', { className: 'edge-modal' },
      el('h4', {}, 'Add Edge'),
      form
    )
  );
  edgeModalOverlay.addEventListener('click', (ev) => { if (ev.target === edgeModalOverlay) closeEdgeModal(); });
  document.body.append(edgeModalOverlay);
  edgeModalRefs = { form, weightToggle, weightInput, startSelect, endSelect };
}

function teardownEdgeModal() {
  if (!edgeModalOverlay) return;
  edgeModalOverlay.remove();
  edgeModalOverlay = null;
  edgeModalRefs = null;
}

function openEdgeModal() {
  if (!graphState) return;
  if (graphState.vertices.length < 2) { alert('Add at least two vertices first.'); return; }
  ensureEdgeModal();
  populateEdgeModalOptions();
  edgeModalRefs.weightToggle.checked = false;
  edgeModalRefs.weightInput.disabled = true;
  edgeModalRefs.weightInput.value = 1;
  edgeModalOverlay.classList.remove('hidden');
  setTimeout(() => { edgeModalRefs.startSelect.focus(); }, 0);
}

function closeEdgeModal() {
  if (!edgeModalOverlay) return;
  edgeModalOverlay.classList.add('hidden');
}

function populateEdgeModalOptions() {
  if (!edgeModalRefs) return;
  const { startSelect, endSelect } = edgeModalRefs;
  startSelect.innerHTML = '';
  endSelect.innerHTML = '';
  const fragStart = document.createDocumentFragment();
  const fragEnd = document.createDocumentFragment();
  graphState.vertices.forEach(({ id }) => {
    fragStart.append(el('option', { value: id }, id));
    fragEnd.append(el('option', { value: id }, id));
  });
  startSelect.append(fragStart);
  endSelect.append(fragEnd);
}

function showGraphBasePseudo(){
  setPseudocode([
    { text: 'BFS(start):', id: 'bfs0' },
    { text: '  q = [start]', id: 'bfs1' },
    { text: '  while q:', id: 'bfs2' },
    { text: '    u = q.pop(0)', id: 'bfs3' },
    { text: '    for v in adj[u]:', id: 'bfs4' },
    { text: 'DFS(u): mark & recurse', id: 'dfs0' },
    { text: 'Dijkstra(start):', id: 'd0' },
    { text: '  dist[start]=0', id: 'd1' },
    { text: '  while PQ:', id: 'd2' },
    { text: '    u = extract_min()', id: 'd3' },
    { text: '    relax edges of u', id: 'd4' }
  ]);
}

// --- Graph Construction & Interaction ---
function createVertex() {
  const canvas = document.getElementById('graph-canvas');
  const id = graphState.nextId++;
  const x = Math.random() * (canvas.clientWidth - 40) + 4;
  const y = Math.random() * (canvas.clientHeight - 40) + 4;
  const vertexEl = el('div', { className: 'vertex', style: { left: `${x}px`, top: `${y}px` }, dataset: { id: String(id) } }, id);
  vertexEl.addEventListener('mousedown', startDragVertex);
  vertexEl.addEventListener('click', () => { vertexEl.classList.toggle('active'); });
  canvas.append(vertexEl);
  graphState.vertices.push({ id, el: vertexEl });
  graphState.adj.set(id, new Set());
}

function startDragVertex(e) {
  const target = e.currentTarget; const startX = e.clientX, startY = e.clientY;
  const rect = target.getBoundingClientRect(); const offsetX = startX - rect.left, offsetY = startY - rect.top;
  function move(ev) {
    const canvas = document.getElementById('graph-canvas'); const cRect = canvas.getBoundingClientRect();
    let newX = ev.clientX - offsetX - cRect.left; let newY = ev.clientY - offsetY - cRect.top;
    newX = Math.max(0, Math.min(cRect.width - 32, newX));
    newY = Math.max(0, Math.min(cRect.height - 32, newY));
    target.style.left = newX + 'px'; target.style.top = newY + 'px'; updateEdgePositions();
  }
  function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
}

function createRandomEdge(weighted = false) {
  if (graphState.vertices.length < 2) return false;
  const ids = graphState.vertices.map(v => v.id);
  let attempts = 0;
  const maxAttempts = ids.length * ids.length * 2;
  while (attempts < maxAttempts) {
    let a = ids[Math.floor(Math.random() * ids.length)];
    let b = ids[Math.floor(Math.random() * ids.length)];
    if (a === b) { attempts++; continue; }
    const weight = weighted ? Math.floor(Math.random() * 8) + 2 : 1;
    if (addEdge(a, b, weight, { weighted })) return true;
    attempts++;
  }
  return false;
}
function edgeKey(a, b) {
  if (!graphState) return `${a}-${b}`;
  return graphState.directed ? `${a}->${b}` : (a < b ? `${a}-${b}` : `${b}-${a}`);
}
function addEdge(a, b, weight = 1, options = {}) {
  if (!graphState) return false;
  if (!graphState.adj.has(a) || !graphState.adj.has(b)) return false;
  const directed = graphState.directed;
  if (graphState.adj.get(a).has(b)) return false;
  graphState.adj.get(a).add(b);
  if (!directed) graphState.adj.get(b).add(a);

  const weighted = !!options.weighted;
  const key = edgeKey(a, b);
  if (weighted) { graphState.weights.set(key, weight); }
  else { graphState.weights.delete(key); }

  const canvas = document.getElementById('graph-canvas');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('edge');
  Object.assign(svg.style, { left: '0', top: '0', width: '100%', height: '100%' });
  const line = document.createElementNS(SVG_NS, 'line');
  line.dataset.a = a; line.dataset.b = b;
  line.setAttribute('stroke', '#4cc9f0');
  line.setAttribute('stroke-width', '2.4');
  if (directed) {
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    const markerId = `arrow-${a}-${b}-${Math.random().toString(36).slice(2, 8)}`;
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const markerPath = document.createElementNS(SVG_NS, 'path');
    markerPath.setAttribute('d', 'M0,0 L8,3.5 L0,7 Z');
    markerPath.setAttribute('fill', '#4cc9f0');
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    svg.appendChild(defs);
    line.setAttribute('marker-end', `url(#${markerId})`);
  }
  svg.appendChild(line);
  if (weighted) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('fill', '#f8fafc');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '600');
    label.dataset.type = 'weight';
    svg.appendChild(label);
  }
  canvas.appendChild(svg);
  graphState.edges.push({ a, b, el: svg, directed, weighted });
  updateEdgePositions();
  return true;
}
function updateEdgePositions() {
  if (!graphState) return;
  const canvasRect = document.getElementById('graph-canvas').getBoundingClientRect();
  graphState.edges.forEach(edge => {
    const va = graphState.vertices.find(v => v.id === edge.a).el.getBoundingClientRect();
    const vb = graphState.vertices.find(v => v.id === edge.b).el.getBoundingClientRect();
    const line = edge.el.querySelector('line');
    const x1 = va.left - canvasRect.left + 16, y1 = va.top - canvasRect.top + 16, x2 = vb.left - canvasRect.left + 16, y2 = vb.top - canvasRect.top + 16;
    line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    const label = edge.el.querySelector('text[data-type="weight"]');
    if (label) {
      const key = edgeKey(edge.a, edge.b);
      const weightVal = graphState.weights.get(key);
      label.setAttribute('x', (x1 + x2) / 2);
      label.setAttribute('y', (y1 + y2) / 2 - 6);
      label.textContent = weightVal != null ? weightVal : '';
    }
  });
}

// --- Highlight & Distance UI ---
function clearGraphHighlights() { document.querySelectorAll('.vertex').forEach(v => v.classList.remove('active')); document.querySelectorAll('#graph-canvas .distance-label').forEach(l => l.remove()); }
function activateVertex(id) { const v = graphState.vertices.find(v => v.id === id); if (v) v.el.classList.add('active'); }
function updateGraphDistance(id, dist) {
  let lbl = document.getElementById('dist-' + id);
  if (!lbl) { lbl = el('div', { id: 'dist-' + id, className: 'distance-label' }); document.getElementById('graph-canvas').append(lbl); }
  const vert = graphState.vertices.find(v => v.id === id);
  if (vert) {
    const r = vert.el.getBoundingClientRect(); const cr = document.getElementById('graph-canvas').getBoundingClientRect();
    lbl.style.left = (r.left - cr.left) + 'px';
    lbl.style.top = (r.top - cr.top - 14) + 'px';
    lbl.textContent = dist;
  }
}

// --- Algorithms ---
async function runBFS(){
  const start = Number(document.getElementById('start-vertex').value); if (Number.isNaN(start)) return;
  highlightPseudo('bfs0'); await wait(80);
  const adjObj = buildAdjObject();
  const order = pureBFS(adjObj, String(start));
  for(const u of order){ activateVertex(Number(u)); highlightPseudo('bfs3'); await wait(animSpeed[speed]); }
}
async function runDFS(){
  const start = Number(document.getElementById('start-vertex').value); if (Number.isNaN(start)) return;
  highlightPseudo('dfs0'); await wait(80);
  const adjObj = buildAdjObject();
  const order = pureDFS(adjObj, String(start));
  for(const u of order){ activateVertex(Number(u)); await wait(animSpeed[speed]); }
}
async function runDijkstra(){
  const start = Number(document.getElementById('start-vertex').value); if (Number.isNaN(start)) return;
  highlightPseudo('d0'); await wait(80);
  const adjObj = buildAdjObject();
  const {dist:distObj, prev:prevObj} = pureDijkstra(adjObj, String(start));
  const dist = new Map(), prev = new Map();
  Object.entries(distObj).forEach(([k,v])=>dist.set(Number(k), v));
  Object.entries(prevObj).forEach(([k,v])=>prev.set(Number(k), v==null? null: Number(v)));
  for(const vid of Object.keys(distObj)){ activateVertex(Number(vid)); updateGraphDistance(Number(vid), distObj[vid]); highlightPseudo('d3'); await wait(animSpeed[speed]); }
  graphState.lastDijkstra = { dist, prev, start };
  // auto-highlight shortest path to farthest reachable node
  let farNode = null, farDist = -Infinity;
  dist.forEach((d,k)=>{ if(d!==Infinity && d>farDist){ farDist=d; farNode=k; }});
  if(farNode!=null && farNode!==start){
    const path=[]; let cur=farNode; while(cur!=null){ path.push(cur); if(cur===start) break; cur=prev.get(cur); }
    if(path[path.length-1]===start){
      path.reverse(); document.querySelectorAll('.vertex').forEach(v => v.classList.remove('active'));
      path.forEach(id => activateVertex(id));
    }
  }
}

function buildAdjObject(){
  const obj={};
  graphState.vertices.forEach(v=>{ obj[v.id]=[]; });
  graphState.adj.forEach((set, a)=>{ set.forEach(b=>{ const w = graphState.weights.get(edgeKey(a,b)) || 1; obj[a].push({to:String(b), weight:w}); }); });
  return obj;
}
function highlightShortestPath() {
  if (!graphState?.lastDijkstra) return;
  const target = prompt('Target vertex id for path?'); if (target == null) return; const tId = Number(target); if (Number.isNaN(tId)) return;
  const { prev, start } = graphState.lastDijkstra; const path = []; let cur = tId;
  while (cur != null) { path.push(cur); if (cur === start) break; cur = prev.get(cur); }
  if (path[path.length - 1] !== start) { alert('No path'); return; }
  path.reverse(); document.querySelectorAll('.vertex').forEach(v => v.classList.remove('active')); path.forEach(id => activateVertex(id));
}
function generateRandomGraph(weighted = false) {
  const canvas = document.getElementById('graph-canvas'); if (!canvas) return;
  const directed = graphState?.directed ?? false;
  const countStr = prompt('How many vertices?', '5');
  let count = Number(countStr);
  if (Number.isNaN(count) || count < 2) count = 5;
  count = Math.min(Math.max(2, count), 12);
  clearGraphHighlights();
  graphState.vertices.forEach(v => v.el.remove()); graphState.edges.forEach(e => e.el.remove());
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), lastDijkstra: null, directed };
  for (let i = 0; i < count; i++) createVertex();
  const maxEdges = directed ? count * (count - 1) : (count * (count - 1)) / 2;
  const edgeTarget = Math.min(maxEdges, count + 2);
  let created = 0;
  let attempts = 0;
  const maxAttempts = edgeTarget * 6;
  while (created < edgeTarget && attempts < maxAttempts) {
    if (createRandomEdge(weighted)) created++;
    attempts++;
  }
  updateEdgePositions();
}

registerImplementations({ activateVertex, updateGraphDistance });
