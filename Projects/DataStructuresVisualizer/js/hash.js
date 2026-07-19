import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs } from './core.js';

class HashTableChaining {
  constructor(size = 8) { this.size = size; this.buckets = Array.from({ length: size }, () => []); }
  hash(key) { return ((key % this.size) + this.size) % this.size; }
  insert(key) { const index = this.hash(key); if (!this.buckets[index].includes(key)) this.buckets[index].push(key); }
  remove(key) { const index = this.hash(key); const position = this.buckets[index].indexOf(key); if (position > -1) this.buckets[index].splice(position, 1); }
}

class HashTableOpen {
  constructor(size = 11) { this.size = size; this.slots = Array(size).fill(null); }
  hash(key) { return ((key % this.size) + this.size) % this.size; }
  insert(key) {
    let index = this.hash(key), start = index, tombstone = -1;
    while (this.slots[index] != null) {
      if (this.slots[index] === key) return;
      if (this.slots[index] === '*' && tombstone === -1) tombstone = index;
      index = (index + 1) % this.size;
      if (index === start) { if (tombstone !== -1) this.slots[tombstone] = key; return; }
    }
    this.slots[tombstone !== -1 ? tombstone : index] = key;
  }
  remove(key) {
    let index = this.hash(key), start = index;
    while (this.slots[index] != null) {
      if (this.slots[index] === key) { this.slots[index] = '*'; return; }
      index = (index + 1) % this.size;
      if (index === start) return;
    }
  }
}

let hashState;
let hashPseudoMode = 'base';

export function renderHashTableVisualizer(visualArea, controlsArea) {
  hashState = { mode: 'chain', table: new HashTableChaining(8) };
  const modeSelect = el('select', { id: 'hash-mode', onchange: handleModeChange },
    el('option', { value: 'chain' }, 'Separate chaining'),
    el('option', { value: 'open' }, 'Linear probing')
  );
  const keyInput = el('input', { id: 'hash-val', placeholder: 'e.g. 27', type: 'number' });
  const controls = createExplorerControls({
    title: 'Hash-table actions',
    intro: 'A hash function turns a key into a home bucket. If that bucket is occupied, the selected strategy resolves the collision.',
    fields: [controlField('Collision strategy', modeSelect), controlField('Integer key', keyInput)],
    groups: [
      controlGroup('Place or remove one key', 'uses Integer key',
        el('button', { className: 'btn primary', onclick: handleHashInsert }, 'Hash and insert'),
        el('button', { className: 'btn', onclick: handleHashRemove }, 'Find and remove')
      ),
      controlGroup('Explore table behavior', 'watch the load factor',
        el('button', { className: 'btn', onclick: handleRandomFill }, 'Add six examples'),
        el('button', { className: 'btn', onclick: rehash }, 'Double capacity'),
        el('button', { className: 'btn', onclick: handleHashReset }, 'Clear table')
      )
    ]
  });
  visualArea.append(
    el('h2', {}, 'Hash Table'),
    el('div', { className: 'visual-legend' },
      el('span', { className: 'legend-item' }, el('span', { className: 'legend-swatch active' }), 'home bucket'),
      el('span', { className: 'legend-item' }, el('span', { className: 'legend-swatch move' }), 'collision / probe')
    ),
    el('div', { id: 'hash-table', className: 'hash-table' }),
    el('div', { id: 'hash-stats', className: 'visit-order' }, 'Load factor: 0.00')
  );
  controlsArea.prepend(controls);
  drawHash();
  showHashBasePseudocode();
  configureExplorer({
    name: 'Hash table',
    goal: 'Insert a key and follow the modulo calculation to its home bucket.',
    focus: 'Bucket numbers appear in the corner. Color shows the home bucket and probe path.',
    change: 'The collision strategy decides where a colliding key is stored.',
    why: 'Hash tables trade ordered layout for quick access by computed bucket.'
  });
}

function readHashKey() {
  const input = qs('#hash-val');
  const key = Number(input?.value);
  if (!input || input.value === '' || Number.isNaN(key)) {
    announce('Enter an integer key first.', { tone: 'error', focus: 'Use the Integer key field.', change: 'The table did not change.', why: 'The hash function needs a key to calculate a bucket.' });
    return null;
  }
  return key;
}

function handleModeChange() {
  const mode = qs('#hash-mode').value;
  hashState.mode = mode;
  hashState.table = mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11);
  drawHash();
  announce(`Switched to ${mode === 'chain' ? 'separate chaining' : 'linear probing'} and started with an empty table.`, {
    title: 'Choose a collision rule', tone: 'move', focus: 'All buckets are empty.',
    change: `The strategy is now ${mode === 'chain' ? 'chaining' : 'linear probing'}.`,
    why: mode === 'chain' ? 'Colliding keys share a bucket in a collection.' : 'Colliding keys scan forward until an open slot is found.'
  });
}

function openProbePath(table, key) {
  const path = [];
  let index = table.hash(key), start = index;
  while (table.slots[index] != null && table.slots[index] !== key) {
    path.push(index);
    index = (index + 1) % table.size;
    if (index === start) break;
  }
  path.push(index);
  return path;
}

function handleHashInsert() {
  const key = readHashKey(); if (key == null) return;
  const home = hashState.table.hash(key);
  const before = currentCount();
  const probes = hashState.mode === 'open' ? openProbePath(hashState.table, key) : [home];
  const chainHadCollision = hashState.mode === 'chain' && hashState.table.buckets[home].length > 0 && !hashState.table.buckets[home].includes(key);
  hashState.table.insert(key);
  drawHash(home, probes);
  highlightPseudo(hashState.mode === 'chain' ? 'h_chain' : 'h_open');
  const collision = hashState.mode === 'open' ? probes.length > 1 : chainHadCollision;
  announce(`${key} mod ${hashState.table.size} = ${home}${collision ? '; a collision must be resolved.' : '.'}`, {
    title: collision ? 'Resolve a collision' : 'Place key in its home bucket', tone: collision ? 'move' : 'complete',
    focus: hashState.mode === 'open' ? `Highlighted path: ${probes.join(' → ')}.` : `Bucket ${home} now contains ${hashState.table.buckets[home].join(', ')}.`,
    change: currentCount() === before ? 'The key was already present, so the table did not grow.' : `Stored key ${key}; item count ${before} → ${currentCount()}.`,
    why: hashState.mode === 'chain' ? 'Modulo selects a bucket; chaining keeps colliding keys together.' : 'Linear probing checks consecutive slots until one is available.'
  });
}

function handleHashRemove() {
  const key = readHashKey(); if (key == null) return;
  const home = hashState.table.hash(key);
  const probes = hashState.mode === 'open' ? openProbePath(hashState.table, key) : [home];
  const before = currentCount();
  hashState.table.remove(key);
  drawHash(home, probes);
  highlightPseudo('h_rem');
  const removed = currentCount() < before;
  announce(removed ? `Removed key ${key}.` : `Key ${key} was not in the table.`, {
    title: removed ? 'Remove the located key' : 'Search complete: no key', tone: removed ? 'move' : 'complete',
    focus: hashState.mode === 'open' ? `Search followed ${probes.join(' → ')}.` : `Search inspected bucket ${home}.`,
    change: removed ? `Item count ${before} → ${currentCount()}.` : 'The table did not change.',
    why: hashState.mode === 'open' ? 'A tombstone preserves the probe path so later searches do not stop early.' : 'Only the matching key is removed from its bucket chain.'
  });
}

function handleRandomFill() {
  const before = currentCount();
  for (let i = 0; i < 6; i++) hashState.table.insert(Math.floor(Math.random() * 100));
  drawHash();
  announce('Added six example keys.', { title: 'Build a collision example', tone: 'move', focus: 'Look for shared buckets or runs of occupied slots.', change: `Item count ${before} → ${currentCount()}.`, why: 'A fuller table makes collisions and their resolution easier to see.' });
}

function handleHashReset() {
  const before = currentCount();
  hashState.table = hashState.mode === 'chain' ? new HashTableChaining(8) : new HashTableOpen(11);
  drawHash();
  announce(`Cleared ${before} key${before === 1 ? '' : 's'} from the table.`, { title: 'Reset the table', tone: 'move', focus: 'Every bucket is empty.', change: `Item count ${before} → 0.`, why: 'Capacity and collision strategy remain selected while stored keys are removed.' });
}

function currentCount() {
  return hashState.mode === 'chain'
    ? hashState.table.buckets.reduce((sum, bucket) => sum + bucket.length, 0)
    : hashState.table.slots.filter((value) => value != null && value !== '*').length;
}

function showHashBasePseudocode() {
  hashPseudoMode = 'base';
  setPseudocode([
    { text: 'def hash(k): return k % size', id: 'h_hash' },
    { text: 'Insert (chaining): append to bucket', id: 'h_chain' },
    { text: 'Insert (open): probe while slot occupied', id: 'h_open' },
    { text: 'Remove: locate & delete / tombstone', id: 'h_rem' }
  ]);
}

function showRehashPseudo(mode) {
  hashPseudoMode = 'rehash';
  setPseudocode(mode === 'chain' ? [
    { text: 'newBuckets = [[] for _ in range(2*size)]', id: 'rh1' },
    { text: 'for bucket in buckets:', id: 'rh2' },
    { text: '  for key in bucket: insert(newBuckets, key)', id: 'rh3' }
  ] : [
    { text: 'newSlots = [None]*(2*size+1)', id: 'rh1' },
    { text: 'for key in occupied slots:', id: 'rh2' },
    { text: '  place via probing', id: 'rh3' }
  ]);
  setTimeout(() => { if (hashPseudoMode === 'rehash') showHashBasePseudocode(); }, 4000);
}

function drawHash(highlightIndex = null, probePath = []) {
  const container = qs('#hash-table'); if (!container) return;
  container.innerHTML = '';
  if (hashState.mode === 'chain') {
    hashState.table.buckets.forEach((bucket, index) => {
      const bucketEl = el('div', { className: `hash-bucket${index === highlightIndex ? ' primary' : ''}`, dataset: { i: index } });
      const chain = el('div', { className: 'hash-chain' });
      bucket.forEach((key) => chain.append(el('div', { className: 'hash-node' }, key)));
      if (!bucket.length) chain.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
      bucketEl.append(chain); container.append(bucketEl);
    });
  } else {
    hashState.table.slots.forEach((key, index) => {
      const classes = `hash-bucket${index === highlightIndex ? ' primary' : ''}${probePath.includes(index) && index !== highlightIndex ? ' probe' : ''}`;
      const bucketEl = el('div', { className: classes, dataset: { i: index } });
      if (key == null) bucketEl.append(el('div', { className: 'hash-node', style: { opacity: .3 } }, '∅'));
      else bucketEl.append(el('div', { className: `hash-node ${key === '*' ? 'probe' : ''}` }, key === '*' ? 'tombstone' : key));
      container.append(bucketEl);
    });
  }
  updateLoadFactor();
}

function updateLoadFactor() {
  const stats = qs('#hash-stats'); if (!stats) return;
  const count = currentCount(), capacity = hashState.table.size;
  stats.textContent = `Load factor ${(count / capacity).toFixed(2)} · ${count} stored key${count === 1 ? '' : 's'} across ${capacity} buckets`;
}

function rehash() {
  const oldCapacity = hashState.table.size;
  const count = currentCount();
  showRehashPseudo(hashState.mode);
  if (hashState.mode === 'chain') {
    const old = hashState.table, bigger = new HashTableChaining(old.size * 2);
    old.buckets.flat().forEach((key) => bigger.insert(key)); hashState.table = bigger;
  } else {
    const old = hashState.table, bigger = new HashTableOpen(old.size * 2 + 1);
    old.slots.forEach((key) => { if (key != null && key !== '*') bigger.insert(key); }); hashState.table = bigger;
  }
  drawHash();
  announce(`Rehashed ${count} key${count === 1 ? '' : 's'} into a larger table.`, { title: 'Grow and recompute every bucket', tone: 'move', focus: 'Key positions may change because capacity changed.', change: `Capacity ${oldCapacity} → ${hashState.table.size}; load factor decreased.`, why: 'The modulo uses capacity, so every key must be hashed again after resizing.' });
}
