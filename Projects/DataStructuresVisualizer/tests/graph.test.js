import { bfs, dfs, dijkstra } from '../js/lib/graph-algorithms.js';

describe('Graph Algorithms', () => {
  const adj={
    A:[{to:'B',weight:2},{to:'C',weight:5}],
    B:[{to:'C',weight:1},{to:'D',weight:4}],
    C:[{to:'D',weight:1}],
    D:[]
  };
  test('BFS order',()=>{
    expect(bfs(adj,'A')).toEqual(['A','B','C','D']);
  });
  test('DFS order',()=>{
    expect(dfs(adj,'A')).toEqual(['A','B','C','D']);
  });
  test('Dijkstra distances & predecessors',()=>{
    const {dist, prev} = dijkstra(adj,'A');
    expect(dist).toEqual({A:0,B:2,C:3,D:4});
    // One valid predecessor chain: A->B->C->D
    expect(prev.D).toBe('C');
    expect(prev.C).toBe('B');
    expect(prev.B).toBe('A');
  // reconstruct path from D back to A
  const path=[]; let cur='D'; while(cur){ path.push(cur); if(cur==='A') break; cur=prev[cur]; }
  path.reverse();
  expect(path).toEqual(['A','B','C','D']);
  });
});
