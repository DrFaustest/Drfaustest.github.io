import { appState, resetStepEngine, setPseudocode, highlightPseudo, ensurePanels } from './core.js';
// Router for hash tables
import { renderHashTableVisualizer } from './hash.js';

export function loadVisualizer(type){
  try {
    console.debug('[hash-router] loadVisualizer called with', type);
    appState.current=type; resetStepEngine();
    const viz=document.getElementById('visualization-area');
    const controls=document.getElementById('controls-area');
    if(!viz||!controls){ console.error('[hash-router] Missing visualization or controls area'); return; }
    viz.innerHTML=''; controls.innerHTML='';
    ensurePanels();
    setPseudocode([{text:'Select a hash table...', id:'idle'}]); highlightPseudo('idle');
    switch(type){
      case 'hash': return renderHashTableVisualizer(viz, controls);
      default: viz.appendChild(document.createTextNode('Select a hash table to begin.'));
    }
  } catch(err){
    console.error('[hash-router] Error loading visualizer', type, err);
    const viz=document.getElementById('visualization-area');
    if(viz) viz.append(' Error loading visualizer: '+err.message);
  }
}

function bootstrap(){
  console.debug('[hash-router] bootstrap');
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
