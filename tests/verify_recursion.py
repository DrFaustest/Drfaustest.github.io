"""Compare the browser simulator's line/variable snapshots with real CPython.

Run from the repository root: python tests/verify_recursion.py
Requires Node.js and Python 3, no third-party packages.
"""
import copy
import contextlib
import io
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'lessons' / 'recursion' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def normalize(value):
    if isinstance(value, set):
        return sorted([normalize(item) for item in value])
    if isinstance(value, (list, tuple)):
        return [normalize(item) for item in value]
    if isinstance(value, dict):
        return {key: normalize(item) for key, item in value.items()}
    return value


def actual_trace(function, args, watched):
    states = []
    output = io.StringIO()
    source = function.__code__.co_filename

    def tracer(frame, event, arg):
        if event == 'line' and frame.f_code.co_filename == source:
            frames = []
            cursor = frame
            while cursor and cursor.f_code.co_filename == source:
                names = watched[cursor.f_code.co_name]
                frames.append(normalize(copy.deepcopy({key: cursor.f_locals[key] for key in names if key in cursor.f_locals})))
                cursor = cursor.f_back
            states.append({'line': frame.f_lineno, 'stack': frames[::-1], 'stdout': output.getvalue().splitlines()})
        return tracer

    sys.settrace(tracer)
    try:
        with contextlib.redirect_stdout(output):
            function(*args)
    finally:
        sys.settrace(None)
    return states


def compare(actual, simulated, label):
    browser = []
    for state in simulated:
        if state['line'] is None:
            continue
        frames = []
        for frame in state['stack']:
            locals_ = {key: value for key, value in frame['locals'].items() if key != 'search'}
            if 'visited' in locals_:
                locals_['visited'] = sorted(locals_['visited'])
            frames.append(locals_)
        browser.append({'line': state['line'], 'stack': frames, 'stdout': state.get('stdout', [])})
    assert len(actual) == len(browser), f'{label}: {len(actual)} Python states vs {len(browser)} browser states'
    for index, (a, b) in enumerate(zip(actual, browser)):
        assert a == b, f'{label}, state {index}:\nPython {a}\nBrowser {b}'
    print(f'{label}: {len(actual)} line pauses and all watched values match CPython')


hanoi = load('hanoi_example', 'tower_of_hanoi.py')
maze = load('maze_example', 'maze.py')
sudoku = load('sudoku_example', 'sudoku.py')
script = """
import {hanoiTrace, mazeTrace, mazePreset} from './lessons/recursion/algorithms.js';
import {sudokuTrace, sudokuPreset} from './lessons/recursion/sudoku.js';
console.log(JSON.stringify({
  hanoi: [1,2,3,4,5,6].map(n => hanoiTrace(n)),
  mazes: ['branches','blocked','open'].map(name => ({name, grid: mazePreset(name), trace: mazeTrace(mazePreset(name))})),
  sudoku: ['quick','backtrack','blocked','scattered','corners'].map(name => ({name, board: sudokuPreset(name), trace: sudokuTrace(sudokuPreset(name))}))
}));
"""
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=ROOT, encoding='utf-8'))
for n, simulated in enumerate(data['hanoi'], 1):
    actual = actual_trace(hanoi.TowerOfHanoi, (n, 'A', 'C', 'B'), {'TowerOfHanoi': ['n', 'source', 'destination', 'auxiliary']})
    compare(actual, simulated, f'Hanoi n={n}')
for example in data['mazes']:
    actual = actual_trace(maze.mazeSearch, (example['grid'], 0, 0), {
        'mazeSearch': ['grid', 'x', 'y'],
    })
    compare(actual, example['trace'], f'Maze {example["name"]}')
for example in data['sudoku']:
    board = example['board']
    empty = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
    actual = actual_trace(sudoku.solve_sudoku, (board, empty), {
        'solve_sudoku': ['board', 'empty', 'index', 'row', 'col', 'number', 'box_row', 'box_col', 'box', 'r'],
    })
    compare(actual, example['trace'], f'Sudoku {example["name"]}')
