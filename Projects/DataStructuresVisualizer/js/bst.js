import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs, setTeardown } from './core.js';

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
  const valueInput=el('input',{id:'bst-val',placeholder:'e.g. 9',type:'number'});
  const controlsForm=createExplorerControls({
    title:'Binary-search-tree actions',
    intro:'At every node, smaller values go left and larger or equal values go right. Watch the highlighted comparison path.',
    fields:[controlField('Value',valueInput)],
    groups:[
      controlGroup('Change or inspect','uses Value',
        el('button',{className:'btn primary',onclick:handleBSTInsert},'Insert value'),
        el('button',{className:'btn',onclick:handleBSTRemove},'Remove value'),
        el('button',{className:'btn',onclick:handleBSTSearch},'Search path')
      ),
      controlGroup('Traverse every node','compare visit orders',
        el('button',{className:'btn',onclick:()=>animateTraversal('in')},'Inorder'),
        el('button',{className:'btn',onclick:()=>animateTraversal('pre')},'Preorder'),
        el('button',{className:'btn',onclick:()=>animateTraversal('post')},'Postorder'),
        el('button',{className:'btn',onclick:()=>animateTraversal('bfs')},'Level order (BFS)')
      )
    ]
  });
  visualArea.append(title, el('div',{className:'visual-legend'},el('span',{className:'legend-item'},el('span',{className:'legend-swatch active'}),'comparison / visit')), treeDiv, svg);
  controlsArea.prepend(controlsForm);
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
  configureExplorer({ name:'Binary search tree', goal:'Search for a value and read each left-or-right decision along the highlighted path.', focus:'Highlighted circles are the nodes compared or visited.', change:'Insertion adds a leaf; removal reconnects children while preserving order.', why:'The left-smaller/right-larger invariant guides efficient search.' });
  const resizeHandler = () => drawTree();
  window.addEventListener('resize', resizeHandler);
  setTeardown(() => {
    window.removeEventListener('resize', resizeHandler);
    bstInstance = null;
  });
}

function readBSTValue(){ const input=qs('#bst-val'); const value=Number(input?.value); if(!input||input.value===''||Number.isNaN(value)){ announce('Enter a number first.', { tone:'error', change:'The tree did not change.', why:'Tree actions need a comparison target.' }); return null; } return value; }
function bstValues(){ const values=[]; const queue=[]; if(bstInstance.root)queue.push(bstInstance.root); while(queue.length){const node=queue.shift(); values.push(node.v); if(node.l)queue.push(node.l); if(node.r)queue.push(node.r);} return values; }
function handleBSTInsert(){ const value=readBSTValue(); if(value==null)return; const path=[]; let cursor=bstInstance.root; while(cursor){path.push(cursor.v); cursor=value<cursor.v?cursor.l:cursor.r;} bstInstance.insert(value); drawTree(); highlightPseudo('ins2'); announce(`Inserted ${value} as a new leaf.`, { title:'Follow comparisons to an empty branch', tone:'move', focus:`Path: ${path.length?path.join(' → '):'empty tree'} → ${value}.`, change:`Node ${value} now occupies the first empty left/right link.`, why:'Placing by comparison preserves the search-tree ordering invariant.' }); }
function handleBSTRemove(){ const value=readBSTValue(); if(value==null)return; const before=bstValues(); bstInstance.remove(value); const after=bstValues(); drawTree(); announce(before.includes(value)?`Removed ${value} and repaired the tree.`:`${value} was not found.`, { title:before.includes(value)?'Remove while preserving order':'Removal complete: no match', tone:before.includes(value)?'move':'complete', focus:before.includes(value)?'Children were reconnected; a two-child node uses its inorder successor.':'The comparison path ended at an empty link.', change:before.includes(value)?`Node count ${before.length} → ${after.length}.`:'The tree did not change.', why:'Every remaining left descendant must stay smaller and every right descendant larger.' }); }
function handleBSTSearch(){ const value=readBSTValue(); if(value!=null)highlightSearchPath(value); }

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
  if (!bstInstance) return;
  const container = qs('#tree'); const svg = qs('#tree-lines');
  if (!container || !svg) return;
  container.innerHTML = ''; svg.innerHTML = '';
  appendGlowFilter(svg);
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
      const c1 = pos; const c2 = positions.get(node.r);
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
  // Draw nodes
  positions.forEach((p, node) => {
    const nodeEl = el('div', { className: 'tree-node', style: { left: `${p.x}px`, top: `${p.y}px`, position: 'absolute' } }, node.v);
    container.append(nodeEl);
  });
  // Resize SVG height based on depth
  svg.setAttribute('height', String(depth * verticalGap + 120));
}

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
  const found=pathValues.at(-1)===targetValue;
  announce(found?`Found ${targetValue} after ${pathValues.length} comparison${pathValues.length===1?'':'s'}.`:`${targetValue} is not in the tree.`, { title:found?'Search complete: match found':'Search reached an empty branch', tone:found?'complete':'inspect', focus:`Comparison path: ${pathValues.join(' → ')||'empty tree'}.`, change:'The tree was read but not changed.', why:pathValues.length?`${targetValue} moves left when smaller and right when larger at each node.`:'An empty tree contains no searchable nodes.' });
}

function animateTraversal(type){
  const order=[];
  function dfsIn(n){ if(!n) return; dfsIn(n.l); order.push(n.v); dfsIn(n.r); }
  function dfsPre(n){ if(!n) return; order.push(n.v); dfsPre(n.l); dfsPre(n.r); }
  function dfsPost(n){ if(!n) return; dfsPost(n.l); dfsPost(n.r); order.push(n.v); }
  if(type==='in') dfsIn(bstInstance.root); else if(type==='pre') dfsPre(bstInstance.root); else if(type==='post') dfsPost(bstInstance.root); else if(type==='bfs') {
    const q=[]; if(bstInstance.root) q.push(bstInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r); }
  }
  const names={in:'Inorder',pre:'Preorder',post:'Postorder',bfs:'Level order'};
  const nodes=Array.from(document.querySelectorAll('#tree .tree-node'));
  let i=0; function step(){ nodes.forEach(n=>n.classList.remove('active')); if(i>=order.length){ announce(`${names[type]} traversal: ${order.join(' → ')}.`, { title:'Traversal complete', tone:'complete', focus:'The final visit order is shown here.', change:'The tree was visited but not changed.', why:type==='in'?'Inorder visits a BST in sorted value order.':type==='bfs'?'A queue visits one depth level at a time.':'Recursive position determines when each node is visited.' }); return; } const val=order[i++]; const elNode=nodes.find(n=>n.textContent==val); if(elNode){ elNode.classList.add('active'); } announce(`Visit ${val}. Order so far: ${order.slice(0,i).join(' → ')}.`, { title:`${names[type]} traversal`, tone:'inspect', focus:`Node ${val} is highlighted.`, change:'The visit cursor moved; the tree did not change.', why:'The traversal rule decides which node comes next.', record:false }); setTimeout(step,400);} step();
}
