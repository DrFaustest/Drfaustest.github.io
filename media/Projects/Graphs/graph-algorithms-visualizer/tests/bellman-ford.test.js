// Bellman-Ford algorithm test suite
function registerBellmanFordTests({ test }) {
    
    // Test initialization
    test('BellmanFord initializes with empty structures', async () => {
        const graph = new Graph();
        graph.addNode('A');
        graph.addNode('B');
        graph.addEdge('A', 'B', 1);
        
        const bellmanFord = new BellmanFord(graph);
        if (Object.keys(bellmanFord.distances).length !== 0) {
            throw new Error('Distances should be empty after initialization');
        }
        if (Object.keys(bellmanFord.previous).length !== 0) {
            throw new Error('Previous nodes should be empty after initialization');
        }
    });
    
    // Test single edge
    test('BellmanFord finds shortest path for simple edge', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        if (bellmanFord.distances['B'] !== 5) {
            throw new Error(`Expected distance to B to be 5, got ${bellmanFord.distances['B']}`);
        }
        
        if (bellmanFord.previous['B'] !== 'A') {
            throw new Error(`Expected previous node of B to be A, got ${bellmanFord.previous['B']}`);
        }
    });
    
    // Test graph with multiple paths
    test('BellmanFord finds shortest path among multiple options', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 10);
        graph.addEdge('A', 'C', 3);
        graph.addEdge('C', 'B', 1);
        
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        if (bellmanFord.distances['B'] !== 4) {
            throw new Error(`Expected distance to B to be 4 (via C), got ${bellmanFord.distances['B']}`);
        }
        
        if (bellmanFord.previous['B'] !== 'C') {
            throw new Error(`Expected previous node of B to be C, got ${bellmanFord.previous['B']}`);
        }
    });
    
    // Test negative edge
    test('BellmanFord handles negative edges correctly', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('B', 'C', -3);
        
        const bellmanFord = new BellmanFord(graph);
        const result = bellmanFord.findShortestPaths('A');
        
        if (bellmanFord.distances['C'] !== 2) {
            throw new Error(`Expected distance to C to be 2, got ${bellmanFord.distances['C']}`);
        }
        
        if (result.hasNegativeCycle) {
            throw new Error('Should not detect negative cycle when none exists');
        }
    });
    
    // Test negative cycle
    test('BellmanFord detects negative cycles', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 1);
        graph.addEdge('B', 'C', 2);
        graph.addEdge('C', 'A', -4);  // Creates a cycle with negative total weight
        
        const bellmanFord = new BellmanFord(graph);
        const result = bellmanFord.findShortestPaths('A');
        
        if (!result.hasNegativeCycle) {
            throw new Error('Should detect negative cycle');
        }
    });
    
    // Test example graph without negative edges
    test('BellmanFord finds correct paths on example graph 1', async () => {
        const graph = new Graph();
        graph.createExample1();
        
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        // Check distances - should be the same as Dijkstra for graph without negative edges
        const expectedDistances = {
            'A': 0,
            'B': 4,
            'C': 2,
            'D': 5,
            'E': 10
        };
        
        for (const node in expectedDistances) {
            if (bellmanFord.distances[node] !== expectedDistances[node]) {
                throw new Error(`Expected distance to ${node} to be ${expectedDistances[node]}, got ${bellmanFord.distances[node]}`);
            }
        }
    });
    
    // Test example graph with negative edges
    test('BellmanFord finds correct paths on example graph 2 with negative edge', async () => {
        const graph = new Graph();
        graph.createExample2();
        
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        // With the negative edge D->B(-4), the path A->C->D->B should be better than A->B direct
        if (bellmanFord.distances['B'] >= 4) {
            throw new Error(`Expected distance to B to be less than 4 (via the negative edge), got ${bellmanFord.distances['B']}`);
        }
        
        // Check that we actually go through D to get to B
        if (bellmanFord.previous['B'] !== 'D') {
            throw new Error(`Expected previous node of B to be D (via negative edge), got ${bellmanFord.previous['B']}`);
        }
    });
    
    // Test path reconstruction with negative edges
    test('BellmanFord correctly reconstructs paths with negative edges', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        graph.addEdge('B', 'C', -2);
        
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        // Get path from A to C
        const path = bellmanFord.getPath('C');
        
        // Check path
        if (path.length !== 3) {
            throw new Error(`Expected path to have 3 nodes, got ${path.length}`);
        }
        
        if (path[0] !== 'A' || path[1] !== 'B' || path[2] !== 'C') {
            throw new Error(`Expected path to be ['A', 'B', 'C'], got ${JSON.stringify(path)}`);
        }
    });
}

// Register with testRunner if available
if (window.testRunner) {
    window.testRunner.addTestSuite('Bellman-Ford Algorithm Tests', registerBellmanFordTests);
}