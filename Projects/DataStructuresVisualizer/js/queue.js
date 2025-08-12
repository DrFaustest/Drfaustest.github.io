import { el, highlightPseudo, setPseudocode, qs } from './core.js';

// FIFO queue backing array (front at index 0).
let queueData = [];

/** Render the Queue visualizer. */
export function renderQueueVisualizer(visualArea, controlsArea) {
  queueData = [5, 6, 7];
  const title = el('h2', {}, 'Queue');
  const queueRow = el('div', { id: 'queue-row', className: 'viz-row' });
  const controlsForm = el('div', {},
    el('input', { id: 'queue-val', placeholder: 'Value', type: 'number' }),
    el('button', { className: 'btn', onclick: () => { const value = Number(qs('#queue-val').value); if (!Number.isNaN(value)) { queueData.push(value); redrawQueue(); highlightPseudo('enq'); } } }, 'Enqueue'),
    el('button', { className: 'btn', onclick: () => { queueData.shift(); redrawQueue(); highlightPseudo('deq'); } }, 'Dequeue'),
    el('button', { className: 'btn', onclick: handlePeek }, 'Peek'),
    el('button', { className: 'btn', onclick: () => { queueData = []; redrawQueue(); } }, 'Clear')
  );
  visualArea.append(title, queueRow);
  controlsArea.append(el('h3', {}, 'Queue Controls'), controlsForm);
  redrawQueue();
  setPseudocode([
    { text: 'class Queue:', id: 'q0' },
    { text: '    def enqueue(x): data.append(x)', id: 'enq' },
    { text: '    def dequeue(): return data.pop(0)', id: 'deq' },
    { text: '    def peek(): return data[0]', id: 'peek' }
  ]);
}

/** Redraw queue cells left-to-right (front on the left). */
function redrawQueue() {
  const row = qs('#queue-row');
  row.innerHTML = '';
  queueData.forEach(value => row.append(el('div', { className: 'cell' }, value)));
}

function handlePeek(){
  const first = document.querySelector('#queue-row .cell');
  if(first){ first.classList.add('active'); highlightPseudo('peek'); setTimeout(()=>first.classList.remove('active'),600); }
}
