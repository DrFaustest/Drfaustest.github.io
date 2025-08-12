/**
 * Data Structures & Algorithms Visualizer
 * --------------------------------------
 * Single-file implementation of multiple interactive visualizations:
 *  - Array, Linked List, Stack, Queue
 *  - Binary Search Tree, AVL Tree, Red-Black Tree
 *  - Hash Table (chaining & open addressing)
 *  - Graph (BFS, DFS, Dijkstra + path reconstruction)
 *  - Sorting algorithms (Bubble, Insertion, Merge, Quick) with a step engine
 *
 * Features:
 *  - Pseudocode panel with dynamic highlighting (maps logical steps to lines)
 *  - Statistics panel (comparisons / swaps / total operations)
 *  - Step recording & playback controls (play, pause, prev, next, reset)
 *  - Adjustable animation speed
 *
 * NOTE: The goal of this refactor is readability. Behavior should remain unchanged.
 */

// ---------------------------------------------------------------------------
// DOM Utility Helpers
// ---------------------------------------------------------------------------

// Query single / multiple
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// Create element with props + children (small hyperscript helper)
const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);

    for (const [k, v] of Object.entries(props || {})) {
        if (k === 'dataset' && v && typeof v === 'object') {
            for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
        } else if (k === 'style' && v && typeof v === 'object') {
            Object.assign(node.style, v);
        } else if (k in node) {
            try { node[k] = v; } catch { node.setAttribute(k, v); }
        } else {
            node.setAttribute(k, v);
        }
    }

    children
        .flat()
        .forEach(child => node.append(child && child.nodeType ? child : document.createTextNode(String(child))));

    return node;
};

// Async delay for animations
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// Animation Speeds
const animSpeed = { ultra: 60, fast: 120, normal: 260, slow: 520 };
let speed = 'normal';

// Global application state
const appState = {
    current: null,
    steps: [],          // Recorded algorithm steps for playback (sorting currently)
    stepIndex: 0,
    playing: false,
    playLoop: null,
    stats: { comparisons: 0, swaps: 0, operations: 0 },
    pseudoLines: [],
    pseudoMap: new Map()
};

function resetStepEngine() {
    appState.steps = [];
    appState.stepIndex = 0;
    appState.playing = false;
    clearInterval(appState.playLoop);
    appState.stats = { comparisons: 0, swaps: 0, operations: 0 };
    updateStats();
    togglePlayButton(false, true);
}

// Panels (lazy created per load)
function ensurePanels() {
    if (qs('#panel-pseudocode')) return; // already created
    const controls = qs('#controls-area');
    if (!controls) return;

    const pseudo = el('div', { id: 'panel-pseudocode', className: 'panel' },
        el('div', { className: 'panel-header' }, 'Pseudocode'),
        el('pre', { id: 'pseudo-code', className: 'code' })
    );

    const stats = el('div', { id: 'panel-stats', className: 'panel' },
        el('div', { className: 'panel-header' }, 'Stats'),
        el('ul', { id: 'stats-list', className: 'stats-list' })
    );

    const actions = el('div', { id: 'panel-actions', className: 'panel' },
        el('div', { className: 'panel-header' }, 'Playback'),
        el('div', { className: 'playback-controls' },
            el('button', { id: 'step-prev', className: 'btn', onclick: () => step(-1) }, 'Prev'),
            el('button', { id: 'step-next', className: 'btn', onclick: () => step(1) }, 'Next'),
            el('button', { id: 'step-play', className: 'btn primary', onclick: togglePlay }, 'Play'),
            el('button', { id: 'step-reset', className: 'btn', onclick: () => renderCurrentAgain() }, 'Reset')
        ),
        el('label', { htmlFor: 'speed-select', style: { marginTop: '.5rem' } }, 'Speed:'),
        (() => {
            const select = el('select', { id: 'speed-select' });
            ['ultra', 'fast', 'normal', 'slow'].forEach(v => select.append(el('option', { value: v, selected: v === speed }, v)));
            select.onchange = () => speed = select.value;
            return select;
        })()
    );

    controls.append(pseudo, stats, actions);
    updateStats();
}
function setPseudocode(lines) {
    ensurePanels();
    appState.pseudoLines = lines;
    appState.pseudoMap.clear();
    const pre = qs('#pseudo-code');
    pre.innerHTML = '';
    lines.forEach((ln, i) => {
        const lineDiv = el('div', { className: 'code-line', dataset: { i } }, ln.text);
        if (ln.id) appState.pseudoMap.set(ln.id, i);
        pre.append(lineDiv);
    });
}
function highlightPseudo(idOrIndex) {
    qsa('#pseudo-code .code-line').forEach(l => l.classList.remove('hl'));
    if (idOrIndex == null) return;
    const idx = typeof idOrIndex === 'number' ? idOrIndex : appState.pseudoMap.get(idOrIndex);
    if (idx != null) {
        const line = qs(`#pseudo-code .code-line[data-i='${idx}']`);
        if (line) line.classList.add('hl');
        line?.scrollIntoView({ block: 'nearest' });
    }
}
function updateStats() {
    ensurePanels();
    const ul = qs('#stats-list');
    if (!ul) return;
    ul.innerHTML = '';
    Object.entries(appState.stats).forEach(([k, v]) => ul.append(el('li', {}, `${k}: ${v}`)));
}
function incStat(name, delta = 1) {
    appState.stats[name] = (appState.stats[name] || 0) + delta;
    updateStats();
}

// Step playback
function togglePlay() {
    if (!appState.steps.length) return;
    appState.playing = !appState.playing;
    togglePlayButton(appState.playing, false);

    if (appState.playing) {
        appState.playLoop = setInterval(() => {
            if (appState.stepIndex >= appState.steps.length) {
                appState.playing = false;
                togglePlayButton(false);
                clearInterval(appState.playLoop);
                return;
            }
            runStep(appState.steps[appState.stepIndex++]);
        }, animSpeed[speed]);
    } else {
        clearInterval(appState.playLoop);
    }
}
function togglePlayButton(isPlaying, disabled) {
    const btn = qs('#step-play');
    if (!btn) return;
    if (disabled) {
        btn.disabled = true;
        btn.textContent = 'Play';
        return;
    }
    btn.disabled = false;
    btn.textContent = isPlaying ? 'Pause' : 'Play';
}
function step(dir) {
    if (!appState.steps.length) return;
    if (dir > 0 && appState.stepIndex < appState.steps.length) {
        runStep(appState.steps[appState.stepIndex++]);
    } else if (dir < 0 && appState.stepIndex > 0) {
        renderCurrentAgain(appState.stepIndex - 1);
        appState.stepIndex--;
    }
}
// Rebuild current visualization to a base state then re-apply steps up to targetIndex (rewind)
function renderCurrentAgain(targetIndex = 0) {
    if (appState.current === 'sorting') {
        drawBars(true); // base array already provided
        for (let i = 0; i < targetIndex; i++) applyStepState(appState.steps[i], true);
    }
    highlightPseudo(null);
}
function runStep(step) {
    applyStepState(step);
    if (step.pc) highlightPseudo(step.pc);
}
function applyStepState(step, fast) {
    switch (step.type) {
        case 'compare':
            highlightBars(step.i, step.j);
            if (!fast) incStat('comparisons');
            break;
        case 'swap':
            swapBars(step.i, step.j);
            if (!fast) incStat('swaps');
            break;
        case 'write':
            // Merge sort write operation (overwriting index with value)
            baseArray[step.i] = step.value;
            drawBars(true); // redraw without clearing highlights
            highlightBars(step.i, step.i);
            if (!fast) incStat('swaps'); // count writes as swaps for stats consistency
            break;
        case 'mark-sorted':
            markBarSorted(step.i);
            break;
        case 'visit-vertex':
            activateVertex(step.id);
            break;
        case 'distance-update':
            updateGraphDistance(step.v, step.dist);
            break;
        default:
            break;
    }
    if (!fast) incStat('operations');
}

// Router
addEventListener('DOMContentLoaded', () => {
    const loadBtn = qs('#load-btn');
    loadBtn?.addEventListener('click', () => loadVisualizer(qs('#structure-select').value));
    loadVisualizer('array');
});

function loadVisualizer(type) {
    appState.current = type;
    resetStepEngine();
    const viz = qs('#visualization-area');
    const controls = qs('#controls-area');
    viz.innerHTML = '';
    controls.innerHTML = '';
    ensurePanels();
    setPseudocode([{ text: 'Select a category...', id: 'idle' }]);
    highlightPseudo('idle');

    switch (type) {
        case 'array': return renderArrayVisualizer(viz, controls);
        case 'linked-list': return renderLinkedListVisualizer(viz, controls);
        case 'stack': return renderStackVisualizer(viz, controls);
        case 'queue': return renderQueueVisualizer(viz, controls);
        case 'tree': return renderTreeVisualizer(viz, controls);
        case 'avl': return renderAVLVisualizer(viz, controls);
        case 'rbt': return renderRBTVisualizer(viz, controls);
        case 'hash': return renderHashTableVisualizer(viz, controls);
        case 'graph': return renderGraphVisualizer(viz, controls);
        case 'sorting': return renderSortingVisualizer(viz, controls);
        default:
            viz.append(el('p', {}, 'Select a data structure or algorithm to begin.'));
    }
}

// ============ Array Visualizer ============
let arrayData = [];
function renderArrayVisualizer(viz, controls) {
    arrayData = [3, 1, 4];
    const title = el('h2', {}, 'Array');
    const row = el('div', { className: 'viz-row', id: 'array-row' });
    const form = el('div', {},
        el('input', { id: 'arr-val', placeholder: 'Value', type: 'number' }),
        el('input', { id: 'arr-idx', placeholder: 'Index (optional)', type: 'number', min: 0 }),
        el('button', { className: 'btn', onclick: addArrayElement }, 'Push/Insert'),
        el('button', { className: 'btn', onclick: popArrayElement }, 'Pop'),
        el('button', { className: 'btn', onclick: removeArrayAt }, 'Remove At'),
        el('button', { className: 'btn', onclick: () => { arrayData.length = 0; updateArrayViz(); } }, 'Clear')
    );
    viz.append(title, row);
    controls.append(el('h3', {}, 'Array Controls'), form);
    updateArrayViz();
    setPseudocode([
        { text: 'insert(A,val,i?)', id: 'sig' },
        { text: ' if i omitted: append', id: 'append' },
        { text: ' else shift right from i', id: 'shift' },
        { text: ' place value', id: 'place' }
    ]);
}
function drawArray(arr, row) {
    row.innerHTML = '';
    arr.forEach((v, i) => {
        row.append(
            el('div', { className: 'cell' }, v),
            el('div', { className: 'cell index' }, i)
        );
    });
}
function updateArrayViz() {
    drawArray(arrayData, qs('#array-row'));
}
function addArrayElement() {
    const v = Number(qs('#arr-val').value);
    const raw = qs('#arr-idx').value;
    const idx = raw === '' ? null : Number(raw);
    if (Number.isNaN(v)) return;
    if (idx == null || idx >= arrayData.length) {
        arrayData.push(v);
        highlightPseudo('append');
    } else {
        arrayData.splice(idx, 0, v);
        highlightPseudo('place');
    }
    updateArrayViz();
}
function popArrayElement() {
    arrayData.pop();
    updateArrayViz();
}
function removeArrayAt() {
    const i = Number(qs('#arr-idx').value);
    if (!Number.isNaN(i)) {
        arrayData.splice(i, 1);
        updateArrayViz();
    }
}

// ---------------------------------------------------------------------------
// Linked List
// ---------------------------------------------------------------------------

// ============ Linked List ============
class ListNode {
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.size = 0;
    }
    push(val) {
        if (!this.head) {
            this.head = new ListNode(val);
        } else {
            let n = this.head;
            while (n.next) n = n.next;
            n.next = new ListNode(val);
        }
        this.size++;
    }
    insertAt(val, idx) {
        if (idx <= 0 || !this.head) {
            this.head = new ListNode(val, this.head);
            this.size++;
            return;
        }
        let i = 0, prev = null, cur = this.head;
        while (cur && i < idx) { prev = cur; cur = cur.next; i++; }
        prev.next = new ListNode(val, cur);
        this.size++;
    }
    removeAt(idx) {
        if (!this.head) return;
        if (idx <= 0) {
            this.head = this.head.next;
            this.size--;
            return;
        }
        let i = 0, prev = null, cur = this.head;
        while (cur && i < idx) { prev = cur; cur = cur.next; i++; }
        if (cur) { prev.next = cur.next; this.size--; }
    }
    toArray() {
        const out = [];
        let n = this.head;
        while (n) { out.push(n.val); n = n.next; }
        return out;
    }
}
let list=null;
function renderLinkedListVisualizer(viz, controls) {
    list = new LinkedList();
    [10, 20, 30].forEach(v => list.push(v));
    const title = el('h2', {}, 'Linked List');
    const row = el('div', { className: 'viz-row', id: 'list-row' });
    const form = el('div', {},
        el('input', { id: 'list-val', placeholder: 'Value', type: 'number' }),
        el('input', { id: 'list-idx', placeholder: 'Index', type: 'number', min: 0 }),
        el('button', {
            className: 'btn',
            onclick: () => {
                const v = Number(qs('#list-val').value);
                const i = Number(qs('#list-idx').value);
                if (Number.isNaN(v)) return;
                if (Number.isNaN(i)) { list.push(v); highlightPseudo('push2'); }
                else { list.insertAt(v, i); highlightPseudo('ins2'); }
                updateListViz();
            }
        }, 'Insert/Push'),
        el('button', { className: 'btn', onclick: () => { const i = Number(qs('#list-idx').value); if (!Number.isNaN(i)) { list.removeAt(i); updateListViz(); } } }, 'Remove At'),
        el('button', { className: 'btn', onclick: () => { list = new LinkedList(); updateListViz(); } }, 'Clear')
    );
    viz.append(title, row);
    controls.append(el('h3', {}, 'Linked List Controls'), form);
    updateListViz();
    setPseudocode([
        { text: 'class Node(v,next)', id: 'n1' },
        { text: 'push(v): traverse tail', id: 'push1' },
        { text: ' tail.next=new Node', id: 'push2' },
        { text: 'insertAt(i): find i-1', id: 'ins1' },
        { text: ' link new node', id: 'ins2' }
    ]);
}
function updateListViz() {
    const row = qs('#list-row');
    row.innerHTML = '';
    let n = list.head;
    while (n) {
        row.append(el('div', { className: 'node' }, el('span', { className: 'val' }, n.val)));
        if (n.next) row.append(el('div', { className: 'arrow' }));
        n = n.next;
    }
}

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

// ============ Stack ============
let stack = [];
function renderStackVisualizer(viz, controls) {
    stack = [1, 2, 3];
    const title = el('h2', {}, 'Stack');
    const col = el('div', { id: 'stack-col' });
    const form = el('div', {},
        el('input', { id: 'stack-val', placeholder: 'Value', type: 'number' }),
        el('button', {
            className: 'btn',
            onclick: () => {
                const v = Number(qs('#stack-val').value);
                if (!Number.isNaN(v)) { stack.push(v); updateStack(); highlightPseudo('push'); }
            }
        }, 'Push'),
        el('button', {
            className: 'btn',
            onclick: () => { stack.pop(); updateStack(); highlightPseudo('pop'); }
        }, 'Pop'),
        el('button', { className: 'btn', onclick: () => { stack = []; updateStack(); } }, 'Clear')
    );
    viz.append(title, col);
    controls.append(el('h3', {}, 'Stack Controls'), form);
    updateStack();
    setPseudocode([
        { text: 'push(x): add top', id: 'push' },
        { text: 'pop(): remove top', id: 'pop' }
    ]);
}
function updateStack() {
    const col = qs('#stack-col');
    col.innerHTML = '';
    const items = stack.slice().reverse();
    const row = el('div', { className: 'viz-row' });
    items.forEach(v => row.append(el('div', { className: 'cell' }, v)));
    col.append(row);
}

// ============ Queue ============
let queue = [];
function renderQueueVisualizer(viz, controls) {
    queue = [5, 6, 7];
    const title = el('h2', {}, 'Queue');
    const row = el('div', { id: 'queue-row', className: 'viz-row' });
    const form = el('div', {},
        el('input', { id: 'queue-val', placeholder: 'Value', type: 'number' }),
        el('button', {
            className: 'btn',
            onclick: () => { const v = Number(qs('#queue-val').value); if (!Number.isNaN(v)) { queue.push(v); updateQueue(); highlightPseudo('enq'); } }
        }, 'Enqueue'),
        el('button', {
            className: 'btn',
            onclick: () => { queue.shift(); updateQueue(); highlightPseudo('deq'); }
        }, 'Dequeue'),
        el('button', { className: 'btn', onclick: () => { queue = []; updateQueue(); } }, 'Clear')
    );
    viz.append(title, row);
    controls.append(el('h3', {}, 'Queue Controls'), form);
    updateQueue();
    setPseudocode([
        { text: 'enqueue(x): add rear', id: 'enq' },
        { text: 'dequeue(): remove front', id: 'deq' }
    ]);
}
function updateQueue() {
    const row = qs('#queue-row');
    row.innerHTML = '';
    queue.forEach(v => row.append(el('div', { className: 'cell' }, v)));
}

// ============ Binary Search Tree ============
class BSTNode { constructor(v) { this.v = v; this.l = null; this.r = null; } }
class BST {
    constructor() { this.root = null; }
    insert(v) { this.root = this._ins(this.root, v); }
    _ins(n, v) {
        if (!n) return new BSTNode(v);
        if (v < n.v) n.l = this._ins(n.l, v); else n.r = this._ins(n.r, v);
        return n;
    }
    remove(v) { this.root = this._rem(this.root, v); }
    _rem(n, v) {
        if (!n) return null;
        if (v < n.v) { n.l = this._rem(n.l, v); return n; }
        if (v > n.v) { n.r = this._rem(n.r, v); return n; }
        // Node found
        if (!n.l) return n.r;
        if (!n.r) return n.l;
        let succ = n.r;
        while (succ.l) succ = succ.l;
        n.v = succ.v;
        n.r = this._rem(n.r, succ.v);
        return n;
    }
}
let bst=null;
function renderTreeVisualizer(viz, controls) {
    bst = new BST();
    [8, 3, 10, 1, 6, 14, 4, 7, 13].forEach(v => bst.insert(v));
    const title = el('h2', {}, 'Binary Search Tree');
    const treeDiv = el('div', { id: 'tree', className: 'tree' });
    const form = el('div', {},
        el('input', { id: 'bst-val', placeholder: 'Value', type: 'number' }),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#bst-val').value); if (!Number.isNaN(v)) { bst.insert(v); drawTree(); highlightPseudo('ins2'); } } }, 'Insert'),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#bst-val').value); if (!Number.isNaN(v)) { bst.remove(v); drawTree(); highlightPseudo('rem'); } } }, 'Remove'),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#bst-val').value); if (!Number.isNaN(v)) { highlightSearchPath(v); } } }, 'Search')
    );
    viz.append(title, treeDiv);
    controls.append(el('h3', {}, 'Tree Controls'), form);
    drawTree();
    setPseudocode([
        { text: 'insert(x):', id: 'ins' },
        { text: ' if empty root=x', id: 'ins2' },
        { text: ' else recurse left/right', id: 'ins3' },
        { text: 'remove(x): find node', id: 'rem' },
        { text: ' replace w successor', id: 'rem2' }
    ]);
}
function treeLevels(root) {
    const levels = [];
    if (!root) return levels;
    let q = [root];
    while (q.length) {
        const sz = q.length;
        const lvl = [];
        for (let i = 0; i < sz; i++) {
            const n = q.shift();
            lvl.push(n);
            if (n) { q.push(n.l); q.push(n.r); }
        }
        if (lvl.some(x => x)) levels.push(lvl); else break;
    }
    return levels;
}
function drawTree() {
    const t = qs('#tree');
    t.innerHTML = '';
    const lvls = treeLevels(bst.root);
    lvls.forEach(lvl => {
        const row = el('div', { className: 'tree-level' });
        lvl.forEach(n => { row.append(el('div', { className: 'tree-node' }, n ? n.v : '')); });
        t.append(row);
    });
}
function highlightSearchPath(val) {
    const nodes = [];
    let n = bst.root;
    while (n) {
        nodes.push(n.v);
        if (val === n.v) break;
        n = val < n.v ? n.l : n.r;
    }
    qsa('#tree .tree-node').forEach(td => td.classList.remove('active'));
    nodes.forEach(v => {
        const cell = Array.from(qsa('#tree .tree-node')).find(c => c.textContent == v);
        if (cell) cell.classList.add('active');
    });
}

// ============ Graph (BFS/DFS/Dijkstra) ============
let graphState = null;
function renderGraphVisualizer(viz, controls) {
    const title = el('h2', {}, 'Graph (BFS / DFS / Dijkstra)');
    const canvas = el('div', { className: 'graph-canvas', id: 'graph-canvas' });
    const form = el('div', {},
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
    viz.append(title, canvas);
    controls.append(el('h3', {}, 'Graph Controls'), form);
    graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), pendingEdge: null, lastDijkstra: null };
    setPseudocode([
        { text: 'BFS(start): queue', id: 'bfs1' },
        { text: 'while queue:', id: 'bfs3' },
        { text: ' dequeue u', id: 'bfs4' },
        { text: ' for v in adj[u]', id: 'bfs5' },
        { text: 'Dijkstra(start):', id: 'd0' },
        { text: ' dist[start]=0', id: 'd1' },
        { text: ' while PQ:', id: 'd2' },
        { text: ' extract-min u', id: 'd3' },
        { text: ' relax edges', id: 'd4' }
    ]);
}
function createVertex() {
    const c = qs('#graph-canvas');
    const id = graphState.nextId++;
    const x = Math.random() * (c.clientWidth - 40) + 4;
    const y = Math.random() * (c.clientHeight - 40) + 4;
    const v = el('div', { className: 'vertex', style: { left: `${x}px`, top: `${y}px` }, dataset: { id: String(id) } }, id);
    v.addEventListener('mousedown', startDragVertex);
    v.addEventListener('click', () => { if (graphState.pendingEdge) { edgeSelectionClick(v); } else { v.classList.toggle('active'); } });
    c.append(v);
    graphState.vertices.push({ id, el: v });
    graphState.adj.set(id, new Set());
}
function startDragVertex(e) {
    const target = e.currentTarget;
    const startX = e.clientX, startY = e.clientY;
    const rect = target.getBoundingClientRect();
    const offX = startX - rect.left, offY = startY - rect.top;
    function move(ev) {
        const canvas = qs('#graph-canvas');
        const cRect = canvas.getBoundingClientRect();
        let nx = ev.clientX - offX - cRect.left;
        let ny = ev.clientY - offY - cRect.top;
        nx = Math.max(0, Math.min(cRect.width - 32, nx));
        ny = Math.max(0, Math.min(cRect.height - 32, ny));
        target.style.left = nx + 'px';
        target.style.top = ny + 'px';
        updateEdgePositions();
    }
    function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
}
function createRandomEdge() {
    if (graphState.vertices.length < 2) return;
    const ids = graphState.vertices.map(v => v.id);
    let a = ids[Math.floor(Math.random() * ids.length)], b = a;
    while (b === a) b = ids[Math.floor(Math.random() * ids.length)];
    addEdge(a, b);
}
function pendingEdgeSelectionStart() { graphState.pendingEdge = { a: null }; }
function edgeSelectionClick(v) {
    if (graphState.pendingEdge.a == null) {
        graphState.pendingEdge.a = Number(v.dataset.id);
        v.classList.add('active');
    } else {
        const a = graphState.pendingEdge.a;
        const b = Number(v.dataset.id);
        if (a !== b) {
            const w = Number(prompt('Weight?', '1')) || 1;
            addEdge(a, b, w);
        }
        graphState.pendingEdge = null;
        qsa('.vertex').forEach(vx => vx.classList.remove('active'));
    }
}
function edgeKey(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }
function addEdge(a, b, w = 1) {
    if (graphState.adj.get(a)?.has(b)) return;
    graphState.adj.get(a).add(b);
    graphState.adj.get(b).add(a);
    if (w !== 1) graphState.weights.set(edgeKey(a, b), w);
    const c = qs('#graph-canvas');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('edge');
    Object.assign(svg.style, { left: '0', top: '0', width: '100%', height: '100%' });
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.dataset.a = a; l.dataset.b = b;
    l.setAttribute('stroke', '#2a3142');
    l.setAttribute('stroke-width', '2');
    svg.appendChild(l);
    if (w !== 1) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('fill', '#4cc9f0');
        label.setAttribute('font-size', '10');
        label.dataset.type = 'weight';
        svg.appendChild(label);
    }
    c.appendChild(svg);
    graphState.edges.push({ a, b, el: svg });
    updateEdgePositions();
}
function updateEdgePositions() {
    const c = qs('#graph-canvas').getBoundingClientRect();
    graphState.edges.forEach(e => {
        const va = graphState.vertices.find(v => v.id === e.a).el.getBoundingClientRect();
        const vb = graphState.vertices.find(v => v.id === e.b).el.getBoundingClientRect();
        const line = e.el.querySelector('line');
        const x1 = va.left - c.left + 16, y1 = va.top - c.top + 16, x2 = vb.left - c.left + 16, y2 = vb.top - c.top + 16;
        line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        const label = e.el.querySelector('text[data-type="weight"]');
        if (label) {
            label.setAttribute('x', (x1 + x2) / 2);
            label.setAttribute('y', (y1 + y2) / 2 - 4);
            label.textContent = graphState.weights.get(edgeKey(e.a, e.b));
        }
    });
}
window.addEventListener('resize', () => updateEdgePositions());
function clearGraphHighlights() { qsa('.vertex').forEach(v => v.classList.remove('active')); qsa('#graph-canvas .distance-label').forEach(l => l.remove()); }
function activateVertex(id) { const v = graphState.vertices.find(v => v.id === id); if (v) v.el.classList.add('active'); }
function updateGraphDistance(id, dist) {
    let lbl = document.getElementById('dist-' + id);
    if (!lbl) { lbl = el('div', { id: 'dist-' + id, className: 'distance-label' }); qs('#graph-canvas').append(lbl); }
    const vert = graphState.vertices.find(v => v.id === id);
    if (vert) {
        const r = vert.el.getBoundingClientRect();
        const cr = qs('#graph-canvas').getBoundingClientRect();
        lbl.style.left = (r.left - cr.left) + 'px';
        lbl.style.top = (r.top - cr.top - 14) + 'px';
        lbl.textContent = dist;
    }
}
async function runBFS() {
    const start = Number(qs('#start-vertex').value); if (Number.isNaN(start)) return;
    const visited = new Set(); const queueLocal = [start];
    while (queueLocal.length) {
        const u = queueLocal.shift();
        if (visited.has(u)) continue;
        visited.add(u);
        activateVertex(u);
        await wait(animSpeed[speed]);
        for (const v of (graphState.adj.get(u) || [])) if (!visited.has(v)) queueLocal.push(v);
    }
}
async function runDFS() {
    const start = Number(qs('#start-vertex').value); if (Number.isNaN(start)) return;
    const visited = new Set();
    async function dfs(u) {
        if (visited.has(u)) return;
        visited.add(u);
        activateVertex(u);
        await wait(animSpeed[speed]);
        for (const v of (graphState.adj.get(u) || [])) await dfs(v);
    }
    await dfs(start);
}
async function runDijkstra() {
    const start = Number(qs('#start-vertex').value); if (Number.isNaN(start)) return;
    const dist = new Map(), prev = new Map();
    const pq = [];
    function push(node, d) { pq.push({ node, d }); pq.sort((a, b) => a.d - b.d); }
    graphState.vertices.forEach(v => { dist.set(v.id, Infinity); prev.set(v.id, null); });
    dist.set(start, 0); push(start, 0);
    while (pq.length) {
        const { node, d } = pq.shift();
        if (d !== dist.get(node)) continue;
        activateVertex(node);
        updateGraphDistance(node, d);
        await wait(animSpeed[speed]);
        (graphState.adj.get(node) || []).forEach(n => {
            const w = graphState.weights.get(edgeKey(node, n)) || 1;
            const nd = d + w;
            if (nd < dist.get(n)) { dist.set(n, nd); prev.set(n, node); push(n, nd); }
        });
    }
    graphState.lastDijkstra = { dist, prev, start };
}
function highlightShortestPath() {
    if (!graphState?.lastDijkstra) return;
    const target = prompt('Target vertex id for path?');
    if (target == null) return;
    const tId = Number(target); if (Number.isNaN(tId)) return;
    const { prev, start } = graphState.lastDijkstra;
    const path = [];
    let cur = tId;
    while (cur != null) { path.push(cur); if (cur === start) break; cur = prev.get(cur); }
    if (path[path.length - 1] !== start) { alert('No path'); return; }
    path.reverse();
    qsa('.vertex').forEach(v => v.classList.remove('active'));
    path.forEach(id => activateVertex(id));
}
function generateRandomGraph() { // reset
    const canvas = qs('#graph-canvas'); if (!canvas) return;
    graphState.vertices.forEach(v => v.el.remove());
    graphState.edges.forEach(e => e.el.remove());
    graphState = { nextId: 0, vertices: [], edges: [], adj: new Map(), weights: new Map(), pendingEdge: null, lastDijkstra: null };
    for (let i = 0; i < 5; i++) createVertex();
    for (let i = 0; i < 6; i++) createRandomEdge();
    graphState.edges.forEach(e => { if (Math.random() < 0.6) { const w = Math.floor(Math.random() * 9) + 1; graphState.weights.set(edgeKey(e.a, e.b), w); } });
    updateEdgePositions();
}

// ============ Sorting (Step Engine) ============
let baseArray = []; // current working array for drawing
function renderSortingVisualizer(viz, controls) {
    baseArray = Array.from({ length: 18 }, () => Math.floor(Math.random() * 90) + 10);
    const title = el('h2', {}, 'Sorting Algorithms');
    const bars = el('div', { id: 'bars', className: 'bar-container' });
    const form = el('div', {},
        el('button', { className: 'btn', onclick: shuffleBars }, 'Shuffle'),
        el('label', { style: { marginLeft: '.5rem' } }, 'Size:'),
        (() => {
            const inp = el('input', { id: 'sort-size', type: 'number', min: 4, max: 120, value: 18, style: { width: '70px' } });
            inp.addEventListener('change', () => {
                let n = Number(inp.value);
                if (Number.isNaN(n) || n < 4) n = 18;
                if (n > 120) n = 120;
                inp.value = n;
                baseArray = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);
                drawBars();
                resetStepEngine();
            });
            return inp;
        })(),
        el('select', { id: 'algo' },
            el('option', { value: 'bubble' }, 'Bubble'),
            el('option', { value: 'insertion' }, 'Insertion'),
            el('option', { value: 'merge' }, 'Merge'),
            el('option', { value: 'quick' }, 'Quick')
        ),
        el('button', { className: 'btn primary', onclick: startSort }, 'Generate Steps')
    );
    viz.append(title, bars);
    controls.append(el('h3', {}, 'Sorting Controls'), form);
    drawBars();
    setPseudocode([
        { text: 'for i=0..n-1', id: 'loop_i' },
        { text: '  for j=0..n-2-i', id: 'loop_j' },
        { text: '    if A[j]>A[j+1] swap', id: 'cond_swap' },
        { text: 'mark sorted tail', id: 'mark' }
    ]);
}
function drawBars(reset) {
    const bars = qs('#bars');
    bars.innerHTML = '';
    const max = Math.max(...baseArray, 100);
    baseArray.forEach((v, i) => bars.append(el('div', { className: 'bar', style: { height: `${(v / max) * 240 + 10}px` }, dataset: { i } })));
    if (!reset) qsa('.bar').forEach(b => b.classList.remove('sorted', 'active'));
}
function shuffleBars() { resetStepEngine(); const sizeInput = qs('#sort-size'); const n = sizeInput ? Number(sizeInput.value) : 18; baseArray = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10); drawBars(); }
function highlightBars(i, j) { qsa('.bar').forEach(b => b.classList.remove('active')); qs(`.bar[data-i='${i}']`)?.classList.add('active'); qs(`.bar[data-i='${j}']`)?.classList.add('active'); }
function swapBars(i, j) { [baseArray[i], baseArray[j]] = [baseArray[j], baseArray[i]]; drawBars(true); highlightBars(i, j); }
function markBarSorted(i) { const b = qs(`.bar[data-i='${i}']`); if (b) b.classList.add('sorted'); }
function startSort() {
    resetStepEngine();
    const algo = qs('#algo').value;
    const original = [...baseArray];
    switch (algo) {
        case 'bubble': genBubbleSteps(); break;
        case 'insertion': genInsertionSteps(); break;
        case 'merge': genMergeSteps(); break;
        case 'quick': genQuickSteps(); break;
    }
    baseArray = [...original];
    drawBars();
    highlightPseudo('loop_i');
    togglePlayButton(false, false);
}
function genBubbleSteps() {
    const arr = [...baseArray];
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
            appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'loop_j' });
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'cond_swap' });
            }
        }
        appState.steps.push({ type: 'mark-sorted', i: n - 1 - i, pc: 'mark' });
    }
}
function genInsertionSteps() {
    const arr = [...baseArray];
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) {
            appState.steps.push({ type: 'compare', i: j, j: j + 1, pc: 'loop_j' });
            arr[j + 1] = arr[j];
            appState.steps.push({ type: 'swap', i: j, j: j + 1, pc: 'cond_swap' });
            j--;
        }
        arr[j + 1] = key;
    }
    for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}
function genMergeSteps() {
    const arr = [...baseArray];
    function merge(l, r) {
        if (r - l <= 0) return;
        const m = Math.floor((l + r) / 2);
        merge(l, m); merge(m + 1, r);
        const tmp = [];
        let i = l, j = m + 1;
        while (i <= m && j <= r) {
            appState.steps.push({ type: 'compare', i, j, pc: 'loop_j' });
            if (arr[i] <= arr[j]) tmp.push(arr[i++]); else tmp.push(arr[j++]);
        }
        while (i <= m) tmp.push(arr[i++]);
        while (j <= r) tmp.push(arr[j++]);
        for (let k = l; k <= r; k++) {
            const newVal = tmp[k - l];
            if (arr[k] !== newVal) {
                arr[k] = newVal;
                // record a write step (overwrite index k with value newVal)
                appState.steps.push({ type: 'write', i: k, value: newVal, pc: 'cond_swap' });
            }
        }
    }
    merge(0, arr.length - 1);
    for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}
function genQuickSteps() {
    const arr = [...baseArray];
    function qsRec(l, r) {
        if (l >= r) return;
        let i = l, j = r, p = arr[Math.floor((l + r) / 2)];
        while (i <= j) {
            while (arr[i] < p) { appState.steps.push({ type: 'compare', i, j: i, pc: 'loop_j' }); i++; }
            while (arr[j] > p) { appState.steps.push({ type: 'compare', i: j, j, pc: 'loop_j' }); j--; }
            if (i <= j) {
                if (i !== j) { [arr[i], arr[j]] = [arr[j], arr[i]]; appState.steps.push({ type: 'swap', i, j, pc: 'cond_swap' }); }
                i++; j--;
            }
        }
        qsRec(l, j); qsRec(i, r);
    }
    qsRec(0, arr.length - 1);
    for (let i = 0; i < arr.length; i++) appState.steps.push({ type: 'mark-sorted', i });
}

// ==== Additional Visualizers (AVL, Red-Black, Hash Table) ====
class AVLNode { constructor(v) { this.v = v; this.l = null; this.r = null; this.h = 1; } }
class AVL {
    constructor() { this.root = null; }
    height(n) { return n ? n.h : 0; }
    update(n) { n.h = 1 + Math.max(this.height(n.l), this.height(n.r)); return n; }
    balance(n) { return n ? this.height(n.l) - this.height(n.r) : 0; }
    rotRight(y) { const x = y.l; const T2 = x.r; x.r = y; y.l = T2; this.update(y); this.update(x); return x; }
    rotLeft(x) { const y = x.r; const T2 = y.l; y.l = x; x.r = T2; this.update(x); this.update(y); return y; }
    insert(v) { this.root = this._ins(this.root, v); }
    _ins(n, v) {
        if (!n) return new AVLNode(v);
        if (v < n.v) n.l = this._ins(n.l, v); else if (v > n.v) n.r = this._ins(n.r, v); else return n;
        this.update(n);
        const b = this.balance(n);
        if (b > 1 && v < n.l.v) return this.rotRight(n);
        if (b < -1 && v > n.r.v) return this.rotLeft(n);
        if (b > 1 && v > n.l.v) { n.l = this.rotLeft(n.l); return this.rotRight(n); }
        if (b < -1 && v < n.r.v) { n.r = this.rotRight(n.r); return this.rotLeft(n); }
        return n;
    }
}
let avl=null;
function renderAVLVisualizer(viz, controls) {
    avl = new AVL();
    [30, 10, 40, 5, 20, 35, 50, 25].forEach(v => avl.insert(v));
    const title = el('h2', {}, 'AVL Tree');
    const treeDiv = el('div', { id: 'avl-tree', className: 'tree' });
    const form = el('div', {},
        el('input', { id: 'avl-val', placeholder: 'Value', type: 'number' }),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#avl-val').value); if (!Number.isNaN(v)) { avl.insert(v); drawAVL(); } } }, 'Insert'),
        el('button', { className: 'btn', onclick: () => { avl = new AVL(); drawAVL(); } }, 'Reset')
    );
    viz.append(title, treeDiv);
    controls.append(el('h3', {}, 'AVL Controls'), form);
    drawAVL();
    setPseudocode([
        { text: 'insert(x): BST insert', id: 'a1' },
        { text: 'update heights', id: 'a2' },
        { text: 'check balance', id: 'a3' },
        { text: 'rotate if |b|>1', id: 'a4' }
    ]);
}
function avlLevels(root) {
    const levels = [];
    if (!root) return levels;
    let q = [root];
    while (q.length) {
        const sz = q.length;
        const lvl = [];
        for (let i = 0; i < sz; i++) {
            const n = q.shift();
            lvl.push(n);
            if (n) { q.push(n.l); q.push(n.r); }
        }
        if (lvl.some(x => x)) levels.push(lvl); else break;
    }
    return levels;
}
function drawAVL() {
    const t = qs('#avl-tree'); if (!t) return;
    t.innerHTML = '';
    const lvls = avlLevels(avl.root);
    lvls.forEach(lvl => {
        const row = el('div', { className: 'tree-level' });
        lvl.forEach(n => {
            if (!n) row.append(el('div', { className: 'tree-node' }, ''));
            else {
                const bal = (avl.height(n.l) - avl.height(n.r));
                const cls = bal > 1 ? 'balance-pos' : bal < -1 ? 'balance-neg' : '';
                row.append(el('div', { className: `tree-node ${cls}` }, n.v));
            }
        });
        t.append(row);
    });
}
class RBTNode { constructor(v, color = 'red') { this.v = v; this.c = color; this.l = null; this.r = null; this.p = null; } }
class RBT {
    constructor() { this.root = null; }
    rotateLeft(x) { const y = x.r; x.r = y.l; if (y.l) y.l.p = x; y.p = x.p; if (!x.p) this.root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y; y.l = x; x.p = y; }
    rotateRight(y) { const x = y.l; y.l = x.r; if (x.r) x.r.p = y; x.p = y.p; if (!y.p) this.root = x; else if (y === y.p.l) y.p.l = x; else y.p.r = x; x.r = y; y.p = x; }
    insert(v) { let z = new RBTNode(v), y = null, x = this.root; while (x) { y = x; x = z.v < x.v ? x.l : x.r; } z.p = y; if (!y) this.root = z; else if (z.v < y.v) y.l = z; else y.r = z; z.c = 'red'; this.fixInsert(z); }
    fixInsert(z) {
        while (z.p && z.p.c === 'red') {
            if (z.p === z.p.p?.l) {
                const y = z.p.p.r;
                if (y && y.c === 'red') { z.p.c = 'black'; y.c = 'black'; z.p.p.c = 'red'; z = z.p.p; }
                else { if (z === z.p.r) { z = z.p; this.rotateLeft(z); } z.p.c = 'black'; z.p.p.c = 'red'; this.rotateRight(z.p.p); }
            } else {
                const y = z.p.p?.l;
                if (y && y.c === 'red') { z.p.c = 'black'; y.c = 'black'; z.p.p.c = 'red'; z = z.p.p; }
                else { if (z === z.p.l) { z = z.p; this.rotateRight(z); } z.p.c = 'black'; z.p.p.c = 'red'; this.rotateLeft(z.p.p); }
            }
        }
        this.root.c = 'black';
    }
}
let rbt=null;
function renderRBTVisualizer(viz, controls) {
    rbt = new RBT();
    [20, 10, 30, 5, 15, 25, 40, 1, 12, 18].forEach(v => rbt.insert(v));
    const title = el('h2', {}, 'Red-Black Tree');
    const treeDiv = el('div', { id: 'rbt-tree', className: 'tree' });
    const form = el('div', {},
        el('input', { id: 'rbt-val', placeholder: 'Value', type: 'number' }),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#rbt-val').value); if (!Number.isNaN(v)) { rbt.insert(v); drawRBT(); } } }, 'Insert'),
        el('button', { className: 'btn', onclick: () => { rbt = new RBT(); drawRBT(); } }, 'Reset')
    );
    viz.append(title, treeDiv);
    controls.append(el('h3', {}, 'RBT Controls'), form);
    drawRBT();
    setPseudocode([
        { text: 'Insert node (red)', id: 'r1' },
        { text: 'While parent red', id: 'r2' },
        { text: '  Recolor/rotate', id: 'r3' },
        { text: 'Root always black', id: 'r4' }
    ]);
}
function rbtLevels(root) {
    const levels = [];
    if (!root) return levels;
    let q = [root];
    while (q.length) {
        const sz = q.length;
        const lvl = [];
        for (let i = 0; i < sz; i++) {
            const n = q.shift();
            lvl.push(n);
            if (n) { q.push(n.l); q.push(n.r); }
        }
        if (lvl.some(x => x)) levels.push(lvl); else break;
    }
    return levels;
}
function drawRBT() {
    const t = qs('#rbt-tree'); if (!t) return;
    t.innerHTML = '';
    const lvls = rbtLevels(rbt.root);
    lvls.forEach(lvl => {
        const row = el('div', { className: 'tree-level' });
        lvl.forEach(n => {
            if (!n) row.append(el('div', { className: 'tree-node' }, ''));
            else row.append(el('div', { className: `tree-node rbt-${n.c}` }, n.v));
        });
        t.append(row);
    });
}
class HashTableChaining {
    constructor(size = 8) { this.size = size; this.buckets = Array.from({ length: size }, () => []); }
    hash(k) { return k % this.size; }
    insert(k) { const i = this.hash(k); if (!this.buckets[i].includes(k)) this.buckets[i].push(k); }
    remove(k) { const i = this.hash(k); const idx = this.buckets[i].indexOf(k); if (idx > -1) this.buckets[i].splice(idx, 1); }
}
class HashTableOpen {
    constructor(size = 11) { this.size = size; this.slots = Array(this.size).fill(null); }
    hash(k) { return k % this.size; }
    insert(k) { let i = this.hash(k), start = i; while (this.slots[i] != null) { if (this.slots[i] === k) return; i = (i + 1) % this.size; if (i === start) return; } this.slots[i] = k; }
    remove(k) { let i = this.hash(k), start = i; while (this.slots[i] != null) { if (this.slots[i] === k) { this.slots[i] = '*'; return; } i = (i + 1) % this.size; if (i === start) return; } }
}
let hashState = null;
function renderHashTableVisualizer(viz, controls) {
    hashState = { mode: 'chain', table: new HashTableChaining(8) };
    const title = el('h2', {}, 'Hash Table');
    const tableDiv = el('div', { id: 'hash-table', className: 'hash-table' });
    const form = el('div', {},
        el('select', { id: 'hash-mode', onchange: () => { const mode = qs('#hash-mode').value; hashState.mode = mode; hashState.table = mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11); drawHash(); } },
            el('option', { value: 'chain' }, 'Chaining'),
            el('option', { value: 'open' }, 'Open Addressing')
        ),
        el('input', { id: 'hash-val', placeholder: 'Key (int)', type: 'number', style: { marginLeft: '.5rem', width: '90px' } }),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#hash-val').value); if (Number.isNaN(v)) return; hashState.table.insert(v); drawHash(); } }, 'Insert'),
        el('button', { className: 'btn', onclick: () => { const v = Number(qs('#hash-val').value); if (Number.isNaN(v)) return; hashState.table.remove(v); drawHash(); } }, 'Remove'),
        el('button', { className: 'btn', onclick: () => { for (let i = 0; i < 6; i++) { hashState.table.insert(Math.floor(Math.random() * 100)); } drawHash(); } }, 'Random Fill'),
        el('button', { className: 'btn', onclick: () => { hashState.table = hashState.mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11); drawHash(); } }, 'Reset')
    );
    viz.append(title, tableDiv);
    controls.append(el('h3', {}, 'Hash Controls'), form);
    drawHash();
    setPseudocode([
        { text: 'hash(k)=k%size', id: 'h1' },
        { text: 'Chaining: list buckets', id: 'h2' },
        { text: 'Open: linear probe', id: 'h3' }
    ]);
}
function drawHash() {
    const c = qs('#hash-table'); if (!c) return; c.innerHTML = '';
    if (hashState.mode === 'chain') {
        hashState.table.buckets.forEach((bucket, i) => {
            const b = el('div', { className: 'hash-bucket', dataset: { i } }, '');
            const chain = el('div', { className: 'hash-chain' });
            bucket.forEach(k => chain.append(el('div', { className: 'hash-node' }, k)));
            if (!bucket.length) chain.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
            b.append(chain); c.append(b);
        });
    } else {
        hashState.table.slots.forEach((k, i) => {
            const b = el('div', { className: 'hash-bucket', dataset: { i } });
            if (k == null) b.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
            else b.append(el('div', { className: `hash-node ${k === '*' ? 'probe' : ''}` }, k === '*' ? '(del)' : k));
            c.append(b);
        });
    }
}
// End of enhanced script
