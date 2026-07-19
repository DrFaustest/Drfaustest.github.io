import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, setPseudocode, animSpeed, speed, wait, registerImplementations, highlightPseudo, setTeardown } from './core.js';
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
  const directedToggle = el('input', { type:'checkbox', id:'graph-directed-toggle', onchange:(event)=>toggleDirected(event.target.checked) });
  const startInput = el('input', { id:'start-vertex', placeholder:'e.g. 0', type:'number', min:0 });
  const targetInput = el('input', { id:'target-vertex', placeholder:'e.g. 4', type:'number', min:0 });
  const countInput = el('input', { id:'random-count', type:'number', min:2, max:12, value:6 });
  const controlsForm = createExplorerControls({
    title:'Graph actions',
    intro:'First build a graph, then choose a start node and run one algorithm. Visited nodes stay green; the current node turns rust.',
    fields:[
      controlField('Start node',startInput), controlField('Target node (for path)',targetInput),
      controlField('Example size (2–12)',countInput),
      controlField('Edge direction',el('span',{className:'graph-toggle'},directedToggle,el('span',{},'Directed edges')))
    ],
    groups:[
      controlGroup('1 · Build the graph','drag nodes to rearrange',
        el('button',{className:'btn',onclick:()=>createVertex(false)},'Add one node'),
        el('button',{className:'btn',onclick:openEdgeModal},'Connect two nodes')
      ),
      controlGroup('2 · Load an example','uses Example size',
        el('button',{className:'btn',onclick:()=>generateRandomGraph(false)},'Unweighted example'),
        el('button',{className:'btn',onclick:()=>generateRandomGraph(true)},'Weighted example')
      ),
      controlGroup('3 · Run from Start node','watch the visit order',
        el('button',{className:'btn primary',onclick:runBFS},'Breadth-first search'),
        el('button',{className:'btn',onclick:runDFS},'Depth-first search'),
        el('button',{className:'btn',onclick:runDijkstra},'Shortest distances'),
        el('button',{className:'btn',onclick:highlightShortestPath},'Show target path')
      ),
      controlGroup('Reset highlights','keeps your graph',
        el('button',{className:'btn',onclick:()=>clearGraphHighlights({announceChange:true})},'Clear algorithm colors')
      )
    ]
  });
  visualArea.append(title,
    el('div',{className:'visual-legend'},
      el('span',{className:'legend-item'},el('span',{className:'legend-swatch'}),'unvisited'),
      el('span',{className:'legend-item'},el('span',{className:'legend-swatch active'}),'visited'),
      el('span',{className:'legend-item'},el('span',{className:'legend-swatch move'}),'current')
    ), canvas, el('div',{id:'visit-order',className:'visit-order'},el('strong',{},'Visit order:'),el('span',{},'Run BFS or DFS to begin.')));
  controlsArea.prepend(controlsForm);
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), lastDijkstra: null, directed: false };
  ensureEdgeModal();
  showGraphBasePseudo();
  configureExplorer({ name:'Graph traversal', goal:'Build or load a graph, enter Start node 0, and run BFS to see the frontier expand.', focus:'The rust node is current; green nodes have already been visited.', change:'Traversal changes only the visited state. Dijkstra also updates distance labels.', why:'The order of exploring neighbors defines each graph algorithm’s behavior.' });
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
  announce(`Switched to ${isDirected ? 'directed' : 'undirected'} edges and cleared the old connections.`, { title:'Change edge meaning', tone:'move', focus:'Nodes remain, but all edges were removed.', change:isDirected?'New edges will have a one-way arrow.':'New edges will connect both directions.', why:'Existing edges cannot safely keep their meaning when direction rules change.' });
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
  const formError = el('p', { id:'edge-form-error', className:'control-help', role:'alert' });

  const form = el('form', { id: 'edge-builder-form' },
    el('label', {}, 'Start Node', startSelect),
    el('label', {}, 'End Node', endSelect),
    el('label', { className: 'edge-weight-toggle' },
      weightToggle,
      el('span', {}, 'Weighted'),
      weightInput
    ),
    formError,
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
    formError.textContent = '';
    if (Number.isNaN(start) || Number.isNaN(end)) { formError.textContent='Select two valid nodes.'; return; }
    if (start === end) { formError.textContent='Start and end must be different nodes.'; return; }
    if (!graphState.adj.has(start) || !graphState.adj.has(end)) { formError.textContent='One of those node IDs no longer exists.'; return; }
    if (weighted && (Number.isNaN(weightVal) || weightVal <= 0)) { formError.textContent='Weight must be a positive number.'; return; }
    const added = addEdge(start, end, weighted ? weightVal : 1, { weighted });
    if (!added) { formError.textContent='That edge already exists.'; return; }
    closeEdgeModal();
    announce(`Connected node ${start} to node ${end}${weighted ? ` with weight ${weightVal}` : ''}.`, { title:'Add an edge', tone:'move', focus:`Follow the new ${graphState.directed?'arrow':'line'} between ${start} and ${end}.`, change:`The graph now has ${graphState.edges.length} edge${graphState.edges.length===1?'':'s'}.`, why:weighted?'The weight is the cost Dijkstra will use when comparing routes.':'An unweighted traversal treats this connection like every other edge.' });
  });

  edgeModalOverlay = el('div', { id: 'edge-modal-overlay', className: 'edge-modal-overlay hidden', role: 'dialog', 'aria-modal': 'true' },
    el('div', { className: 'edge-modal' },
      el('h4', {}, 'Add Edge'),
      form
    )
  );
  edgeModalOverlay.addEventListener('click', (ev) => { if (ev.target === edgeModalOverlay) closeEdgeModal(); });
  document.body.append(edgeModalOverlay);
  edgeModalRefs = { form, weightToggle, weightInput, startSelect, endSelect, formError };
}

function teardownEdgeModal() {
  if (!edgeModalOverlay) return;
  edgeModalOverlay.remove();
  edgeModalOverlay = null;
  edgeModalRefs = null;
}

function openEdgeModal() {
  if (!graphState) return;
  if (graphState.vertices.length < 2) { announce('Add at least two nodes before connecting them.', { tone:'error', focus:'Use Add one node until nodes 0 and 1 exist.', change:'No edge was added.', why:'An edge needs two distinct endpoints.' }); return; }
  ensureEdgeModal();
  populateEdgeModalOptions();
  edgeModalRefs.weightToggle.checked = false;
  edgeModalRefs.weightInput.disabled = true;
  edgeModalRefs.weightInput.value = 1;
  edgeModalRefs.formError.textContent = '';
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
function createVertex(silent = false) {
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
  if (!silent) announce(`Added node ${id}.`, { title:'Create a vertex', tone:'move', focus:`Node ${id} appears in the graph canvas. Drag it to reposition it.`, change:`Node count ${graphState.vertices.length-1} → ${graphState.vertices.length}.`, why:'Vertices represent the items whose relationships the edges will describe.' });
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
    label.setAttribute('fill', '#713f12');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '800');
    label.setAttribute('paint-order', 'stroke');
    label.setAttribute('stroke', '#fffdf8');
    label.setAttribute('stroke-width', '4');
    label.setAttribute('stroke-linejoin', 'round');
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
function clearGraphHighlights({ announceChange = false } = {}) {
  document.querySelectorAll('.vertex').forEach(v => v.classList.remove('active','current'));
  document.querySelectorAll('#graph-canvas .distance-label').forEach(l => l.remove());
  const order= document.getElementById('visit-order');
  if(order) order.replaceChildren(el('strong',{},'Visit order:'),el('span',{},'No traversal is active.'));
  if(announceChange) announce('Cleared traversal colors and distance labels.', { title:'Reset the algorithm view', tone:'move', focus:'The graph structure and edges remain.', change:'Only temporary highlights were removed.', why:'You can now run another algorithm on exactly the same graph.' });
}
function activateVertex(id) { const v = graphState.vertices.find(v => v.id === id); if (v) v.el.classList.add('active'); }

function showCurrentVertex(id){ document.querySelectorAll('#graph-canvas .vertex').forEach((node)=>node.classList.remove('current')); const vertex=graphState.vertices.find((item)=>item.id===id); if(vertex)vertex.el.classList.add('current','active'); }

function renderVisitOrder(order){ const output=document.getElementById('visit-order'); if(!output)return; output.replaceChildren(el('strong',{},'Visit order:')); order.forEach((id)=>output.append(el('span',{className:'visit-chip'},id))); }

function readStartVertex(){ const input=document.getElementById('start-vertex'); const start=Number(input?.value); if(!input||input.value===''||Number.isNaN(start)||!graphState.adj.has(start)){ announce('Enter a start node that exists in the graph.', { tone:'error', focus:`Available node IDs: ${graphState.vertices.map((vertex)=>vertex.id).join(', ')||'none yet'}.`, change:'No algorithm ran.', why:'Traversal needs a real vertex as its first frontier item.' }); return null; } return start; }
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
  const start = readStartVertex(); if (start == null) return;
  clearGraphHighlights();
  highlightPseudo('bfs0'); await wait(80);
  const adjObj = buildAdjObject();
  const order = pureBFS(adjObj, String(start));
  const visited=[];
  for(const u of order){ const id=Number(u); showCurrentVertex(id); visited.push(id); renderVisitOrder(visited); highlightPseudo('bfs3'); announce(`Visit node ${id}; its unseen neighbors join the back of the queue.`, { title:'BFS expands the frontier', tone:'inspect', focus:`Node ${id} is rust; visited nodes stay green.`, change:`Visit order: ${visited.join(' → ')}.`, why:'A queue finishes the current distance layer before moving farther away.', record:false }); await wait(animSpeed[speed]); }
  document.querySelectorAll('#graph-canvas .vertex').forEach((node)=>node.classList.remove('current'));
  announce(`Breadth-first search visited ${order.length} node${order.length===1?'':'s'}: ${order.join(' → ')}.`, { title:'BFS complete', tone:'complete', focus:'All reached nodes remain green.', change:`Final visit order: ${order.join(' → ')}.`, why:'FIFO queue order visits nodes in increasing edge distance from the start.' });
}
async function runDFS(){
  const start = readStartVertex(); if (start == null) return;
  clearGraphHighlights();
  highlightPseudo('dfs0'); await wait(80);
  const adjObj = buildAdjObject();
  const order = pureDFS(adjObj, String(start));
  const visited=[];
  for(const u of order){ const id=Number(u); showCurrentVertex(id); visited.push(id); renderVisitOrder(visited); announce(`Visit node ${id}, then continue along one unseen neighbor.`, { title:'DFS follows one branch', tone:'inspect', focus:`Node ${id} is rust; visited nodes stay green.`, change:`Visit order: ${visited.join(' → ')}.`, why:'A recursive call stack explores deeply before returning to try another branch.', record:false }); await wait(animSpeed[speed]); }
  document.querySelectorAll('#graph-canvas .vertex').forEach((node)=>node.classList.remove('current'));
  announce(`Depth-first search visited ${order.length} node${order.length===1?'':'s'}: ${order.join(' → ')}.`, { title:'DFS complete', tone:'complete', focus:'All reached nodes remain green.', change:`Final visit order: ${order.join(' → ')}.`, why:'Stack-like recursion completes one branch before backtracking.' });
}
async function runDijkstra(){
  const start = readStartVertex(); if (start == null) return;
  clearGraphHighlights();
  highlightPseudo('d0'); await wait(80);
  const adjObj = buildAdjObject();
  const hasNegativeWeight = Object.values(adjObj).some(edges => edges.some(edge => edge.weight < 0));
  if (hasNegativeWeight) { announce('Dijkstra requires non-negative edge weights. Remove the negative edge or use the shortest-path workspace with Bellman–Ford.'); return; }
  const {dist:distObj, prev:prevObj} = pureDijkstra(adjObj, String(start));
  const dist = new Map(), prev = new Map();
  Object.entries(distObj).forEach(([k,v])=>dist.set(Number(k), v));
  Object.entries(prevObj).forEach(([k,v])=>prev.set(Number(k), v==null? null: Number(v)));
  const settled=Object.keys(distObj).map(Number).filter((id)=>dist.get(id)!==Infinity).sort((a,b)=>dist.get(a)-dist.get(b));
  for(const id of settled){ showCurrentVertex(id); updateGraphDistance(id, dist.get(id)); highlightPseudo('d3'); announce(`Finalize node ${id} at distance ${dist.get(id)}.`, { title:'Choose the closest unsettled node', tone:'inspect', focus:`Node ${id} is rust and its distance label is ${dist.get(id)}.`, change:'One more shortest distance is now final.', why:'With non-negative weights, the smallest tentative distance cannot be improved later.', record:false }); await wait(animSpeed[speed]); }
  document.querySelectorAll('#graph-canvas .vertex').forEach((node)=>node.classList.remove('current'));
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
  announce(`Shortest distances from node ${start} are complete.`, { title:'Dijkstra complete', tone:'complete', focus:'Distance labels show least total cost; a sample shortest path is highlighted.', change:Array.from(dist.entries()).map(([id,value])=>`${id}:${value===Infinity?'∞':value}`).join(' · '), why:'Each predecessor link records how the lowest-cost route reached that node.' });
}

function buildAdjObject(){
  const obj={};
  graphState.vertices.forEach(v=>{ obj[v.id]=[]; });
  graphState.adj.forEach((set, a)=>{ set.forEach(b=>{ const w = graphState.weights.get(edgeKey(a,b)) || 1; obj[a].push({to:String(b), weight:w}); }); });
  return obj;
}
function highlightShortestPath() {
  if (!graphState?.lastDijkstra) { announce('Run Shortest distances before showing a target path.', { tone:'error', change:'No path was highlighted.', why:'The path uses predecessor links produced by Dijkstra.' }); return; }
  const input=document.getElementById('target-vertex'); const tId=Number(input?.value);
  if(!input||input.value===''||Number.isNaN(tId)||!graphState.adj.has(tId)){ announce('Enter a target node that exists.', { tone:'error', focus:'Use the Target node field.', change:'No path was highlighted.', why:'Path reconstruction must end at a known vertex.' }); return; }
  const { prev, start } = graphState.lastDijkstra; const path = []; let cur = tId;
  while (cur != null) { path.push(cur); if (cur === start) break; cur = prev.get(cur); }
  if (path[path.length - 1] !== start) { announce(`Node ${tId} is unreachable from node ${start}.`, { title:'No path exists', tone:'complete', focus:'The target is outside the reachable component.', change:'No path was highlighted.', why:'Predecessor links stop before reaching the start when no route exists.' }); return; }
  path.reverse(); document.querySelectorAll('.vertex').forEach(v => v.classList.remove('active')); path.forEach(id => activateVertex(id));
  announce(`Shortest path: ${path.join(' → ')}.`, { title:'Reconstruct the target path', tone:'complete', focus:'Only vertices on the path remain green.', change:`Total cost: ${graphState.lastDijkstra.dist.get(tId)}.`, why:'Following predecessor links backward selects the edges that produced the shortest distance.' });
}
function generateRandomGraph(weighted = false) {
  const canvas = document.getElementById('graph-canvas'); if (!canvas) return;
  const directed = graphState?.directed ?? false;
  const countInput=document.getElementById('random-count');
  let count = Number(countInput?.value);
  if (Number.isNaN(count) || count < 2) count = 6;
  count = Math.min(Math.max(2, count), 12);
  if(countInput)countInput.value=count;
  clearGraphHighlights();
  graphState.vertices.forEach(v => v.el.remove()); graphState.edges.forEach(e => e.el.remove());
  graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), lastDijkstra: null, directed };
  for (let i = 0; i < count; i++) createVertex(true);
  layoutExampleVertices();
  const maxEdges = directed ? count * (count - 1) : (count * (count - 1)) / 2;
  const edgeTarget = Math.min(maxEdges, count + 2);
  let created = 0;
  // Start with a spanning path so node 0 can reach every example vertex.
  for (let i = 0; i < count - 1; i++) {
    const weight = weighted ? Math.floor(Math.random() * 8) + 2 : 1;
    if (addEdge(i, i + 1, weight, { weighted })) created++;
  }
  let attempts = 0;
  const maxAttempts = edgeTarget * 6;
  while (created < edgeTarget && attempts < maxAttempts) {
    if (createRandomEdge(weighted)) created++;
    attempts++;
  }
  updateEdgePositions();
  const startInput=document.getElementById('start-vertex'); if(startInput)startInput.value=0;
  announce(`Built a ${weighted?'weighted':'unweighted'} example with ${count} nodes and ${created} edges.`, { title:'Example graph ready', tone:'ready', focus:'Start node is set to 0; drag any node to untangle the layout.', change:'The previous graph was replaced with a new practice example.', why:weighted?'Edge labels are costs that Dijkstra adds along a route.':'BFS and DFS treat every edge as one connection.' });
}

function layoutExampleVertices(){
  const canvas=document.getElementById('graph-canvas');
  if(!canvas||!graphState.vertices.length)return;
  const radius=Math.max(70,Math.min(canvas.clientWidth,canvas.clientHeight)*0.34);
  const centerX=canvas.clientWidth/2-16;
  const centerY=canvas.clientHeight/2-16;
  graphState.vertices.forEach((vertex,index)=>{
    const angle=-Math.PI/2+(index/graphState.vertices.length)*Math.PI*2;
    vertex.el.style.left=`${centerX+Math.cos(angle)*radius}px`;
    vertex.el.style.top=`${centerY+Math.sin(angle)*radius}px`;
  });
}

registerImplementations({ activateVertex, updateGraphDistance });
