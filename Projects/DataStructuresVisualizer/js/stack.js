import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs } from './core.js';

// Backing array modeling the stack (end of array = top of stack).
let stackData = [];

/** Render the Stack visualizer (LIFO). */
export function renderStackVisualizer(visualArea, controlsArea) {
  stackData = [1, 2, 3];
  const title = el('h2', {}, 'Stack');
  const stackColumn = el('div', { id: 'stack-col' });
  const valueInput = el('input', { id: 'stack-val', placeholder: 'e.g. 9', type: 'number' });
  const controlsForm = createExplorerControls({
    title: 'Stack actions',
    intro: 'A stack uses last in, first out (LIFO). Every operation happens at the TOP.',
    fields: [controlField('Value to push', valueInput)],
    groups: [controlGroup('Use the top', 'one accessible end',
    el('button', {
      className: 'btn primary',
      onclick: () => {
        const value = Number(qs('#stack-val').value);
        if (qs('#stack-val').value === '' || Number.isNaN(value)) { announce('Enter a number to push.', { tone:'error', focus:'Use the Value to push field.', change:'The stack did not change.', why:'Push needs a value for the new top item.' }); return; }
        const oldTop = stackData.at(-1);
        stackData.push(value); redrawStack(); highlightPseudo('push');
        announce(`Pushed ${value} onto the top.`, { title:'Push: add a new top', tone:'move', focus:`${value} is marked TOP.`, change:`Top ${oldTop ?? 'empty'} → ${value}; size ${stackData.length-1} → ${stackData.length}.`, why:'The newest item must be the first one removed in a LIFO structure.' });
      }
    }, 'Push'),
    el('button', {
      className: 'btn',
      onclick: () => { if(!stackData.length){ announce('The stack is empty; pop is invalid.', { tone:'error', focus:'There is no TOP item.', change:'The stack stayed empty.', why:'Pop can only remove an existing top value.' }); return; } const oldSize=stackData.length; const value=stackData.pop(); redrawStack(); highlightPseudo('pop'); announce(`Popped ${value} from the top.`, { title:'Pop: remove the newest item', tone:'move', focus:stackData.length?`${stackData.at(-1)} is the new TOP.`:'The stack is now empty.', change:`Size ${oldSize} → ${stackData.length}.`, why:'LIFO removes the most recently pushed value first.' }); }
    }, 'Pop'),
    el('button', { className: 'btn', onclick: handlePeek }, 'Peek at top'),
    el('button', { className: 'btn', onclick: handleClear }, 'Clear stack')
    )]
  });
  visualArea.append(title, stackColumn);
  controlsArea.prepend(controlsForm);
  redrawStack();
  setPseudocode([
    { text: 'class Stack:', id: 's0' },
    { text: '    def push(x): data.append(x)', id: 'push' },
    { text: '    def pop(): return data.pop()', id: 'pop' },
    { text: '    def peek(): return data[-1]', id: 'peek' }
  ]);
  configureExplorer({ name:'Stack', goal:'Push, pop, or peek and keep your eyes on the TOP label.', focus:'The leftmost displayed cell is the top of this horizontal stack.', change:'Only the top can be added, read, or removed.', why:'Restricting access creates last-in, first-out behavior.' });
}

/** Render stack top visually on the right side (reverse for display). */
function redrawStack() {
  const column = qs('#stack-col');
  column.innerHTML = '';
  const displayItems = stackData.slice().reverse(); // show top visually at left
  const row = el('div', { className: 'viz-row' });
  if (displayItems.length) row.append(el('span', { className:'structure-label' }, 'TOP'));
  displayItems.forEach((val,index) => row.append(el('div', { className:`cell${index===0?' active':''}`, 'aria-label':`${index===0?'Top value':'Stack value'} ${val}` }, val)));
  if (!displayItems.length) row.append(el('span', { className:'structure-label muted' }, 'EMPTY STACK'));
  column.append(row);
}

function handlePeek(){
  const column = qs('#stack-col');
  const firstCell = column.querySelector('.cell');
  if(firstCell){ firstCell.classList.add('active'); highlightPseudo('peek'); announce(`The top value is ${stackData.at(-1)}.`, { title:'Peek: read without removing', tone:'inspect', focus:'The TOP cell stays highlighted.', change:`Size remains ${stackData.length}; no value moved.`, why:'Peek reveals the next value pop would remove without changing the stack.' }); }
  else announce('The stack is empty; there is no top value.', { tone:'error', change:'The stack stayed empty.', why:'Peek needs an existing top item.' });
}

function handleClear(){ const count=stackData.length; stackData=[]; redrawStack(); announce(`Cleared ${count} item${count===1?'':'s'} from the stack.`, { title:'Reset the stack', tone:'move', focus:'The EMPTY STACK label is visible.', change:`Size ${count} → 0.`, why:'Clearing returns the structure to its initial empty state.' }); }
