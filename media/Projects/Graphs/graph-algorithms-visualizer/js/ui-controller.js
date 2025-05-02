// This file manages user interactions, such as inputting graph data, selecting algorithms, and displaying results. 
// It connects the UI elements with the underlying logic of the algorithms.

/**
 * UI Controller for handling user interactions
 */
class UIController {
    /**
     * Initialize the UI controller
     * @param {GraphVisualizer} visualizer - The graph visualizer instance
     * @param {Graph} graph - The graph instance
     */
    constructor(visualizer, graph) {
        this.visualizer = visualizer;
        this.graph = graph;
        this.currentAlgorithm = null;
        this.addingNode = false;
        this.stepResetDone = false; // Flag to track if reset has been done for stepping
        this.runResetDone = false; // Flag to track if reset has been done for running
        this.isResetting = false; // Flag to track if reset is in progress
        
        // Initialize UI
        this.initUI();
    }

    /**
     * Initialize UI elements and event listeners
     */
    initUI() {
        // Algorithm selection buttons
        this.dijkstraBtn = document.getElementById('dijkstra-btn');
        this.bellmanFordBtn = document.getElementById('bellman-ford-btn');
        
        // Graph control buttons
        this.addNodeBtn = document.getElementById('add-node-btn');
        this.addEdgeBtn = document.getElementById('add-edge-btn');
        this.deleteBtn = document.getElementById('delete-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.example1Btn = document.getElementById('example1-btn');
        this.example2Btn = document.getElementById('example2-btn');
        
        // Algorithm controls
        this.startNodeSelect = document.getElementById('start-node');
        this.runBtn = document.getElementById('run-btn');
        this.stepBtn = document.getElementById('step-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.animationSpeedInput = document.getElementById('animation-speed');
        
        // Canvas for graph visualization
        this.canvas = document.getElementById('graph-canvas');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update node dropdown
        this.updateStartNodeDropdown();
    }

    /**
     * Set up event listeners for all UI elements
     */
    setupEventListeners() {
        // Algorithm selection
        this.dijkstraBtn.addEventListener('click', () => this.selectAlgorithm('dijkstra'));
        this.bellmanFordBtn.addEventListener('click', () => this.selectAlgorithm('bellmanFord'));
        
        // Graph controls
        this.addNodeBtn.addEventListener('click', () => this.toggleAddNode());
        this.addEdgeBtn.addEventListener('click', () => this.toggleAddEdge());
        this.deleteBtn.addEventListener('click', () => this.visualizer.deleteSelected());
        this.clearBtn.addEventListener('click', () => this.clearGraph());
        this.example1Btn.addEventListener('click', () => this.loadExample(1));
        this.example2Btn.addEventListener('click', () => this.loadExample(2));
        
        // Algorithm controls
        this.runBtn.addEventListener('click', () => this.runAlgorithm());
        this.stepBtn.addEventListener('click', () => this.stepAlgorithm());
        this.resetBtn.addEventListener('click', () => this.resetAlgorithm());
        
        // Canvas click for adding nodes
        this.canvas.addEventListener('click', (e) => {
            if (this.addingNode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.visualizer.addNewNode(x, y);
                this.updateStartNodeDropdown();
            }
        });
        
        // Animation speed
        this.animationSpeedInput.addEventListener('input', (e) => {
            this.visualizer.setAnimationSpeed(parseInt(e.target.value));
        });
        
        // Start node selection
        this.startNodeSelect.addEventListener('change', () => {
            this.initializeAlgorithm();
        });
    }

    /**
     * Select which algorithm to use
     * @param {string} algorithm - The algorithm name ('dijkstra' or 'bellmanFord')
     */
    selectAlgorithm(algorithm) {
        // Update UI
        if (algorithm === 'dijkstra') {
            this.dijkstraBtn.classList.add('active');
            this.bellmanFordBtn.classList.remove('active');
            this.currentAlgorithm = 'dijkstra';
            
            // Check for negative edges
            if (this.graph.hasNegativeEdge()) {
                this.visualizer.updateStepDescription("Warning: Graph has negative edges. Dijkstra's algorithm may not produce correct results.");
            }
        } else {
            this.dijkstraBtn.classList.remove('active');
            this.bellmanFordBtn.classList.add('active');
            this.currentAlgorithm = 'bellmanFord';
        }
        
        // Reset algorithm visuals
        this.resetAlgorithm();
    }

    /**
     * Toggle node adding mode
     */
    toggleAddNode() {
        this.addingNode = !this.addingNode;
        
        if (this.addingNode) {
            this.addNodeBtn.classList.add('active');
            this.addEdgeBtn.classList.remove('active');
            this.visualizer.setAddingEdge(false);
        } else {
            this.addNodeBtn.classList.remove('active');
        }
    }

    /**
     * Toggle edge adding mode
     */
    toggleAddEdge() {
        this.visualizer.setAddingEdge(!this.visualizer.addingEdge);
        
        if (this.visualizer.addingEdge) {
            this.addEdgeBtn.classList.add('active');
            this.addNodeBtn.classList.remove('active');
            this.addingNode = false;
        } else {
            this.addEdgeBtn.classList.remove('active');
        }
    }

    /**
     * Clear the graph
     */
    clearGraph() {
        if (confirm('Are you sure you want to clear the graph?')) {
            this.graph.clear();
            this.visualizer.reset();
            this.updateStartNodeDropdown();
        }
    }

    /**
     * Load example graph
     * @param {number} exampleNumber - Which example to load (1 or 2)
     */
    loadExample(exampleNumber) {
        if (exampleNumber === 1) {
            this.graph.createExample1();
        } else {
            this.graph.createExample2();
        }
        
        this.visualizer.setGraph(this.graph);
        this.updateStartNodeDropdown();
        
        // Auto-select appropriate algorithm
        if (exampleNumber === 2) {
            this.selectAlgorithm('bellmanFord');
        } else {
            this.selectAlgorithm('dijkstra');
        }
        
        // Set default start node to A
        this.startNodeSelect.value = 'A';
    }

    /**
     * Update the start node dropdown with current nodes
     */
    updateStartNodeDropdown() {
        const nodes = this.graph.getNodes();
        const previousValue = this.startNodeSelect.value;
        
        // Clear existing options
        this.startNodeSelect.innerHTML = '';
        
        // Add options for all nodes
        for (const node of nodes) {
            const option = document.createElement('option');
            option.value = node;
            option.textContent = node;
            this.startNodeSelect.appendChild(option);
        }
        
        // If there are nodes and we have a current algorithm,
        // reinitialize the algorithm to include any new nodes
        if (nodes.length > 0 && this.currentAlgorithm) {
            // Try to keep the previously selected node if it still exists
            if (nodes.includes(previousValue)) {
                this.startNodeSelect.value = previousValue;
            }
            
            // Initialize the algorithm with the current graph state
            this.initializeAlgorithm();
        }
    }

    /**
     * Initialize the selected algorithm
     */
    initializeAlgorithm() {
        const startNode = this.startNodeSelect.value;
        
        if (!startNode) {
            this.visualizer.updateStepDescription("Please select a start node.");
            return;
        }
        
        if (this.currentAlgorithm === 'dijkstra') {
            import('./dijkstra.js').then(module => {
                const Dijkstra = module.default;
                const algorithm = new Dijkstra(this.graph);
                this.visualizer.setAlgorithm(algorithm);
                this.visualizer.initializeAlgorithm(startNode);
                
                // If initializing as part of a reset for 'run', trigger run after initialization
                if (this.isResetting && !this.runResetDone) {
                    this.runResetDone = true;
                    this.isResetting = false;
                    // Run on next tick to ensure initialization is fully complete
                    setTimeout(() => this.visualizer.runAlgorithm(), 0);
                }
            });
        } else if (this.currentAlgorithm === 'bellmanFord') {
            import('./bellman-ford.js').then(module => {
                const BellmanFord = module.default;
                const algorithm = new BellmanFord(this.graph);
                this.visualizer.setAlgorithm(algorithm);
                this.visualizer.initializeAlgorithm(startNode);
                
                // If initializing as part of a reset for 'run', trigger run after initialization
                if (this.isResetting && !this.runResetDone) {
                    this.runResetDone = true;
                    this.isResetting = false;
                    // Run on next tick to ensure initialization is fully complete
                    setTimeout(() => this.visualizer.runAlgorithm(), 0);
                }
            });
        }
    }

    /**
     * Run the algorithm
     */
    runAlgorithm() {
        if (!this.startNodeSelect.value) {
            this.visualizer.updateStepDescription("Please select a start node.");
            return;
        }
        
        // If algorithm is not initialized or needs reset, do it first
        if (this.visualizer.currentStepIndex < 0 || !this.runResetDone) {
            this.runResetDone = false;
            this.isResetting = true;
            this.resetAlgorithm();
            // The actual run will be triggered by initializeAlgorithm after reset completes
            return;
        }
        
        // If already reset and initialized, run directly
        this.visualizer.runAlgorithm();
    }

    /**
     * Step through the algorithm
     */
    stepAlgorithm() {
        if (!this.startNodeSelect.value) {
            this.visualizer.updateStepDescription("Please select a start node.");
            return;
        }
        
        // Reset the algorithm only on the first step press
        if (this.visualizer.currentStepIndex < 0 || !this.stepResetDone) {
            this.stepResetDone = true;
            this.resetAlgorithm();
            // Wait for initialization to complete before stepping
            setTimeout(() => {
                if (this.visualizer.currentStepIndex >= 0) {
                    this.visualizer.stepAlgorithm();
                }
            }, 100);
            return;
        }
        
        // Step through the algorithm
        this.visualizer.stepAlgorithm();
    }

    /**
     * Reset the algorithm
     */
    resetAlgorithm() {
        this.visualizer.reset();
        this.initializeAlgorithm();
        this.stepResetDone = false; // Reset the step flag
        // Don't reset runResetDone here as we need it to persist during async operations
    }
}

export default UIController;