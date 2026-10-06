def TowerOfHanoi(n, source, destination, auxiliary):
    if n == 1:
        print("Move disk 1 from source", source, "to destination", destination)
        return
    TowerOfHanoi(n - 1, source, auxiliary, destination)
    print("Move disk", n, "from source", source, "to destination", destination)
    TowerOfHanoi(n - 1, auxiliary, destination, source)


def mainTower(n):
    TowerOfHanoi(n, 'A', 'C', 'B')
    # A, C, B are the names of rods.


def TowerOfHanoiIterative(n):
    src = 'A'
    aux = 'C'
    des = 'B'

    total_moves = 2 ** n - 1
    if n % 2 == 0:
        des, aux = aux, des

    rods = {'A': list(range(n, 0, -1)), 'B': [], 'C': []}

    for move in range(1, total_moves + 1):
        if move % 3 == 1:
            from_rod, to_rod = ('A', 'B') if (rods['A'] and (not rods['B'] or rods['A'][-1] < rods['B'][-1])) else ('B', 'A')
        elif move % 3 == 2:
            from_rod, to_rod = ('A', 'C') if (rods['A'] and (not rods['C'] or rods['A'][-1] < rods['C'][-1])) else ('C', 'A')
        else:
            from_rod, to_rod = ('B', 'C') if (rods['B'] and (not rods['C'] or rods['B'][-1] < rods['C'][-1])) else ('C', 'B')

        disk = rods[from_rod].pop()
        rods[to_rod].append(disk)
        print(f"Move disk {disk} from {from_rod} to {to_rod}")


if __name__ == '__main__':
    num = int(input('How many disks? '))
    mainTower(num)
    TowerOfHanoiIterative(num)
