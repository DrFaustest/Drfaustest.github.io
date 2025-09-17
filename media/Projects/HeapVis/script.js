/* Heap Visualizer
 - Min/Max binary heap with animated insert, extract, delete, update
 - Array-based representation with SVG layout; nodes have stable IDs for smooth animations
*/
(function(){
  const svg = document.getElementById('heapSvg');
  const arrayBar = document.getElementById('arrayBar');
  const logPanel = document.getElementById('logPanel');

  const heapTypeToggle = document.getElementById('heapTypeToggle');
  const speedRange = document.getElementById('speedRange');
  const speedLabel = document.getElementById('speedLabel');

  const insertValue = document.getElementById('insertValue');
  const insertBtn = document.getElementById('insertBtn');
  const extractBtn = document.getElementById('extractBtn');
  const extractResult = document.getElementById('extractResult');
  const deleteIndex = document.getElementById('deleteIndex');
  const deleteIndexBtn = document.getElementById('deleteIndexBtn');
  const deleteValue = document.getElementById('deleteValue');
  const deleteValueBtn = document.getElementById('deleteValueBtn');
  const updateIndex = document.getElementById('updateIndex');
  const updateValue = document.getElementById('updateValue');
  const updateBtn = document.getElementById('updateBtn');
  const arrayInput = document.getElementById('arrayInput');
  const buildBtn = document.getElementById('buildBtn');
  const randomBtn = document.getElementById('randomBtn');
  const clearBtn = document.getElementById('clearBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const stepBtn = document.getElementById('stepBtn');

  // State: heap is array of nodes { id:number, val:number }
  let heap = [];
  let isMax = false; // checkbox unchecked => Min heap
  let animSpeed = 1; // 1x
  let isPlaying = true;
  let stepQueue = [];
  let awaitingStep = false;
  let nextId = 1; // stable ids for nodes

  // Keep stable SVG node elements for smooth animations
  const nodeEls = Object.create(null); // id -> <g>

  const nodesLayer = createSvgGroup('nodes');
  const edgesLayer = createSvgGroup('edges');
  svg.appendChild(edgesLayer);
  svg.appendChild(nodesLayer);

  function createSvgGroup(cls){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class', cls);
    return g;
  }

  function log(msg){
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = msg;
    logPanel.appendChild(div);
    logPanel.scrollTop = logPanel.scrollHeight;
  }
  function clearLog(){ logPanel.innerHTML = ''; }

  function comparator(a,b){ return isMax ? a > b : a < b; }

  function parent(i){ return Math.floor((i-1)/2); }
  function left(i){ return 2*i+1; }
  function right(i){ return 2*i+2; }

  function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }
  function animDelay(base=450){ return base / animSpeed; }

  // Step control
  function enqueue(step){ stepQueue.push(step); }
  async function runQueue(){
    if(!isPlaying) return; // paused
    while(stepQueue.length){
      if(!isPlaying){ awaitingStep = true; return; }
      const step = stepQueue.shift();
      await step();
    }
  }
  function requestRun(){
    if(isPlaying) runQueue();
  }

  // Layout calculation
  function computeLayout(){
    const count = heap.length;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const levels = Math.ceil(Math.log2(count+1));
    const levelHeight = Math.max(70, height / Math.max(1, levels+0.5));
    const positions = [];
    const radius = 20;
    for(let i=0;i<count;i++){
      const depth = Math.floor(Math.log2(i+1));
      const levelIndexStart = (1<<depth)-1;
      const levelCount = Math.min(1<<depth, count - levelIndexStart);
      const posInLevel = i - levelIndexStart;
      const y = 40 + depth*levelHeight;
      const padding = 24;
      const usableW = Math.max(padding*2 + radius*2, width - padding*2);
      const stepX = levelCount>1 ? usableW/(levelCount-1) : 0;
      const x = padding + (levelCount>1 ? posInLevel*stepX : usableW/2);
      positions.push({x,y,r:radius});
    }
    return positions;
  }

  // Draw
  function render(){
    // edges
    edgesLayer.innerHTML = '';
    const pos = computeLayout();
    for(let i=0;i<heap.length;i++){
      const l = left(i), r = right(i);
      if(l < heap.length) edgesLayer.appendChild(edgeLine(pos[i], pos[l]));
      if(r < heap.length) edgesLayer.appendChild(edgeLine(pos[i], pos[r]));
    }
    // nodes: preserve DOM elements, update transform and labels
    const seen = new Set();
    for(let i=0;i<heap.length;i++){
      const node = heap[i]; // {id, val}
      seen.add(node.id);
      let g = nodeEls[node.id];
      if(!g){
        g = createNodeGroup(node.id, node.val);
        nodeEls[node.id] = g;
        nodesLayer.appendChild(g);
      }
      const t = g.querySelector('text');
      if(t && t.textContent !== String(node.val)) t.textContent = String(node.val);
      g.setAttribute('transform', `translate(${pos[i].x},${pos[i].y})`);
      if(i===0) g.classList.add('root'); else g.classList.remove('root');
      g.dataset.index = String(i);
    }
    // remove any nodes no longer in heap
    Object.keys(nodeEls).forEach(idStr=>{
      const id = Number(idStr);
      if(!seen.has(id)){
        const el = nodeEls[id];
        if(el && el.parentNode) el.parentNode.removeChild(el);
        delete nodeEls[id];
      }
    });
    renderArrayBar();
  }

  function edgeLine(p1,p2){
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y2', p2.y);
    return line;
  }

  function createNodeGroup(id, val){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class', 'node');
    g.dataset.id = String(id);
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('r', 20);
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('text-anchor','middle');
    t.setAttribute('dominant-baseline','central');
    t.textContent = String(val);
    g.appendChild(c); g.appendChild(t);
    g.addEventListener('click', ()=>{
      const idx = heap.findIndex(n=>n.id===id);
      if(idx>=0) highlightIndex(idx);
    });
    return g;
  }

  function renderArrayBar(){
    arrayBar.innerHTML = '';
    heap.forEach((n,i)=>{
      const item = document.createElement('div');
      item.className = 'array-item';
      item.innerHTML = `<span class="idx">${i}</span><span>${n.val}</span>`;
      arrayBar.appendChild(item);
    });
  }

  function highlightIndex(i){
    // highlight node and array item briefly
    const node = heap[i];
    const g = node ? nodeEls[node.id] : null;
    if(g){
      g.classList.add('highlight');
      setTimeout(()=>g.classList.remove('highlight'), 550/animSpeed);
    }
    const arrItem = arrayBar.children[i];
    if(arrItem){
      arrItem.classList.add('highlight');
      setTimeout(()=>arrItem.classList.remove('highlight'), 550/animSpeed);
    }
  }

  // Animations helpers
  async function animateSwap(i,j){
    const idI = heap[i]?.id, idJ = heap[j]?.id;
    if(idI && nodeEls[idI]) nodeEls[idI].classList.add('swap');
    if(idJ && nodeEls[idJ]) nodeEls[idJ].classList.add('swap');
    await sleep(120/animSpeed);
    [heap[i], heap[j]] = [heap[j], heap[i]];
    render();
    await sleep(animDelay());
    if(idI && nodeEls[idI]) nodeEls[idI].classList.remove('swap');
    if(idJ && nodeEls[idJ]) nodeEls[idJ].classList.remove('swap');
  }

  async function animateMove(){
    render();
    await sleep(animDelay());
  }

  // Heap core operations producing animated steps
  async function heapifyUp(i){
    while(i>0){
      const p = parent(i);
      if(comparator(heap[i].val, heap[p].val)){
        log(`Swap <span class="k">${heap[i].val}</span> with parent <span class="k">${heap[p].val}</span>`);
        await animateSwap(i,p);
        i = p;
      } else break;
    }
  }
  async function heapifyDown(i){
    const n = heap.length;
    while(true){
      const l = left(i), r = right(i);
      let best = i;
      if(l < n && comparator(heap[l].val, heap[best].val)) best = l;
      if(r < n && comparator(heap[r].val, heap[best].val)) best = r;
      if(best !== i){
        log(`Swap <span class="k">${heap[i].val}</span> with child <span class="k">${heap[best].val}</span>`);
        await animateSwap(i,best);
        i = best;
      } else break;
    }
  }

  // Public operations
  function insert(val){
    enqueue(async ()=>{
      log(`Insert <span class="k">${val}</span>`);
      heap.push({id: nextId++, val});
      await animateMove();
      await heapifyUp(heap.length-1);
      render();
    });
    requestRun();
  }

  function extractRoot(){
    enqueue(async ()=>{
      if(heap.length===0){ log(`<span class="warn">Heap is empty</span>`); return; }
      const root = heap[0].val;
      log(`Extract root <span class="k">${root}</span>`);
      const last = heap.pop();
      if(heap.length>0){
        heap[0] = last;
        await animateMove();
        await heapifyDown(0);
      }
      render();
      extractResult.textContent = `→ ${root}`;
    });
    requestRun();
  }

  function deleteAtIndex(idx){
    enqueue(async ()=>{
      if(idx<0 || idx>=heap.length){ log(`<span class="warn">Index ${idx} out of bounds</span>`); return; }
      log(`Delete index <span class="i">${idx}</span> (value <span class="k">${heap[idx].val}</span>)`);
      const last = heap.pop();
      if(idx < heap.length){
        const oldVal = heap[idx].val;
        heap[idx] = last;
        await animateMove();
        // choose up or down based on relation
        if(comparator(heap[idx].val, oldVal)) await heapifyUp(idx); else await heapifyDown(idx);
      }
      render();
    });
    requestRun();
  }

  function deleteByValue(val){
    enqueue(async ()=>{
      const idx = heap.findIndex(n=>n.val===val);
      if(idx === -1){ log(`<span class="warn">Value ${val} not found</span>`); return; }
      log(`Delete value <span class="k">${val}</span> at index <span class="i">${idx}</span>`);
      const last = heap.pop();
      if(idx < heap.length){
        const oldVal = heap[idx].val;
        heap[idx] = last;
        await animateMove();
        if(comparator(heap[idx].val, oldVal)) await heapifyUp(idx); else await heapifyDown(idx);
      }
      render();
    });
    requestRun();
  }

  function updateKey(idx, newVal){
    enqueue(async ()=>{
      if(idx<0 || idx>=heap.length){ log(`<span class="warn">Index ${idx} out of bounds</span>`); return; }
      const oldVal = heap[idx].val;
      heap[idx].val = newVal;
      log(`Update index <span class="i">${idx}</span> from <span class="k">${oldVal}</span> to <span class="k">${newVal}</span>`);
      await animateMove();
      if(comparator(heap[idx].val, oldVal)) await heapifyUp(idx); else await heapifyDown(idx);
      render();
    });
    requestRun();
  }

  function buildFromArray(arr){
    enqueue(async ()=>{
      heap = arr.map(v=>({id: nextId++, val: v}));
      log(`Build heap from array [${arr.join(', ')}]`);
      await animateMove();
      // heapify bottom-up
      for(let i=Math.floor(heap.length/2)-1;i>=0;i--){
        await heapifyDown(i);
      }
      render();
    });
    requestRun();
  }

  function clearHeap(){
    enqueue(async ()=>{
      heap = [];
      extractResult.textContent = '';
      clearLog();
      render();
    });
    requestRun();
  }

  // UI wiring
  heapTypeToggle.addEventListener('change', ()=>{
    isMax = heapTypeToggle.checked;
    log(`Mode: <span class="k">${isMax?'Max Heap':'Min Heap'}</span>`);
    // Rebuild to ensure property using current values
    buildFromArray(heap.map(n=>n.val));
  });
  speedRange.addEventListener('input', ()=>{
    animSpeed = Number(speedRange.value);
    speedLabel.textContent = `${animSpeed.toFixed(2).replace(/\.00$/,'.0').replace(/0$/,'')}x`;
  });

  insertBtn.addEventListener('click',()=>{
    const v = Number(insertValue.value);
    if(Number.isFinite(v)) insert(v);
    insertValue.value = '';
    insertValue.focus();
  });
  insertValue.addEventListener('keyup',(e)=>{ if(e.key==='Enter') insertBtn.click(); });

  extractBtn.addEventListener('click', extractRoot);

  deleteIndexBtn.addEventListener('click', ()=>{
    const idx = Number(deleteIndex.value);
    if(Number.isInteger(idx)) deleteAtIndex(idx);
    deleteIndex.value = '';
  });
  deleteValueBtn.addEventListener('click', ()=>{
    const v = Number(deleteValue.value);
    if(Number.isFinite(v)) deleteByValue(v);
    deleteValue.value='';
  });

  updateBtn.addEventListener('click', ()=>{
    const idx = Number(updateIndex.value);
    const nv = Number(updateValue.value);
    if(Number.isInteger(idx) && Number.isFinite(nv)) updateKey(idx,nv);
  });

  buildBtn.addEventListener('click', ()=>{
    const parts = arrayInput.value.split(/[\,\s]+/).filter(Boolean).map(Number);
    const valid = parts.filter(v=>Number.isFinite(v));
    buildFromArray(valid);
  });

  randomBtn.addEventListener('click', ()=>{
    const n = 7 + Math.floor(Math.random()*7);
    const arr = Array.from({length:n}, ()=>Math.floor(Math.random()*50));
    arrayInput.value = arr.join(', ');
    buildFromArray(arr);
  });

  clearBtn.addEventListener('click', clearHeap);

  playPauseBtn.addEventListener('click', ()=>{
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
    if(isPlaying){ awaitingStep=false; requestRun(); }
  });
  stepBtn.addEventListener('click', async ()=>{
    if(stepQueue.length){
      const step = stepQueue.shift();
      await step();
    }
  });

  // initial
  render();
  log('Ready. Use controls to interact with the heap.');
})();
