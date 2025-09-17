from collections import deque
from typing import List, Optional, Tuple

# ---------------------------------------------
# Bitmask utilities for domains {1..9}
# ---------------------------------------------
ALL = (1 << 10) - 2  # 0b11_1111_1110 -> bits 1..9 set

def bit(d: int) -> int:
    return 1 << d

def is_singleton(m: int) -> bool:
    return m != 0 and (m & (m - 1)) == 0

def mask_to_digit(m: int) -> int:
    # precondition: singleton
    return (m.bit_length() - 1)

def mask_size(m: int) -> int:
    return m.bit_count()

def mask_iter(m: int):
    while m:
        lsb = m & -m
        d = (lsb.bit_length() - 1)
        yield d
        m ^= lsb

# ---------------------------------------------
# Grid indexing helpers
# ---------------------------------------------
def rc_to_i(r: int, c: int) -> int:
    return r * 9 + c

def i_to_rc(i: int) -> Tuple[int, int]:
    return divmod(i, 9)

# Precompute peers and units
UNITS: List[List[int]] = []          # 27 units (9 rows, 9 cols, 9 boxes)
UNITS_OF_CELL: List[List[int]] = [[] for _ in range(81)]
PEERS: List[List[int]] = [[] for _ in range(81)]

# Build units
for r in range(9):
    UNITS.append([rc_to_i(r, c) for c in range(9)])
for c in range(9):
    UNITS.append([rc_to_i(r, c) for r in range(9)])
for br in range(3):
    for bc in range(3):
        cells = []
        for dr in range(3):
            for dc in range(3):
                cells.append(rc_to_i(3*br + dr, 3*bc + dc))
        UNITS.append(cells)

# Map cells to units and peers
for u_idx, unit in enumerate(UNITS):
    for i in unit:
        UNITS_OF_CELL[i].append(u_idx)
for i in range(81):
    peer_set = set()
    for u_idx in UNITS_OF_CELL[i]:
        for j in UNITS[u_idx]:
            if j != i:
                peer_set.add(j)
    PEERS[i] = sorted(peer_set)

# ---------------------------------------------
# Pretty printing
# ---------------------------------------------
def format_grid(domains: List[int]) -> str:
    out = []
    for r in range(9):
        row = []
        for c in range(9):
            i = rc_to_i(r, c)
            m = domains[i]
            if is_singleton(m):
                row.append(str(mask_to_digit(m)))
            else:
                row.append(".")
        out.append(" ".join(row))
    return "\n".join(out)

def format_solution(domains: List[int]) -> str:
    # returns a compact 9-line solution with digits
    lines = []
    for r in range(9):
        line = []
        for c in range(9):
            d = mask_to_digit(domains[rc_to_i(r, c)])
            line.append(str(d))
        lines.append("".join(line))
    return "\n".join(lines)

# ---------------------------------------------
# Initialization
# ---------------------------------------------
def parse_grid(grid) -> List[int]:
    """
    Accepts:
      - 81-char string with digits 1..9 or '0' '.' for empty
      - 9x9 list of ints (0 for empty)
      - 9 lines string
    Returns domains[81] as bitmasks.
    """
    cells: List[Optional[int]] = []

    if isinstance(grid, str):
        s = "".join(ch for ch in grid if not ch.isspace())
        if len(s) != 81:
            raise ValueError("String grid must contain exactly 81 non-space characters.")
        for ch in s:
            if ch in ".0":
                cells.append(None)
            elif ch.isdigit() and ch != '0':
                d = int(ch)
                if not (1 <= d <= 9):
                    raise ValueError("Digits must be 1..9.")
                cells.append(d)
            else:
                raise ValueError(f"Unexpected char: {ch}")
    else:
        # assume 9x9 iterable
        for r in range(9):
            for c in range(9):
                v = grid[r][c]
                if v in (0, None, '.'):
                    cells.append(None)
                else:
                    v = int(v)
                    if not (1 <= v <= 9):
                        raise ValueError("Values must be 0 or 1..9.")
                    cells.append(v)

    # domains
    D = [ALL] * 81
    # Seed givens
    for i, v in enumerate(cells):
        if v is not None:
            D[i] = bit(v)
    # Initial consistency: remove given digits from peers
    if not propagate_all(D):
        raise ValueError("Initial puzzle is contradictory.")
    return D

# ---------------------------------------------
# Propagation (WFC-style): naked singles + hidden singles
# ---------------------------------------------
def propagate_all(D: List[int]) -> bool:
    """
    Returns True if consistent; False if contradiction.
    """
    q = deque()

    # enqueue all current singletons
    for i in range(81):
        if is_singleton(D[i]):
            q.append(i)

    changed = True
    while True:
        # A) process naked singles queue
        while q:
            i = q.popleft()
            m = D[i]
            if not is_singleton(m):
                continue  # might have been expanded since enqueue
            v = m
            # eliminate v from all peers
            for j in PEERS[i]:
                if D[j] & v:
                    D[j] &= ~v
                    if D[j] == 0:
                        return False  # contradiction
                    if is_singleton(D[j]):
                        q.append(j)

        # B) hidden singles in all units
        progress = False
        for unit in UNITS:
            # For each digit 1..9, count candidate cells in unit
            for d in range(1, 10):
                b = bit(d)
                loc = [i for i in unit if (D[i] & b)]
                if len(loc) == 0:
                    # digit impossible in this unit => contradiction
                    return False
                if len(loc) == 1:
                    i = loc[0]
                    if D[i] != b:
                        D[i] = b
                        q.append(i)
                        progress = True
        if not progress and not q:
            break

    return True

# ---------------------------------------------
# Search: MRV branching
# ---------------------------------------------
def solved(D: List[int]) -> bool:
    return all(is_singleton(m) for m in D)

def select_mrv_cell(D: List[int]) -> Optional[int]:
    best_i, best_size = None, 10
    for i, m in enumerate(D):
        if m == 0:
            return None
        sz = mask_size(m)
        if 1 < sz < best_size:
            best_size, best_i = sz, i
    return best_i

def deep_copy_domains(D: List[int]) -> List[int]:
    return D.copy()

def solve(D: List[int]) -> Optional[List[int]]:
    if solved(D):
        return D
    i = select_mrv_cell(D)
    if i is None:
        return None  # contradiction somewhere
    # Branch on smallest domain
    candidates = list(mask_iter(D[i]))
    # Optional: try least-constraining or fail-fast ordering;
    # here we just iterate ascending.
    for d in candidates:
        D2 = deep_copy_domains(D)
        D2[i] = bit(d)
        if propagate_all(D2):
            ans = solve(D2)
            if ans is not None:
                return ans
    return None

# ---------------------------------------------
# Public API
# ---------------------------------------------
def solve_sudoku(grid) -> List[List[int]]:
    """
    grid: 81-char string or 9x9 list. Returns solved 9x9 list of ints.
    """
    D0 = parse_grid(grid)
    ans = solve(D0)
    if ans is None:
        raise ValueError("No solution found (unsatisfiable).")
    # Convert to 9x9 ints
    out = [[0]*9 for _ in range(9)]
    for r in range(9):
        for c in range(9):
            out[r][c] = mask_to_digit(ans[rc_to_i(r, c)])
    return out

# ---------------------------------------------
# Demo
# ---------------------------------------------
if __name__ == "__main__":
    # A moderately hard puzzle (0 or . = empty)
    puzzle = (
        "530070000"
        "600195000"
        "098000060"
        "800060003"
        "400803001"
        "700020006"
        "060000280"
        "000419005"
        "000080079"
    )
    D = parse_grid(puzzle)
    print("Initial:")
    print(format_grid(D), "\n")
    solution = solve(D)
    if solution:
        print("Solved grid:")
        print(format_solution(solution))
    else:
        print("No solution.")
