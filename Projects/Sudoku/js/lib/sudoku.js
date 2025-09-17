// Sudoku solver (bitmask domains + propagation + MRV search)
// Ported algorithm ideas from media/Projects/Sudoku/sudoku.py
// Exports:
//  - cloneGrid(grid) : deep copy 9x9 numeric grid
//  - solve(grid) -> {solution: 9x9 grid or null}
//  - generate(difficulty) -> {puzzle, solution}
//  - traceSolve(grid, stepCallback) -> runs a trace and calls stepCallback(events)

const ALL = (1<<10) - 2; // bits 1..9 set
const bit = d => (1<<d);
const isSingleton = m => m !== 0 && (m & (m-1)) === 0;
const maskToDigit = m => (m.toString(2).length - 1); // approximate but works for singletons
const maskIter = function*(m){ while(m){ const lsb = m & -m; const d = Math.log2(lsb)|0; yield d; m ^= lsb; } };

function cloneGrid(g){ return g.map(r=>r.slice()); }

// Helpers: convert between grid (9x9 numbers with 0 empties) and domains (array[81] bitmasks)
function gridToDomains(grid){
  const D = new Array(81).fill(ALL);
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const v = grid[r][c]||0;
    const i = r*9+c;
    if(v) D[i] = bit(v);
  }
  return D;
}
function domainsToGrid(D){
  const g = Array.from({length:9}, ()=> Array(9).fill(0));
  for(let i=0;i<81;i++){
    if(isSingleton(D[i])) g[Math.floor(i/9)][i%9] = maskToDigit(D[i]);
  }
  return g;
}

// Precompute units and peers (rows, cols, boxes)
const UNITS = [];
const UNITS_OF_CELL = Array.from({length:81}, ()=> []);
const PEERS = Array.from({length:81}, ()=> []);
for(let r=0;r<9;r++) UNITS.push(Array.from({length:9}, (_,c)=> r*9 + c));
for(let c=0;c<9;c++) UNITS.push(Array.from({length:9}, (_,r)=> r*9 + c));
for(let br=0;br<3;br++) for(let bc=0; bc<3; bc++){
  const cells = [];
  for(let dr=0; dr<3; dr++) for(let dc=0; dc<3; dc++) cells.push((3*br+dr)*9 + (3*bc+dc));
  UNITS.push(cells);
}
UNITS.forEach((unit, uidx)=>{ unit.forEach(i=> UNITS_OF_CELL[i].push(uidx)); });
for(let i=0;i<81;i++){
  const s = new Set();
  UNITS_OF_CELL[i].forEach(uidx=>{ UNITS[uidx].forEach(j=>{ if(j!==i) s.add(j); }); });
  PEERS[i] = Array.from(s.values());
}

// Propagation: naked singles + hidden singles
function propagateAll(D){
  const q = [];
  for(let i=0;i<81;i++) if(isSingleton(D[i])) q.push(i);

  while(true){
    while(q.length){
      const i = q.shift();
      const m = D[i];
      if(!isSingleton(m)) continue;
      // eliminate from peers
      for(const j of PEERS[i]){
        if(D[j] & m){
          D[j] &= ~m;
          if(D[j] === 0) return false;
          if(isSingleton(D[j])) q.push(j);
        }
      }
    }

    let progress = false;
    for(const unit of UNITS){
      for(let d=1; d<=9; d++){
        const b = bit(d);
        const loc = unit.filter(i => (D[i] & b));
        if(loc.length === 0) return false;
        if(loc.length === 1){
          const i = loc[0]; if(D[i] !== b){ D[i] = b; q.push(i); progress = true; }
        }
      }
    }
    if(!progress && q.length===0) break;
  }
  return true;
}

function solved(D){ return D.every(m=> isSingleton(m)); }

function selectMRV(D){
  let bestI = -1, bestSize = 10;
  for(let i=0;i<81;i++){
    const m = D[i];
    if(m === 0) return -1; // contradiction
    if(!isSingleton(m)){
      // count bits
      const sz = m.toString(2).split('0').join('').length; // fallback
      // better: use built-in bitCount if available; approximate here by loop
      let count=0, mm=m; while(mm){ mm &= (mm-1); count++; }
      if(count < bestSize){ bestSize = count; bestI = i; }
    }
  }
  return bestI;
}

function solve(gridIn){
  const D0 = gridToDomains(gridIn);
  if(!propagateAll(D0)) return {solution:null};

  function search(D){
    if(solved(D)) return D;
    const i = selectMRV(D);
    if(i < 0) return null;
    const choices = Array.from(maskIter(D[i]));
    for(const d of choices){
      const D2 = D.slice();
      D2[i] = bit(d);
      if(propagateAll(D2)){
        const ans = search(D2);
        if(ans) return ans;
      }
    }
    return null;
  }

  const ans = search(D0);
  if(!ans) return {solution:null};
  return {solution: domainsToGrid(ans)};
}

// Generator: re-use previous simple generator -- fill full then remove
function fillGrid(){
  const grid = Array.from({length:9}, ()=> Array(9).fill(0));
  const nums = [1,2,3,4,5,6,7,8,9];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  function findEmpty(){ for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(grid[r][c]===0) return [r,c]; return null; }
  function isSafe(grid,r,c,v){ for(let i=0;i<9;i++) if(grid[r][i]===v) return false; for(let i=0;i<9;i++) if(grid[i][c]===v) return false; const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3; for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(grid[br+i][bc+j]===v) return false; return true; }
  function backtrack(){ const pos = findEmpty(); if(!pos) return true; const [r,c]=pos; shuffle(nums); for(const v of nums){ if(isSafe(grid,r,c,v)){ grid[r][c]=v; if(backtrack()) return true; grid[r][c]=0; } } return false; }
  backtrack(); return grid;
}

function generate(difficulty='medium'){
  const solvedGrid = fillGrid();
  let removals = 40; if(difficulty==='easy') removals=30; if(difficulty==='hard') removals=50;
  if(difficulty==='minimal') removals = 64; // attempt to leave very few givens
  const puzzle = cloneGrid(solvedGrid);
  const cells = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) cells.push([r,c]);
  for(let i=cells.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cells[i],cells[j]]=[cells[j],cells[i]]; }
  let removed=0;
  for(const [r,c] of cells){ if(removed>=removals) break; const backup = puzzle[r][c]; puzzle[r][c]=0; const attempt = solve(puzzle); if(!attempt.solution) { puzzle[r][c]=backup; continue; } removed++; }
  return {puzzle, solution: solvedGrid};
}

// Trace-enabled search: similar events to previous: start, enter, try, assign, backtrack, deadend, done
async function traceSolve(gridIn, stepCallback, options={}){
  const D0 = gridToDomains(gridIn);
  if(!propagateAll(D0)){
    if(stepCallback) await stepCallback({type:'done', success:false, solution:null});
    return {solution:null};
  }

  const stack = [];

  // search returns final domains (array) on success, or null on failure
  async function search(D){
    if(solved(D)) return D.slice();
    const i = selectMRV(D);
    if(i < 0) return null;
    const r = Math.floor(i/9), c = i%9;
    const choices = Array.from(maskIter(D[i]));
    if(stepCallback) await stepCallback({type:'enter', r, c, candidates: new Set(choices), grid: domainsToGrid(D)});
    for(const v of choices){
      if(stepCallback) await stepCallback({type:'try', r, c, val:v, grid: domainsToGrid(D)});
      const D2 = D.slice();
      D2[i] = bit(v);
      if(stepCallback) await stepCallback({type:'assign', r, c, val:v, grid: domainsToGrid(D2)});
      if(propagateAll(D2)){
        stack.push({r,c,attempting:v, candidates: Array.from(maskIter(D2[i]))});
        const res = await search(D2);
        if(res) return res; // bubble up solved domains
        // if not ok, pop
        stack.pop();
      }
      if(stepCallback) await stepCallback({type:'backtrack', r, c, val:v, grid: domainsToGrid(D)});
    }
    if(stepCallback) await stepCallback({type:'deadend', r, c, grid: domainsToGrid(D)});
    return null;
  }

  if(stepCallback) await stepCallback({type:'start', grid: domainsToGrid(D0)});
  // Inform caller the trace is ready (initial propagation done) so UI can deterministically
  // allow a first step or start autoplay. UI listens for 'ready'.
  if(stepCallback) await stepCallback({type:'ready', grid: domainsToGrid(D0)});
  const finalDomains = await search(D0);
  if(stepCallback) await stepCallback({type:'done', success: !!finalDomains, solution: finalDomains ? domainsToGrid(finalDomains) : null});
  return {solution: finalDomains ? domainsToGrid(finalDomains) : null};
}

// default exports

export { cloneGrid, solve, generate, traceSolve };
