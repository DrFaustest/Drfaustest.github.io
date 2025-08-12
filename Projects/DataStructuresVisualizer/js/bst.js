import { el, highlightPseudo, setPseudocode, qs } from './core.js';

// Basic BST node.
class BSTNode { constructor(value) { this.v = value; this.l = null; this.r = null; } }

// Unbalanced BST with insert & remove (successor replacement strategy).
class BST {
  constructor() { this.root = null; }
  insert(value) { this.root = this._insertRecursive(this.root, value); }
  _insertRecursive(node, value) {
    if (!node) return new BSTNode(value);
    if (value < node.v) node.l = this._insertRecursive(node.l, value); else node.r = this._insertRecursive(node.r, value);
    return node;
  }
  remove(value) { this.root = this._removeRecursive(this.root, value); }
  _removeRecursive(node, value) {
    if (!node) return null;
    if (value < node.v) { node.l = this._removeRecursive(node.l, value); return node; }
    if (value > node.v) { node.r = this._removeRecursive(node.r, value); return node; }
    // Node found
    if (!node.l) return node.r;
    if (!node.r) return node.l;
    // Two children: find inorder successor (leftmost in right subtree)
    let successor = node.r;
    while (successor.l) successor = successor.l;
    node.v = successor.v;
    node.r = this._removeRecursive(node.r, successor.v);
    return node;
  }
}

let bstInstance;

/** Render BST visualizer. */
export function renderTreeVisualizer(visualArea, controlsArea) {
  bstInstance = new BST();
  [8, 3, 10, 1, 6, 14, 4, 7, 13].forEach(v => bstInstance.insert(v));
  const title = el('h2', {}, 'Binary Search Tree');
  const treeDiv = el('div', { id: 'tree', className: 'tree canvas-tree' });
  const svg = el('svg', { id: 'tree-lines', className: 'tree-lines', width: '100%', height: '100%' });
  const controlsForm = el('div', {},
    el('input', { id: 'bst-val', placeholder: 'Value', type: 'number' }),
    el('button', { className: 'btn', onclick: () => { const value = Number(qs('#bst-val').value); if (!Number.isNaN(value)) { bstInstance.insert(value); drawTree(); highlightPseudo('ins2'); } } }, 'Insert'),
    el('button', { className: 'btn', onclick: () => { const value = Number(qs('#bst-val').value); if (!Number.isNaN(value)) { bstInstance.remove(value); drawTree(); highlightPseudo('rem'); } } }, 'Remove'),
  el('button', { className: 'btn', onclick: () => { const value = Number(qs('#bst-val').value); if (!Number.isNaN(value)) { highlightSearchPath(value); } } }, 'Search')
  el('button', { className: 'btn', onclick: () => animateTraversal("in") }, 'Inorder'),
  el('button', { className: 'btn', onclick: () => animateTraversal("pre") }, 'Preorder'),
  el('button', { className: 'btn', onclick: () => animateTraversal("post") }, 'Postorder'),
  el('button', { className: 'btn', onclick: () => animateTraversal("bfs") }, 'BFS')
  );
  visualArea.append(title, treeDiv, svg);
  controlsArea.append(el('h3', {}, 'Tree Controls'), controlsForm);
  drawTree();
  setPseudocode([
    { text: 'def insert(root,x):', id: 'ins' },
    { text: '    if root is None: return Node(x)', id: 'ins2' },
    { text: '    if x < root.v: root.l=insert(root.l,x)', id: 'ins3' },
    { text: '    else: root.r=insert(root.r,x)', id: 'ins3b' },
    { text: '    return root', id: 'ins4' },
    { text: 'def search(root,x):', id: 's1' },
    { text: '    if not root: return None', id: 's2' },
    { text: '    if x==root.v: return root', id: 's3' },
    { text: '    if x<root.v: return search(root.l,x)', id: 's4' },
    { text: '    return search(root.r,x)', id: 's5' }
  ]);
}

/** Collect tree nodes level-order (including null placeholders) per layer for simple grid rendering. */
function treeLevels(root) {
  const levels = [];
  if (!root) return levels;
  let queue = [root];
  while (queue.length) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node);
      if (node) { queue.push(node.l); queue.push(node.r); }
    }
    if (level.some(n => n)) levels.push(level); else break;
  }
  return levels;
}

/** Render the BST level by level into a simple matrix layout. */
function drawTree() {
  const container = qs('#tree'); const svg = qs('#tree-lines');
  if (!container || !svg) return;
  container.innerHTML = ''; svg.innerHTML = '';
  const levels = treeLevels(bstInstance.root);
  const depth = levels.length;
  const nodeSize = 42; const verticalGap = 80; // spacing
  const containerWidth = container.clientWidth || container.parentElement.clientWidth || 600;
  // Compute positions via recursion to retain parent-child alignment.
  const positions = new Map();
  function layout(node, depthLevel, xMin, xMax) {
    if (!node) return;
    const x = (xMin + xMax) / 2;
    const y = depthLevel * verticalGap + 20;
    positions.set(node, { x, y });
    layout(node.l, depthLevel + 1, xMin, x);
    layout(node.r, depthLevel + 1, x, xMax);
  }
  layout(bstInstance.root, 0, 0, containerWidth);
  // Draw lines first
  positions.forEach((pos, node) => {
    if (node.l && positions.has(node.l)) {
      const c1 = pos; const c2 = positions.get(node.l);
      svg.append(el('line', { x1: c1.x + nodeSize/2, y1: c1.y + nodeSize/2, x2: c2.x + nodeSize/2, y2: c2.y + nodeSize/2, stroke: '#2a3142', 'stroke-width': 2 }));
    }
    if (node.r && positions.has(node.r)) {
      const c1 = pos; const c2 = positions.get(node.r);
      svg.append(el('line', { x1: c1.x + nodeSize/2, y1: c1.y + nodeSize/2, x2: c2.x + nodeSize/2, y2: c2.y + nodeSize/2, stroke: '#2a3142', 'stroke-width': 2 }));
    }
  });
  // Draw nodes
  positions.forEach((p, node) => {
    const nodeEl = el('div', { className: 'tree-node', style: { left: `${p.x}px`, top: `${p.y}px`, position: 'absolute' } }, node.v);
    container.append(nodeEl);
  });
  // Resize SVG height based on depth
  svg.setAttribute('height', String(depth * verticalGap + 120));
}

// Redraw on window resize to keep layout centered.
window.addEventListener('resize', () => drawTree());

/** Highlight search path root->target. */
function highlightSearchPath(targetValue) {
  const pathValues = [];
  let cursor = bstInstance.root;
  while (cursor) {
    pathValues.push(cursor.v);
    if (targetValue === cursor.v) break;
    cursor = targetValue < cursor.v ? cursor.l : cursor.r;
  }
  document.querySelectorAll('#tree .tree-node').forEach(nodeEl => nodeEl.classList.remove('active'));
  pathValues.forEach(val => {
    const cell = Array.from(document.querySelectorAll('#tree .tree-node')).find(c => c.textContent == val);
    if (cell) cell.classList.add('active');
  });
}

function animateTraversal(type){
  const order=[];
  function dfsIn(n){ if(!n) return; dfsIn(n.l); order.push(n.v); dfsIn(n.r); }
  function dfsPre(n){ if(!n) return; order.push(n.v); dfsPre(n.l); dfsPre(n.r); }
  function dfsPost(n){ if(!n) return; dfsPost(n.l); dfsPost(n.r); order.push(n.v); }
  if(type==='in') dfsIn(bstInstance.root); else if(type==='pre') dfsPre(bstInstance.root); else if(type==='post') dfsPost(bstInstance.root); else if(type==='bfs') {
    const q=[]; if(bstInstance.root) q.push(bstInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r); }
  }
  const nodes=Array.from(document.querySelectorAll('#tree .tree-node'));
  let i=0; function step(){ nodes.forEach(n=>n.classList.remove('active')); if(i>=order.length) return; const val=order[i++]; const elNode=nodes.find(n=>n.textContent==val); if(elNode){ elNode.classList.add('active'); } setTimeout(step,400);} step();
}
