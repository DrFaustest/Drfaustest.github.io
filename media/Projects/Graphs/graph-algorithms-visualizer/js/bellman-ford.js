/**
 * Implementation of the Bellman-Ford algorithm for finding shortest paths in a graph
 * Can handle graphs with negative edge weights
 * @class
 */
class BellmanFord {
    /**
     * Initialize Bellman-Ford algorithm with a graph
     * @param {Graph} graph - The graph to run the algorithm on
     */
    constructor(graph) {
        this.graph = graph;
        this.distances = {};
        this.previous = {};
        this.steps = [];
        this.hasNegativeCycle = false;
    }
    
    /**
     * Find the shortest path from source to all other nodes
     * Can detect negative cycles
     * @param {string} source - Source node
     * @returns {Object} Result containing distances, previous nodes, visualization steps, and cycle detection
     */
    findShortestPaths(source) {
        // Initialize the algorithm
        this.initialize(source);
        
        // Get current nodes and edges (in case new ones were added)
        const nodes = this.graph.getNodes();
        const edges = this.graph.getAllEdges();
        
        // Make sure any newly added nodes are in our distances dictionary
        this.ensureNodesInitialized(nodes);
        
        // Relax edges |V| - 1 times
        for (let i = 0; i < nodes.length - 1; i++) {
            let anyChange = false;
            
            // Add a step at the beginning of each iteration
            this.addVisualizationStep(i, null, "iteration-start");
            
            for (const edge of edges) {
                const u = edge.source;
                const v = edge.destination;
                const weight = edge.weight;
                
                // Ensure both nodes are in our distance tracking
                // This handles nodes that might have been added after initialization
                if (this.distances[u] === undefined) {
                    this.distances[u] = Infinity;
                    this.previous[u] = null;
                }
                if (this.distances[v] === undefined) {
                    this.distances[v] = Infinity;
                    this.previous[v] = null;
                }
                
                // Store the old distance for visualization purposes
                const oldDistance = this.distances[v];
                const oldPrevious = this.previous[v];
                
                if (this.distances[u] !== Infinity) {
                    const newDistance = this.distances[u] + weight;
                    
                    // If new distance is shorter OR equal but alphabetically earlier source node
                    if (newDistance < this.distances[v] ||
                        (newDistance === this.distances[v] && u.localeCompare(this.previous[v]) < 0)) {
                        this.distances[v] = newDistance;
                        this.previous[v] = u;
                        anyChange = true;
                        
                        // Add a step for this edge relaxation
                        this.addVisualizationStep(i, v, "edge-relaxation", {
                            edge: { source: u, destination: v, weight: weight },
                            oldDistance,
                            newDistance,
                            oldPrevious
                        });
                    }
                }
            }
            
            // Add step at the end of iteration
            this.addVisualizationStep(i, null, "iteration-end");
            
            // If no changes were made in this iteration, we can stop
            if (!anyChange) {
                this.addVisualizationStep(i, null, "early-termination");
                break;
            }
        }
        
        // Check for negative weight cycles
        this.detectNegativeCycles(edges);
        
        return {
            distances: this.distances,
            previous: this.previous,
            steps: this.steps,
            hasNegativeCycle: this.hasNegativeCycle
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
        
        // If target is unreachable (infinity distance or undefined previous) or part of negative cycle
        if (this.distances[target] === Infinity || this.previous[current] === undefined || this.hasNegativeCycle) {
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
        this.steps = [];
        this.hasNegativeCycle = false;
        
        // Get current nodes from the graph
        const currentNodes = this.graph.getNodes();
        
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
        this.addVisualizationStep(-1, source);
    }
    
    /**
     * Ensure all nodes are initialized in the distances and previous dictionaries
     * @param {Array} nodes - Current nodes in the graph
     */
    ensureNodesInitialized(nodes) {
        for (const node of nodes) {
            if (this.distances[node] === undefined) {
                this.distances[node] = Infinity;
                this.previous[node] = null;
            }
        }
    }
    
    /**
     * Detect negative weight cycles
     * @param {Array} edges - Array of edges in the graph
     */
    detectNegativeCycles(edges) {
        // Run one more round of relaxation to detect negative cycles
        for (const edge of edges) {
            const u = edge.source;
            const v = edge.destination;
            const weight = edge.weight;
            
            if (this.distances[u] !== Infinity && 
                this.distances[u] + weight < this.distances[v]) {
                // Negative cycle found
                this.hasNegativeCycle = true;
                
                // For visualization, mark the node as part of the cycle
                this.addVisualizationStep("cycle", v);
            }
        }
    }
    
    /**
     * Add a step for visualization
     * @param {number|string} iteration - Current iteration or 'cycle' for cycle detection
     * @param {string|null} currentNode - Currently processed node
     * @param {string} stepType - Type of step (e.g., "iteration-start", "edge-relaxation", etc.)
     * @param {Object} [details] - Additional details for the step
     */
    addVisualizationStep(iteration, currentNode, stepType, details = {}) {
        // Create deep copies to avoid reference issues
        const stepDistances = {...this.distances};
        
        this.steps.push({
            iteration,
            currentNode,
            stepType,
            distances: stepDistances,
            hasNegativeCycle: this.hasNegativeCycle,
            details
        });
    }

    /**
     * Get algorithm steps for visualization
     * @returns {Array} Array of algorithm steps
     */
    getSteps() {
        // Make sure we have steps (this should be already taken care of by initialize())
        if (this.steps.length === 0) {
            console.warn("Warning: No steps available in Bellman-Ford algorithm");
            return [];
        }
        
        // Format steps with titles and descriptions for visualization
        const formattedSteps = this.steps.map((step) => {
            let title = "Bellman-Ford Algorithm";
            let description;
            
            if (step.iteration === -1) {
                description = `Initialized distances. Source node is ${step.currentNode}.`;
            } else if (step.iteration === "cycle") {
                description = `Checking for negative cycles. Processing node ${step.currentNode}.`;
            } else if (step.stepType === "iteration-start") {
                description = `Iteration ${step.iteration + 1}: Starting iteration.`;
            } else if (step.stepType === "edge-relaxation") {
                const { edge, oldDistance, newDistance } = step.details;
                description = `Relaxing edge (${edge.source} -> ${edge.destination}) with weight ${edge.weight}. Distance updated from ${oldDistance} to ${newDistance}.`;
            } else if (step.stepType === "iteration-end") {
                description = `Iteration ${step.iteration + 1}: Completed iteration.`;
            } else if (step.stepType === "early-termination") {
                description = `Iteration ${step.iteration + 1}: No changes detected. Early termination.`;
            }
            
            if (step.hasNegativeCycle) {
                description += " Negative cycle detected!";
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

// Make the BellmanFord class globally available
if (typeof window !== 'undefined') {
    window.BellmanFord = BellmanFord;
}

// Export the BellmanFord class as default export
export default BellmanFord;