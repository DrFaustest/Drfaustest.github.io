/**
 * Implementation of Dijkstra's algorithm for finding shortest paths in a graph
 * @class
 */
class Dijkstra {
    /**
     * Initialize Dijkstra's algorithm with a graph
     * @param {Graph} graph - The graph to run the algorithm on
     */
    constructor(graph) {
        this.graph = graph;
        this.distances = {};
        this.previous = {};
        this.visited = new Set();
        this.path = [];
        this.steps = [];
    }
    
    /**
     * Find the shortest path from source to all other nodes
     * @param {string} source - Source node
     * @returns {Object} Result containing distances, previous nodes, and visualization steps
     */
    findShortestPaths(source) {
        // Initialize the algorithm
        this.initialize(source);
        
        // Get current nodes from the graph (in case new nodes were added)
        const currentNodes = Object.keys(this.graph.adjacencyList);
        
        // Process all nodes
        while (this.visited.size < currentNodes.length) {
            const current = this.findNodeWithMinDistance();
            
            // If we can't find a node with min distance, 
            // it means remaining nodes are unreachable
            if (!current) break;
            
            this.processNode(current);
        }
        
        return {
            distances: this.distances,
            previous: this.previous,
            steps: this.steps
        };
    }
    
    /**
     * Reconstruct path from source to target
     * @param {string} target - Target node
     * @returns {Array} Path from source to target
     */
    getPath(target) {
        const path = [];
        let current = target;
        
        // If target is unreachable (infinity distance or undefined previous)
        if (this.distances[target] === Infinity || this.previous[current] === undefined) {
            return path;
        }
        
        // Build path backwards from target to source
        while (current !== null) {
            path.unshift(current);
            current = this.previous[current];
        }
        
        return path;
    }
    
    /**
     * Initialize all data structures for the algorithm
     * @param {string} source - Source node 
     */
    initialize(source) {
        this.distances = {};
        this.previous = {};
        this.visited = new Set();
        this.path = [];
        this.steps = [];
        
        // Get current nodes from the graph
        const currentNodes = Object.keys(this.graph.adjacencyList);
        
        // Set all initial distances to Infinity, except the source
        for (const node of currentNodes) {
            this.distances[node] = Infinity;
            this.previous[node] = null;
        }
        
        // Distance from source to itself is 0
        if (this.graph.hasNode(source)) {
            this.distances[source] = 0;
        }
        
        // Add initial step for visualization
        this.addVisualizationStep(source);
    }
    
    /**
     * Find the unvisited node with the minimum distance
     * @returns {string|null} Node with minimum distance or null if none found
     */
    findNodeWithMinDistance() {
        let minDistance = Infinity;
        let minNode = null;
        
        // Make sure we consider any new nodes that might have been added
        const currentNodes = Object.keys(this.graph.adjacencyList);
        
        // Initialize any new nodes that might not be in our distance map
        for (const node of currentNodes) {
            if (this.distances[node] === undefined) {
                this.distances[node] = Infinity;
                this.previous[node] = null;
            }
        }
        
        // Find unvisited node with minimum distance
        for (const node of currentNodes) {
            if (!this.visited.has(node) && this.distances[node] < minDistance) {
                minDistance = this.distances[node];
                minNode = node;
            }
        }
        
        return minNode;
    }
    
    /**
     * Process a node - update distances to its neighbors
     * @param {string} node - Node to process 
     */
    processNode(node) {
        // Mark node as visited
        this.visited.add(node);
        
        // Update distances to neighbors
        const edges = this.graph.getEdgesFrom(node);
        for (const edge of edges) {
            const neighbor = edge.node;
            
            // Ensure this neighbor is in our distance tracking
            // This handles nodes that might have been added after initialization
            if (this.distances[neighbor] === undefined) {
                this.distances[neighbor] = Infinity;
                this.previous[neighbor] = null;
            }
            
            // If neighbor is already visited, skip
            if (this.visited.has(neighbor)) continue;
            
            // Calculate new distance
            const newDistance = this.distances[node] + edge.weight;
            
            // If new distance is shorter, update
            // OR if equal distance but alphabetically earlier node (for consistent path selection)
            if (newDistance < this.distances[neighbor] || 
                (newDistance === this.distances[neighbor] && node.localeCompare(this.previous[neighbor]) < 0)) {
                this.distances[neighbor] = newDistance;
                this.previous[neighbor] = node;
            }
        }
        
        // Add step for visualization
        this.addVisualizationStep(node);
    }
    
    /**
     * Add a step for visualization
     * @param {string} currentNode - Currently processed node
     */
    addVisualizationStep(currentNode) {
        // Create deep copies to avoid reference issues
        const stepDistances = {...this.distances};
        const stepVisited = [...this.visited];
        
        this.steps.push({
            currentNode,
            distances: stepDistances,
            visited: stepVisited,
        });
    }

    /**
     * Get algorithm steps for visualization
     * @returns {Array} Array of algorithm steps
     */
    getSteps() {
        // Make sure we have steps (this should be already taken care of by initialize())
        if (this.steps.length === 0) {
            console.warn("Warning: No steps available in Dijkstra algorithm");
            return [];
        }
        
        // Format steps with titles and descriptions for visualization
        const formattedSteps = this.steps.map((step, index) => {
            let title = "Dijkstra's Algorithm";
            let description;
            
            if (index === 0) {
                description = `Initialized distances. Source node is ${step.currentNode}.`;
            } else {
                description = `Processing node ${step.currentNode}. Updated distances to neighboring nodes.`;
            }
            
            return {
                ...step,
                title,
                description,
                previous: this.previous
            };
        });
        
        return formattedSteps;
    }
}

// Make the Dijkstra class globally available
if (typeof window !== 'undefined') {
    window.Dijkstra = Dijkstra;
}

// Export the Dijkstra class as default export
export default Dijkstra;