import { appState, resetStepEngine, setPseudocode, highlightPseudo, ensurePanels } from './core.js';
// Router for linear structures
import { renderArrayVisualizer } from './array.js';
import { renderLinkedListVisualizer } from './linkedlist.js';
import { renderStackVisualizer } from './stack.js';
import { renderQueueVisualizer } from './queue.js';

export function loadVisualizer(type){
  try {
    console.debug('[linear-router] loadVisualizer called with', type);
    appState.current=type; resetStepEngine();
    const viz=document.getElementById('visualization-area');
    const controls=document.getElementById('controls-area');
    if(!viz||!controls){ console.error('[linear-router] Missing visualization or controls area'); return; }
    viz.innerHTML=''; controls.innerHTML='';
    ensurePanels();
    setPseudocode([{text:'Select a structure...', id:'idle'}]); highlightPseudo('idle');
    switch(type){
      case 'array': return renderArrayVisualizer(viz, controls);
      case 'linked-list': return renderLinkedListVisualizer(viz, controls);
      case 'stack': return renderStackVisualizer(viz, controls);
      case 'queue': return renderQueueVisualizer(viz, controls);
      default: viz.appendChild(document.createTextNode('Select a linear data structure to begin.'));
    }
  } catch(err){
    console.error('[linear-router] Error loading visualizer', type, err);
    const viz=document.getElementById('visualization-area');
    if(viz) viz.append(' Error loading visualizer: '+err.message);
  }
}

function bootstrap(){
  console.debug('[linear-router] bootstrap');
  const loadBtn=document.getElementById('load-btn');
  if(loadBtn){
    loadBtn.addEventListener('click', ()=>{
      const sel=document.getElementById('structure-select');
      const value=sel?sel.value:null;
      if(value) loadVisualizer(value);
    });
  }
}

bootstrap();
