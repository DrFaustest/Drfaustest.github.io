import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs } from './core.js';

// FIFO queue backing array (front at index 0).
let queueData = [];

/** Render the Queue visualizer. */
export function renderQueueVisualizer(visualArea, controlsArea) {
  queueData = [5, 6, 7];
  const title = el('h2', {}, 'Queue');
  const queueRow = el('div', { id: 'queue-row', className: 'viz-row' });
  const valueInput = el('input', { id: 'queue-val', placeholder: 'e.g. 9', type: 'number' });
  const controlsForm = createExplorerControls({
    title:'Queue actions',
    intro:'A queue uses first in, first out (FIFO). Values join at the REAR and leave from the FRONT.',
    fields:[controlField('Value to enqueue', valueInput)],
    groups:[controlGroup('Use the queue', 'rear in · front out',
      el('button', { className:'btn primary', onclick: handleEnqueue }, 'Enqueue at rear'),
      el('button', { className:'btn', onclick: handleDequeue }, 'Dequeue front'),
      el('button', { className:'btn', onclick: handlePeek }, 'Peek at front'),
      el('button', { className:'btn', onclick: handleClear }, 'Clear queue')
    )]
  });
  visualArea.append(title, queueRow);
  controlsArea.prepend(controlsForm);
  redrawQueue();
  setPseudocode([
    { text: 'class Queue:', id: 'q0' },
    { text: '    def enqueue(x): data.append(x)', id: 'enq' },
    { text: '    def dequeue(): return data.pop(0)', id: 'deq' },
    { text: '    def peek(): return data[0]', id: 'peek' }
  ]);
  configureExplorer({ name:'Queue', goal:'Watch data enter at REAR and leave at FRONT.', focus:'The endpoint labels show which side each operation uses.', change:'Enqueue adds one cell; dequeue removes the oldest cell.', why:'Separate entry and exit ends create first-in, first-out behavior.' });
}

/** Redraw queue cells left-to-right (front on the left). */
function redrawQueue() {
  const row = qs('#queue-row');
  row.innerHTML = '';
  if (!queueData.length) { row.append(el('span', { className:'structure-label muted' }, 'EMPTY QUEUE')); return; }
  row.append(el('span', { className:'structure-label' }, 'FRONT'));
  queueData.forEach((value,index) => row.append(el('div', { className:`cell${index===0?' active':''}`, 'aria-label':`${index===0?'Front value':'Queue value'} ${value}` }, value)));
  row.append(el('span', { className:'structure-label' }, 'REAR'));
}

function handleEnqueue(){ const input=qs('#queue-val'); const value=Number(input.value); if(input.value==='' || Number.isNaN(value)){ announce('Enter a number to enqueue.', { tone:'error', focus:'Use the Value to enqueue field.', change:'The queue did not change.', why:'Enqueue needs a new value to place at the rear.' }); return; } const oldRear=queueData.at(-1); queueData.push(value); redrawQueue(); highlightPseudo('enq'); announce(`Enqueued ${value} at the rear.`, { title:'Enqueue: join the line', tone:'move', focus:`${value} is next to the REAR label.`, change:`Rear ${oldRear ?? 'empty'} → ${value}; size ${queueData.length-1} → ${queueData.length}.`, why:'New arrivals wait behind older values in a FIFO structure.' }); }

function handleDequeue(){ if(!queueData.length){ announce('The queue is empty; dequeue is invalid.', { tone:'error', focus:'There is no FRONT value.', change:'The queue stayed empty.', why:'Dequeue can only remove an existing oldest value.' }); return; } const oldSize=queueData.length; const value=queueData.shift(); redrawQueue(); highlightPseudo('deq'); announce(`Dequeued ${value} from the front.`, { title:'Dequeue: serve the oldest item', tone:'move', focus:queueData.length?`${queueData[0]} is now at FRONT.`:'The queue is now empty.', change:`Size ${oldSize} → ${queueData.length}.`, why:'FIFO always removes the value that has waited longest.' }); }

function handlePeek(){
  const first = document.querySelector('#queue-row .cell');
  if(first){ first.classList.add('active'); highlightPseudo('peek'); announce(`The front value is ${queueData[0]}.`, { title:'Peek: inspect the next item out', tone:'inspect', focus:'The FRONT cell remains highlighted.', change:`Size remains ${queueData.length}; no value moved.`, why:'Peek answers what dequeue would remove without changing the queue.' }); }
  else announce('The queue is empty; there is no front value.', { tone:'error', change:'The queue stayed empty.', why:'Peek needs an existing front item.' });
}

function handleClear(){ const count=queueData.length; queueData=[]; redrawQueue(); announce(`Cleared ${count} item${count===1?'':'s'} from the queue.`, { title:'Reset the queue', tone:'move', focus:'The EMPTY QUEUE label is visible.', change:`Size ${count} → 0.`, why:'Clearing returns the structure to its initial empty state.' }); }
