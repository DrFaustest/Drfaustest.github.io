// Pure graph algorithms extracted for testing
// Representation: adjacency list {node: [{to, weight}...]}

export function bfs(adj, start){
  const visited = new Set([start]);
  const order=[]; const q=[start];
  while(q.length){
    const u=q.shift(); order.push(u);
    for(const e of (adj[u]||[])) if(!visited.has(e.to)){ visited.add(e.to); q.push(e.to);}  
  }
  return order;
}

export function dfs(adj, start){
  const visited=new Set(); const order=[];
  (function rec(u){ visited.add(u); order.push(u); for(const e of (adj[u]||[])) if(!visited.has(e.to)) rec(e.to); })(start);
  return order;
}

export function dijkstra(adj, start){
  const dist={}; const prev={}; const pq=[]; // simple array pq for small graphs
  for(const v in adj){ dist[v]=Infinity; prev[v]=null; }
  dist[start]=0; pq.push({v:start,d:0});
  while(pq.length){
    let idx=0; for(let i=1;i<pq.length;i++) if(pq[i].d<pq[idx].d) idx=i; // extract min
    const {v,d}=pq.splice(idx,1)[0]; if(d!==dist[v]) continue;
    for(const e of (adj[v]||[])){
      const nd=d+ (e.weight??1);
      if(nd < dist[e.to]){ dist[e.to]=nd; prev[e.to]=v; pq.push({v:e.to,d:nd}); }
    }
  }
  return {dist, prev};
}
