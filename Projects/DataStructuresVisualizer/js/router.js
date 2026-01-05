import { appState, resetStepEngine, setPseudocode, highlightPseudo, ensurePanels, runTeardown } from './core.js';
// Router: delegates to specific visualizer render functions.
import { renderArrayVisualizer } from './array.js';
import { renderLinkedListVisualizer } from './linkedlist.js';
import { renderStackVisualizer } from './stack.js';
import { renderQueueVisualizer } from './queue.js';
import { renderTreeVisualizer } from './bst.js';
import { renderAVLVisualizer } from './avl.js';
import { renderRBTVisualizer } from './rbt.js';
import { renderHashTableVisualizer } from './hash.js';
import { renderGraphVisualizer } from './graph.js';
import { renderSortingVisualizer } from './sorting.js';

export function loadVisualizer(type){
  try {
    console.debug('[router] loadVisualizer called with', type);
    appState.current=type; resetStepEngine();
  const viz=document.getElementById('visualization-area');
  const controls=document.getElementById('controls-area');
    if(!viz||!controls){ console.error('[router] Missing visualization or controls area'); return; }
  runTeardown();
    viz.innerHTML=''; controls.innerHTML='';
    ensurePanels();
    setPseudocode([{text:'Select a category...', id:'idle'}]); highlightPseudo('idle');
    switch(type){
      case 'array': return renderArrayVisualizer(viz, controls);
      case 'linked-list': return renderLinkedListVisualizer(viz, controls);
      case 'stack': return renderStackVisualizer(viz, controls);
      case 'queue': return renderQueueVisualizer(viz, controls);
      case 'tree': return renderTreeVisualizer(viz, controls);
      case 'avl': return renderAVLVisualizer(viz, controls);
      case 'rbt': return renderRBTVisualizer(viz, controls);
      case 'hash': return renderHashTableVisualizer(viz, controls);
      case 'graph': return renderGraphVisualizer(viz, controls);
      case 'sorting': return renderSortingVisualizer(viz, controls);
      default: viz.appendChild(document.createTextNode('Select a data structure or algorithm to begin.'));
    }
  } catch(err){
    console.error('[router] Error loading visualizer', type, err);
    const viz=document.getElementById('visualization-area');
    if(viz) viz.append(' Error loading visualizer: '+err.message);
  }
}

function bootstrap(){
  console.debug('[router] bootstrap');
  const loadBtn=document.getElementById('load-btn');
  if(loadBtn){
    loadBtn.addEventListener('click', ()=>{
      const sel=document.getElementById('structure-select');
      const value=sel?sel.value:null;
      if(!value) return console.warn('[router] No selection value');
      loadVisualizer(value);
    });
  } else {
    console.warn('[router] Load button not found at bootstrap');
  }
  // Auto-load default only if nothing currently rendered
  if(!document.getElementById('visualization-area').children.length){
    loadVisualizer('array');
  }
}

if(document.readyState==='loading'){
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  // DOM already parsed
  bootstrap();
}
