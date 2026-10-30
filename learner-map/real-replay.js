import {prepareProjection} from './real-model.js';
import {color} from './model.js';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const fixed=v=>v.toFixed(6);
function svg(tag,attrs={},text='') {const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);el.textContent=text;return el;}

async function start() {
  const response=await fetch(new URL('./real-projection.json',import.meta.url));
  if(!response.ok)throw new Error(`Saved data unavailable (${response.status})`);
  const data=await response.json(),frames=prepareProjection(data),count=frames.length-1;
  let step=0,selected=data.updates[0][0][0],mode='direct',timer=null,chartConcept=-1;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),nodes=[];
  const graph=$('concept-graph');
  const xy=data.nodes.map(({x,y})=>[50+x*900,35+y*500]);
  for(const [a,b] of data.displayEdges)graph.append(svg('line',{x1:xy[a][0],y1:xy[a][1],x2:xy[b][0],y2:xy[b][1],class:'real-edge'}));
  data.nodes.forEach(({id},index)=>{
    const [x,y]=xy[index],circle=svg('circle',{cx:x,cy:y,r:6,class:'real-node'}),title=svg('title');
    circle.append(title);circle.addEventListener('click',()=>{selected=index;$('concept').value=index;render();});graph.append(circle);nodes.push(circle);
    const option=document.createElement('option');option.value=index;option.textContent=`Concept ${id}`;$('concept').append(option);
  });
  const ring=svg('circle',{r:11,fill:'none',stroke:'#17201e','stroke-width':2,'pointer-events':'none'});
  const label=svg('text',{class:'real-node-label','pointer-events':'none'});graph.append(ring,label);
  $('concept').value=selected;
  const chart=$('trajectory'),x=i=>52+i/count*560,y=v=>180-v*150;
  for(const value of [0,0.5,1]){chart.append(svg('line',{x1:52,y1:y(value),x2:612,y2:y(value),stroke:'#d9d0be'}));chart.append(svg('text',{x:42,y:y(value)+5,'text-anchor':'end'},value.toFixed(1)));}
  for(const i of [0,250,500,750,1000])chart.append(svg('text',{x:x(i),y:203,'text-anchor':'middle'},String(i)));
  chart.append(svg('text',{x:332,y:225,'text-anchor':'middle'},'Interaction position (not elapsed time)'));
  const directPath=svg('path',{fill:'none',stroke:'#084f7b','stroke-width':2.5}),graphPath=svg('path',{fill:'none',stroke:'#984200','stroke-width':2.5,'stroke-dasharray':'7 5'});
  const cursor=svg('line',{y1:23,y2:183,stroke:'#17201e','stroke-width':1.5});chart.append(directPath,graphPath,cursor);
  function stop(){if(timer!==null)clearInterval(timer);timer=null;$('play').textContent='Play';$('play').setAttribute('aria-pressed','false');}
  function setStep(value){stop();step=Math.max(0,Math.min(count,Number(value)));render();}
  function render(announce=true){
    const states=frames[step],state=states[selected],g=data.graphValues[step][selected],previous=frames[Math.max(0,step-1)][selected];
    nodes.forEach((circle,index)=>{const item=states[index],value=mode==='direct'?item.d:data.graphValues[step][index];circle.setAttribute('fill',mode==='direct'&&item.n===0?'#fffdf8':color(value));circle.setAttribute('stroke-dasharray',item.n===0?'3 2':'none');circle.firstChild.textContent=`${data.nodes[index].id}: d ${fixed(item.d)}, g ${fixed(data.graphValues[step][index])}, n ${item.n}`;});
    const [sx,sy]=xy[selected];ring.setAttribute('cx',sx);ring.setAttribute('cy',sy);label.setAttribute('x',Math.min(870,sx+15));label.setAttribute('y',Math.max(18,sy-14));label.textContent=`${data.nodes[selected].id} · ${(mode==='direct'?state.d:g).toFixed(3)}`;
    $('frame-label').textContent=`After interaction ${step.toLocaleString()} of 1,000`;
    $('legend-title').textContent=`${mode==='direct'?'Direct estimate d':'Neighbor-smoothed estimate g'} · fixed 0–1 scale`;
    $('inspect-title').textContent=`Concept ${data.nodes[selected].id}`;
    $('event-note').textContent=step===0?'Initial prior: no responses have been observed.':`At this interaction: direct count change ${state.n-previous.n}, correct-count change ${state.s-previous.s}. ${state.n===previous.n&&g!==data.graphValues[step-1][selected]?'The smoothed estimate moved without a new direct observation.':''}`;
    const details=[['Correct / observations',`${state.s} / ${state.n}`],['Direct estimate d',fixed(state.d)],['Smoothed estimate g',fixed(g)],['Currently displayed',(mode==='direct'?state.d:g).toFixed(6)]];
    $('state-details').replaceChildren(...details.map(([text,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=text;dd.textContent=value;div.append(dt,dd);return div;}));
    $('direct-calc').textContent=`d = (1 + ${state.s}) / (2 + ${state.n}) = ${fixed(state.d)}`;
    $('neighbor-calc').textContent=`Direct component: 0.8 × d = ${fixed(0.8*state.d)}`;
    $('smooth-calc').textContent=`Saved neighbor component: g − 0.8d = ${fixed(g-0.8*state.d)}; combined g = ${fixed(g)}`;
    $('scrub').value=step;$('record-output').textContent=`${step.toLocaleString()} / 1,000`;$('back').disabled=step===0;$('next').disabled=step===count;$('last').disabled=step===count;
    $('trajectory-title').textContent=`${data.nodes[selected].id} across all 1,000 interactions`;
    if(chartConcept!==selected){
      for(const [path,key] of [[directPath,'d'],[graphPath,'g']]){let d=`M${x(0)},${y(key==='d'?frames[0][selected].d:data.graphValues[0][selected])}`;for(let i=1;i<=count;i++)d+=` H${x(i)} V${y(key==='d'?frames[i][selected].d:data.graphValues[i][selected])}`;path.setAttribute('d',d);}chartConcept=selected;
    }
    cursor.setAttribute('x1',x(step));cursor.setAttribute('x2',x(step));
    $('table-caption').textContent=`All 188 saved concept states after interaction ${step.toLocaleString()}; six-decimal estimates`;
    if($('state-table').closest('details').open){$('state-table').replaceChildren(...data.nodes.map(({id},index)=>{const item=states[index],tr=document.createElement('tr');tr.dataset.selected=String(index===selected);[id,item.s,item.n,fixed(item.d),fixed(data.graphValues[step][index])].forEach((value,k)=>{const cell=document.createElement(k===0?'th':'td');if(k===0)cell.scope='row';cell.textContent=value;tr.append(cell);});return tr;}));}
    if(announce)$('replay-status').textContent=`After interaction ${step.toLocaleString()}. ${step<count?`Before interaction ${(step+1).toLocaleString()} is observed.`:'Full replay complete.'} ${data.nodes[selected].id}: d ${fixed(state.d)}, g ${fixed(g)}, n ${state.n}.`;
  }
  $('view').addEventListener('change',()=>{stop();mode=$('view').value;render();});
  function guide(index,view){stop();step=1;selected=index;mode=view;$('concept').value=index;$('view').value=view;render();}
  $('guide-direct').addEventListener('click',()=>guide(data.updates[0][0][0],'direct'));
  $('guide-neighbor').addEventListener('click',()=>guide(0,'smoothed'));
  $('concept').addEventListener('change',()=>{selected=Number($('concept').value);render();});
  $('scrub').addEventListener('input',()=>setStep($('scrub').value));$('back').addEventListener('click',()=>setStep(step-1));$('next').addEventListener('click',()=>setStep(step+1));$('reset').addEventListener('click',()=>setStep(0));$('last').addEventListener('click',()=>setStep(count));$('speed').addEventListener('change',stop);
  $('state-table').closest('details').addEventListener('toggle',()=>render());
  $('play').addEventListener('click',()=>{if(timer!==null){stop();render();return;}if(reduced.matches)return;if(step===count)step=0;$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');render();timer=setInterval(()=>{step++;if(step>=count){stop();render();}else render(false);},Number($('speed').value));});
  function motionPreference(){stop();$('play').disabled=reduced.matches;$('motion-note').textContent=reduced.matches?'Reduced motion is on: automatic playback is disabled. Use Back, Next, Last, or the slider.':'Playback starts paused. Pace controls presentation speed, not recorded practice time.';render();}
  reduced.addEventListener('change',motionPreference);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});
  motionPreference();$('replay-app').hidden=false;$('load-status').hidden=true;
}
start().catch(error=>{console.error('[learner-map]',error);$('load-status').textContent='The saved replay could not load. Please reload this page. The methods and source information remain available below.';});
