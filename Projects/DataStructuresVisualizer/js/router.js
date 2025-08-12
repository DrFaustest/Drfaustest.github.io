import { appState, resetStepEngine, setPseudocode, highlightPseudo, ensurePanels } from './core.js';
/**
 * Router: central entry point responsible for clearing the UI and delegating
 * to the selected visualizer's render function.
 */
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
  appState.current=type; resetStepEngine(); const viz=document.getElementById('visualization-area'); const controls=document.getElementById('controls-area'); viz.innerHTML=''; controls.innerHTML=''; ensurePanels(); setPseudocode([{text:'Select a category...', id:'idle'}]); highlightPseudo('idle');
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
}

// Initial bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', ()=>{
  const loadBtn=document.getElementById('load-btn');
  loadBtn?.addEventListener('click', ()=> loadVisualizer(document.getElementById('structure-select').value));
  loadVisualizer('array');
});
