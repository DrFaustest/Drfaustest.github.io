import { LinkedList } from '../Projects/DataStructuresVisualizer/js/lib/linked-list-structure.js';

test('LinkedList push / insertAt / removeAt', ()=>{ const l=new LinkedList(); l.push(10); l.push(20); l.insertAt(5,0); l.insertAt(15,3); // append at end
  expect(l.toArray()).toEqual([5,10,20,15]); l.removeAt(1); expect(l.toArray()).toEqual([5,20,15]); l.removeAt(0); expect(l.toArray()).toEqual([20,15]); });
