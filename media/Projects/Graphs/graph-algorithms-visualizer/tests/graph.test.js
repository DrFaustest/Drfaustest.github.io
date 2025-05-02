// Graph test suite
function registerGraphTests({ test }) {
    
    // Test graph initialization
    test('Graph initializes with empty adjacency list', async () => {
        const graph = new Graph();
        if (Object.keys(graph.adjacencyList).length !== 0) {
            throw new Error('New graph should have empty adjacency list');
        }
    });
    
    // Test adding nodes
    test('Can add a node to the graph', async () => {
        const graph = new Graph();
        graph.addNode('A');
        if (!graph.hasNode('A')) {
            throw new Error('Graph should contain node A after adding it');
        }
    });
    
    // Test adding edges
    test('Can add an edge to the graph', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        
        // Check that both nodes exist
        if (!graph.hasNode('A') || !graph.hasNode('B')) {
            throw new Error('Both nodes should be created when adding an edge');
        }
        
        // Check that the edge exists with correct weight
        const edges = graph.getEdgesFrom('A');
        if (edges.length !== 1 || edges[0].node !== 'B' || edges[0].weight !== 5) {
            throw new Error('Edge from A to B with weight 5 should exist');
        }
    });
    
    // Test getting nodes
    test('Can get all nodes in the graph', async () => {
        const graph = new Graph();
        graph.addNode('A');
        graph.addNode('B');
        graph.addNode('C');
        
        const nodes = graph.getNodes();
        if (nodes.length !== 3 || !nodes.includes('A') || !nodes.includes('B') || !nodes.includes('C')) {
            throw new Error('getNodes should return all nodes in the graph');
        }
    });
    
    // Test getting edges
    test('Can get edges from a specific node', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('A', 'C', 3);
        
        const edges = graph.getEdgesFrom('A');
        if (edges.length !== 2) {
            throw new Error(`Expected 2 edges from node A, got ${edges.length}`);
        }
        
        // Check edge to B
        const edgeToB = edges.find(edge => edge.node === 'B');
        if (!edgeToB || edgeToB.weight !== 5) {
            throw new Error('Edge from A to B with weight 5 not found');
        }
        
        // Check edge to C
        const edgeToC = edges.find(edge => edge.node === 'C');
        if (!edgeToC || edgeToC.weight !== 3) {
            throw new Error('Edge from A to C with weight 3 not found');
        }
    });
    
    // Test removing a node
    test('Can remove a node and its edges', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('B', 'C', 3);
        graph.addEdge('A', 'C', 2);
        
        graph.removeNode('B');
        
        if (graph.hasNode('B')) {
            throw new Error('Node B should be removed');
        }
        
        // Check that edges involving B are removed
        const edgesFromA = graph.getEdgesFrom('A');
        if (edgesFromA.some(edge => edge.node === 'B')) {
            throw new Error('Edge from A to B should be removed');
        }
    });
    
    // Test removing an edge
    test('Can remove an edge', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('A', 'C', 3);
        
        graph.removeEdge('A', 'B');
        
        const edges = graph.getEdgesFrom('A');
        if (edges.some(edge => edge.node === 'B')) {
            throw new Error('Edge from A to B should be removed');
        }
        if (edges.length !== 1 || edges[0].node !== 'C') {
            throw new Error('Only edge from A to C should remain');
        }
    });
    
    // Test clearing the graph
    test('Can clear the entire graph', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('B', 'C', 3);
        graph.addEdge('A', 'C', 2);
        
        graph.clear();
        
        if (Object.keys(graph.adjacencyList).length !== 0 || 
            Object.keys(graph.nodes).length !== 0 || 
            graph.edges.length !== 0) {
            throw new Error('Graph should be empty after clearing');
        }
    });
    
    // Test example graph creation
    test('Can create example graph 1', async () => {
        const graph = new Graph();
        graph.createExample1();
        
        // Check that all nodes and edges exist
        const nodes = graph.getNodes();
        if (nodes.length !== 5 || 
            !nodes.includes('A') || 
            !nodes.includes('B') || 
            !nodes.includes('C') || 
            !nodes.includes('D') || 
            !nodes.includes('E')) {
            throw new Error('Example1 should have nodes A, B, C, D, E');
        }
        
        // Check specific edges
        const edgesFromA = graph.getEdgesFrom('A');
        if (!edgesFromA.some(e => e.node === 'B' && e.weight === 4) || 
            !edgesFromA.some(e => e.node === 'C' && e.weight === 2)) {
            throw new Error('Example1 should have edges A->B(4) and A->C(2)');
        }
    });
    
    // Test negative edge detection
    test('Can detect negative edges', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        
        if (graph.hasNegativeEdge()) {
            throw new Error('Graph should not have negative edges');
        }
        
        graph.addEdge('B', 'C', -2);
        
        if (!graph.hasNegativeEdge()) {
            throw new Error('Graph should detect negative edge B->C(-2)');
        }
    });
}

// Register with testRunner
if (window.testRunner) {
    window.testRunner.addTestSuite('Graph Class Tests', registerGraphTests);
}