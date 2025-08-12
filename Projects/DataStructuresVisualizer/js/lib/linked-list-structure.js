class ListNode { constructor(v,next=null){ this.v=v; this.next=next; } }
export class LinkedList { constructor(){ this.head=null; this.size=0; } push(v){ if(!this.head) this.head=new ListNode(v); else { let c=this.head; while(c.next) c=c.next; c.next=new ListNode(v);} this.size++; }
  insertAt(v,i){ if(i<=0||!this.head){ this.head=new ListNode(v,this.head); this.size++; return;} let idx=0,prev=null,c=this.head; while(c&&idx<i){ prev=c;c=c.next; idx++; } prev.next=new ListNode(v,c); this.size++; }
  removeAt(i){ if(!this.head) return; if(i<=0){ this.head=this.head.next; this.size--; return;} let idx=0,prev=null,c=this.head; while(c&&idx<i){ prev=c;c=c.next; idx++; } if(c){ prev.next=c.next; this.size--; } }
  toArray(){ const arr=[]; let c=this.head; while(c){ arr.push(c.v); c=c.next;} return arr; }
}
