// Pure sorting step generators for unit testing.
// Each function returns { steps, result } where steps mirror visualization semantics.

export function bubbleSortSteps(arr){
  const a=[...arr]; const steps=[]; const n=a.length;
  for(let i=0;i<n;i++){
    for(let j=0;j<n-1-i;j++){
      steps.push({type:'compare',i:j,j:j+1});
      if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]]; steps.push({type:'swap',i:j,j:j+1});}
    }
    steps.push({type:'mark-sorted',i:n-1-i});
  }
  return {steps,result:a};
}

export function insertionSortSteps(arr){
  const a=[...arr]; const steps=[];
  for(let i=1;i<a.length;i++){
    let key=a[i], j=i-1;
    while(j>=0 && a[j]>key){
      steps.push({type:'compare',i:j,j:j+1});
      a[j+1]=a[j]; steps.push({type:'swap',i:j,j:j+1}); j--; }
    a[j+1]=key;
  }
  for(let i=0;i<a.length;i++) steps.push({type:'mark-sorted',i});
  return {steps,result:a};
}

export function mergeSortSteps(arr){
  const a=[...arr]; const steps=[];
  function merge(l,r){
    if(r-l<=0) return;
    const m=Math.floor((l+r)/2); merge(l,m); merge(m+1,r);
    const temp=[]; let i=l,j=m+1; while(i<=m && j<=r){
      steps.push({type:'compare',i,j});
      if(a[i]<=a[j]) temp.push(a[i++]); else temp.push(a[j++]);
    }
    while(i<=m) temp.push(a[i++]); while(j<=r) temp.push(a[j++]);
    for(let k=l;k<=r;k++){const val=temp[k-l]; if(a[k]!==val){a[k]=val; steps.push({type:'write',i:k,value:val});}}
  }
  merge(0,a.length-1);
  for(let i=0;i<a.length;i++) steps.push({type:'mark-sorted',i});
  return {steps,result:a};
}

export function quickSortSteps(arr){
  const a=[...arr]; const steps=[];
  function qs(l,r){ if(l>=r) return; let i=l,j=r,p=a[Math.floor((l+r)/2)];
    while(i<=j){ while(a[i]<p){steps.push({type:'compare',i,j:i}); i++;} while(a[j]>p){steps.push({type:'compare',i:j,j}); j--;}
      if(i<=j){ if(i!==j){[a[i],a[j]]=[a[j],a[i]]; steps.push({type:'swap',i,j}); } i++; j--; }
    } qs(l,j); qs(i,r); }
  qs(0,a.length-1); for(let i=0;i<a.length;i++) steps.push({type:'mark-sorted',i});
  return {steps,result:a};
}
