const normalizedIndex = (key, size) => ((key % size) + size) % size;

export class HashTableChaining {
  constructor(size = 8) {
    if (!Number.isInteger(size) || size < 1) throw new RangeError('Hash table size must be a positive integer.');
    this.size = size;
    this.buckets = Array.from({ length: size }, () => []);
  }

  hash(key) { return normalizedIndex(key, this.size); }

  insert(key) {
    const bucket = this.buckets[this.hash(key)];
    if (bucket.includes(key)) return false;
    bucket.push(key);
    return true;
  }

  has(key) { return this.buckets[this.hash(key)].includes(key); }

  remove(key) {
    const bucket = this.buckets[this.hash(key)];
    const index = bucket.indexOf(key);
    if (index < 0) return false;
    bucket.splice(index, 1);
    return true;
  }
}

export class HashTableOpen {
  constructor(size = 11) {
    if (!Number.isInteger(size) || size < 1) throw new RangeError('Hash table size must be a positive integer.');
    this.size = size;
    this.slots = Array(size).fill(null);
  }

  hash(key) { return normalizedIndex(key, this.size); }

  insert(key) {
    let index = this.hash(key);
    const start = index;
    let tombstone = -1;
    do {
      if (this.slots[index] === key) return false;
      if (this.slots[index] === '*' && tombstone < 0) tombstone = index;
      if (this.slots[index] == null) {
        this.slots[tombstone >= 0 ? tombstone : index] = key;
        return true;
      }
      index = (index + 1) % this.size;
    } while (index !== start);
    if (tombstone >= 0) {
      this.slots[tombstone] = key;
      return true;
    }
    return false;
  }

  has(key) {
    let index = this.hash(key);
    const start = index;
    while (this.slots[index] != null) {
      if (this.slots[index] === key) return true;
      index = (index + 1) % this.size;
      if (index === start) break;
    }
    return false;
  }

  remove(key) {
    let index = this.hash(key);
    const start = index;
    while (this.slots[index] != null) {
      if (this.slots[index] === key) {
        this.slots[index] = '*';
        return true;
      }
      index = (index + 1) % this.size;
      if (index === start) break;
    }
    return false;
  }
}
