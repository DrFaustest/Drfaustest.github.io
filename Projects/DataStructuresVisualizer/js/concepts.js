const concepts = {
  array: {
    title: 'Array', summary: 'A sequence stored in contiguous indexed positions. Direct indexing is the defining advantage; insertion or removal away from the end requires shifting values.',
    invariants: ['Each value has an integer index.', 'Positions are contiguous from index 0.', 'The visual cells map directly to storage order.'],
    complexity: [['Read / update by index', 'O(1)', 'O(1)'], ['Search (unsorted)', 'O(n)', 'O(n)'], ['Append', 'O(1) amortized', 'O(n)'], ['Insert / remove by index', 'O(n)', 'O(n)']],
    uses: 'Dense ordered data, lookup tables, buffers, and the backing representation for heaps.', pitfalls: 'Confusing an index with a value; ignoring capacity growth; assuming middle insertion is constant time.', visual: 'Each bordered cell is one indexed position. Its left-to-right order is the array order.'
  },
  'linked-list': {
    title: 'Singly linked list', summary: 'A sequence of nodes in which each node stores a value and a reference to the next node.',
    invariants: ['The head identifies the first node.', 'Each node has at most one next reference.', 'The final node points to null.'],
    complexity: [['Read by position', 'O(n)', 'O(n)'], ['Search', 'O(n)', 'O(n)'], ['Insert / remove at head', 'O(1)', 'O(1)'], ['Append without tail reference', 'O(n)', 'O(n)']],
    uses: 'Frequent head insertion, simple adjacency chains, and structures where stable node identity matters.', pitfalls: 'Losing the next reference during mutation; forgetting to update head; assuming random access.', visual: 'Boxes are nodes; arrows represent next references; null marks the end rather than an empty value.'
  },
  stack: {
    title: 'Stack', summary: 'A last-in, first-out sequence with all primary operations at the top.',
    invariants: ['Push adds to the top.', 'Pop removes from the top.', 'Only the top is directly accessible.'],
    complexity: [['Push', 'O(1)', 'O(1)'], ['Pop', 'O(1)', 'O(1)'], ['Peek', 'O(1)', 'O(1)'], ['Search', 'O(n)', 'O(n)']],
    uses: 'Call stacks, undo history, depth-first exploration, parsing, and delimiter matching.', pitfalls: 'Popping an empty stack; confusing top orientation; using a stack where FIFO order is required.', visual: 'The vertical column exposes the top entry; operations happen only at that labeled end.'
  },
  queue: {
    title: 'Queue', summary: 'A first-in, first-out sequence that enqueues at the rear and dequeues at the front.',
    invariants: ['Front identifies the next value removed.', 'Rear identifies where a value is added.', 'Arrival order determines removal order.'],
    complexity: [['Enqueue', 'O(1)', 'O(1)'], ['Dequeue', 'O(1)', 'O(1)'], ['Peek front', 'O(1)', 'O(1)'], ['Search', 'O(n)', 'O(n)']],
    uses: 'Scheduling, breadth-first search, event processing, buffering, and producer–consumer systems.', pitfalls: 'Removing from the wrong end; shifting an array on every dequeue; failing to handle empty state.', visual: 'Cells run from front to rear. Labels identify the two operational ends independent of screen direction.'
  },
  tree: {
    title: 'Binary search tree', summary: 'A binary tree ordered so values smaller than a node are placed to its left and larger values to its right.',
    invariants: ['Every left subtree contains smaller values.', 'Every right subtree contains larger values.', 'Each node has at most two children.'],
    complexity: [['Search', 'O(log n)', 'O(n)'], ['Insert', 'O(log n)', 'O(n)'], ['Remove', 'O(log n)', 'O(n)'], ['Traversal', 'O(n)', 'O(n)']],
    uses: 'Ordered sets, range queries, symbol tables, and the conceptual basis for balanced search trees.', pitfalls: 'Assuming the tree is balanced; mishandling two-child deletion; inconsistent duplicate rules.', visual: 'Vertical level represents depth; left and right edges represent the ordering comparison at each node.'
  },
  avl: {
    title: 'AVL tree', summary: 'A binary search tree that rotates after insertion to keep the height of sibling subtrees within one.',
    invariants: ['BST ordering holds.', 'Balance factor is −1, 0, or 1 at every node.', 'Stored heights match subtree heights.'],
    complexity: [['Search', 'O(log n)', 'O(log n)'], ['Insert', 'O(log n)', 'O(log n)'], ['Rotation', 'O(1)', 'O(1)'], ['Traversal', 'O(n)', 'O(n)']],
    uses: 'Ordered lookup where predictable search time is more important than minimizing rotations.', pitfalls: 'Updating height in the wrong order; choosing the wrong single/double rotation; breaking BST order.', visual: 'The hierarchy is a BST; the balanced shape is the result of rotations, not arbitrary layout.'
  },
  rbt: {
    title: 'Red-black tree', summary: 'A binary search tree with color constraints that bound its height while requiring fewer rotations than stricter AVL balancing.',
    invariants: ['The root is black.', 'A red node has no red child.', 'Every root-to-null path has equal black height.', 'BST ordering holds.'],
    complexity: [['Search', 'O(log n)', 'O(log n)'], ['Insert', 'O(log n)', 'O(log n)'], ['Recolor / rotate', 'O(log n)', 'O(log n)'], ['Traversal', 'O(n)', 'O(n)']],
    uses: 'Ordered maps and sets with frequent insertion and deletion.', pitfalls: 'Treating null leaves inconsistently; violating black height; forgetting parent references during rotation.', visual: 'Node color encodes a balancing rule, not value status. Shape and color must be interpreted together.'
  },
  hash: {
    title: 'Hash table', summary: 'A key-to-bucket structure that uses a hash function for expected constant-time lookup and a collision strategy when keys map to the same position.',
    invariants: ['A key always produces the same base bucket for a fixed table size.', 'Every stored key remains reachable through the selected collision strategy.', 'Load factor is item count divided by bucket capacity.'],
    complexity: [['Search / insert', 'O(1) average', 'O(n)'], ['Delete', 'O(1) average', 'O(n)'], ['Resize / rehash', 'O(n)', 'O(n)'], ['Space', 'O(n)', 'O(n)']],
    uses: 'Dictionaries, caches, indexes, membership tests, and deduplication.', pitfalls: 'Ignoring negative hash values; deleting incorrectly in open addressing; allowing load factor to grow unchecked.', visual: 'The numbered containers are buckets. Chained chips share a bucket; probing moves across bucket positions.'
  },
  graph: {
    title: 'Graph', summary: 'A set of vertices connected by edges. Direction and weight change which paths and algorithms are valid.',
    invariants: ['Every edge references existing vertices.', 'Undirected edges are symmetric in the adjacency representation.', 'Traversal marks a vertex before adding it repeatedly.'],
    complexity: [['BFS / DFS', 'O(V + E)', 'O(V + E)'], ['Dijkstra (simple queue)', 'O(V² + E)', 'O(V)'], ['Add edge', 'O(1)', 'O(1)'], ['Adjacency storage', 'O(V + E)', 'O(V + E)']],
    uses: 'Networks, dependencies, routes, recommendations, state spaces, and knowledge relationships.', pitfalls: 'Using Dijkstra with negative weights; forgetting disconnected components; confusing directed and undirected edges.', visual: 'Circles are vertices and connecting lines are edges. Position aids reading but does not change adjacency.'
  },
  sorting: {
    title: 'Comparison sorting', summary: 'Algorithms that order values by comparing elements and moving or writing them into the correct relative positions.',
    invariants: ['The final sequence is nondecreasing.', 'The output contains the same multiset of values as the input.', 'Generated steps are replayed from an immutable starting array.'],
    complexity: [['Bubble sort', 'O(n²)', 'O(n²)'], ['Insertion sort', 'O(n²)', 'O(n²)'], ['Merge sort', 'O(n log n)', 'O(n log n)'], ['Quick sort', 'O(n log n) average', 'O(n²)']],
    uses: 'Ordering for search, presentation, grouping, ranking, and as a building block for other algorithms.', pitfalls: 'Comparing only average cases; confusing stable and in-place properties; animating swaps that the implementation never performs.', visual: 'Bar height encodes value. Highlights identify active comparisons or writes; completed bars are marked independently of color.'
  }
};

function renderConcept(key) {
  const panel = document.querySelector('[data-concept-panel]');
  const concept = concepts[key];
  if (!panel || !concept) return;
  const rows = concept.complexity.map(([operation, average, worst]) => `<tr><td>${operation}</td><td>${average}</td><td>${worst}</td></tr>`).join('');
  const invariants = concept.invariants.map((item) => `<li>${item}</li>`).join('');
  panel.innerHTML = `
    <div class="concept-heading"><div><p class="section-kicker">Concept reference</p><h2>${concept.title}</h2></div><p>${concept.summary}</p></div>
    <div class="concept-grid">
      <section><h3>Defining rules</h3><ul>${invariants}</ul></section>
      <section><h3>Use cases</h3><p>${concept.uses}</p><h3>Common mistakes</h3><p>${concept.pitfalls}</p></section>
      <section><h3>Visual mapping</h3><p>${concept.visual}</p></section>
    </div>
    <div class="complexity-table"><h3>Time complexity</h3><div class="data-table-wrap"><table><thead><tr><th>Operation</th><th>Average / typical</th><th>Worst case</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

const panel = document.querySelector('[data-concept-panel]');
const select = document.getElementById('structure-select');
const fixedConcept = panel?.dataset.concept;

renderConcept(fixedConcept || select?.value || 'array');
select?.addEventListener('change', () => renderConcept(select.value));
document.getElementById('load-btn')?.addEventListener('click', () => renderConcept(select.value));
