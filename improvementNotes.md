# improvementNotes

## Section 1 – Issues by Severity

### Critical
✅ **RESOLVED** - `index.html`: Profile photo now uses forward slashes (`media/img/Profile Pic.png`). All project images properly use forward slashes.
✅ **RESOLVED** - `index.html`: Contact form now includes `Accept: application/json` header in fetch request, correctly handling Formspree's 303 redirect.
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/index.html`: Footer is now properly closed with proper script module imports after footer.

### High
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/js/graph.js`: Now properly implements `setTeardown()` to remove resize listeners when switching visualizers.
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/js/bst.js`: Now uses `setTeardown()` pattern to clean up resize listeners.
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/js/avl.js`: Implements proper teardown for resize listeners.
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/js/rbt.js`: Implements proper teardown for resize listeners.
✅ **RESOLVED** - `Projects/DataStructuresVisualizer/js/sorting.js`: Now implements `setTeardown()` to clean up ResizeObserver and resize event listener, preventing memory leaks.

### Medium
✅ **RESOLVED** - `index.html`: Project cards now use semantic `<a>` tags without nested onclick divs, making them accessible via keyboard/screen readers.
✅ **RESOLVED** - Global styling (`style.css`): Now includes `@media (prefers-reduced-motion: reduce)` to disable gradient animation for users with motion sensitivity.

### Low
✅ **RESOLVED** - Legacy `Projects/DataStructuresVisualizer/script.js` has been removed from the repository.
⚠️ **STILL PRESENT** - `Projects/DataStructuresVisualizer/js/graph.js`: Uses blocking `prompt()` dialogs for target vertex selection (line 353) and random graph generation (line 362). Should be replaced with modals or in-panel inputs for consistency with polished design.

## Section 2 – Remaining Tasks

### Medium Priority
1. **Replace prompt() dialogs in graph.js**: Convert blocking prompts to modal dialogs or in-panel inputs
   - Line 353: Target vertex selection for path finding
   - Line 362: Random graph vertex count input
   - Should match the polished design of the edge weight modal

### Low Priority  
2. **Add automated tests**: Create smoke tests for switching between visualizers to catch memory leak regressions

## Section 3 – Completed Improvements ✅

### Critical Fixes (All Resolved)
- ✅ Fixed all image paths to use forward slashes for GitHub Pages compatibility
- ✅ Added `Accept: application/json` header to contact form submission
- ✅ Closed unclosed footer tag in DataStructuresVisualizer/index.html

### Memory Leak Fixes (All Resolved)
- ✅ Implemented `setTeardown()` cleanup pattern in graph.js, bst.js, avl.js, rbt.js, sorting.js
- ✅ All visualizers now properly remove resize event listeners and observers
- ✅ sorting.js now cleans up ResizeObserver and fallback resize listener

### Sorting Visualizer Complete Rework (January 2026)
- ✅ **Fixed Reset button**: Now properly resets stats and clears all visual states
- ✅ **Fixed Shuffle button**: Creates new random array and resets all states
- ✅ **Added originalArray tracking**: Stores the original unsorted array so "Generate Steps" always works from the same starting point
- ✅ **Fixed step generation**: Array is properly restored to original state before generating new steps
- ✅ **Improved state management**: Created `resetPlayback()` and `clearTransientVisuals()` helper functions
- ✅ **Better error handling**: Added null checks and guards throughout drawBars and applyStepState
- ✅ **Fixed highlighting**: Bars are properly highlighted and unhighlighted during step execution
- ✅ **Fixed resize handling**: Properly stores and cleans up resize handlers in teardown
- ✅ **Algorithm switching**: Changing algorithms now properly resets playback state
- ✅ **Size changing**: Changing array size properly resets all state and creates new random array
- ✅ **Consistent state**: All buttons now maintain consistent state across operations

### Accessibility Improvements (All Resolved)
- ✅ Converted project cards from `<div onclick>` to semantic `<a>` tags
- ✅ Added `prefers-reduced-motion` media query to disable gradient animation for motion-sensitive users

### Repository Hygiene (Completed)
- ✅ Removed legacy monolithic `script.js` file (~1,100 lines, unused)
