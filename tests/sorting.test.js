import { bubbleSortSteps, insertionSortSteps, mergeSortSteps, quickSortSteps } from '../Projects/DataStructuresVisualizer/js/lib/sorting-algorithms.js';

function isSorted(a){ for(let i=1;i<a.length;i++) if(a[i-1]>a[i]) return false; return true; }

test('bubble sort sorts', ()=>{ const arr=[5,3,8,1,2]; const {result}=bubbleSortSteps(arr); expect(isSorted(result)).toBe(true); });
test('insertion sort sorts', ()=>{ const arr=[9,4,6,2,7,1]; const {result}=insertionSortSteps(arr); expect(isSorted(result)).toBe(true); });
test('merge sort sorts', ()=>{ const arr=[5,4,3,2,1,0]; const {result}=mergeSortSteps(arr); expect(result).toEqual([0,1,2,3,4,5]); });
test('quick sort sorts random', ()=>{ const arr=Array.from({length:20},()=>Math.floor(Math.random()*100)); const {result}=quickSortSteps(arr); expect(isSorted(result)).toBe(true); });
