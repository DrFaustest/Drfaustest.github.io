export const SOLVED_SUDOKU = [
  [5,3,4,6,7,8,9,1,2], [6,7,2,1,9,5,3,4,8], [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3], [4,2,6,8,5,3,7,9,1], [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4], [2,8,7,4,1,9,6,3,5], [3,4,5,2,8,6,1,7,9],
];

export function sudokuPreset(name) {
  const board = structuredClone(SOLVED_SUDOKU);
  if (name === 'blocked') {
    board[0][0] = 0; board[0][1] = 5; board[3][1] = 0;
  } else if (name === 'backtrack') {
    for (const i of [6,10,16,20,30,32,38,39,40,41,42,43,44,54,57,59,64,65,66,67,73,79]) board[Math.floor(i / 9)][i % 9] = 0;
  } else if (name === 'scattered') {
    for (const i of [0,5,8,12,16,20,25,28,32,38,43,47,51,54,59,63,68,73,77,80]) board[Math.floor(i / 9)][i % 9] = 0;
  } else if (name === 'corners') {
    for (const r of [0,1,7,8]) for (const c of [0,1,7,8]) board[r][c] = 0;
  } else for (let i = 0; i < 9; i++) board[i][i] = 0;
  return board;
}

export function validateSudoku(board) {
  if (!Array.isArray(board) || board.length !== 9 || board.some(row => !Array.isArray(row) || row.length !== 9 || row.some(n => !Number.isInteger(n) || n < 0 || n > 9))) throw new Error('Enter nine rows of nine digits. Use 0 or . for empty cells.');
  const check = (values, label) => {
    const digits = values.filter(Boolean);
    if (new Set(digits).size !== digits.length) throw new Error(`Conflicting givens in ${label}. Remove the repeated digit before running.`);
  };
  for (let i = 0; i < 9; i++) {
    check(board[i], `row ${i + 1}`); check(board.map(row => row[i]), `column ${i + 1}`);
  }
  for (let r = 0; r < 9; r += 3) for (let c = 0; c < 9; c += 3) check(board.slice(r, r + 3).flatMap(row => row.slice(c, c + 3)), `the box starting at row ${r + 1}, column ${c + 1}`);
  return board;
}

export function parseSudoku(text) {
  const rows = text.trim().split(/\r?\n/).map(row => row.replace(/[\s,|]/g, ''));
  if (rows.length !== 9 || rows.some(row => !/^[0-9.]{9}$/.test(row))) throw new Error('Enter nine rows of nine digits. Use 0 or . for empty cells.');
  return validateSudoku(rows.map(row => [...row].map(char => char === '.' ? 0 : Number(char))));
}

export function randomSudoku(random = Math.random) {
  const shuffle = values => {
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    return values;
  };
  const digits = shuffle([1,2,3,4,5,6,7,8,9]);
  const order = () => shuffle([0,1,2]).flatMap(band => shuffle([0,1,2]).map(i => band * 3 + i));
  const rows = order(), cols = order();
  const board = rows.map(r => cols.map(c => digits[SOLVED_SUDOKU[r][c] - 1]));
  for (const i of shuffle(Array.from({length:81}, (_,i)=>i)).slice(0,14)) board[Math.floor(i / 9)][i % 9] = 0;
  return board;
}

export function sudokuTrace(input) {
  validateSudoku(input);
  const board = structuredClone(input);
  const empty = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] === 0) empty.push([r, c]);
  const frames = [], steps = [];
  let placements = 0, backtracks = 0;
  const emit = (line, text, kind = 'line') => {
    if (steps.length >= 8000) throw new RangeError('This puzzle needs more than 8,000 recorded steps. Add a few givens or choose a teaching layout; this is not a no-solution result.');
    // One immutable board snapshot shared by frames within this state.
    const snapshot = structuredClone(board);
    steps.push({ line, text, kind, board: snapshot, placements, backtracks,
      stack: frames.map(frame => ({ name: `solve_sudoku(board, empty, ${frame.index})`, locals: { board: snapshot, empty, ...structuredClone(frame) } })),
      current: frames.length && 'row' in frames.at(-1) ? [frames.at(-1).row, frames.at(-1).col] : null });
  };
  function solve(index) {
    const f = { index }; frames.push(f);
    emit(11, `Check whether index ${index} equals ${empty.length}, the number of empty cells.`);
    if (index === empty.length) {
      emit(12, 'Every initially empty cell is filled. Return True.', 'success'); frames.pop(); return true;
    }
    emit(13, `Read empty[${index}] to choose the next cell.`);
    [f.row, f.col] = empty[index];
    emit(14, 'Locate the top-left corner of this cell’s 3×3 box.');
    f.box_row = Math.floor(f.row / 3) * 3; f.box_col = Math.floor(f.col / 3) * 3;
    emit(15, 'Create a list for the box values.'); f.box = [];
    for (let r = f.box_row; r < f.box_row + 3; r++) {
      emit(16, 'Advance to the next box row.'); f.r = r;
      emit(17, 'Collect this row’s three box values.'); f.box.push(...board[r].slice(f.box_col, f.box_col + 3));
    }
    emit(16, 'The box-row loop is exhausted.');
    for (let number = 1; number <= 9; number++) {
      emit(18, 'Advance to the next candidate number.'); f.number = number;
      emit(19, 'Check the row, column, and box for this number.');
      const conflict = board[f.row].includes(number) ? 'row' : board.some(row => row[f.col] === number) ? 'column' : f.box.includes(number) ? 'box' : null;
      if (conflict) { emit(20, 'Reject ' + number + ': ' + conflict + ' conflict.', 'reject'); continue; }
      emit(21, 'Place ' + number + ' at (' + f.row + ', ' + f.col + ').', 'place');
      board[f.row][f.col] = number; placements++;
      emit(22, 'Recursively solve the remaining empty cells.', 'call');
      if (solve(index + 1)) { emit(23, 'The child succeeded. Return True.', 'return'); frames.pop(); return true; }
      emit(24, 'The child failed. Erase this trial number.', 'backtrack');
      board[f.row][f.col] = 0; backtracks++;
    }
    emit(18, 'All candidates have been tried.');
    emit(25, 'No number works. Return False.', 'return'); frames.pop(); return false;
  }
  const solved = solve(0);
  emit(null, solved ? `Solved. ${placements} placements and ${backtracks} backtracks. The board contains the first solution found; uniqueness was not tested.` : 'Returned False. No solution exists for these givens; every trial placement has been undone.', 'done');
  steps.at(-1).solved = solved;
  return steps;
}
