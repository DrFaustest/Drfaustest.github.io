import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, setPseudocode, qs, setTeardown } from './core.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function appendGlowFilter(svg){
  if (!svg) return;
  if (svg.querySelector('#tree-glow')) return;
  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', 'tree-glow');
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '2.5');
  blur.setAttribute('result', 'blur');
  const merge = document.createElementNS(SVG_NS, 'feMerge');
  const mergeNode1 = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeNode1.setAttribute('in', 'blur');
  const mergeNode2 = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeNode2.setAttribute('in', 'SourceGraphic');
  merge.append(mergeNode1, mergeNode2);
  filter.append(blur, merge);
  defs.append(filter);
  svg.append(defs);
}

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
  const valueInput=el('input',{id:'avl-val',placeholder:'e.g. 45',type:'number'});
  const controlsForm=createExplorerControls({title:'AVL-tree actions',intro:'AVL insertion follows BST ordering, then rotates any node whose left and right heights differ by more than one.',fields:[controlField('Value to insert',valueInput)],groups:[
    controlGroup('Change the balanced tree','watch the root and branch heights',el('button',{className:'btn primary',onclick:handleAVLInsert},'Insert and rebalance'),el('button',{className:'btn',onclick:handleAVLReset},'Clear tree')),
    controlGroup('Traverse every node','compare visit orders',el('button',{className:'btn',onclick:()=>animateAVL('in')},'Inorder'),el('button',{className:'btn',onclick:()=>animateAVL('pre')},'Preorder'),el('button',{className:'btn',onclick:()=>animateAVL('post')},'Postorder'),el('button',{className:'btn',onclick:()=>animateAVL('bfs')},'Level order (BFS)'))
  ]});
  visualArea.append(title,el('div',{className:'visual-legend'},el('span',{className:'legend-item'},el('span',{className:'legend-swatch active'}),'current visit')), treeDiv, svg);
  controlsArea.prepend(controlsForm);
  drawAVL();
  setPseudocode([
  { text: 'def insert(root,x):', id: 'a1' },
  { text: '    if root None: return Node(x)', id: 'a2' },
  { text: '    recurse left/right', id: 'a3' },
  { text: '    update height', id: 'a4' },
  { text: '    b = height(L)-height(R)', id: 'a5' },
  { text: '    rotate if |b|>1', id: 'a6' }
  ]);
  configureExplorer({name:'AVL tree',goal:'Insert a value and watch whether the root or a subtree rotates to restore balance.',focus:'Each node’s left and right subtree heights determine its balance factor.',change:'A rotation changes parent-child links while preserving sorted inorder order.',why:'Keeping height difference at most one prevents the tree from becoming a long chain.'});
  const resizeHandler = () => drawAVL();
  window.addEventListener('resize', resizeHandler);
  setTeardown(() => {
    window.removeEventListener('resize', resizeHandler);
    avlInstance = null;
  });
}

function avlCount(node=avlInstance?.root){ return node?1+avlCount(node.l)+avlCount(node.r):0; }
function handleAVLInsert(){ const input=qs('#avl-val'); const value=Number(input?.value); if(!input||input.value===''||Number.isNaN(value)){announce('Enter a number to insert.',{tone:'error',change:'The tree did not change.',why:'AVL insertion needs a value to compare.'});return;} const before=avlCount(); const oldRoot=avlInstance.root?.v; avlInstance.insert(value); drawAVL(); const added=avlCount()>before; announce(added?`Inserted ${value} and checked balance on the path to the root.`:`${value} already exists, so no node was added.`,{title:added?(oldRoot!==avlInstance.root?.v?'Rebalance with a rotation':'Balance already valid'):'Duplicate ignored',tone:added?'move':'complete',focus:oldRoot!==avlInstance.root?.v?`Root changed from ${oldRoot} to ${avlInstance.root?.v}.`:'The tree shape stayed balanced.',change:added?`Node count ${before} → ${avlCount()}.`:'The tree did not change.',why:'AVL rotations restore height balance without changing sorted inorder order.'}); }
function handleAVLReset(){const before=avlCount();avlInstance=new AVL();drawAVL();announce(`Cleared ${before} node${before===1?'':'s'}.`,{title:'Reset the AVL tree',tone:'move',focus:'The tree is empty.',change:`Node count ${before} → 0.`,why:'A new empty AVL tree already satisfies the balance rule.'});}

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
  appendGlowFilter(svg);
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
      svg.append(el('line', {
        x1: c1.x + nodeSize/2,
        y1: c1.y + nodeSize/2,
        x2: c2.x + nodeSize/2,
        y2: c2.y + nodeSize/2,
        stroke: '#4cc9f0',
        'stroke-width': 4,
        'stroke-linecap': 'round',
        'filter': 'url(#tree-glow)'
      }));
    }
    if (node.r && positions.has(node.r)) {
      const c1 = pos, c2 = positions.get(node.r);
      svg.append(el('line', {
        x1: c1.x + nodeSize/2,
        y1: c1.y + nodeSize/2,
        x2: c2.x + nodeSize/2,
        y2: c2.y + nodeSize/2,
        stroke: '#4cc9f0',
        'stroke-width': 4,
        'stroke-linecap': 'round',
        'filter': 'url(#tree-glow)'
      }));
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

function animateAVL(type){
  const order=[];
  function inO(n){ if(!n) return; inO(n.l); order.push(n.v); inO(n.r); }
  function pre(n){ if(!n) return; order.push(n.v); pre(n.l); pre(n.r); }
  function post(n){ if(!n) return; post(n.l); post(n.r); order.push(n.v); }
  if(type==='in') inO(avlInstance.root); else if(type==='pre') pre(avlInstance.root); else if(type==='post') post(avlInstance.root); else if(type==='bfs'){ const q=[]; if(avlInstance.root) q.push(avlInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r);} }
  const nodes=Array.from(document.querySelectorAll('#avl-tree .tree-node'));
  const names={in:'Inorder',pre:'Preorder',post:'Postorder',bfs:'Level order'};
  let i=0; function step(){ nodes.forEach(n=>n.classList.remove('active')); if(i>=order.length){announce(`${names[type]} traversal: ${order.join(' → ')}.`,{title:'Traversal complete',tone:'complete',focus:'The full visit order is shown here.',change:'The tree was read but not changed.',why:type==='in'?'Inorder produces sorted values in a search tree.':'The traversal rule determines when each node is visited.'});return;} const val=order[i++]; const nodeEl=nodes.find(n=>n.textContent==val); if(nodeEl) nodeEl.classList.add('active'); announce(`Visit ${val}. Order so far: ${order.slice(0,i).join(' → ')}.`,{title:`${names[type]} traversal`,tone:'inspect',focus:`Node ${val} is highlighted.`,change:'The visit cursor moved; the tree did not change.',why:'The traversal rule chooses the next node.',record:false}); setTimeout(step,400); } step();
}
