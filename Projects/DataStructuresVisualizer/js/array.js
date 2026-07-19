import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs, setTeardown } from './core.js';

// Internal backing array we mutate & re-render.
let arrayData = [];
let searchTimer = null;

/** Render the Array visualizer UI + initialize pseudocode. */
export function renderArrayVisualizer(visualArea, controlsArea) {
  arrayData = [3, 1, 4];
  const title = el('h2', {}, 'Array');
  const arrayRow = el('div', { className: 'viz-row', id: 'array-row' });

  const valueInput = el('input', { id: 'arr-val', placeholder: 'e.g. 8', type: 'number' });
  const indexInput = el('input', { id: 'arr-idx', placeholder: 'leave blank for end', type: 'number', min: 0 });
  const searchInput = el('input', { id: 'arr-search', placeholder: 'e.g. 4', type: 'number' });
  const controlsForm = createExplorerControls({
    title: 'Array actions',
    intro: 'An array stores values in numbered, contiguous positions. Add a value, then watch which indexes shift.',
    fields: [controlField('Value', valueInput), controlField('Index (optional)', indexInput), controlField('Search target', searchInput)],
    groups: [
      controlGroup('Add or change', 'uses Value + optional Index',
        el('button', { className: 'btn primary', onclick: handleInsert }, 'Insert value'),
        el('button', { className: 'btn', onclick: handleUpdate }, 'Update index')
      ),
      controlGroup('Remove or reorder', 'uses Index when needed',
        el('button', { className: 'btn', onclick: handlePop }, 'Remove last'),
        el('button', { className: 'btn', onclick: handleRemoveAt }, 'Remove at index'),
        el('button', { className: 'btn', onclick: handleReverse }, 'Reverse order')
      ),
      controlGroup('Inspect or reset', 'uses Search target',
        el('button', { className: 'btn', onclick: handleSearch }, 'Find value'),
        el('button', { className: 'btn', onclick: handleClear }, 'Clear array')
      )
    ]
  });

  visualArea.append(title,
    el('div', { className: 'visual-legend' },
      el('span', { className: 'legend-item' }, el('span', { className: 'legend-swatch active' }), 'currently inspected'),
      el('span', { className: 'legend-item' }, el('span', { className: 'legend-swatch complete' }), 'match found')
    ), arrayRow);
  controlsArea.prepend(controlsForm);
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
  configureExplorer({
    name: 'Array',
    goal: 'Choose an operation. Index labels make shifts and direct access visible.',
    focus: 'A bordered cell is the value; the small label below is its index.',
    change: 'Insertions and removals can shift every value after the chosen index.',
    why: 'Array positions are contiguous, so a value’s index is part of the structure.'
  });
  setTeardown(() => window.clearTimeout(searchTimer));
}

/** Draw the array cells + index row. */
function drawArray(values, container) {
  container.innerHTML = '';
  values.forEach((value, index) => {
    container.append(el('div', { className: 'array-item' },
      el('div', { className: 'cell', dataset: { index }, 'aria-label': `Value ${value} at index ${index}` }, value),
      el('span', { className: 'array-index' }, `index ${index}`)
    ));
  });
}

/** Re-render the current array representation. */
function refreshArrayDisplay() { drawArray(arrayData, qs('#array-row')); }

/** Insert (append or at index) handler. */
function handleInsert() {
  const value = Number(qs('#arr-val').value);
  const idxRaw = qs('#arr-idx').value;
  const targetIndex = idxRaw === '' ? null : Number(idxRaw);
  if (Number.isNaN(value)) { announce('Enter a numeric value before inserting.', { tone: 'error', focus: 'Use the Value field.', change: 'The array was not changed.', why: 'Every array cell in this explorer stores a number.' }); return; }
  const before = `[${arrayData.join(', ')}]`;
  const willAppend = targetIndex == null || targetIndex >= arrayData.length;
  const actualIndex = willAppend ? arrayData.length : Math.max(0, targetIndex);
  if (willAppend) {
    arrayData.push(value);
    highlightPseudo('append');
  } else {
    arrayData.splice(actualIndex, 0, value);
    highlightPseudo('place');
  }
  refreshArrayDisplay();
  qs(`#array-row .cell[data-index='${actualIndex}']`)?.classList.add('active');
  announce(`${value} was inserted at index ${actualIndex}.`, {
    title: willAppend ? 'Append at the end' : 'Insert and shift right', tone: 'move',
    focus: `The new cell at index ${actualIndex} is highlighted.`,
    change: `${before} → [${arrayData.join(', ')}]`,
    why: willAppend ? 'Appending creates one new position without shifting existing values.' : 'Contiguous indexes leave no gap, so later values move one position right.'
  });
}

function handleUpdate() {
  const value = Number(qs('#arr-val').value);
  const idx = Number(qs('#arr-idx').value);
  if (Number.isNaN(value) || Number.isNaN(idx) || idx < 0 || idx >= arrayData.length) { announce('Enter a value and an index that currently exists.', { tone: 'error', focus: `Valid indexes are 0 through ${Math.max(arrayData.length - 1, 0)}.`, change: 'The array was not changed.', why: 'Updating replaces an existing cell; it does not create a new one.' }); return; }
  const oldValue = arrayData[idx];
  arrayData[idx] = value;
  highlightPseudo('upd');
  refreshArrayDisplay();
  qs(`#array-row .cell[data-index='${idx}']`)?.classList.add('active');
  announce(`Index ${idx} changed from ${oldValue} to ${value}.`, { title: 'Replace one value', tone: 'move', focus: `Only index ${idx} is highlighted.`, change: `${oldValue} → ${value}; the array length stays ${arrayData.length}.`, why: 'Direct indexing lets an array update one known position without shifting neighbors.' });
}

/** Pop last element. */
function handlePop() { if (!arrayData.length) { announce('The array is empty; there is nothing to remove.', { tone:'error', change:'The array stayed empty.', why:'Remove last requires a final cell.' }); return; } const oldLength=arrayData.length; const value=arrayData.pop(); refreshArrayDisplay(); announce(`Removed ${value} from the end.`, { title:'Remove the last cell', tone:'move', focus:`The former last index was ${oldLength - 1}.`, change:`Length ${oldLength} → ${arrayData.length}.`, why:'Removing at the end does not shift any remaining value.' }); }

/** Remove at supplied index. */
function handleRemoveAt() {
  const index = Number(qs('#arr-idx').value);
  if (!Number.isNaN(index) && index >= 0 && index < arrayData.length) {
    const removed = arrayData[index];
    const before = `[${arrayData.join(', ')}]`;
    arrayData.splice(index, 1);
    refreshArrayDisplay();
    announce(`Removed ${removed} from index ${index}.`, { title:'Remove and shift left', tone:'move', focus:`Indexes after ${index} moved left.`, change:`${before} → [${arrayData.join(', ')}]`, why:'The array closes the gap so its positions remain contiguous.' });
  } else announce('Enter an index that exists before removing.', { tone:'error', change:'The array was not changed.', why:'There must be a cell at the requested index.' });
}

function handleReverse() { const before=`[${arrayData.join(', ')}]`; arrayData.reverse(); highlightPseudo('rev'); refreshArrayDisplay(); announce('Reversed the array in place.', { title:'Swap mirrored positions', tone:'move', focus:'Compare the first and last cells, then move inward.', change:`${before} → [${arrayData.join(', ')}]`, why:'Reversal changes every value’s position but keeps the same values and length.' }); }

function handleClear() { const count=arrayData.length; arrayData.length=0; refreshArrayDisplay(); announce(`Cleared ${count} value${count===1?'':'s'} from the array.`, { title:'Reset the structure', tone:'move', focus:'The visualization is now empty.', change:`Length ${count} → 0.`, why:'Clearing removes all stored values and returns to the empty state.' }); }

function handleSearch() {
  const target = Number(qs('#arr-search').value);
  if (Number.isNaN(target)) { announce('Enter a numeric search target.', { tone:'error', focus:'Use the Search target field.', change:'The array was not changed.', why:'Linear search needs a value to compare against each cell.' }); return; }
  window.clearTimeout(searchTimer);
  highlightPseudo('s2');
  const cells = Array.from(document.querySelectorAll('#array-row .cell'));
  let i = 0;
  function step() {
    cells.forEach(c=>c.classList.remove('active','ok'));
    if (i >= arrayData.length) { highlightPseudo('s4'); announce(`${target} was not found after checking ${arrayData.length} cell${arrayData.length===1?'':'s'}.`, { title:'Search complete: no match', tone:'complete', focus:'No cell remains highlighted.', change:'The array was read but not changed.', why:'Linear search must inspect every cell before it can prove the value is absent.' }); return; }
    cells[i].classList.add('active');
    announce(`Compare target ${target} with ${arrayData[i]} at index ${i}.`, { title:'Inspect the next cell', tone:'compare', focus:`Index ${i} is highlighted.`, change:'The search cursor moved; the array itself did not change.', why:'Linear search checks cells from left to right until it finds a match.', record:false });
    if (arrayData[i] === target) { cells[i].classList.add('ok'); highlightPseudo('s3'); announce(`Found ${target} at index ${i}.`, { title:'Search complete: match found', tone:'complete', focus:`Index ${i} is outlined as the match.`, change:`The search stopped after ${i+1} comparison${i?'s':''}; the array did not change.`, why:'Once equality is confirmed, the algorithm can return the matching index.' }); return; }
    i++; searchTimer=window.setTimeout(step, 300);
  }
  step();
}
