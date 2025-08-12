import { el, highlightPseudo, setPseudocode, qs } from './core.js';

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

/** Render the Linked List visualizer. */
export function renderLinkedListVisualizer(visualArea, controlsArea) {
  linkedListInstance = new LinkedList();
  [10, 20, 30].forEach(v => linkedListInstance.push(v));
  const title = el('h2', {}, 'Linked List');
  const listRow = el('div', { className: 'viz-row', id: 'list-row' });
  const lengthBadge = el('span', { id: 'list-length', style: { marginLeft: 'auto', fontSize: '.8rem', opacity: .75 } }, 'len: 0');
  const controlsForm = el('div', { style:{display:'flex', flexWrap:'wrap', gap:'.5rem', alignItems:'center'} },
    el('input', { id: 'list-val', placeholder: 'Value', type: 'number' }),
    el('input', { id: 'list-idx', placeholder: 'Index', type: 'number', min: 0 }),
    el('button', {
      className: 'btn',
      onclick: () => {
        const value = Number(qs('#list-val').value);
        const index = Number(qs('#list-idx').value);
        if (Number.isNaN(value)) return;
        if (Number.isNaN(index)) { linkedListInstance.push(value); highlightPseudo('push2'); }
        else { linkedListInstance.insertAt(value, index); highlightPseudo('ins2'); }
        redrawLinkedList();
      }
    }, 'Insert/Push'),
  el('button', { className: 'btn', onclick: () => { const index = Number(qs('#list-idx').value); if (!Number.isNaN(index)) { linkedListInstance.removeAt(index); redrawLinkedList(); } } }, 'Remove At'),
  el('button', { className: 'btn', onclick: handleReverse }, 'Reverse'),
  el('input', { id: 'list-search', placeholder: 'Search', type: 'number', style:{width:'70px'} }),
  el('button', { className: 'btn', onclick: handleSearch }, 'Search'),
  el('button', { className: 'btn', onclick: () => { const v = Number(qs('#list-val').value); if (!Number.isNaN(v)) { linkedListInstance.removeValue(v); redrawLinkedList(); } } }, 'Delete Val'),
  el('button', { className: 'btn', onclick: () => { linkedListInstance = new LinkedList(); redrawLinkedList(); } }, 'Clear'),
  lengthBadge
  );
  visualArea.append(title, listRow);
  controlsArea.append(el('h3', {}, 'Linked List Controls'), controlsForm);
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
}

/** Redraw linked list as sequence of nodes + arrows. */
function redrawLinkedList() {
  const row = qs('#list-row');
  row.innerHTML = '';
  let cursor = linkedListInstance.head;
  while (cursor) {
    row.append(el('div', { className: 'node' }, el('span', { className: 'val' }, cursor.val)));
    if (cursor.next) row.append(el('div', { className: 'arrow' }));
    cursor = cursor.next;
  }
  const badge = qs('#list-length'); if (badge) badge.textContent = 'len: ' + linkedListInstance.size;
}

function handleReverse(){
  let prev=null, cur=linkedListInstance.head;
  while(cur){ const nxt=cur.next; cur.next=prev; prev=cur; cur=nxt; }
  linkedListInstance.head=prev; redrawLinkedList(); highlightPseudo('rev3');
}

function handleSearch(){
  const target=Number(qs('#list-search').value); if(Number.isNaN(target)) return;
  let cur=linkedListInstance.head, i=0; const nodes=Array.from(document.querySelectorAll('#list-row .node'));
  function step(){ nodes.forEach(n=>n.classList.remove('active','ok')); if(!cur){ highlightPseudo('s6'); return; }
    nodes[i].classList.add('active'); if(cur.val===target){ nodes[i].classList.add('ok'); highlightPseudo('s4'); return; }
    cur=cur.next; i++; setTimeout(step,300); }
  highlightPseudo('s3'); step();
}
