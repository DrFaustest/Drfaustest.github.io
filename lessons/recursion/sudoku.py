"""Recursive Sudoku teaching example. Run with Python 3.

board is a 9x9 list: 0 means empty. Givens must not conflict.
empty lists the initially empty cells in row-major order.
The function mutates board and returns True for the first solution;
False restores the original board. It does not test uniqueness.
"""


def solve_sudoku(board, empty, index=0):
    if index == len(empty):
        return True
    row, col = empty[index]
    box_row, box_col = (row // 3) * 3, (col // 3) * 3
    box = []
    for r in range(box_row, box_row + 3):
        box.extend(board[r][box_col:box_col + 3])
    for number in range(1, 10):
        if number in board[row] or number in list(zip(*board))[col] or number in box:
            continue
        board[row][col] = number
        if solve_sudoku(board, empty, index + 1):
            return True
        board[row][col] = 0
    return False


if __name__ == "__main__":
    board = [
        [0, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 0, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 0, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 0, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 0, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 0, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 0, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 0, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 0],
    ]
    empty = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
    solved = solve_sudoku(board, empty)
    print("Solved" if solved else "No solution")
    for row in board:
        print(*row)
