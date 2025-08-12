export class BSTNode { constructor(v){ this.v=v; this.l=null; this.r=null; } }
export class BST {
  constructor(){ this.root=null; }
  insert(v){ this.root=this._ins(this.root,v); }
  _ins(n,v){ if(!n) return new BSTNode(v); if(v<n.v) n.l=this._ins(n.l,v); else n.r=this._ins(n.r,v); return n; }
  remove(v){ this.root=this._rem(this.root,v); }
  _rem(n,v){ if(!n) return null; if(v<n.v){ n.l=this._rem(n.l,v); return n; } if(v>n.v){ n.r=this._rem(n.r,v); return n; }
    if(!n.l) return n.r; if(!n.r) return n.l; let s=n.r; while(s.l) s=s.l; n.v=s.v; n.r=this._rem(n.r,s.v); return n; }
  inorder(){ const res=[]; (function walk(x){ if(!x) return; walk(x.l); res.push(x.v); walk(x.r); })(this.root); return res; }
}
