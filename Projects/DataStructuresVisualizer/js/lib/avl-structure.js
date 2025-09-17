class AVLNode { constructor(v){ this.v=v; this.l=null; this.r=null; this.h=1; } }
export class AVL {
  constructor(){ this.root=null; }
  h(n){ return n? n.h:0; }
  upd(n){ n.h=1+Math.max(this.h(n.l),this.h(n.r)); return n; }
  bal(n){ return this.h(n.l)-this.h(n.r); }
  rotR(y){ const x=y.l; const t2=x.r; x.r=y; y.l=t2; this.upd(y); this.upd(x); return x; }
  rotL(x){ const y=x.r; const t2=y.l; y.l=x; x.r=t2; this.upd(x); this.upd(y); return y; }
  insert(v){ this.root=this._ins(this.root,v); }
  _ins(n,v){ if(!n) return new AVLNode(v); if(v<n.v) n.l=this._ins(n.l,v); else if(v>n.v) n.r=this._ins(n.r,v); else return n; this.upd(n); const b=this.bal(n);
    if(b>1 && v<n.l.v) return this.rotR(n); if(b<-1 && v>n.r.v) return this.rotL(n);
    if(b>1 && v>n.l.v){ n.l=this.rotL(n.l); return this.rotR(n);} if(b<-1 && v<n.r.v){ n.r=this.rotR(n.r); return this.rotL(n);} return n; }
  verify(){ let ok=true; const dfs=(n)=>{ if(!n) return 0; const lh=dfs(n.l), rh=dfs(n.r); if(Math.abs(lh-rh)>1) ok=false; if(n.h!==1+Math.max(lh,rh)) ok=false; return 1+Math.max(lh,rh); }; dfs(this.root); return ok; }
  inorder(){ const res=[]; (function walk(x){ if(!x) return; walk(x.l); res.push(x.v); walk(x.r); })(this.root); return res; }
}
