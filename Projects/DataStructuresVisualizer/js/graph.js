import { el, setPseudocode, animSpeed, speed, wait, registerImplementations, highlightPseudo } from './core.js';
// NOTE: Pure algorithm logic imported from lib/graph-algorithms.js so visualization reuses tested code.
import { bfs as pureBFS, dfs as pureDFS, dijkstra as pureDijkstra } from './lib/graph-algorithms.js';

// Central graph state object.
let graphState = null;

export function renderGraphVisualizer(visualArea, controlsArea) {
  const title = el('h2', {}, 'Graph (BFS / DFS / Dijkstra)');
  const canvas = el('div', { className: 'graph-canvas', id: 'graph-canvas' });
  const controlsForm = el('div', {},
    el('button', { className: 'btn', onclick: createVertex }, 'Add Vertex'),
    el('button', { className: 'btn', onclick: createRandomEdge }, 'Add Edge'),
    el('button', { className: 'btn', onclick: () => pendingEdgeSelectionStart() }, 'Weighted Edge'),
    el('input', { id: 'start-vertex', placeholder: 'Start (id)', type: 'number', min: 0, style: { marginLeft: '.5rem' } }),
    el('button', { className: 'btn', onclick: runBFS }, 'BFS'),
    el('button', { className: 'btn', onclick: runDFS }, 'DFS'),
    el('button', { className: 'btn', onclick: runDijkstra }, 'Dijkstra'),
    el('button', { className: 'btn', onclick: highlightShortestPath }, 'Show Path'),
    el('button', { className: 'btn', onclick: generateRandomGraph }, 'Random Graph'),
    el('button', { className: 'btn', onclick: clearGraphHighlights }, 'Clear')
  );
  visualArea.append(title, canvas);
  controlsArea.append(el('h3', {}, 'Graph Controls'), controlsForm);
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), pendingEdge: null, lastDijkstra: null };
  showGraphBasePseudo();
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
  vertexEl.addEventListener('click', () => { if (graphState.pendingEdge) { edgeSelectionClick(vertexEl); } else { vertexEl.classList.toggle('active'); } });
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

function createRandomEdge() {
  if (graphState.vertices.length < 2) return;
  const ids = graphState.vertices.map(v => v.id);
  let a = ids[Math.floor(Math.random() * ids.length)], b = a;
  while (b === a) b = ids[Math.floor(Math.random() * ids.length)];
  addEdge(a, b);
}
function pendingEdgeSelectionStart() { graphState.pendingEdge = { a: null }; }
function edgeSelectionClick(vertexDom) {
  if (graphState.pendingEdge.a == null) {
    graphState.pendingEdge.a = Number(vertexDom.dataset.id);
    vertexDom.classList.add('active');
  } else {
    const a = graphState.pendingEdge.a; const b = Number(vertexDom.dataset.id);
    if (a !== b) { const w = Number(prompt('Weight?', '1')) || 1; addEdge(a, b, w); }
    graphState.pendingEdge = null;
    document.querySelectorAll('.vertex').forEach(vx => vx.classList.remove('active'));
  }
}
function edgeKey(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }
function addEdge(a, b, w = 1) {
  if (graphState.adj.get(a)?.has(b)) return; // ignore duplicate
  graphState.adj.get(a).add(b); graphState.adj.get(b).add(a);
  if (w !== 1) graphState.weights.set(edgeKey(a, b), w);
  const canvas = document.getElementById('graph-canvas');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('edge');
  Object.assign(svg.style, { left: '0', top: '0', width: '100%', height: '100%' });
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line'); line.dataset.a = a; line.dataset.b = b; line.setAttribute('stroke', '#2a3142'); line.setAttribute('stroke-width', '2');
  svg.appendChild(line);
  if (w !== 1) { const label = document.createElementNS('http://www.w3.org/2000/svg', 'text'); label.setAttribute('fill', '#4cc9f0'); label.setAttribute('font-size', '10'); label.dataset.type = 'weight'; svg.appendChild(label); }
  canvas.appendChild(svg); graphState.edges.push({ a, b, el: svg }); updateEdgePositions();
}
function updateEdgePositions() {
  const canvasRect = document.getElementById('graph-canvas').getBoundingClientRect();
  graphState.edges.forEach(edge => {
    const va = graphState.vertices.find(v => v.id === edge.a).el.getBoundingClientRect();
    const vb = graphState.vertices.find(v => v.id === edge.b).el.getBoundingClientRect();
    const line = edge.el.querySelector('line');
    const x1 = va.left - canvasRect.left + 16, y1 = va.top - canvasRect.top + 16, x2 = vb.left - canvasRect.left + 16, y2 = vb.top - canvasRect.top + 16;
    line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    const label = edge.el.querySelector('text[data-type="weight"]');
    if (label) { label.setAttribute('x', (x1 + x2) / 2); label.setAttribute('y', (y1 + y2) / 2 - 4); label.textContent = graphState.weights.get(edgeKey(edge.a, edge.b)); }
  });
}
window.addEventListener('resize', () => updateEdgePositions());

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
function generateRandomGraph() {
  const canvas = document.getElementById('graph-canvas'); if (!canvas) return;
  graphState.vertices.forEach(v => v.el.remove()); graphState.edges.forEach(e => e.el.remove());
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), pendingEdge: null, lastDijkstra: null };
  for (let i = 0; i < 5; i++) createVertex(); for (let i = 0; i < 6; i++) createRandomEdge();
  graphState.edges.forEach(e => { if (Math.random() < 0.6) { const w = Math.floor(Math.random() * 9) + 1; graphState.weights.set(edgeKey(e.a, e.b), w); } });
  updateEdgePositions();
}

registerImplementations({ activateVertex, updateGraphDistance });
