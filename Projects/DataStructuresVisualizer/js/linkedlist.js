import { announce, configureExplorer, controlField, controlGroup, createExplorerControls, el, highlightPseudo, setPseudocode, qs, setTeardown } from './core.js';

// Node for a singly linked list.
class ListNode { constructor(value, next = null) { this.val = value; this.next = next; } }

// Minimal singly linked list implementation (only what the UI needs).
class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  // Append to tail.
  push(value) {
    if (!this.head) { this.head = new ListNode(value); }
    else { let cursor = this.head; while (cursor.next) cursor = cursor.next; cursor.next = new ListNode(value); }
    this.size++;
  }
  // Insert at an index (0 => head). If index exceeds length, inserts at end logically via traversal.
  insertAt(value, index) {
    if (index <= 0 || !this.head) { this.head = new ListNode(value, this.head); this.size++; return; }
    let i = 0, previous = null, current = this.head;
    while (current && i < index) { previous = current; current = current.next; i++; }
    previous.next = new ListNode(value, current); this.size++;
  }
  // Remove node at index if present.
  removeAt(index) {
    if (!this.head) return;
    if (index <= 0) { this.head = this.head.next; this.size--; return; }
    let i = 0, previous = null, current = this.head;
    while (current && i < index) { previous = current; current = current.next; i++; }
    if (current) { previous.next = current.next; this.size--; }
  }
  // Remove first node containing value
  removeValue(value) {
    if (!this.head) return false;
    if (this.head.val === value) { this.head = this.head.next; this.size--; return true; }
    let prev = this.head, cur = this.head.next;
    while (cur) {
      if (cur.val === value) { prev.next = cur.next; this.size--; return true; }
      prev = cur; cur = cur.next;
    }
    return false;
  }
}

let linkedListInstance;
let searchTimer = null;

/** Render the Linked List visualizer. */
export function renderLinkedListVisualizer(visualArea, controlsArea) {
  linkedListInstance = new LinkedList();
  [10, 20, 30].forEach(v => linkedListInstance.push(v));
  const title = el('h2', {}, 'Linked List');
  const listRow = el('div', { className: 'viz-row', id: 'list-row' });
  const lengthBadge = el('span', { id: 'list-length', style: { marginLeft: 'auto', fontSize: '.8rem', opacity: .75 } }, 'len: 0');
  const valueInput = el('input', { id: 'list-val', placeholder: 'e.g. 40', type: 'number' });
  const indexInput = el('input', { id: 'list-idx', placeholder: 'leave blank for tail', type: 'number', min: 0 });
  const searchInput = el('input', { id: 'list-search', placeholder: 'e.g. 20', type: 'number' });
  const controlsForm = createExplorerControls({
    title:'Linked-list actions',
    intro:'Each node stores a value and a next reference. Follow the arrows from HEAD until NULL.',
    fields:[controlField('Value', valueInput), controlField('Index (optional)', indexInput), controlField('Search target', searchInput)],
    groups:[
      controlGroup('Add a node', 'uses Value + optional Index',
    el('button', {
      className: 'btn primary',
      onclick: () => {
        const valueInput = qs('#list-val');
        const value = Number(valueInput.value);
        const indexRaw = qs('#list-idx').value;
        const index = indexRaw === '' ? null : Number(indexRaw);
        if (valueInput.value === '' || Number.isNaN(value)) { announce('Enter a number before adding a node.', { tone:'error', change:'The list did not change.', why:'A new node needs a stored value.' }); return; }
        const oldSize=linkedListInstance.size;
        const actualIndex=index==null?oldSize:Math.min(Math.max(0,index),oldSize);
        if (index == null) { linkedListInstance.push(value); highlightPseudo('push2'); }
        else { linkedListInstance.insertAt(value, index); highlightPseudo('ins2'); }
        redrawLinkedList();
        document.querySelectorAll('#list-row .node')[actualIndex]?.classList.add('active');
        announce(`Inserted node ${value} at position ${actualIndex}.`, { title:index==null?'Append a tail node':'Reconnect two references', tone:'move', focus:`The new node at position ${actualIndex} is highlighted.`, change:`Size ${oldSize} → ${linkedListInstance.size}.`, why:index==null?'The old tail now points to the new node, which points to NULL.':'The previous node points to the new node, and the new node points to the former next node.' });
      }
    }, 'Insert node')),
      controlGroup('Remove or rearrange', 'uses Index or Value',
        el('button', { className:'btn', onclick:handleRemoveAt }, 'Remove at index'),
        el('button', { className:'btn', onclick:handleRemoveValue }, 'Remove first value'),
        el('button', { className:'btn', onclick:handleReverse }, 'Reverse arrows')
      ),
      controlGroup('Inspect or reset', 'uses Search target',
        el('button', { className:'btn', onclick:handleSearch }, 'Find value'),
        el('button', { className:'btn', onclick:handleClear }, 'Clear list')
      )
    ]
  });
  visualArea.append(title, lengthBadge, el('div', { className:'visual-legend' }, el('span', { className:'legend-item' }, el('span',{className:'legend-swatch active'}),'node being visited'), el('span',{className:'legend-item'},el('span',{className:'legend-swatch complete'}),'match found')), listRow);
  controlsArea.prepend(controlsForm);
  redrawLinkedList();
  setPseudocode([
    { text: 'class Node:', id: 'n1' },
    { text: '    def __init__(self,v,next=None):', id: 'n2' },
    { text: '        self.v=v; self.next=next', id: 'n3' },
    { text: 'def push(head,v):', id: 'push1' },
    { text: '    if not head: return Node(v)', id: 'push1b' },
    { text: '    cur=head; while cur.next: cur=cur.next', id: 'push2' },
    { text: '    cur.next=Node(v)', id: 'push2b' },
    { text: 'def insert_at(head,i,v): traverse to i-1', id: 'ins1' },
    { text: 'def search(head,x):', id: 's1' },
    { text: '    cur=head; i=0', id: 's2' },
    { text: '    while cur:', id: 's3' },
    { text: '        if cur.v==x: return i', id: 's4' },
    { text: '        cur=cur.next; i+=1', id: 's5' },
    { text: '    return -1', id: 's6' },
    { text: 'def reverse(head):', id: 'rev1' },
    { text: '    prev=None; cur=head', id: 'rev2' },
    { text: '    while cur: nxt=cur.next; cur.next=prev; prev=cur; cur=nxt', id: 'rev3' },
    { text: '    return prev', id: 'rev4' }
  ]);
  configureExplorer({ name:'Linked list', goal:'Follow references from HEAD to NULL while each action explains which link changes.', focus:'Arrows are next references; the highlighted node is being inspected or changed.', change:'Insert and remove operations reconnect references rather than shifting every node.', why:'Nodes can live separately because references establish their order.' });
  setTeardown(() => window.clearTimeout(searchTimer));
}

/** Redraw linked list as sequence of nodes + arrows. */
function redrawLinkedList() {
  const row = qs('#list-row');
  row.innerHTML = '';
  row.append(el('span', { className:'structure-label' }, 'HEAD'));
  let cursor = linkedListInstance.head;
  while (cursor) {
    row.append(el('div', { className: 'node' }, el('span', { className: 'val' }, cursor.val)));
    if (cursor.next) row.append(el('div', { className: 'arrow' }));
    cursor = cursor.next;
  }
  row.append(el('span', { className:'structure-label muted' }, 'NULL'));
  const badge = qs('#list-length'); if (badge) badge.textContent = 'len: ' + linkedListInstance.size;
}

function handleRemoveAt(){ const raw=qs('#list-idx').value; const index=Number(raw); if(raw==='' || Number.isNaN(index) || index<0 || index>=linkedListInstance.size){ announce('Enter an index that exists before removing.', { tone:'error', focus:`Valid indexes are 0 through ${Math.max(linkedListInstance.size-1,0)}.`, change:'The list did not change.', why:'A node must exist before its incoming reference can bypass it.' }); return; } const before=linkedListInstance.size; linkedListInstance.removeAt(index); redrawLinkedList(); announce(`Removed the node at position ${index}.`, { title:'Bypass one node', tone:'move', focus:index===0?'HEAD now points to the former second node.':`The node before position ${index} now skips the removed node.`, change:`Size ${before} → ${linkedListInstance.size}.`, why:'Removal reconnects one incoming reference to the removed node’s successor.' }); }

function handleRemoveValue(){ const input=qs('#list-val'); const value=Number(input.value); if(input.value==='' || Number.isNaN(value)){ announce('Enter the value to remove.', { tone:'error', change:'The list did not change.', why:'The operation searches for the first matching node.' }); return; } const removed=linkedListInstance.removeValue(value); redrawLinkedList(); announce(removed?`Removed the first node containing ${value}.`:`No node contains ${value}.`, { title:removed?'Find, then bypass the match':'Removal complete: no match', tone:removed?'move':'complete', focus:removed?'The neighboring reference now skips that node.':'The search reached NULL.', change:removed?`The list size is now ${linkedListInstance.size}.`:'The list did not change.', why:'Only the first equal node is removed so the remaining order stays intact.' }); }

function handleReverse(){
  const oldHead=linkedListInstance.head?.val;
  let prev=null, cur=linkedListInstance.head;
  while(cur){ const nxt=cur.next; cur.next=prev; prev=cur; cur=nxt; }
  linkedListInstance.head=prev; redrawLinkedList(); highlightPseudo('rev3'); announce('Reversed every next reference in the list.', { title:'Reverse the arrows', tone:'move', focus:'HEAD moved to the former tail; every arrow points the opposite way.', change:`HEAD ${oldHead ?? 'NULL'} → ${linkedListInstance.head?.val ?? 'NULL'}.`, why:'Changing references reverses node order without moving or recreating the nodes.' });
}

function handleSearch(){
  const input=qs('#list-search'); const target=Number(input.value); if(input.value==='' || Number.isNaN(target)) { announce('Enter a numeric search target.', { tone:'error', change:'The list did not change.', why:'Search needs a value to compare with each node.' }); return; }
  window.clearTimeout(searchTimer);
  let cur=linkedListInstance.head, i=0; const nodes=Array.from(document.querySelectorAll('#list-row .node'));
  function step(){ nodes.forEach(n=>n.classList.remove('active','ok')); if(!cur){ highlightPseudo('s6'); announce(`${target} was not found after following every next reference.`, { title:'Search reached NULL', tone:'complete', focus:'NULL marks the end of the list.', change:'The list was read but not changed.', why:'A linked list must be traversed from HEAD because it has no direct index access.' }); return; }
    nodes[i].classList.add('active'); announce(`Compare ${target} with node ${i}, which stores ${cur.val}.`, { title:'Follow the next reference', tone:'compare', focus:`Node ${i} is highlighted.`, change:'The search cursor moved; the list did not change.', why:'Each node only knows which node comes next.', record:false }); if(cur.val===target){ nodes[i].classList.add('ok'); highlightPseudo('s4'); announce(`Found ${target} at node ${i}.`, { title:'Search complete: match found', tone:'complete', focus:`Node ${i} is outlined as the match.`, change:`The search stopped after ${i+1} node${i?'s':''}; the list did not change.`, why:'The traversal can stop as soon as equality is confirmed.' }); return; }
    cur=cur.next; i++; searchTimer=window.setTimeout(step,300); }
  highlightPseudo('s3'); step();
}

function handleClear(){ const count=linkedListInstance.size; linkedListInstance=new LinkedList(); redrawLinkedList(); announce(`Cleared ${count} node${count===1?'':'s'} from the list.`, { title:'Reset the list', tone:'move', focus:'HEAD now points directly to NULL.', change:`Size ${count} → 0.`, why:'An empty linked list has no head node.' }); }
