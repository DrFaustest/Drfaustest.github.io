import { el, highlightPseudo, setPseudocode, qs } from './core.js';

// Internal backing array we mutate & re-render.
let arrayData = [];

/** Render the Array visualizer UI + initialize pseudocode. */
export function renderArrayVisualizer(visualArea, controlsArea) {
  arrayData = [3, 1, 4];
  const title = el('h2', {}, 'Array');
  const arrayRow = el('div', { className: 'viz-row', id: 'array-row' });

  const controlsForm = el('div', {},
    el('input', { id: 'arr-val', placeholder: 'Value', type: 'number' }),
    el('input', { id: 'arr-idx', placeholder: 'Index', type: 'number', min: 0, style: { width: '70px' } }),
    el('button', { className: 'btn', onclick: handleInsert }, 'Insert/Push'),
    el('button', { className: 'btn', onclick: handleUpdate }, 'Update'),
    el('button', { className: 'btn', onclick: handlePop }, 'Pop'),
    el('button', { className: 'btn', onclick: handleRemoveAt }, 'Remove At'),
    el('button', { className: 'btn', onclick: handleReverse }, 'Reverse'),
    el('input', { id: 'arr-search', placeholder: 'Search', type: 'number', style: { width: '70px', marginLeft: '.5rem' } }),
    el('button', { className: 'btn', onclick: handleSearch }, 'Search'),
    el('button', { className: 'btn', onclick: () => { arrayData.length = 0; refreshArrayDisplay(); } }, 'Clear')
  );

  visualArea.append(title, arrayRow);
  controlsArea.append(el('h3', {}, 'Array Controls'), controlsForm);
  refreshArrayDisplay();
  setPseudocode([
    { text: 'def insert(A, val, i=None):', id: 'sig' },
    { text: '    if i is None or i >= len(A):', id: 'append' },
    { text: '        A.append(val)', id: 'append_do' },
    { text: '    else:', id: 'shift' },
    { text: '        A.insert(i, val)', id: 'place' },
    { text: 'def update(A,i,val): A[i]=val', id: 'upd' },
    { text: 'def search(A,x):', id: 's1' },
    { text: '    for i,v in enumerate(A):', id: 's2' },
    { text: '        if v==x: return i', id: 's3' },
    { text: '    return -1', id: 's4' },
    { text: 'def reverse(A): A.reverse()', id: 'rev' }
  ]);
}

/** Draw the array cells + index row. */
function drawArray(values, container) {
  container.innerHTML = '';
  values.forEach((value, index) => {
    container.append(
      el('div', { className: 'cell' }, value),
      el('div', { className: 'cell index' }, index)
    );
  });
}

/** Re-render the current array representation. */
function refreshArrayDisplay() { drawArray(arrayData, qs('#array-row')); }

/** Insert (append or at index) handler. */
function handleInsert() {
  const value = Number(qs('#arr-val').value);
  const idxRaw = qs('#arr-idx').value;
  const targetIndex = idxRaw === '' ? null : Number(idxRaw);
  if (Number.isNaN(value)) return;
  if (targetIndex == null || targetIndex >= arrayData.length) {
    arrayData.push(value);
    highlightPseudo('append');
  } else {
    arrayData.splice(targetIndex, 0, value);
    highlightPseudo('place');
  }
  refreshArrayDisplay();
}

function handleUpdate() {
  const value = Number(qs('#arr-val').value);
  const idx = Number(qs('#arr-idx').value);
  if (Number.isNaN(value) || Number.isNaN(idx) || idx < 0 || idx >= arrayData.length) return;
  arrayData[idx] = value;
  highlightPseudo('upd');
  refreshArrayDisplay();
}

/** Pop last element. */
function handlePop() { arrayData.pop(); refreshArrayDisplay(); }

/** Remove at supplied index. */
function handleRemoveAt() {
  const index = Number(qs('#arr-idx').value);
  if (!Number.isNaN(index)) {
    arrayData.splice(index, 1);
    refreshArrayDisplay();
  }
}

function handleReverse() { arrayData.reverse(); highlightPseudo('rev'); refreshArrayDisplay(); }

function handleSearch() {
  const target = Number(qs('#arr-search').value);
  if (Number.isNaN(target)) return;
  highlightPseudo('s2');
  const cells = Array.from(document.querySelectorAll('#array-row .cell')).filter((_,i)=> i%2===0); // value cells
  let i = 0;
  function step() {
    cells.forEach(c=>c.classList.remove('active','ok'));
    if (i >= arrayData.length) { highlightPseudo('s4'); return; }
    cells[i].classList.add('active');
    if (arrayData[i] === target) { cells[i].classList.add('ok'); highlightPseudo('s3'); return; }
    i++; setTimeout(step, 300);
  }
  step();
}
