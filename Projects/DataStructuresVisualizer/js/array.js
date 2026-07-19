import { announce, el, highlightPseudo, setPseudocode, qs, setTeardown } from './core.js';

// Internal backing array we mutate & re-render.
let arrayData = [];
let searchTimer = null;

/** Render the Array visualizer UI + initialize pseudocode. */
export function renderArrayVisualizer(visualArea, controlsArea) {
  arrayData = [3, 1, 4];
  const title = el('h2', {}, 'Array');
  const arrayRow = el('div', { className: 'viz-row', id: 'array-row' });

  const controlsForm = el('div', {},
    el('input', { id: 'arr-val', placeholder: 'Value', type: 'number', 'aria-label': 'Array value' }),
    el('input', { id: 'arr-idx', placeholder: 'Index', type: 'number', min: 0, style: { width: '90px' }, 'aria-label': 'Array index' }),
    el('button', { className: 'btn', onclick: handleInsert }, 'Insert/Push'),
    el('button', { className: 'btn', onclick: handleUpdate }, 'Update'),
    el('button', { className: 'btn', onclick: handlePop }, 'Pop'),
    el('button', { className: 'btn', onclick: handleRemoveAt }, 'Remove At'),
    el('button', { className: 'btn', onclick: handleReverse }, 'Reverse'),
    el('input', { id: 'arr-search', placeholder: 'Search', type: 'number', style: { width: '90px', marginLeft: '.5rem' }, 'aria-label': 'Value to search for' }),
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
  setTeardown(() => window.clearTimeout(searchTimer));
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
  if (Number.isNaN(value)) { announce('Enter a numeric value before inserting.'); return; }
  if (targetIndex == null || targetIndex >= arrayData.length) {
    arrayData.push(value);
    highlightPseudo('append');
  } else {
    arrayData.splice(targetIndex, 0, value);
    highlightPseudo('place');
  }
  refreshArrayDisplay();
  announce(targetIndex == null || targetIndex >= arrayData.length - 1 ? `Appended ${value}.` : `Inserted ${value} at index ${targetIndex}.`);
}

function handleUpdate() {
  const value = Number(qs('#arr-val').value);
  const idx = Number(qs('#arr-idx').value);
  if (Number.isNaN(value) || Number.isNaN(idx) || idx < 0 || idx >= arrayData.length) { announce('Enter a valid value and an index that exists.'); return; }
  arrayData[idx] = value;
  highlightPseudo('upd');
  refreshArrayDisplay();
  announce(`Updated index ${idx} to ${value}.`);
}

/** Pop last element. */
function handlePop() { if (!arrayData.length) { announce('The array is empty; there is nothing to pop.'); return; } const value=arrayData.pop(); refreshArrayDisplay(); announce(`Removed ${value} from the end.`); }

/** Remove at supplied index. */
function handleRemoveAt() {
  const index = Number(qs('#arr-idx').value);
  if (!Number.isNaN(index) && index >= 0 && index < arrayData.length) {
    arrayData.splice(index, 1);
    refreshArrayDisplay();
    announce(`Removed the value at index ${index}.`);
  } else announce('Enter an index that exists before removing.');
}

function handleReverse() { arrayData.reverse(); highlightPseudo('rev'); refreshArrayDisplay(); announce('Reversed the array in place.'); }

function handleSearch() {
  const target = Number(qs('#arr-search').value);
  if (Number.isNaN(target)) { announce('Enter a numeric search target.'); return; }
  window.clearTimeout(searchTimer);
  highlightPseudo('s2');
  const cells = Array.from(document.querySelectorAll('#array-row .cell')).filter((_,i)=> i%2===0); // value cells
  let i = 0;
  function step() {
    cells.forEach(c=>c.classList.remove('active','ok'));
    if (i >= arrayData.length) { highlightPseudo('s4'); announce(`${target} was not found.`); return; }
    cells[i].classList.add('active');
    if (arrayData[i] === target) { cells[i].classList.add('ok'); highlightPseudo('s3'); announce(`Found ${target} at index ${i}.`); return; }
    i++; searchTimer=window.setTimeout(step, 300);
  }
  step();
}
