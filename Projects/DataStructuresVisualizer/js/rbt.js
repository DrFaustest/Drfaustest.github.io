import { el, setPseudocode, qs } from './core.js';

// Red-Black Tree node (stores color + parent).
class RBTNode { constructor(value, color = 'red') { this.v = value; this.c = color; this.l = null; this.r = null; this.p = null; } }

// Classic RB-Tree insert + fix (no deletion needed for visualization).
class RBT {
  constructor() { this.root = null; }
  rotateLeft(x) {
    const y = x.r; x.r = y.l; if (y.l) y.l.p = x; y.p = x.p;
    if (!x.p) this.root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y;
    y.l = x; x.p = y;
  }
  rotateRight(y) {
    const x = y.l; y.l = x.r; if (x.r) x.r.p = y; x.p = y.p;
    if (!y.p) this.root = x; else if (y === y.p.l) y.p.l = x; else y.p.r = x;
    x.r = y; y.p = x;
  }
  insert(value) {
    let z = new RBTNode(value), parent = null, cursor = this.root;
    while (cursor) { parent = cursor; cursor = z.v < cursor.v ? cursor.l : cursor.r; }
    z.p = parent; if (!parent) this.root = z; else if (z.v < parent.v) parent.l = z; else parent.r = z;
    z.c = 'red';
    this.fixInsert(z);
  }
  fixInsert(z) {
    while (z.p && z.p.c === 'red') {
      if (z.p === z.p.p?.l) { // parent is a left child
        const uncle = z.p.p.r;
        if (uncle && uncle.c === 'red') { // recolor case
          z.p.c = 'black'; uncle.c = 'black'; z.p.p.c = 'red'; z = z.p.p;
        } else { // rotation cases
          if (z === z.p.r) { z = z.p; this.rotateLeft(z); }
            z.p.c = 'black'; z.p.p.c = 'red'; this.rotateRight(z.p.p);
        }
      } else { // parent is right child (mirror cases)
        const uncle = z.p.p?.l;
        if (uncle && uncle.c === 'red') {
          z.p.c = 'black'; uncle.c = 'black'; z.p.p.c = 'red'; z = z.p.p;
        } else {
          if (z === z.p.l) { z = z.p; this.rotateRight(z); }
          z.p.c = 'black'; z.p.p.c = 'red'; this.rotateLeft(z.p.p);
        }
      }
    }
    if (this.root) this.root.c = 'black';
  }
}

let rbtInstance;

export function renderRBTVisualizer(visualArea, controlsArea) {
  rbtInstance = new RBT();
  [20, 10, 30, 5, 15, 25, 40, 1, 12, 18].forEach(v => rbtInstance.insert(v));
  const title = el('h2', {}, 'Red-Black Tree');
  const treeDiv = el('div', { id: 'rbt-tree', className: 'tree canvas-tree' });
  const svg = el('svg', { id: 'rbt-lines', className: 'tree-lines', width: '100%', height: '100%' });
  const controlsForm = el('div', {},
    el('input', { id: 'rbt-val', placeholder: 'Value', type: 'number' }),
    el('button', { className: 'btn', onclick: () => { const value = Number(qs('#rbt-val').value); if (!Number.isNaN(value)) { rbtInstance.insert(value); drawRBT(); } } }, 'Insert'),
  el('button', { className: 'btn', onclick: () => { rbtInstance = new RBT(); drawRBT(); } }, 'Reset'),
  el('button', { className: 'btn', onclick: () => animateRBT('in') }, 'Inorder'),
  el('button', { className: 'btn', onclick: () => animateRBT('pre') }, 'Preorder'),
  el('button', { className: 'btn', onclick: () => animateRBT('post') }, 'Postorder'),
  el('button', { className: 'btn', onclick: () => animateRBT('bfs') }, 'BFS')
  );
  visualArea.append(title, treeDiv, svg);
  controlsArea.append(el('h3', {}, 'RBT Controls'), controlsForm);
  drawRBT();
  setPseudocode([
  { text: 'def rb_insert(root,x): create red node', id: 'r1' },
  { text: 'while z.parent and parent.red:', id: 'r2' },
  { text: '    case: uncle red -> recolor', id: 'r3' },
  { text: '    else: rotations + recolor', id: 'r3b' },
  { text: 'root.color = black', id: 'r4' }
  ]);
}

function rbtLevels(root) {
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

function drawRBT() {
  const container = qs('#rbt-tree'); const svg = qs('#rbt-lines'); if (!container || !svg) return;
  container.innerHTML=''; svg.innerHTML='';
  const nodeSize = 42; const verticalGap = 80; const containerWidth = container.clientWidth || container.parentElement.clientWidth || 600;
  const positions = new Map();
  function layout(node, depthLevel, xMin, xMax) {
    if (!node) return; const x = (xMin + xMax)/2; const y = depthLevel * verticalGap + 20; positions.set(node,{x,y});
    layout(node.l, depthLevel+1, xMin, x); layout(node.r, depthLevel+1, x, xMax);
  }
  layout(rbtInstance.root, 0, 0, containerWidth);
  positions.forEach((pos, node) => {
    if (node.l && positions.has(node.l)) { const c1=pos,c2=positions.get(node.l); svg.append(el('line',{ x1:c1.x+nodeSize/2,y1:c1.y+nodeSize/2,x2:c2.x+nodeSize/2,y2:c2.y+nodeSize/2,stroke:'#2a3142','stroke-width':2 })); }
    if (node.r && positions.has(node.r)) { const c1=pos,c2=positions.get(node.r); svg.append(el('line',{ x1:c1.x+nodeSize/2,y1:c1.y+nodeSize/2,x2:c2.x+nodeSize/2,y2:c2.y+nodeSize/2,stroke:'#2a3142','stroke-width':2 })); }
  });
  positions.forEach((p,node)=>{
    container.append(el('div',{ className:`tree-node rbt-${node.c}`, style:{ position:'absolute', left:`${p.x}px`, top:`${p.y}px` } }, node.v));
  });
}

window.addEventListener('resize', () => drawRBT());

function animateRBT(type){
  const order=[]; function inO(n){ if(!n) return; inO(n.l); order.push(n.v); inO(n.r);} function pre(n){ if(!n) return; order.push(n.v); pre(n.l); pre(n.r);} function post(n){ if(!n) return; post(n.l); post(n.r); order.push(n.v);} if(type==='in') inO(rbtInstance.root); else if(type==='pre') pre(rbtInstance.root); else if(type==='post') post(rbtInstance.root); else if(type==='bfs'){ const q=[]; if(rbtInstance.root) q.push(rbtInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r);} }
  const nodes=Array.from(document.querySelectorAll('#rbt-tree .tree-node'));
  let i=0; function step(){ nodes.forEach(n=>n.classList.remove('active')); if(i>=order.length) return; const val=order[i++]; const nodeEl=nodes.find(n=>n.textContent==val); if(nodeEl) nodeEl.classList.add('active'); setTimeout(step,400);} step();
}
