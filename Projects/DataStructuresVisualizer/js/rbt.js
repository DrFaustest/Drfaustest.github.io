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
  const valueInput=el('input',{id:'rbt-val',placeholder:'e.g. 22',type:'number'});
  const controlsForm=createExplorerControls({title:'Red-black-tree actions',intro:'Insert by BST order, then recolor or rotate to preserve the red-black rules. Node color is structural state, not decoration.',fields:[controlField('Value to insert',valueInput)],groups:[
    controlGroup('Change the colored tree','watch recoloring and root movement',el('button',{className:'btn primary',onclick:handleRBTInsert},'Insert and repair'),el('button',{className:'btn',onclick:handleRBTReset},'Clear tree')),
    controlGroup('Traverse every node','compare visit orders',el('button',{className:'btn',onclick:()=>animateRBT('in')},'Inorder'),el('button',{className:'btn',onclick:()=>animateRBT('pre')},'Preorder'),el('button',{className:'btn',onclick:()=>animateRBT('post')},'Postorder'),el('button',{className:'btn',onclick:()=>animateRBT('bfs')},'Level order (BFS)'))
  ]});
  visualArea.append(title,el('div',{className:'visual-legend'},el('span',{className:'legend-item'},el('span',{className:'legend-swatch active'}),'current visit'),el('span',{className:'legend-item'},'Red nodes cannot have red children')),treeDiv,svg);
  controlsArea.prepend(controlsForm);
  drawRBT();
  setPseudocode([
  { text: 'def rb_insert(root,x): create red node', id: 'r1' },
  { text: 'while z.parent and parent.red:', id: 'r2' },
  { text: '    case: uncle red -> recolor', id: 'r3' },
  { text: '    else: rotations + recolor', id: 'r3b' },
  { text: 'root.color = black', id: 'r4' }
  ]);
  configureExplorer({name:'Red-black tree',goal:'Insert a value and watch recoloring or rotations preserve the color rules.',focus:'Red and black fills encode node state; the root must always end black.',change:'Repair may recolor a parent and uncle or rotate a local three-node shape.',why:'The color rules bound the longest root-to-leaf path, keeping operations logarithmic.'});
  const resizeHandler = () => drawRBT();
  window.addEventListener('resize', resizeHandler);
  setTeardown(() => {
    window.removeEventListener('resize', resizeHandler);
    rbtInstance = null;
  });
}

function rbtCount(node=rbtInstance?.root){return node?1+rbtCount(node.l)+rbtCount(node.r):0;}
function handleRBTInsert(){const input=qs('#rbt-val');const value=Number(input?.value);if(!input||input.value===''||Number.isNaN(value)){announce('Enter a number to insert.',{tone:'error',change:'The tree did not change.',why:'Red-black insertion needs a value to compare.'});return;}const before=rbtCount();const oldRoot=rbtInstance.root?.v;rbtInstance.insert(value);drawRBT();announce(`Inserted ${value} as red, then repaired any color conflict.`,{title:oldRoot!==rbtInstance.root?.v?'Rotate and recolor':'Recolor if needed',tone:'move',focus:`The root is ${rbtInstance.root?.v} and is black.`,change:`Node count ${before} → ${rbtCount()}.`,why:'A new node begins red so black-height stays stable; repair prevents adjacent red nodes.'});}
function handleRBTReset(){const before=rbtCount();rbtInstance=new RBT();drawRBT();announce(`Cleared ${before} node${before===1?'':'s'}.`,{title:'Reset the red-black tree',tone:'move',focus:'The tree is empty.',change:`Node count ${before} → 0.`,why:'An empty tree satisfies every red-black invariant.'});}

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
  appendGlowFilter(svg);
  const nodeSize = 42; const verticalGap = 80; const containerWidth = container.clientWidth || container.parentElement.clientWidth || 600;
  const positions = new Map();
  function layout(node, depthLevel, xMin, xMax) {
    if (!node) return; const x = (xMin + xMax)/2; const y = depthLevel * verticalGap + 20; positions.set(node,{x,y});
    layout(node.l, depthLevel+1, xMin, x); layout(node.r, depthLevel+1, x, xMax);
  }
  layout(rbtInstance.root, 0, 0, containerWidth);
  positions.forEach((pos, node) => {
    if (node.l && positions.has(node.l)) {
      const c1=pos,c2=positions.get(node.l);
      svg.append(el('line',{
        x1:c1.x+nodeSize/2,
        y1:c1.y+nodeSize/2,
        x2:c2.x+nodeSize/2,
        y2:c2.y+nodeSize/2,
        stroke:'#4cc9f0',
        'stroke-width':4,
        'stroke-linecap':'round',
        'filter':'url(#tree-glow)'
      }));
    }
    if (node.r && positions.has(node.r)) {
      const c1=pos,c2=positions.get(node.r);
      svg.append(el('line',{
        x1:c1.x+nodeSize/2,
        y1:c1.y+nodeSize/2,
        x2:c2.x+nodeSize/2,
        y2:c2.y+nodeSize/2,
        stroke:'#4cc9f0',
        'stroke-width':4,
        'stroke-linecap':'round',
        'filter':'url(#tree-glow)'
      }));
    }
  });
  positions.forEach((p,node)=>{
    container.append(el('div',{ className:`tree-node rbt-${node.c}`, style:{ position:'absolute', left:`${p.x}px`, top:`${p.y}px` } }, node.v));
  });
}

function animateRBT(type){
  const order=[]; function inO(n){ if(!n) return; inO(n.l); order.push(n.v); inO(n.r);} function pre(n){ if(!n) return; order.push(n.v); pre(n.l); pre(n.r);} function post(n){ if(!n) return; post(n.l); post(n.r); order.push(n.v);} if(type==='in') inO(rbtInstance.root); else if(type==='pre') pre(rbtInstance.root); else if(type==='post') post(rbtInstance.root); else if(type==='bfs'){ const q=[]; if(rbtInstance.root) q.push(rbtInstance.root); while(q.length){ const n=q.shift(); order.push(n.v); if(n.l) q.push(n.l); if(n.r) q.push(n.r);} }
  const nodes=Array.from(document.querySelectorAll('#rbt-tree .tree-node'));
  const names={in:'Inorder',pre:'Preorder',post:'Postorder',bfs:'Level order'};
  let i=0; function step(){nodes.forEach(n=>n.classList.remove('active'));if(i>=order.length){announce(`${names[type]} traversal: ${order.join(' → ')}.`,{title:'Traversal complete',tone:'complete',focus:'The full visit order is shown here.',change:'The tree was read but not changed.',why:type==='in'?'Inorder produces sorted values in a search tree.':'The traversal rule determines when each node is visited.'});return;}const val=order[i++];const nodeEl=nodes.find(n=>n.textContent==val);if(nodeEl)nodeEl.classList.add('active');announce(`Visit ${val}. Order so far: ${order.slice(0,i).join(' → ')}.`,{title:`${names[type]} traversal`,tone:'inspect',focus:`Node ${val} is highlighted.`,change:'The visit cursor moved; the tree did not change.',why:'The traversal rule chooses the next node.',record:false});setTimeout(step,400);}step();
}
