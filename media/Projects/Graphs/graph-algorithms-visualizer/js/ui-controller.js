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
        this.localStorageKey = 'graph-visualizer-workspace';
        
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
        this.randomBtn = document.getElementById('random-btn');
        this.layoutBtn = document.getElementById('layout-btn');
        
        // Algorithm controls
        this.startNodeSelect = document.getElementById('start-node');
        this.runBtn = document.getElementById('run-btn');
        this.stepBtn = document.getElementById('step-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.animationSpeedInput = document.getElementById('animation-speed');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.graphStats = document.getElementById('graph-stats');
        this.graphWarning = document.getElementById('graph-warning');
        this.renameNodeBtn = document.getElementById('rename-node-btn');
        this.editEdgeBtn = document.getElementById('edit-edge-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.loadBtn = document.getElementById('load-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        
        // Canvas for graph visualization
        this.canvas = document.getElementById('graph-canvas');
        
        // Set up event listeners
        this.setupEventListeners();
        this.visualizer.onGraphChanged = () => this.handleGraphChanged();
        
        // Update node dropdown
        this.updateStartNodeDropdown();
        this.updateWorkspaceStatus();
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
        this.randomBtn.addEventListener('click', () => this.createRandomGraph());
        this.layoutBtn.addEventListener('click', () => this.visualizer.autoLayout());
        
        // Algorithm controls
        this.runBtn.addEventListener('click', () => this.runAlgorithm());
        this.stepBtn.addEventListener('click', () => this.stepAlgorithm());
        this.resetBtn.addEventListener('click', () => this.resetAlgorithm());
        this.renameNodeBtn.addEventListener('click', () => this.renameSelectedNode());
        this.editEdgeBtn.addEventListener('click', () => this.editSelectedEdge());
        this.saveBtn.addEventListener('click', () => this.saveLocalGraph());
        this.loadBtn.addEventListener('click', () => this.loadLocalGraph());
        this.exportBtn.addEventListener('click', () => this.exportGraph());
        this.importBtn.addEventListener('click', () => this.importGraph());
        
        // Canvas click for adding nodes
        this.canvas.addEventListener('click', (e) => {
            if (this.addingNode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.visualizer.addNewNode(x, y);
                this.updateStartNodeDropdown();
                this.updateWorkspaceStatus('Node added. Drag it to adjust placement.');
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
        this.updateWorkspaceStatus();
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
            this.updateModeIndicator('Mode: Add Node - click the canvas to place a node');
        } else {
            this.addNodeBtn.classList.remove('active');
            this.updateModeIndicator('Mode: Select and drag nodes');
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
            this.updateModeIndicator('Mode: Add Edge - click source node, then destination node');
        } else {
            this.addEdgeBtn.classList.remove('active');
            this.updateModeIndicator('Mode: Select and drag nodes');
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
            this.updateWorkspaceStatus('Graph cleared.');
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
        this.updateWorkspaceStatus(`Loaded example ${exampleNumber}.`);
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

    handleGraphChanged() {
        this.stepResetDone = false;
        this.runResetDone = false;
        this.updateStartNodeDropdown();
        this.updateWorkspaceStatus('Graph updated. Algorithm state reset.');
    }

    updateModeIndicator(message) {
        if (this.modeIndicator) {
            this.modeIndicator.textContent = message;
        }
    }

    updateWorkspaceStatus(message = '') {
        const stats = this.graph.getStats ? this.graph.getStats() : { nodes: 0, edges: 0, negativeEdges: 0 };
        if (this.graphStats) {
            this.graphStats.textContent = `Nodes: ${stats.nodes} | Edges: ${stats.edges} | Negative Edges: ${stats.negativeEdges}`;
        }

        const warnings = [];
        if (this.currentAlgorithm === 'dijkstra' && this.graph.hasNegativeEdge()) {
            warnings.push("Dijkstra's algorithm does not support negative edge weights. Use Bellman-Ford or remove negative edges.");
        }
        if (stats.nodes === 0) {
            warnings.push('Add nodes or load an example to begin.');
        } else if (stats.edges === 0) {
            warnings.push('Add edges to make the graph meaningful.');
        }

        if (this.graphWarning) {
            this.graphWarning.textContent = message || warnings.join(' ');
            this.graphWarning.classList.toggle('warning-active', warnings.length > 0 && !message);
        }
    }

    renameSelectedNode() {
        if (!this.visualizer.selectedNode) {
            this.updateWorkspaceStatus('Select a node first.');
            return;
        }

        const nextName = prompt('Rename selected node:', this.visualizer.selectedNode);
        if (!nextName) return;

        if (!this.visualizer.renameSelectedNode(nextName)) {
            this.updateWorkspaceStatus('Rename failed. Use a unique node name.');
            return;
        }

        this.updateStartNodeDropdown();
        this.updateWorkspaceStatus('Node renamed.');
    }

    editSelectedEdge() {
        if (!this.visualizer.selectedEdge) {
            this.updateWorkspaceStatus('Select an edge line or weight label first.');
            return;
        }

        const edge = this.graph.getEdge(this.visualizer.selectedEdge.source, this.visualizer.selectedEdge.destination);
        if (!edge) return;

        const nextWeight = parseFloat(prompt('Update edge weight:', edge.weight));
        if (Number.isNaN(nextWeight)) {
            this.updateWorkspaceStatus('Edge weight was not changed.');
            return;
        }

        this.visualizer.updateSelectedEdgeWeight(nextWeight);
        this.updateWorkspaceStatus('Edge weight updated.');
    }

    createRandomGraph() {
        this.graph.clear();
        const nodeCount = 7;
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.max(90, Math.min(rect.width, rect.height) * 0.34);

        for (let i = 0; i < nodeCount; i++) {
            const name = String.fromCharCode(65 + i);
            const angle = (Math.PI * 2 * i) / nodeCount - Math.PI / 2;
            this.graph.addNode(name, {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        const nodes = this.graph.getNodes();
        for (let i = 0; i < nodes.length; i++) {
            const next = nodes[(i + 1) % nodes.length];
            this.graph.addEdge(nodes[i], next, Math.floor(Math.random() * 9) + 1);
            if (i % 2 === 0) {
                const jump = nodes[(i + 3) % nodes.length];
                this.graph.addEdge(nodes[i], jump, Math.floor(Math.random() * 12) + 2);
            }
        }

        this.visualizer.setGraph(this.graph);
        this.updateStartNodeDropdown();
        this.selectAlgorithm('dijkstra');
        this.updateWorkspaceStatus('Random graph generated.');
    }

    saveLocalGraph() {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.graph.toJSON()));
        this.updateWorkspaceStatus('Graph saved locally in this browser.');
    }

    loadLocalGraph() {
        const saved = localStorage.getItem(this.localStorageKey);
        if (!saved) {
            this.updateWorkspaceStatus('No local graph save found.');
            return;
        }

        try {
            this.graph.fromJSON(JSON.parse(saved));
            this.visualizer.setGraph(this.graph);
            this.updateStartNodeDropdown();
            this.resetAlgorithm();
            this.updateWorkspaceStatus('Local graph loaded.');
        } catch (error) {
            this.updateWorkspaceStatus('Saved graph could not be loaded.');
        }
    }

    exportGraph() {
        const json = JSON.stringify(this.graph.toJSON(), null, 2);
        navigator.clipboard?.writeText(json)
            .then(() => this.updateWorkspaceStatus('Graph JSON copied to clipboard.'))
            .catch(() => {
                prompt('Copy graph JSON:', json);
                this.updateWorkspaceStatus('Copy the graph JSON from the prompt.');
            });
    }

    importGraph() {
        const json = prompt('Paste graph JSON:');
        if (!json) return;

        try {
            this.graph.fromJSON(JSON.parse(json));
            this.visualizer.setGraph(this.graph);
            this.updateStartNodeDropdown();
            this.resetAlgorithm();
            this.updateWorkspaceStatus('Graph imported.');
        } catch (error) {
            this.updateWorkspaceStatus('Import failed. Check the JSON format.');
        }
    }
}

export default UIController;
