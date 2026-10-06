def mazeSearch(grid, x, y):
    # Check base cases
    if grid[y][x] == 1:
        print(f"Hit a wall at position ({y}, {x})")
        return False
    elif grid[y][x] == 2:
        print(f"Found the end at position ({y}, {x})")
        return True
    elif grid[y][x] == 3:
        print(f"Hit an already visited cell at position ({y}, {x})")
        return False
    # Mark visited
    print(f"Visiting cell at position ({y}, {x})")
    grid[y][x] = 3

    # Check each direction in order
    if ((x + 1 < len(grid) and mazeSearch(grid, x + 1, y))
            or (y + 1 < len(grid) and mazeSearch(grid, x, y+1))
            or (x - 1 >= 0 and mazeSearch(grid, x-1, y))
            or (y - 1 >= 0 and mazeSearch(grid, x, y-1))):
        return True
    return False


def mainMaze():
    # 0 is empty; 1 is wall; 2 is end; 3 is visited.
    grid = [[0, 0, 0, 0, 0, 1],
            [1, 1, 0, 0, 0, 1],
            [0, 0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0, 1],
            [0, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 2]]
    print(mazeSearch(grid, 0, 0))


if __name__ == '__main__':
    mainMaze()
