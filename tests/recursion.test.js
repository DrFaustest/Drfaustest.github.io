import { hanoiTrace, mazeTrace, mazePreset } from '../lessons/recursion/algorithms.js';
import { sudokuTrace, sudokuPreset, parseSudoku, randomSudoku } from '../lessons/recursion/sudoku.js';

test.each(['branches', 'blocked', 'open'])('Maze %s finds a route without separate history collections', preset => {
  const grid = mazePreset(preset), original = structuredClone(grid), trace = mazeTrace(grid), final = trace.at(-1);
  expect(grid).toEqual(original);
  expect(final.found).toBe(preset !== 'blocked');
  expect(final.stack).toEqual([]);
  expect(final.maze[0][0]).toBe(3); expect(final.maze[5][5]).toBe(2);
  for (const state of trace) {
    expect(state).not.toHaveProperty('visited'); expect(state).not.toHaveProperty('path');
    grid.forEach((row,r)=>row.forEach((value,c)=>{ if(value===1) expect(state.maze[r][c]).toBe(1); }));
    for (const frame of state.stack) expect(frame.locals.grid).toEqual(state.maze);
  }
});

test('Visited marks persist after failed branches', () => {
 const trace=mazeTrace(mazePreset('blocked'));
 expect(trace.some(s=>s.line===22)).toBe(true);
 for(let i=1;i<trace.length;i++) trace[i-1].maze.forEach((row,r)=>row.forEach((v,c)=>{if(v===3)expect(trace[i].maze[r][c]).toBe(3);}));
});

function validSudoku(board) {
  const valid = values => new Set(values.filter(Boolean)).size === values.filter(Boolean).length;
  for (let i = 0; i < 9; i++) {
    if (!valid(board[i]) || !valid(board.map(row => row[i]))) return false;
  }
  for (let r = 0; r < 9; r += 3) for (let c = 0; c < 9; c += 3) {
    if (!valid(board.slice(r, r + 3).flatMap(row => row.slice(c, c + 3)))) return false;
  }
  return true;
}

test.each(['quick', 'backtrack', 'blocked', 'scattered', 'corners'])('Sudoku %s preserves givens and every intermediate constraint', preset => {
  const board = sudokuPreset(preset), original = structuredClone(board), trace = sudokuTrace(board);
  expect(validSudoku(board)).toBe(true);
  for (const state of trace) {
    expect(validSudoku(state.board)).toBe(true);
    board.forEach((row, r) => row.forEach((value, c) => { if (value) expect(state.board[r][c]).toBe(value); }));
  }
  expect(board).toEqual(original);
  const final = trace.at(-1);
  expect(final.stack).toEqual([]);
  expect(final.solved).toBe(preset !== 'blocked');
  if (final.solved) expect(final.board.flat().every(value => value >= 1 && value <= 9)).toBe(true);
  else expect(final.board).toEqual(original);
  if (preset === 'backtrack') expect(final.backtracks).toBe(3);
});

test.each([1, 2, 3, 4, 5, 6])('Hanoi with %i disks preserves legal towers and finishes in the minimum moves', n => {
  const trace = hanoiTrace(n);
  for (const state of trace) {
    const disks = Object.values(state.pegs).flat().sort((a, b) => a - b);
    expect(disks).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    for (const peg of Object.values(state.pegs)) {
      expect(peg.every((disk, i) => i === 0 || peg[i - 1] > disk)).toBe(true);
    }
  }
  const final = trace.at(-1);
  expect(final.moves).toHaveLength(2 ** n - 1);
  expect(final.pegs.C).toEqual(Array.from({ length: n }, (_, i) => n - i));
  expect(final.stack).toEqual([]);
  const pegs = { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] };
  for (const [disk, from, to] of final.moves) {
    expect(pegs[from].pop()).toBe(disk);
    expect(pegs[to].length === 0 || pegs[to].at(-1) > disk).toBe(true);
    pegs[to].push(disk);
  }
});

test('A paused print line has not produced a move until the next state', () => {
  const trace = hanoiTrace(3), append = trace.findIndex(step => step.line === 3);
  expect(trace[append].moves).toHaveLength(0);
  expect(trace[append + 1].moves).toEqual([[1, 'A', 'C']]);
  expect(trace[append].moves).toHaveLength(0);
});

test('Custom puzzle parsing accepts dots and rejects conflicting givens', () => {
 const board=sudokuPreset('quick');
 expect(parseSudoku(board.map(r=>r.join('').replaceAll('0','.')).join('\n'))).toEqual(board);
 expect(()=>parseSudoku('123')).toThrow();
 const bad=structuredClone(board);bad[0][0]=3;
 expect(()=>parseSudoku(bad.map(r=>r.join('')).join('\n'))).toThrow();
});
test('Generated layouts preserve Sudoku constraints and can be solved', () => {
 for(let seed=1;seed<=10;seed++) {
  let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/2**32;};
  const board=randomSudoku(random); expect(validSudoku(board)).toBe(true);
  expect(sudokuTrace(board).at(-1).solved).toBe(true);
 }
});
