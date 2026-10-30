// Reconstruct saved count snapshots from a field-minimized projection, without fitting.
export function prepareProjection(data) {
  if(data.schema!=='ednet-derived-map-projection-v1'||data.nodes.length!==188||data.updates.length!==1000||data.graphValues.length!==1001) throw new Error('Unexpected saved replay dimensions');
  const current=data.nodes.map(()=>({n:0,s:0,d:0.5})),frames=[current.slice()];
  for(const updates of data.updates) {
    for(const [index,n,s,d] of updates) {
      if(!Number.isInteger(index)||index<0||index>=188||!Number.isInteger(n)||!Number.isInteger(s)||s<0||s>n||d!==(1+s)/(2+n)) throw new Error('Invalid saved direct state');
      current[index]={n,s,d};
    }
    frames.push(current.slice());
  }
  if(data.graphValues.some(frame=>frame.length!==188||frame.some(v=>!Number.isFinite(v)||v<0||v>1))) throw new Error('Invalid saved graph state');
  return frames;
}
