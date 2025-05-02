/**
 * Visualization module for rendering graphs and algorithm steps
 */
class GraphVisualizer {
    /**
     * Initialize the visualizer with a canvas element
     * @param {HTMLElement} canvasElement - The container element for rendering the graph
     */
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.graph = null;
        this.algorithm = null;
        this.selectedNode = null;
        this.firstSelectedNode = null; // For edge creation
        this.currentStepIndex = -1;
        this.steps = [];
        this.animationSpeed = 5; // Default animation speed (1-10)
    }

    /**
     * Set the graph to visualize
     * @param {Graph} graph - The graph instance
     */
    setGraph(graph) {
        this.graph = graph;
        this.render();
    }

    /**
     * Set the algorithm to visualize
     * @param {Object} algorithm - The algorithm instance (Dijkstra or BellmanFord)
     */
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
        this.currentStepIndex = -1;
        this.steps = [];
    }

    /**
     * Set animation speed
     * @param {number} speed - Speed from 1 (slow) to 10 (fast)
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * Reset the visualization to initial state
     */
    reset() {
        this.currentStepIndex = -1;
        this.render();
        this.updateStepDescription("Select an algorithm and press Run or Step to start.");
        this.updateDistanceTable({
            distances: {},
            previous: {}
        });
    }

    /**
     * Render the graph on canvas
     */
    render() {
        // Clear canvas
        this.canvas.innerHTML = '';
        
        if (!this.graph) return;
        
        // Render edges first (so they appear behind nodes)
        this.renderEdges();
        
        // Render nodes
        this.renderNodes();
    }

    /**
     * Render all nodes in the graph
     */
    renderNodes() {
        const nodes = this.graph.getNodes();
        
        for (const nodeName of nodes) {
            const position = this.graph.getNodePosition(nodeName);
            if (!position) continue;
            
            const nodeElement = document.createElement('div');
            nodeElement.className = 'node';
            nodeElement.dataset.node = nodeName;
            nodeElement.textContent = nodeName;
            
            // Add class for selected node
            if (nodeName === this.selectedNode) {
                nodeElement.classList.add('selected');
            }
            
            // Add classes based on algorithm state if we're visualizing steps
            if (this.currentStepIndex >= 0 && this.steps.length > this.currentStepIndex) {
                const step = this.steps[this.currentStepIndex];
                
                // For Dijkstra, highlight visited and current node
                if (step.visited && step.visited.includes(nodeName)) {
                    nodeElement.classList.add('visited');
                }
                
                if (step.currentNode === nodeName) {
                    nodeElement.classList.add('current');
                }
                
                // Mark start node if available
                if (step.startNode === nodeName) {
                    nodeElement.classList.add('start');
                }
            }
            
            // Position the node
            nodeElement.style.left = `${position.x - 20}px`; // 20 = half of node width
            nodeElement.style.top = `${position.y - 20}px`;  // 20 = half of node height
            
            // Add click event for node selection
            nodeElement.addEventListener('click', () => this.handleNodeClick(nodeName));
            
            // Make nodes draggable
            this.makeNodeDraggable(nodeElement, nodeName);
            
            this.canvas.appendChild(nodeElement);
        }
    }

    /**
     * Render all edges in the graph
     */
    renderEdges() {
        const edges = this.graph.getAllEdges();
        
        for (const edge of edges) {
            const { source, destination, weight } = edge;
            
            const sourcePos = this.graph.getNodePosition(source);
            const destPos = this.graph.getNodePosition(destination);
            
            if (!sourcePos || !destPos) continue;
            
            // Calculate edge angle and length
            const dx = destPos.x - sourcePos.x;
            const dy = destPos.y - sourcePos.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Create edge element
            const edgeElement = document.createElement('div');
            edgeElement.className = 'edge';
            edgeElement.dataset.source = source;
            edgeElement.dataset.destination = destination;
            
            // Highlight current path if we're visualizing steps
            if (this.currentStepIndex >= 0 && this.steps.length > this.currentStepIndex) {
                const step = this.steps[this.currentStepIndex];
                
                if (step.previous && step.previous[destination] === source) {
                    edgeElement.classList.add('current-path');
                }
            }
            
            // Position and rotate edge
            edgeElement.style.width = `${length - 40}px`; // Adjust for node radius
            edgeElement.style.left = `${sourcePos.x}px`;
            edgeElement.style.top = `${sourcePos.y}px`;
            edgeElement.style.transform = `rotate(${angle}deg)`;
            edgeElement.style.transformOrigin = '0 0';
            
            // Add edge label with weight
            const labelElement = document.createElement('div');
            labelElement.className = 'edge-label';
            labelElement.textContent = weight;
            
            // Position label in the middle of the edge
            labelElement.style.left = `${sourcePos.x + dx/2 - 12}px`;
            labelElement.style.top = `${sourcePos.y + dy/2 - 12}px`;
            
            this.canvas.appendChild(edgeElement);
            this.canvas.appendChild(labelElement);
        }
    }

    /**
     * Make a node element draggable
     * @param {HTMLElement} nodeElement - The node DOM element
     * @param {string} nodeName - The name of the node
     */
    makeNodeDraggable(nodeElement, nodeName) {
        let isDragging = false;
        let offsetX, offsetY;
        
        nodeElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                isDragging = true;
                offsetX = e.clientX - nodeElement.getBoundingClientRect().left;
                offsetY = e.clientY - nodeElement.getBoundingClientRect().top;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const canvasRect = this.canvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left - offsetX + 20; // 20 = half node width
            const y = e.clientY - canvasRect.top - offsetY + 20;  // 20 = half node height
            
            // Update node position in the graph
            this.graph.setNodePosition(nodeName, { x, y });
            
            // Re-render the graph
            this.render();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Handle node click event
     * @param {string} nodeName - Name of the clicked node
     */
    handleNodeClick(nodeName) {
        // If we're in edge creation mode
        if (this.addingEdge) {
            if (!this.firstSelectedNode) {
                // First node for edge
                this.firstSelectedNode = nodeName;
                this.selectedNode = nodeName;
                this.render();
            } else {
                // Second node for edge, show modal to enter weight
                const secondSelectedNode = nodeName;
                if (this.firstSelectedNode !== secondSelectedNode) {
                    this.showEdgeWeightModal(this.firstSelectedNode, secondSelectedNode);
                }
                this.firstSelectedNode = null;
                this.selectedNode = null;
                this.render();
            }
        } else {
            // Normal node selection
            this.selectedNode = (this.selectedNode === nodeName) ? null : nodeName;
            this.render();
        }
    }

    /**
     * Show modal to enter edge weight
     * @param {string} source - Source node
     * @param {string} destination - Destination node
     */
    showEdgeWeightModal(source, destination) {
        const modal = document.getElementById('edge-weight-modal');
        const input = document.getElementById('edge-weight-input');
        const confirmBtn = document.getElementById('confirm-edge-btn');
        const cancelBtn = document.getElementById('cancel-edge-btn');
        
        // Reset and show modal
        input.value = '';
        modal.classList.add('show');
        input.focus();
        
        const handleConfirm = () => {
            const weight = parseFloat(input.value);
            if (!isNaN(weight)) {
                this.graph.addEdge(source, destination, weight);
                this.render();
                
                // Reset the algorithm state if we have an active algorithm
                // This ensures new edges will be included in future algorithm runs
                if (this.algorithm) {
                    this.currentStepIndex = -1;
                }
                
                // If negative weights and using Dijkstra, show warning
                if (weight < 0 && this.algorithm && this.algorithm.constructor.name === 'Dijkstra') {
                    this.updateStepDescription("Warning: Negative edge added. Dijkstra's algorithm doesn't work with negative edges!");
                }
            }
            modal.classList.remove('show');
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Set up event listeners
        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Set edge creation mode
     * @param {boolean} adding - True if adding edges
     */
    setAddingEdge(adding) {
        this.addingEdge = adding;
        this.firstSelectedNode = null;
        this.selectedNode = null;
        this.render();
    }

    /**
     * Add a new node at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    addNewNode(x, y) {
        if (!this.graph) return;
        
        // Generate a new node name (use next letter or add number if ran out of letters)
        const nodes = this.graph.getNodes();
        let nodeName;
        
        if (nodes.length < 26) {
            // Use next letter (A, B, C, etc.)
            nodeName = String.fromCharCode(65 + nodes.length);
        } else {
            // Use letter + number (A1, A2, etc.)
            nodeName = String.fromCharCode(65 + Math.floor((nodes.length - 26) / 10)) + 
                      ((nodes.length - 26) % 10 + 1);
        }
        
        // Make sure we don't have duplicate names
        while (nodes.includes(nodeName)) {
            if (nodeName.length === 1) {
                nodeName = nodeName + "1";
            } else {
                const lastChar = nodeName[nodeName.length - 1];
                if (!isNaN(parseInt(lastChar))) {
                    nodeName = nodeName.slice(0, -1) + (parseInt(lastChar) + 1);
                } else {
                    nodeName = nodeName + "1";
                }
            }
        }
        
        this.graph.addNode(nodeName, { x, y });
        this.render();
        
        // Reset the algorithm state if we have an active algorithm
        // This ensures new nodes will be included in future algorithm runs
        if (this.algorithm) {
            this.currentStepIndex = -1;
        }
    }

    /**
     * Delete selected node or edge
     */
    deleteSelected() {
        if (!this.graph || !this.selectedNode) return;
        
        this.graph.removeNode(this.selectedNode);
        this.selectedNode = null;
        this.render();
    }

    /**
     * Update the step description in the UI
     * @param {string} description - The step description
     */
    updateStepDescription(description) {
        const stepDescription = document.getElementById('step-description');
        if (stepDescription) {
            stepDescription.textContent = description;
        }
    }

    /**
     * Update the distance table in the UI
     * @param {Object} data - Object containing distances and previous nodes
     */
    updateDistanceTable(data) {
        const tableBody = document.getElementById('distance-table-body');
        if (!tableBody) return;
        
        // Clear table
        tableBody.innerHTML = '';
        
        // No data to show
        if (!data.distances) return;
        
        // Get sorted node names
        const nodes = Object.keys(data.distances).sort();
        
        for (const node of nodes) {
            const row = document.createElement('tr');
            
            // Node name cell
            const nodeCell = document.createElement('td');
            nodeCell.textContent = node;
            row.appendChild(nodeCell);
            
            // Distance cell
            const distanceCell = document.createElement('td');
            const distance = data.distances[node];
            distanceCell.textContent = distance === Infinity ? '∞' : distance;
            row.appendChild(distanceCell);
            
            // Previous cell
            const prevCell = document.createElement('td');
            prevCell.textContent = data.previous && data.previous[node] ? data.previous[node] : '-';
            row.appendChild(prevCell);
            
            tableBody.appendChild(row);
        }
        
        // Show negative cycle warning if applicable
        if (data.hasNegativeCycle) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.style.color = 'red';
            cell.style.fontWeight = 'bold';
            cell.textContent = 'Negative cycle detected! Distances may not be accurate.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    }

    /**
     * Initialize algorithm with selected start node
     * @param {string} startNode - The node to start from
     */
    initializeAlgorithm(startNode) {
        if (!this.algorithm || !startNode) {
            return;
        }
        
        // Create a fresh algorithm instance with the current graph
        // This ensures all new nodes are included in the algorithm
        let algorithmInstance;
        if (this.algorithm instanceof window.Dijkstra) {
            algorithmInstance = new window.Dijkstra(this.graph);
        } else if (this.algorithm instanceof window.BellmanFord) {
            algorithmInstance = new window.BellmanFord(this.graph);
        } else {
            return; // Unknown algorithm type
        }
        
        this.algorithm = algorithmInstance;
        
        // Initialize the algorithm's data structures
        this.algorithm.initialize(startNode);
        
        // Run the full algorithm to generate all steps
        this.algorithm.findShortestPaths(startNode);
        
        // Get steps for visualization
        this.steps = this.algorithm.getSteps();
        
        // Reset to the beginning
        this.currentStepIndex = 0;
        
        // Show first step
        if (this.steps.length > 0) {
            this.visualizeStep(this.steps[0]);
        }
    }

    /**
     * Run algorithm to completion with animation
     */
    runAlgorithm() {
        if (!this.algorithm) {
            return;
        }
        
        // If not initialized yet, do nothing
        if (this.currentStepIndex < 0) {
            return;
        }
        
        // Calculate delay based on animation speed
        const delay = Math.max(2000 - this.animationSpeed * 190, 100);
        
        // Stop any existing animation
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        
        // Animate steps
        this.animationInterval = setInterval(() => {
            // Go to next step
            this.currentStepIndex++;
            
            // Check if we've reached the end
            if (this.currentStepIndex >= this.steps.length) {
                clearInterval(this.animationInterval);
                return;
            }
            
            // Visualize the current step
            this.visualizeStep(this.steps[this.currentStepIndex]);
        }, delay);
    }

    /**
     * Step through algorithm one step at a time
     */
    stepAlgorithm() {
        if (!this.algorithm) {
            return;
        }
        
        // If not initialized or already at the end, do nothing
        if (this.currentStepIndex < 0) {
            return;
        }
        
        if (this.currentStepIndex >= this.steps.length - 1) {
            return;
        }
        
        // Stop any existing animation
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        
        // Go to next step
        this.currentStepIndex++;
        this.visualizeStep(this.steps[this.currentStepIndex]);
    }

    /**
     * Visualize a single step
     * @param {Object} step - Step data from algorithm
     */
    visualizeStep(step) {
        // Update visual state based on step data
        this.render();
        
        // Make sure step has title and description
        const title = step.title || "Algorithm Step";
        const description = step.description || `Step ${this.currentStepIndex + 1}`;
        
        // Update step description
        this.updateStepDescription(`${title}: ${description}`);
        
        // Update distance table
        this.updateDistanceTable({
            distances: step.distances || {},
            previous: step.previous || this.algorithm.previous || {},
            hasNegativeCycle: step.hasNegativeCycle || false
        });
    }
}

export default GraphVisualizer;