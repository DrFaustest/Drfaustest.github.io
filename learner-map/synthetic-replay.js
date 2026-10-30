import {concepts,edges,stories,replay,color} from './model.js';

const $ = id => document.getElementById(id);
const fixed = n => n.toFixed(3);
const ns = 'http://www.w3.org/2000/svg';
function svg(tag, attrs={}, text='') {
  const el=document.createElementNS(ns,tag);
  for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  el.textContent=text; return el;
}
let story=stories.practice, frames=replay(story.events), step=0, selected='A', mode='direct', timer=null;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const nodes = new Map();
const graph=$('concept-graph');
for (const [a,b] of edges) {
  const u=concepts.find(c=>c.id===a),v=concepts.find(c=>c.id===b);
  graph.append(svg('line',{x1:u.x,y1:u.y,x2:v.x,y2:v.y,class:'edge','aria-hidden':'true'}));
}
for (const {id,x,y} of concepts) {
  const group=svg('g',{class:'node',transform:`translate(${x} ${y})`,role:'button',tabindex:'0'});
  const focus=svg('circle',{r:43,fill:'none',stroke:'transparent',class:'focus-ring'});
  const ring=svg('circle',{r:37,fill:'none',stroke:'#17201e','stroke-width':2});
  const circle=svg('circle',{r:32,stroke:'#17201e','stroke-width':1.5});
  const name=svg('text',{y:-44,class:'node-name'},id);
  // White label ensures stable contrast at both ends of the estimate scale.
  const pill=svg('rect',{x:-26,y:-13,width:52,height:26,rx:4,fill:'#fffdf8'});
  const value=svg('text',{y:6,class:'node-value'});
  const count=svg('text',{y:55,class:'node-count'});
  group.append(focus,ring,circle,name,pill,value,count);
  const inspect=()=>{ selected=id; $('concept').value=id; render(); };
  group.addEventListener('click',inspect);
  group.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') {e.preventDefault();inspect();} });
  graph.append(group); nodes.set(id,{group,ring,circle,value,count});
  const option=document.createElement('option'); option.value=id; option.textContent=`Concept ${id}`; $('concept').append(option);
}
function eventText(event,index) {
  return `Record ${index+1} · day ${event.day}: ${event.correct ? 'correct' : 'incorrect'} response tagged ${event.tags.join(' + ')}.`;
}
function stop() {
  if(timer!==null) window.clearInterval(timer);
  timer=null; $('play').textContent='Play'; $('play').setAttribute('aria-pressed','false');
}
function changeStep(value) { stop(); step=Math.max(0,Math.min(story.events.length,Number(value))); render(); }
function drawTrajectory() {
  const chart=$('trajectory'); chart.replaceChildren();
  const x=i=>52+i/story.events.length*560, y=v=>180-v*150;
  for(const value of [0,0.5,1]) {
    chart.append(svg('line',{x1:52,y1:y(value),x2:612,y2:y(value),stroke:'#d9d0be'}));
    chart.append(svg('text',{x:42,y:y(value)+5,'text-anchor':'end'},value.toFixed(1)));
  }
  for(const i of [0,3,6,9,12]) chart.append(svg('text',{x:x(i),y:203,'text-anchor':'middle'},String(i)));
  chart.append(svg('text',{x:332,y:225,'text-anchor':'middle'},'Response record (not equal elapsed time)'));
  for(const [key,stroke,dash] of [['d','#084f7b',''],['g','#984200','7 5']]) {
    let path=`M${x(0)},${y(frames[0][selected][key])}`;
    for(let i=1;i<frames.length;i++) path+=` H${x(i)} V${y(frames[i][selected][key])}`;
    chart.append(svg('path',{d:path,fill:'none',stroke,'stroke-width':2.5,'stroke-dasharray':dash}));
  }
  chart.append(svg('line',{x1:x(step),y1:23,x2:x(step),y2:183,stroke:'#17201e','stroke-width':1.5}));
  for(const [key,stroke] of [['d','#084f7b'],['g','#984200']]) chart.append(svg('circle',{cx:x(step),cy:y(frames[step][selected][key]),r:4,fill:'#fff',stroke,'stroke-width':2}));
}
function render() {
  const state=frames[step], focal=state[selected], key=mode==='direct'?'d':'g';
  for(const {id} of concepts) {
    const data=state[id],node=nodes.get(id);
    node.circle.setAttribute('fill',color(data[key]));
    node.circle.setAttribute('stroke-dasharray',data.n===0?'4 3':'none');
    node.ring.setAttribute('visibility',selected===id?'visible':'hidden');
    node.value.textContent=data[key].toFixed(2); node.count.textContent=`n = ${data.n}`;
    node.group.setAttribute('aria-label',`Concept ${id}, ${mode} estimate ${fixed(data[key])}, ${data.n} direct observations. Inspect concept ${id}.`);
    node.group.setAttribute('aria-pressed',String(selected===id));
  }
  $('frame-label').textContent=`After record ${step} of ${story.events.length}`;
  $('legend-title').textContent=`${mode==='direct'?'Direct estimate d':'Neighbor-smoothed estimate g'} · fixed 0–1 scale`;
  $('inspect-title').textContent=`Concept ${selected}`;
  $('event-note').textContent=step===0?'Initial state: no responses observed. Every direct estimate starts at the 0.50 prior.':eventText(story.events[step-1],step-1);
  const details=[['Correct / observations',`${focal.s} / ${focal.n}`],['Direct estimate d',fixed(focal.d)],['Smoothed estimate g',fixed(focal.g)],['Last direct response',focal.last===null?'None':`Record ${focal.last}`]];
  $('state-details').replaceChildren(...details.map(([label,value])=>{
    const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label; dd.textContent=value; div.append(dt,dd);return div;
  }));
  const neighbors=edges.flatMap(([a,b])=>a===selected?[b]:b===selected?[a]:[]);
  $('direct-calc').textContent=`d = (1 + ${focal.s}) / (2 + ${focal.n}) = ${fixed(focal.d)}`;
  $('neighbor-calc').textContent=`Neighbor mean (${neighbors.join(', ')}) = (${neighbors.map(id=>fixed(state[id].d)).join(' + ')}) / ${neighbors.length} = ${fixed(focal.neighbor)}`;
  $('smooth-calc').textContent=`g = 0.8 × ${fixed(focal.d)} + 0.2 × ${fixed(focal.neighbor)} = ${fixed(focal.g)}`;
  $('recent-note').textContent=`Last five direct outcomes: ${focal.recent.length?focal.recent.map(v=>v?'✓ correct':'× incorrect').join(', '):'none'}. Counts are cumulative; recent outcomes and elapsed time do not reweight d or g. Calculations use full precision; displayed values are rounded.`;
  $('scrub').value=step; $('record-output').textContent=`${step} / ${story.events.length}`;
  $('back').disabled=step===0; $('next').disabled=step===story.events.length;
  $('trajectory-title').textContent=`${selected} across the replay`;
  $('trajectory-note').textContent=story.note+' The full scripted trajectory is shown for context; the map at the selected record uses only responses observed through that record.';
  $('table-caption').textContent=`Synthetic state after record ${step}; three-decimal estimates`;
  $('state-table').replaceChildren(...concepts.map(({id})=>{
    const item=state[id],tr=document.createElement('tr'); tr.dataset.selected=String(id===selected);
    [id,item.s,item.n,fixed(item.d),fixed(item.g),item.last??'None'].forEach((value,index)=>{
      const cell=document.createElement(index===0?'th':'td'); if(index===0) cell.scope='row'; cell.textContent=value; tr.append(cell);
    });return tr;
  }));
  $('event-sequence').replaceChildren(...story.events.map((event,index)=>{
    const li=document.createElement('li');li.textContent=eventText(event,index);if(index===step-1)li.setAttribute('aria-current','step');return li;
  }));
  const next=story.events[step];
  $('replay-status').textContent=`State after record ${step}. ${next?`Before record ${step+1}: concept ${next.tags.join(' + ')}; response not yet observed.`:'Replay complete.'} ${selected}: direct ${fixed(focal.d)}, smoothed ${fixed(focal.g)}, n = ${focal.n}.`;
  drawTrajectory();
}
$('scenario').addEventListener('change',()=>{stop(); story=stories[$('scenario').value]; frames=replay(story.events);step=0;selected='A';mode=$('scenario').value==='neighbors'?'smoothed':'direct';$('view').value=mode;$('concept').value='A';render();});
$('view').addEventListener('change',()=>{stop();mode=$('view').value;render();});
$('concept').addEventListener('change',()=>{selected=$('concept').value;render();});
$('scrub').addEventListener('input',()=>changeStep($('scrub').value));
$('back').addEventListener('click',()=>changeStep(step-1));
$('next').addEventListener('click',()=>changeStep(step+1));
$('reset').addEventListener('click',()=>changeStep(0));
$('speed').addEventListener('change',()=>stop());
$('play').addEventListener('click',()=>{
  if(timer!==null){stop();return;}
  if(reduced.matches)return;
  if(step===story.events.length)step=0;
  $('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');render();
  timer=window.setInterval(()=>{step++;if(step>=story.events.length)stop();render();},Number($('speed').value));
});
function motionPreference() {
  stop();$('play').disabled=reduced.matches;
  $('motion-note').textContent=reduced.matches?'Reduced motion is on: automatic playback is disabled. Use Next, Back, or the slider.':'Playback starts paused, advances one response per tick, and stops at the end.';
}
reduced.addEventListener('change',motionPreference);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
motionPreference();render();$('replay-app').hidden=false;
