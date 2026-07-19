import { solve } from '../Projects/Sudoku/js/lib/sudoku.js';

const puzzle = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9]
];

function validUnit(values) {
  return [...values].sort((a, b) => a - b).join('') === '123456789';
}

test('Sudoku solver produces a valid solution and preserves givens', () => {
  const { solution } = solve(puzzle);
  expect(solution).not.toBeNull();
  for (let row = 0; row < 9; row += 1) {
    expect(validUnit(solution[row])).toBe(true);
    expect(validUnit(solution.map(line => line[row]))).toBe(true);
    for (let column = 0; column < 9; column += 1) {
      if (puzzle[row][column]) expect(solution[row][column]).toBe(puzzle[row][column]);
    }
  }
});

test('Sudoku solver rejects contradictory givens', () => {
  const invalid = puzzle.map(row => [...row]);
  invalid[0][1] = 5;
  expect(solve(invalid).solution).toBeNull();
});
