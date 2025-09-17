import { el, setPseudocode, qs } from './core.js';

// AVL tree node (stores height for O(1) balance factor checks).
class AVLNode { constructor(value) { this.v = value; this.l = null; this.r = null; this.h = 1; } }

class AVL {
  constructor() { this.root = null; }
  height(node) { return node ? node.h : 0; }
  update(node) { node.h = 1 + Math.max(this.height(node.l), this.height(node.r)); return node; }
  balance(node) { return node ? this.height(node.l) - this.height(node.r) : 0; }
  // Right rotation
  rotRight(y) { const x = y.l; const t2 = x.r; x.r = y; y.l = t2; this.update(y); this.update(x); return x; }
  // Left rotation
  rotLeft(x) { const y = x.r; const t2 = y.l; y.l = x; x.r = t2; this.update(x); this.update(y); return y; }
  insert(value) { this.root = this._insert(this.root, value); }
  _insert(node, value) {
    if (!node) return new AVLNode(value);
    if (value < node.v) node.l = this._insert(node.l, value); else if (value > node.v) node.r = this._insert(node.r, value); else return node; // duplicate -> no-op
    this.update(node);
    const bal = this.balance(node);
    // 4 rotation cases
    if (bal > 1 && value < node.l.v) return this.rotRight(node);           // LL
    if (bal < -1 && value > node.r.v) return this.rotLeft(node);           // RR
    if (bal > 1 && value > node.l.v) { node.l = this.rotLeft(node.l); return this.rotRight(node); } // LR
    if (bal < -1 && value < node.r.v) { node.r = this.rotRight(node.r); return this.rotLeft(node); } // RL
    return node;
  }
}

let avlInstance;

export function renderAVLVisualizer(visualArea, controlsArea) {
  avlInstance = new AVL();
  [30, 10, 40, 5, 20, 35, 50, 25].forEach(v => avlInstance.insert(v));
  const title = el('h2', {}, 'AVL Tree');
  const treeDiv = el('div', { id: 'avl-tree', className: 'tree canvas-tree' });
  const svg = el('svg', { id: 'avl-lines', className: 'tree-lines', width: '100%', height: '100%' });
  const controlsForm = el('div', {},
    el('input', { id: 'avl-val', placeholder: 'Value', type: 'number' }),
    el('button', { className: 'btn', onclick: () => { const value = Number(qs('#avl-val').value); if (!Number.isNaN(value)) { avlInstance.insert(value); drawAVL(); } } }, 'Insert'),
  el('button', { className: 'btn', onclick: () => { avlInstance = new AVL(); drawAVL(); } }, 'Reset'),
  el('button', { className: 'btn', onclick: () => animateAVL('in') }, 'Inorder'),
  el('button', { className: 'btn', onclick: () => animateAVL('pre') }, 'Preorder'),
  el('button', { className: 'btn', onclick: () => animateAVL('post') }, 'Postorder'),
  el('button', { className: 'btn', onclick: () => animateAVL('bfs') }, 'BFS')
  );
  visualArea.append(title, treeDiv, svg);
  controlsArea.append(el('h3', {}, 'AVL Controls'), controlsForm);
  drawAVL();
  setPseudocode([
  { text: 'def insert(root,x):', id: 'a1' },
  { text: '    if root None: return Node(x)', id: 'a2' },
  { text: '    recurse left/right', id: 'a3' },
  { text: '    update height', id: 'a4' },
  { text: '    b = height(L)-height(R)', id: 'a5' },
  { text: '    rotate if |b|>1', id: 'a6' }
  ]);
}

function avlLevels(root) {
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

function drawAVL() {
  const container = qs('#avl-tree'); const svg = qs('#avl-lines'); if (!container || !svg) return;
  container.innerHTML = ''; svg.innerHTML='';
  const levels = avlLevels(avlInstance.root); const depth = levels.length;
  const nodeSize = 42; const verticalGap = 80; const containerWidth = container.clientWidth || container.parentElement.clientWidth || 600;
  const positions = new Map();
  function layout(node, depthLevel, xMin, xMax) {
    if (!node) return;
    const x = (xMin + xMax) / 2; const y = depthLevel * verticalGap + 20;
    positions.set(node, { x, y });
    layout(node.l, depthLevel + 1, xMin, x);
    layout(node.r, depthLevel + 1, x, xMax);
  }
  layout(avlInstance.root, 0, 0, containerWidth);
  // Lines
  positions.forEach((pos, node) => {
    if (node.l && positions.has(node.l)) {
      const c1 = pos, c2 = positions.get(node.l);
      svg.append(el('line', { x1: c1.x + nodeSize/2, y1: c1.y + nodeSize/2, x2: c2.x + nodeSize/2, y2: c2.y + nodeSize/2, stroke:'#2a3142', 'stroke-width':2 }));
    }
    if (node.r && positions.has(node.r)) {
      const c1 = pos, c2 = positions.get(node.r);
      svg.append(el('line', { x1: c1.x + nodeSize/2, y1: c1.y + nodeSize/2, x2: c2.x + nodeSize/2, y2: c2.y + nodeSize/2, stroke:'#2a3142', 'stroke-width':2 }));
    }
  });
  // Nodes
  positions.forEach((p, node) => {
    const balanceFactor = (avlInstance.height(node.l) - avlInstance.height(node.r));
    const cls = balanceFactor > 1 ? 'balance-pos' : balanceFactor < -1 ? 'balance-neg' : '';
    container.append(el('div', { className: `tree-node ${cls}`, style: { position:'absolute', left:`${p.x}px`, top:`${p.y}px` } }, node.v));
  });
  svg.setAttribute('height', String(depth * verticalGap + 120));
}

window.addEventListener('resize', () => drawAVL());

function animateAVL(type){
  const order=[];
  function inO(n){ if(!n) return; inO(n.l); order.push(n.v); inO(n.r); }
  function pre(n){ if(!n) return; order.push(n.v); pre(n.l); pre(n.r); }
  function post(n){ if(!n) return; post(n.l); post(n.r); order.push(n.v); }
  if(type==='in') inO(avlInstance.root); else if(type==='pre') pre(avlInstance.root); else if(type==='post') post(avlInstance.root); else if(type==='bfs'){ const q=[]; if(avlInstance.root) q.push(avlInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r);} }
  const nodes=Array.from(document.querySelectorAll('#avl-tree .tree-node'));
  let i=0; function step(){ nodes.forEach(n=>n.classList.remove('active')); if(i>=order.length) return; const val=order[i++]; const nodeEl=nodes.find(n=>n.textContent==val); if(nodeEl) nodeEl.classList.add('active'); setTimeout(step,400); } step();
}
