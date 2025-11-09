import { appState, resetStepEngine, setPseudocode, highlightPseudo, ensurePanels, runTeardown } from './core.js';
// Router for tree structures
import { renderTreeVisualizer } from './bst.js';
import { renderAVLVisualizer } from './avl.js';
import { renderRBTVisualizer } from './rbt.js';

export function loadVisualizer(type){
  try {
    console.debug('[tree-router] loadVisualizer called with', type);
    appState.current=type; resetStepEngine();
    const viz=document.getElementById('visualization-area');
    const controls=document.getElementById('controls-area');
  if(!viz||!controls){ console.error('[tree-router] Missing visualization or controls area'); return; }
  runTeardown();
  viz.innerHTML=''; controls.innerHTML='';
    ensurePanels();
    setPseudocode([{text:'Select a tree...', id:'idle'}]); highlightPseudo('idle');
    switch(type){
      case 'tree': return renderTreeVisualizer(viz, controls);
      case 'avl': return renderAVLVisualizer(viz, controls);
      case 'rbt': return renderRBTVisualizer(viz, controls);
      default: viz.appendChild(document.createTextNode('Select a tree data structure to begin.'));
    }
  } catch(err){
    console.error('[tree-router] Error loading visualizer', type, err);
    const viz=document.getElementById('visualization-area');
    if(viz) viz.append(' Error loading visualizer: '+err.message);
  }
}

function bootstrap(){
  console.debug('[tree-router] bootstrap');
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
