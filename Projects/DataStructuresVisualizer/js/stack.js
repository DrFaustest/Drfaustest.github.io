import { el, highlightPseudo, setPseudocode, qs } from './core.js';

// Backing array modeling the stack (end of array = top of stack).
let stackData = [];

/** Render the Stack visualizer (LIFO). */
export function renderStackVisualizer(visualArea, controlsArea) {
  stackData = [1, 2, 3];
  const title = el('h2', {}, 'Stack');
  const stackColumn = el('div', { id: 'stack-col' });
  const controlsForm = el('div', {},
    el('input', { id: 'stack-val', placeholder: 'Value', type: 'number' }),
    el('button', {
      className: 'btn',
      onclick: () => {
        const value = Number(qs('#stack-val').value);
        if (!Number.isNaN(value)) { stackData.push(value); redrawStack(); highlightPseudo('push'); }
      }
    }, 'Push'),
    el('button', {
      className: 'btn',
      onclick: () => { stackData.pop(); redrawStack(); highlightPseudo('pop'); }
    }, 'Pop'),
  el('button', { className: 'btn', onclick: handlePeek }, 'Peek'),
  el('button', { className: 'btn', onclick: () => { stackData = []; redrawStack(); } }, 'Clear')
  );
  visualArea.append(title, stackColumn);
  controlsArea.append(el('h3', {}, 'Stack Controls'), controlsForm);
  redrawStack();
  setPseudocode([
    { text: 'class Stack:', id: 's0' },
    { text: '    def push(x): data.append(x)', id: 'push' },
    { text: '    def pop(): return data.pop()', id: 'pop' },
    { text: '    def peek(): return data[-1]', id: 'peek' }
  ]);
}

/** Render stack top visually on the right side (reverse for display). */
function redrawStack() {
  const column = qs('#stack-col');
  column.innerHTML = '';
  const displayItems = stackData.slice().reverse(); // show top visually at left
  const row = el('div', { className: 'viz-row' });
  displayItems.forEach(val => row.append(el('div', { className: 'cell' }, val)));
  column.append(row);
}

function handlePeek(){
  const column = qs('#stack-col');
  const firstCell = column.querySelector('.cell');
  if(firstCell){ firstCell.classList.add('active'); highlightPseudo('peek'); setTimeout(()=>firstCell.classList.remove('active'),600); }
}
