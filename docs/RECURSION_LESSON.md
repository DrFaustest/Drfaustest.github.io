# Recursion teaching page

The local recursion.html page traces the supplied instructor TowerOfHanoi and mazeSearch functions, plus a compact Sudoku backtracking example. Snapshots pause before a Python line executes. Python output, frame locals, stack, and visual state can be replayed.

Hanoi uses n == 1, prints moves, and targets C. Its rods and move log are visualization bookkeeping. The supplied iterative function is a separate reference in the page and download: its parity-variable swap is unused by its fixed rod pairs, so odd counts finish on B and even counts on C.

The maze starts with the exact supplied 6 by 6 grid. It uses x,y arguments and grid[y][x], searches right/down/left/up with short circuiting, and permanently marks visited cells 3. Goal 2 remains unchanged. There is no separate visited collection or saved path. Editable layouts remain square because the supplied horizontal bound uses len(grid). Flood fill homework is not included.

Sudoku offers five presets, generated layouts, and validated custom nine-row input. Its compact function checks row, column, and box constraints before recursing. Preparation runs in a cancellable worker, limited to 8,000 snapshots and ten seconds; reaching a limit is not an unsolvability result. Downloads contain the default examples, not browser edits. The first solution does not establish uniqueness.

Validation: npm run check and python tests/verify_recursion.py. The latter compares every line pause and watched frame local against CPython for six Hanoi sizes, three mazes, and five Sudoku presets.
