import { HashTableChaining, HashTableOpen } from '../Projects/DataStructuresVisualizer/js/lib/hash-tables.js';

test('Chaining handles collisions', ()=>{ const h=new HashTableChaining(4); [1,5,9].forEach(k=>h.insert(k)); // all collide (k%4=1)
  expect(h.buckets[1].sort()).toEqual([1,5,9]); });

test('Open addressing inserts all unique', ()=>{ const h=new HashTableOpen(7); [1,8,15].forEach(k=>h.insert(k)); // same hash 1
  const found=[1,8,15].every(k=>h.slots.includes(k)); expect(found).toBe(true); });

test.each([HashTableChaining, HashTableOpen])('%p supports negative keys and deletion', (Table) => {
  const table = new Table(5);
  expect(table.insert(-1)).toBe(true);
  expect(table.has(-1)).toBe(true);
  expect(table.remove(-1)).toBe(true);
  expect(table.has(-1)).toBe(false);
});

test('Open addressing reuses tombstones and reports a full table', () => {
  const table = new HashTableOpen(3);
  expect(table.insert(0)).toBe(true);
  expect(table.insert(3)).toBe(true);
  expect(table.insert(6)).toBe(true);
  expect(table.insert(9)).toBe(false);
  expect(table.remove(3)).toBe(true);
  expect(table.insert(9)).toBe(true);
  expect(table.has(9)).toBe(true);
});
