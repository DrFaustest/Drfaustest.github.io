import { HashTableChaining, HashTableOpen } from '../Projects/DataStructuresVisualizer/js/lib/hash-tables.js';

test('Chaining handles collisions', ()=>{ const h=new HashTableChaining(4); [1,5,9].forEach(k=>h.insert(k)); // all collide (k%4=1)
  expect(h.buckets[1].sort()).toEqual([1,5,9]); });

test('Open addressing inserts all unique', ()=>{ const h=new HashTableOpen(7); [1,8,15].forEach(k=>h.insert(k)); // same hash 1
  const found=[1,8,15].every(k=>h.slots.includes(k)); expect(found).toBe(true); });
