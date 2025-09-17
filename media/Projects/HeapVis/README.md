# Heap Visualizer

An interactive Min/Max binary heap visualizer for your portfolio. Built with plain HTML/CSS/JS and SVG. Supports:

- Insert values
- Extract root
- Delete by index or value
- Update key at index
- Build from array (or random)
- Switch between Min Heap and Max Heap
- Adjustable animation speed, Play/Pause and Step
- Array representation and step-by-step explanation log

## Open

Open `Projects/HeapVis/index.html` in a browser or navigate to it via your portfolio's main index.

## Teaching tips

- Toggle Min/Max to compare ordering.
- Use Build from Array to demonstrate bottom-up heapify.
- Show how delete promotes last element then fixes via up/down.
- Call out the array indices: parent(i) = floor((i-1)/2), children at 2i+1 and 2i+2.

## Notes

- Indices display in the array bar. Root is index 0.
- SVG animates node moves and swaps using CSS transitions.
