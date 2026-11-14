import React, { useCallback, useEffect, useState } from 'react';
import { Eraser, Lightbulb, Pencil, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
const REMOVE_COUNT: Record<Difficulty, number> = { Easy: 34, Medium: 44, Hard: 52 };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isValidPlacement(board: number[][], r: number, c: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === val || board[i][c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (board[br + dr][bc + dc] === val) return false;
    }
  }
  return true;
}

function generateSolvedBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
  const fill = (idx: number): boolean => {
    if (idx === 81) return true;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (isValidPlacement(board, r, c, num)) {
        board[r][c] = num;
        if (fill(idx + 1)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  };
  fill(0);
  return board;
}

function generateSudoku(diff: Difficulty) {
  const solution = generateSolvedBoard();
  const puzzle = solution.map((r) => [...r]);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let toRemove = REMOVE_COUNT[diff];
  for (const pos of positions) {
    if (toRemove <= 0) break;
    puzzle[Math.floor(pos / 9)][pos % 9] = 0;
    toRemove--;
  }
  const fixed = puzzle.map((row) => row.map((v) => v !== 0));
  return { puzzle, solution, fixed };
}

export const SudokuPuzzle: React.FC<PuzzleComponentProps> = ({
  stats,
  onSolved,
  muted,
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [data, setData] = useState(() => generateSudoku('Medium'));
  const [grid, setGrid] = useState<number[][]>(() => data.puzzle.map((r) => [...r]));
  const [notes, setNotes] = useState<number[][][]>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))
  );
  const [selected, setSelected] = useState<[number, number] | null>([0, 0]);
  const [noteMode, setNoteMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [solved]);

  const startNew = useCallback(
    (diff: Difficulty = difficulty) => {
      const fresh = generateSudoku(diff);
      setDifficulty(diff);
      setData(fresh);
      setGrid(fresh.puzzle.map((r) => [...r]));
      setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])));
      setSelected([0, 0]);
      setSeconds(0);
      setHintsUsed(0);
      setSolved(false);
      arcadeSound.click(muted);
    },
    [difficulty, muted]
  );

  const checkSolved = useCallback(
    (candidate: number[][], usedHints: number) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (candidate[r][c] !== data.solution[r][c]) return false;
        }
      }
      setSolved(true);
      const base = difficulty === 'Hard' ? 1400 : difficulty === 'Medium' ? 1000 : 750;
      const score = Math.max(200, base - seconds * 2 - usedHints * 80);
      onSolved(score);
      arcadeSound.victory(muted);
      return true;
    },
    [data.solution, difficulty, muted, onSolved, seconds]
  );

  const applyDigit = useCallback(
    (digit: number) => {
      if (!selected || solved) return;
      const [r, c] = selected;
      if (data.fixed[r][c]) return;

      if (noteMode && digit !== 0) {
        setNotes((prev) =>
          prev.map((row, ri) =>
            row.map((cell, ci) => {
              if (ri !== r || ci !== c) return cell;
              return cell.includes(digit)
                ? cell.filter((n) => n !== digit)
                : [...cell, digit].sort((a, b) => a - b);
            })
          )
        );
        arcadeSound.click(muted);
        return;
      }

      const next = grid.map((row, ri) =>
        row.map((val, ci) => (ri === r && ci === c ? digit : val))
      );
      setGrid(next);
      setNotes((prev) =>
        prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? [] : cell)))
      );
      arcadeSound.click(muted);
      checkSolved(next, hintsUsed);
    },
    [checkSolved, data.fixed, grid, hintsUsed, muted, noteMode, selected, solved]
  );

  const revealHint = () => {
    if (solved) return;
    const empties: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== data.solution[r][c]) empties.push([r, c]);
      }
    }
    if (empties.length === 0) return;
    const target =
      selected && grid[selected[0]][selected[1]] !== data.solution[selected[0]][selected[1]]
        ? selected
        : empties[Math.floor(Math.random() * empties.length)];

    const [r, c] = target;
    const next = grid.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? data.solution[r][c] : val))
    );
    const nextHints = hintsUsed + 1;
    setGrid(next);
    setHintsUsed(nextHints);
    setSelected([r, c]);
    arcadeSound.bonus(muted);
    checkSolved(next, nextHints);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '1' && e.key <= '9') {
        applyDigit(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        applyDigit(0);
      } else if (e.key === 'n' || e.key === 'N') {
        setNoteMode((n) => !n);
      } else if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const [r, c] = selected;
        if (e.key === 'ArrowUp') setSelected([Math.max(0, r - 1), c]);
        if (e.key === 'ArrowDown') setSelected([Math.min(8, r + 1), c]);
        if (e.key === 'ArrowLeft') setSelected([r, Math.max(0, c - 1)]);
        if (e.key === 'ArrowRight') setSelected([r, Math.min(8, c + 1)]);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [applyDigit, selected]);

  const hasConflict = (r: number, c: number, val: number): boolean => {
    if (val === 0) return false;
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === val) return true;
      if (i !== r && grid[i][c] === val) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const nr = br + dr;
        const nc = bc + dc;
        if ((nr !== r || nc !== c) && grid[nr][nc] === val) return true;
      }
    }
    return false;
  };

  const selectedVal = selected ? grid[selected[0]][selected[1]] : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Top Toolbar */}
      <div className="w-full max-w-[460px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => startNew(d)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                difficulty === d ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <span className="font-mono tabular-nums text-slate-300">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </span>
          <span className="font-mono tabular-nums text-emerald-400">
            Solved: {stats.solvedCount}
          </span>
        </div>
      </div>

      {/* 9x9 Grid */}
      <div className="p-2 sm:p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl">
        <div className="grid grid-cols-9 border-2 border-slate-500 bg-slate-800">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isPeer =
                selected &&
                (selected[0] === r ||
                  selected[1] === c ||
                  (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                    Math.floor(selected[1] / 3) === Math.floor(c / 3)));
              const isSameNum = selectedVal !== 0 && val === selectedVal;
              const conflict = hasConflict(r, c, val);
              const isFixed = data.fixed[r][c];
              const cellNotes = notes[r][c];

              const borderRight = c === 2 || c === 5 ? 'border-r-2 border-r-slate-500' : 'border-r border-r-slate-700/70';
              const borderBottom = r === 2 || r === 5 ? 'border-b-2 border-b-slate-500' : 'border-b border-b-slate-700/70';

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => setSelected([r, c])}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center font-mono tabular-nums transition-colors select-none ${borderRight} ${borderBottom} ${
                    isSelected
                      ? 'bg-sky-500/30 ring-2 ring-inset ring-sky-400'
                      : isSameNum
                      ? 'bg-sky-500/18'
                      : isPeer
                      ? 'bg-slate-800/90'
                      : 'bg-slate-900/95'
                  }`}
                >
                  {val !== 0 ? (
                    <span
                      className={`text-base sm:text-lg font-semibold ${
                        conflict
                          ? 'text-rose-400'
                          : isFixed
                          ? 'text-slate-100'
                          : 'text-sky-300'
                      }`}
                    >
                      {val}
                    </span>
                  ) : cellNotes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-x-0.5 text-[8px] leading-tight text-slate-400">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n}>{cellNotes.includes(n) ? n : ''}</span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number Pad + Actions */}
      <div className="w-full max-w-[460px] flex flex-col gap-2.5">
        <div className="grid grid-cols-9 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => applyDigit(n)}
              className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono text-sm font-semibold text-white transition-colors"
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNoteMode((n) => !n)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                noteMode
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Notes {noteMode ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => applyDigit(0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300"
            >
              <Eraser className="w-3.5 h-3.5" />
              Erase
            </button>
            <button
              type="button"
              onClick={revealHint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-medium text-amber-300"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Hint
            </button>
          </div>

          <button
            type="button"
            onClick={() => startNew(difficulty)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Puzzle
          </button>
        </div>
      </div>

      {solved && (
        <div className="w-full max-w-[460px] p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-emerald-300">
            Matrix solved in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}!
          </span>
          <button
            type="button"
            onClick={() => startNew(difficulty)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold"
          >
            Next Puzzle
          </button>
        </div>
      )}
    </div>
  );
};
