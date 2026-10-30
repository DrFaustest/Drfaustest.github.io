// Deliberately synthetic explanatory model. No imported learner data or fitted parameters.
export const concepts = [
  {id:'A', x:80, y:75}, {id:'B', x:270, y:75}, {id:'C', x:175, y:175},
  {id:'D', x:80, y:280}, {id:'E', x:270, y:280}, {id:'F', x:370, y:175}
];
export const edges = [['A','B'],['A','C'],['B','C'],['C','D'],['C','E'],['E','F']];
const event = (tags, correct, day) => ({tags, correct, day});
export const stories = {
  practice: { title:'Direct practice on A', note:'Repeated correct responses raise A’s direct estimate. Errors lower it. The full history stays visible; the line is a model summary, not a learning-gain measure.', events:[
    event(['A'],0,1), event(['A'],0,1), event(['B'],1,2), event(['A'],1,3),
    event(['C'],1,3), event(['A'],1,4), event(['A'],1,5), event(['A','B'],1,6),
    event(['A'],1,8), event(['D'],0,10), event(['A'],1,14), event(['A'],0,21)
  ]},
  neighbors: { title:'Neighbors change; A is untouched', note:'A has no direct responses at any record. Its direct estimate stays at the 0.50 prior while its smoothed estimate moves with B and C. The last three incorrect responses reverse part of that movement.', events:[
    event(['B'],1,1), event(['C'],1,1), event(['B'],1,2), event(['C'],1,3),
    event(['B'],1,4), event(['C'],1,5), event(['B','C'],1,6), event(['B'],1,8),
    event(['C'],1,10), event(['B'],0,14), event(['C'],0,18), event(['B','C'],0,21)
  ]}
};
export function replay(events) {
  const state = Object.fromEntries(concepts.map(({id}) => [id, {n:0,s:0,d:0.5,g:0.5,last:null,recent:[]}]));
  const frames = [];
  function snapshot() {
    for (const {id} of concepts) {
      const neighbors = edges.flatMap(([a,b]) => a===id ? [b] : b===id ? [a] : []);
      const mean = neighbors.length ? neighbors.reduce((sum,key)=>sum+state[key].d,0)/neighbors.length : state[id].d;
      state[id].neighbor = mean;
      state[id].g = 0.8*state[id].d+0.2*mean;
    }
    frames.push(structuredClone(state));
  }
  snapshot();
  events.forEach(({tags,correct},index) => {
    for (const id of new Set(tags)) {
      const item = state[id];
      item.n++; item.s+=correct; item.d=(1+item.s)/(2+item.n); item.last=index+1;
      item.recent=[...item.recent,correct].slice(-5);
    }
    snapshot();
  });
  return frames;
}
// Piecewise orange → light neutral → blue; numeric labels carry the same information.
export function color(value) {
  const stops = [[182,76,0],[255,246,229],[8,104,172]];
  const half = value<=0.5 ? 0 : 1;
  const t = Math.max(0,Math.min(1,(value-half*0.5)*2));
  return `rgb(${stops[half].map((v,i)=>Math.round(v+(stops[half+1][i]-v)*t)).join(',')})`;
}
