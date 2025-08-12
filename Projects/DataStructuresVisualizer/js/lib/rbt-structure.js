class RBTNode { constructor(v,c='red'){ this.v=v; this.c=c; this.l=null; this.r=null; this.p=null; } }
export class RBT {
  constructor(){ this.root=null; }
  rotateLeft(x){ const y=x.r; x.r=y.l; if(y.l) y.l.p=x; y.p=x.p; if(!x.p) this.root=y; else if(x===x.p.l) x.p.l=y; else x.p.r=y; y.l=x; x.p=y; }
  rotateRight(y){ const x=y.l; y.l=x.r; if(x.r) x.r.p=y; x.p=y.p; if(!y.p) this.root=x; else if(y===y.p.l) y.p.l=x; else y.p.r=x; x.r=y; y.p=x; }
  insert(v){ let z=new RBTNode(v), parent=null, cur=this.root; while(cur){ parent=cur; cur = z.v < cur.v ? cur.l : cur.r; }
    z.p=parent; if(!parent) this.root=z; else if(z.v<parent.v) parent.l=z; else parent.r=z; z.c='red'; this.fix(z); }
  fix(z){ while(z.p && z.p.c==='red'){ if(z.p===z.p.p?.l){ const u=z.p.p.r; if(u&&u.c==='red'){ z.p.c='black'; u.c='black'; z.p.p.c='red'; z=z.p.p; } else { if(z===z.p.r){ z=z.p; this.rotateLeft(z);} z.p.c='black'; z.p.p.c='red'; this.rotateRight(z.p.p);} } else { const u=z.p.p?.l; if(u&&u.c==='red'){ z.p.c='black'; u.c='black'; z.p.p.c='red'; z=z.p.p;} else { if(z===z.p.l){ z=z.p; this.rotateRight(z);} z.p.c='black'; z.p.p.c='red'; this.rotateLeft(z.p.p);} } } if(this.root) this.root.c='black'; }
  inorder(){ const res=[]; (function walk(n){ if(!n) return; walk(n.l); res.push(n.v); walk(n.r); })(this.root); return res; }
  validate(){ if(!this.root) return true; if(this.root.c!=='black') return false; let valid=true; let blackHeights=new Set();
    function dfs(n, blacks){ if(!n){ blackHeights.add(blacks); return; } if(n.c==='red' && ((n.l&&n.l.c==='red')||(n.r&&n.r.c==='red'))) valid=false; if(n.c==='black') blacks++; dfs(n.l,blacks); dfs(n.r,blacks); }
    dfs(this.root,0); if(blackHeights.size>1) valid=false; return valid; }
}
