// Dijkstra algorithm test suite
function registerDijkstraTests({ test }) {
    
    // Test initialization
    test('Dijkstra initializes with empty structures', async () => {
        const graph = new Graph();
        graph.addNode('A');
        graph.addNode('B');
        graph.addEdge('A', 'B', 1);
        
        const dijkstra = new Dijkstra(graph);
        if (Object.keys(dijkstra.distances).length !== 0) {
            throw new Error('Distances should be empty after initialization');
        }
        if (Object.keys(dijkstra.previous).length !== 0) {
            throw new Error('Previous nodes should be empty after initialization');
        }
    });
    
    // Test single edge
    test('Dijkstra finds shortest path for simple edge', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 5);
        
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        if (dijkstra.distances['B'] !== 5) {
            throw new Error(`Expected distance to B to be 5, got ${dijkstra.distances['B']}`);
        }
        
        if (dijkstra.previous['B'] !== 'A') {
            throw new Error(`Expected previous node of B to be A, got ${dijkstra.previous['B']}`);
        }
    });
    
    // Test graph with multiple paths
    test('Dijkstra finds shortest path among multiple options', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 10);
        graph.addEdge('A', 'C', 3);
        graph.addEdge('C', 'B', 1);
        
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        if (dijkstra.distances['B'] !== 4) {
            throw new Error(`Expected distance to B to be 4 (via C), got ${dijkstra.distances['B']}`);
        }
        
        if (dijkstra.previous['B'] !== 'C') {
            throw new Error(`Expected previous node of B to be C, got ${dijkstra.previous['B']}`);
        }
    });
    
    // Test example graph
    test('Dijkstra finds correct paths on example graph 1', async () => {
        const graph = new Graph();
        graph.createExample1();
        
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        // Check distances
        const expectedDistances = {
            'A': 0,
            'B': 4,
            'C': 2,
            'D': 5,
            'E': 10
        };
        
        for (const node in expectedDistances) {
            if (dijkstra.distances[node] !== expectedDistances[node]) {
                throw new Error(`Expected distance to ${node} to be ${expectedDistances[node]}, got ${dijkstra.distances[node]}`);
            }
        }
    });
    
    // Test path reconstruction
    test('Dijkstra correctly reconstructs paths', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 1);
        graph.addEdge('B', 'C', 2);
        graph.addEdge('C', 'D', 3);
        
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        // Get path from A to D
        const path = dijkstra.getPath('D');
        
        // Check path
        if (path.length !== 4) {
            throw new Error(`Expected path to have 4 nodes, got ${path.length}`);
        }
        
        if (path[0] !== 'A' || path[1] !== 'B' || path[2] !== 'C' || path[3] !== 'D') {
            throw new Error(`Expected path to be ['A', 'B', 'C', 'D'], got ${JSON.stringify(path)}`);
        }
    });
    
    // Test unreachable nodes
    test('Dijkstra handles unreachable nodes correctly', async () => {
        const graph = new Graph();
        graph.addNode('A');
        graph.addNode('B');
        // No edges between nodes
        
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        if (dijkstra.distances['B'] !== Infinity) {
            throw new Error(`Expected distance to B to be Infinity, got ${dijkstra.distances['B']}`);
        }
        
        const path = dijkstra.getPath('B');
        if (path.length !== 0) {
            throw new Error(`Expected path to B to be empty, got ${JSON.stringify(path)}`);
        }
    });
}

// Register with testRunner if available
if (window.testRunner) {
    window.testRunner.addTestSuite('Dijkstra Algorithm Tests', registerDijkstraTests);
}