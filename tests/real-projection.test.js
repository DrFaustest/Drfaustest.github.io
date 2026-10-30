import fs from 'node:fs';
import {prepareProjection} from '../learner-map/real-model.js';
const data=JSON.parse(fs.readFileSync(new URL('../learner-map/real-projection.json',import.meta.url),'utf8'));

test('real replay retains all 1001 positions and 188 nodes with immutable prefix states',()=>{
  const frames=prepareProjection(data);
  expect(frames).toHaveLength(1001);expect(frames.every(frame=>frame.length===188)).toBe(true);
  expect(frames[0][90]).toEqual({n:0,s:0,d:0.5});
  expect(frames[1][90]).toEqual({n:1,s:1,d:2/3});
  expect(frames[1000].filter(state=>state.n>0)).toHaveLength(148);
});

test('projection contains only the planned minimal field shape, not event or predictor traces',()=>{
  expect(Object.keys(data).sort()).toEqual(['schema','source','config','nodes','displayEdges','updates','graphValues'].sort());
  expect(data.nodes.every(node=>Object.keys(node).sort().join(',')==='id,x,y')).toBe(true);
  expect(data.nodes.map(node=>node.id)).toEqual(Array.from({length:188},(_,i)=>`C${String(i+1).padStart(3,'0')}`));
  expect(data.updates.every(update=>update.every(row=>row.length===4))).toBe(true);
  expect(data.displayEdges).toHaveLength(178);expect(data.displayEdges.every(edge=>edge.length===2)).toBe(true);
  expect(JSON.stringify(data)).not.toMatch(/"(?:events|outcome|hours|gapHours|item|forecasts|primaryTerms|student_id|recent)"\s*:/);
});

test('current and later updates cannot leak into earlier projected count states',()=>{
  const changed=structuredClone(data);changed.updates[999]=[];
  expect(prepareProjection(changed).slice(0,1000)).toEqual(prepareProjection(data).slice(0,1000));
});

test('invalid saved direct state fails explicitly rather than displaying altered arithmetic',()=>{
  const bad=structuredClone(data);bad.updates[0][0][3]=0.99;
  expect(()=>prepareProjection(bad)).toThrow('Invalid saved direct state');
});
