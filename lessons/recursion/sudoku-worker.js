import { sudokuTrace } from './sudoku.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ steps: sudokuTrace(data) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
