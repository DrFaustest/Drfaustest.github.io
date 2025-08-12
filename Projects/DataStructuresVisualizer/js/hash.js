import { el, setPseudocode, qs } from './core.js';

// Separate chaining hash table (array of buckets).
class HashTableChaining {
  constructor(size = 8) { this.size = size; this.buckets = Array.from({ length: size }, () => []); }
  hash(key) { return key % this.size; }
  insert(key) { const idx = this.hash(key); if (!this.buckets[idx].includes(key)) this.buckets[idx].push(key); }
  remove(key) { const idx = this.hash(key); const pos = this.buckets[idx].indexOf(key); if (pos > -1) this.buckets[idx].splice(pos, 1); }
}

// Open addressing hash table with linear probing ("*" denotes deleted/tombstone slot).
class HashTableOpen {
  constructor(size = 11) { this.size = size; this.slots = Array(this.size).fill(null); }
  hash(key) { return key % this.size; }
  insert(key) { let i = this.hash(key), start = i; while (this.slots[i] != null) { if (this.slots[i] === key) return; i = (i + 1) % this.size; if (i === start) return; } this.slots[i] = key; }
  remove(key) { let i = this.hash(key), start = i; while (this.slots[i] != null) { if (this.slots[i] === key) { this.slots[i] = '*'; return; } i = (i + 1) % this.size; if (i === start) return; } }
}

let hashState;
let hashPseudoMode = 'base';

export function renderHashTableVisualizer(visualArea, controlsArea) {
  hashState = { mode: 'chain', table: new HashTableChaining(8) };
  const title = el('h2', {}, 'Hash Table');
  const tableDiv = el('div', { id: 'hash-table', className: 'hash-table' });
  const statsBar = el('div', { id: 'hash-stats', style:{marginTop:'.5rem', fontSize:'.8rem', opacity:.8} }, 'load: 0.00');
  const controlsForm = el('div', {},
    el('select', { id: 'hash-mode', onchange: () => { const mode = qs('#hash-mode').value; hashState.mode = mode; hashState.table = mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11); drawHash(); } },
      el('option', { value: 'chain' }, 'Chaining'),
      el('option', { value: 'open' }, 'Open Addressing')
    ),
    el('input', { id: 'hash-val', placeholder: 'Key (int)', type: 'number', style: { marginLeft: '.5rem', width: '90px' } }),
    el('button', { className: 'btn', onclick: () => { const key = Number(qs('#hash-val').value); if (Number.isNaN(key)) return; hashState.table.insert(key); drawHash(); } }, 'Insert'),
    el('button', { className: 'btn', onclick: () => { const key = Number(qs('#hash-val').value); if (Number.isNaN(key)) return; hashState.table.remove(key); drawHash(); } }, 'Remove'),
    el('button', { className: 'btn', onclick: () => { for (let i = 0; i < 6; i++) { hashState.table.insert(Math.floor(Math.random() * 100)); } drawHash(); } }, 'Random Fill'),
    el('button', { className: 'btn', onclick: () => { hashState.table = hashState.mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11); drawHash(); } }, 'Reset'),
    el('button', { className: 'btn', onclick: () => { rehash(); } }, 'Rehash x2')
  );
  visualArea.append(title, tableDiv, statsBar);
  controlsArea.append(el('h3', {}, 'Hash Controls'), controlsForm);
  drawHash();
  showHashBasePseudocode();
}

function showHashBasePseudocode(){
  hashPseudoMode='base';
  setPseudocode([
    { text: 'def hash(k): return k % size', id: 'h_hash' },
    { text: 'Insert (chaining): append to bucket', id: 'h_chain' },
    { text: 'Insert (open): probe while slot occupied', id: 'h_open' },
    { text: 'Remove: locate & delete / tombstone', id: 'h_rem' }
  ]);
}

function showRehashPseudo(mode){
  hashPseudoMode='rehash';
  if(mode==='chain') setPseudocode([
    { text: 'newBuckets = [[] for _ in range(2*size)]', id: 'rh1' },
    { text: 'for bucket in buckets:', id: 'rh2' },
    { text: '  for key in bucket:', id: 'rh3' },
    { text: '    insert(newBuckets, key)', id: 'rh4' }
  ]); else setPseudocode([
    { text: 'newSlots = [None]*(2*size+1)', id: 'rh1' },
    { text: 'for key in slots:', id: 'rh2' },
    { text: '  if key and key!="*":', id: 'rh3' },
    { text: '    place via probing', id: 'rh4' }
  ]);
  // revert after 4s
  setTimeout(()=>{ if(hashPseudoMode==='rehash') showHashBasePseudocode(); },4000);
}

function drawHash() {
  const container = qs('#hash-table'); if (!container) return;
  container.innerHTML = '';
  if (hashState.mode === 'chain') {
    hashState.table.buckets.forEach((bucket, i) => {
      const bucketEl = el('div', { className: 'hash-bucket', dataset: { i } }, '');
      const chain = el('div', { className: 'hash-chain' });
      bucket.forEach(key => chain.append(el('div', { className: 'hash-node' }, key)));
      if (!bucket.length) chain.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
      bucketEl.append(chain); container.append(bucketEl);
    });
  } else {
    hashState.table.slots.forEach((key, i) => {
      const bucketEl = el('div', { className: 'hash-bucket', dataset: { i } });
      if (key == null) bucketEl.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
      else bucketEl.append(el('div', { className: `hash-node ${key === '*' ? 'probe' : ''}` }, key === '*' ? '(del)' : key));
      container.append(bucketEl);
    });
  }
  updateLoadFactor();
}

function updateLoadFactor(){
  const stats = qs('#hash-stats'); if(!stats) return;
  let count=0, cap=0;
  if(hashState.mode==='chain') { count = hashState.table.buckets.reduce((s,b)=>s+b.length,0); cap = hashState.table.size; }
  else { count = hashState.table.slots.filter(v=>v!=null && v!=='*').length; cap = hashState.table.size; }
  const load = cap? (count/cap).toFixed(2):'0.00';
  stats.textContent = `load: ${load} (${count}/${cap})`;
}

function rehash(){
  showRehashPseudo(hashState.mode);
  if(hashState.mode==='chain'){
    const old = hashState.table; const bigger = new HashTableChaining(old.size*2);
    old.buckets.flat().forEach(k=>bigger.insert(k)); hashState.table=bigger; drawHash();
  } else {
    const old = hashState.table; const bigger = new HashTableOpen(old.size*2+1);
    old.slots.forEach(k=>{ if(k!=null && k!=='*') bigger.insert(k); }); hashState.table=bigger; drawHash();
  }
}

// Future enhancement: dynamically update pseudocode to show rehash procedure when user clicks rehash
// Example python snippet:
// new_table = [ [] for _ in range(2*old_size) ]  # chaining
// for bucket in old_table:
//     for key in bucket:
//         insert(new_table, key)
// table = new_table
