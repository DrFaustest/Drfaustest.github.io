// Integration tests for the graph algorithms
function registerIntegrationTests({ test }) {
    
    // Test that Dijkstra and Bellman-Ford give same results on non-negative graphs
    test('Dijkstra and Bellman-Ford give identical results on non-negative graphs', async () => {
        const graph = new Graph();
        graph.createExample1(); // Example 1 has no negative edges
        
        // Run Dijkstra
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        // Run Bellman-Ford
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        // Compare distances
        for (const node in dijkstra.distances) {
            if (dijkstra.distances[node] !== bellmanFord.distances[node]) {
                throw new Error(`Distance mismatch for node ${node}: Dijkstra=${dijkstra.distances[node]}, Bellman-Ford=${bellmanFord.distances[node]}`);
            }
        }
        
        // Compare paths
        for (const node in dijkstra.previous) {
            if (dijkstra.previous[node] !== bellmanFord.previous[node]) {
                throw new Error(`Path mismatch for node ${node}: Dijkstra's previous=${dijkstra.previous[node]}, Bellman-Ford's previous=${bellmanFord.previous[node]}`);
            }
        }
    });
    
    // Test that Bellman-Ford handles negative edges better than Dijkstra
    test('Bellman-Ford finds better paths with negative edges than Dijkstra', async () => {
        const graph = new Graph();
        graph.createExample2(); // Example 2 has negative edges
        
        // Run Dijkstra
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        
        // Run Bellman-Ford
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        
        // Verify Bellman-Ford finds better path to B via the negative edge from D to B
        if (bellmanFord.distances['B'] >= dijkstra.distances['B']) {
            throw new Error(`Expected Bellman-Ford to find a better path to B with the negative edge. Bellman-Ford: ${bellmanFord.distances['B']}, Dijkstra: ${dijkstra.distances['B']}`);
        }
        
        // Verify Bellman-Ford uses the negative edge (goes through D to get to B)
        if (bellmanFord.previous['B'] !== 'D') {
            throw new Error(`Expected Bellman-Ford to use the negative edge and go through D to reach B. Instead, previous node is ${bellmanFord.previous['B']}`);
        }
    });
    
    // Test the full path traceback for both algorithms
    test('Path reconstruction is consistent with distances', async () => {
        const graph = new Graph();
        graph.addEdge('A', 'B', 3);
        graph.addEdge('B', 'C', 2);
        graph.addEdge('A', 'D', 2);
        graph.addEdge('D', 'C', 3);
        
        // Dijkstra test
        const dijkstra = new Dijkstra(graph);
        dijkstra.findShortestPaths('A');
        const djPath = dijkstra.getPath('C');
        
        // Path should be A -> B -> C (cost 5) as it's shorter than A -> D -> C (cost 5)
        const expectedPath = ['A', 'B', 'C'];
        if (dijkstra.distances['C'] !== 5) {
            throw new Error(`Expected Dijkstra distance to C to be 5, got ${dijkstra.distances['C']}`);
        }
        
        if (JSON.stringify(djPath) !== JSON.stringify(expectedPath)) {
            throw new Error(`Expected Dijkstra path to be ${JSON.stringify(expectedPath)}, got ${JSON.stringify(djPath)}`);
        }
        
        // Bellman-Ford test
        const bellmanFord = new BellmanFord(graph);
        bellmanFord.findShortestPaths('A');
        const bfPath = bellmanFord.getPath('C');
        
        if (bellmanFord.distances['C'] !== 5) {
            throw new Error(`Expected Bellman-Ford distance to C to be 5, got ${bellmanFord.distances['C']}`);
        }
        
        if (JSON.stringify(bfPath) !== JSON.stringify(expectedPath)) {
            throw new Error(`Expected Bellman-Ford path to be ${JSON.stringify(expectedPath)}, got ${JSON.stringify(bfPath)}`);
        }
    });
}

// Register with testRunner if available
if (window.testRunner) {
    window.testRunner.addTestSuite('Integration Tests', registerIntegrationTests);
}