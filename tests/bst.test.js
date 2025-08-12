import { BST } from '../Projects/DataStructuresVisualizer/js/lib/bst-structure.js';

test('BST insert + inorder', ()=>{ const t=new BST(); [8,3,10,1,6,14,4,7,13].forEach(v=>t.insert(v)); expect(t.inorder()).toEqual([1,3,4,6,7,8,10,13,14]); });
test('BST remove leaf and internal', ()=>{ const t=new BST(); [5,3,7,2,4,6,8].forEach(v=>t.insert(v)); t.remove(2); t.remove(7); expect(t.inorder()).toEqual([3,4,5,6,8]); });
