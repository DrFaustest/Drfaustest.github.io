import { AVL } from '../Projects/DataStructuresVisualizer/js/lib/avl-structure.js';

test('AVL maintains balance', ()=>{ const t=new AVL(); [30,10,40,5,20,35,50,25,27,26].forEach(v=>t.insert(v)); expect(t.verify()).toBe(true); const inorder=t.inorder(); const sorted=[...inorder].sort((a,b)=>a-b); expect(inorder).toEqual(sorted); });
