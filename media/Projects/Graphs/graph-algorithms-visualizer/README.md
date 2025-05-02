# Graph Algorithms Visualizer

An interactive visualization tool for learning and understanding graph algorithms, specifically Dijkstra's and Bellman-Ford shortest path algorithms.

## Description

This visualizer allows users to:

1. Create custom weighted directed graphs by adding nodes and edges
2. Load example graphs optimized for each algorithm
3. Run Dijkstra's algorithm on graphs without negative edges
4. Run Bellman-Ford algorithm on any graph, including those with negative edges
5. Step through each algorithm one step at a time to understand the process
6. Visualize the shortest paths found by the algorithms
7. Examine the distance table after each step

## Algorithms Implemented

### Dijkstra's Algorithm
- Finds the shortest paths from a source node to all other nodes in a graph
- Works only on graphs with non-negative edge weights
- Uses a greedy approach, selecting the node with the minimum known distance at each step

### Bellman-Ford Algorithm
- Finds the shortest paths from a source node to all other nodes in a graph
- Works on graphs with negative edge weights (unlike Dijkstra's)
- Can detect negative cycles in a graph
- Performs multiple iterations over all edges

## Features

- **Interactive Graph Building**: Add nodes and edges with custom weights
- **Step-by-Step Visualization**: Watch the algorithms in action one step at a time
- **Distance Table**: See how distances are updated throughout the algorithm
- **Animation Controls**: Adjust animation speed or step manually through the algorithm
- **Example Graphs**: Load pre-configured examples to demonstrate specific algorithm behaviors

## How to Use

1. **Create a Graph**:
   - Click "Add Node" then click on the canvas to add nodes
   - Click "Add Edge" then select a source node followed by a destination node, and enter a weight

2. **Or Load an Example**:
   - Click "Example 1" for a graph suitable for Dijkstra's algorithm (no negative edges)
   - Click "Example 2" for a graph with a negative edge to demonstrate Bellman-Ford

3. **Select an Algorithm**:
   - Choose either "Dijkstra's Algorithm" or "Bellman-Ford Algorithm"

4. **Choose a Starting Node**:
   - Select a node from the dropdown menu

5. **Run the Algorithm**:
   - Click "Run Algorithm" to see the full animation
   - Click "Step Algorithm" to advance one step at a time
   - Click "Reset" to restart the algorithm

6. **Analyze the Results**:
   - Watch nodes change color as they're visited
   - See the shortest paths highlighted
   - Check the distance table for the current shortest path distances

## Technical Details

- Built with vanilla JavaScript using ES modules
- Uses HTML5 and CSS3 for rendering and styling
- Implements the classic adjacency list representation for graphs
- No external libraries or dependencies required