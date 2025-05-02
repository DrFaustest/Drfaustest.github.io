// Main application script for Graph Algorithms Visualizer
import Graph from './graph.js';
import GraphVisualizer from './visualization.js';
import Dijkstra from './dijkstra.js';
import BellmanFord from './bellman-ford.js';
import UIController from './ui-controller.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Get references to DOM elements
        const canvasElement = document.getElementById('graph-canvas');
        
        // Create instances
        const graph = new Graph();
        const visualizer = new GraphVisualizer(canvasElement);
        
        // Set up the visualizer with the graph
        visualizer.setGraph(graph);
        
        // Create UI controller and pass instances
        const uiController = new UIController(visualizer, graph);
        
        // Initialize GraphVisualizer namespace in window for debugging
        window.GraphVisualizer = window.GraphVisualizer || {};
        
        // Store instances in the global object for debugging
        window.GraphVisualizer.modules = {
            graph,
            visualizer,
            uiController,
            Dijkstra,
            BellmanFord
        };
        
        // Load example 1 by default
        uiController.loadExample(1);
        
        console.log('Graph Algorithm Visualizer initialized successfully!');
    } catch (error) {
        console.error('Error initializing the application:', error);
        const output = document.getElementById('output');
        if (output) {
            output.textContent = `Error initializing the application: ${error.message}`;
        }
    }
});