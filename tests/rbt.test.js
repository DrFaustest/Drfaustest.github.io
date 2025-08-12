import { RBT } from '../Projects/DataStructuresVisualizer/js/lib/rbt-structure.js';

test('RBT properties hold after inserts', ()=>{ const t=new RBT(); [20,10,30,5,15,25,40,1,12,18,50,60,55].forEach(v=>t.insert(v)); expect(t.validate()).toBe(true); const inorder=t.inorder(); const sorted=[...inorder].sort((a,b)=>a-b); expect(inorder).toEqual(sorted); });
