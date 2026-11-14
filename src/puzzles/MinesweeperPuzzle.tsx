import React, { useCallback, useEffect, useState } from 'react';
import { Bomb, Flag, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacent: number;
}

type Preset = '9x9' | '12x12';

const PRESETS: Record<Preset, { size: number; mines: number; label: string }> = {
  '9x9': { size: 9, mines: 10, label: '9x9 (10)' },
  '12x12': { size: 12, mines: 22, label: '12x12 (22)' },
};

const NUM_COLORS: Record<number, string> = {
  1: 'text-sky-400',
  2: 'text-emerald-400',
  3: 'text-rose-400',
  4: 'text-violet-400',
  5: 'text-amber-400',
  6: 'text-teal-400',
  7: 'text-slate-200',
  8: 'text-slate-400',
};

function createEmptyGrid(size: number): Cell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  );
}

function plantMines(grid: Cell[][], minesCount: number, safeR: number, safeC: number): Cell[][] {
  const size = grid.length;
  const next = grid.map((r) => r.map((c) => ({ ...c })));
  const candidates: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      candidates.push([r, c]);
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (let i = 0; i < Math.min(minesCount, candidates.length); i++) {
    const [r, c] = candidates[i];
    next[r][c].isMine = true;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (next[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && next[nr][nc].isMine) {
            count++;
          }
        }
      }
      next[r][c].adjacent = count;
    }
  }

  return next;
}

export const MinesweeperPuzzle: React.FC<PuzzleComponentProps> = ({
  stats,
  onSolved,
  muted,
}) => {
  const [preset, setPreset] = useState<Preset>('9x9');
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(9));
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [status, setStatus] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [seconds, setSeconds] = useState(0);

  const config = PRESETS[preset];

  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.min(999, s + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const resetBoard = useCallback(
    (nextPreset: Preset = preset) => {
      const nextCfg = PRESETS[nextPreset];
      setGrid(createEmptyGrid(nextCfg.size));
      setMinesPlaced(false);
      setStatus('ready');
      setSeconds(0);
      arcadeSound.click(muted);
    },
    [muted, preset]
  );

  const checkWin = (board: Cell[][], totalMines: number): boolean => {
    let unrevealedSafe = 0;
    for (const row of board) {
      for (const cell of row) {
        if (!cell.isMine && !cell.isRevealed) unrevealedSafe++;
      }
    }
    return unrevealedSafe === 0 && totalMines > 0;
  };

  const revealFlood = (board: Cell[][], startR: number, startC: number): Cell[][] => {
    const size = board.length;
    const next = board.map((r) => r.map((c) => ({ ...c })));
    const stack: [number, number][] = [[startR, startC]];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const cell = next[r][c];
      if (cell.isRevealed || cell.isFlagged) continue;
      cell.isRevealed = true;
      if (cell.adjacent === 0 && !cell.isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !next[nr][nc].isRevealed) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
    return next;
  };

  const toggleFlag = (r: number, c: number) => {
    if (status === 'won' || status === 'lost') return;
    if (grid[r][c].isRevealed) return;
    setGrid((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) =>
          ri === r && ci === c ? { ...cell, isFlagged: !cell.isFlagged } : cell
        )
      )
    );
    arcadeSound.flag(muted);
  };

  const handleCellClick = (r: number, c: number) => {
    if (status === 'won' || status === 'lost') return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    let currentBoard = grid;
    if (!minesPlaced) {
      currentBoard = plantMines(grid, config.mines, r, c);
      setMinesPlaced(true);
      setStatus('playing');
    }

    const target = currentBoard[r][c];
    if (target.isFlagged) return;

    if (target.isRevealed && target.adjacent > 0) {
      const size = currentBoard.length;
      let flagsAround = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && currentBoard[nr][nc].isFlagged) {
            flagsAround++;
          }
        }
      }
      if (flagsAround === target.adjacent) {
        let updated = currentBoard.map((row) => row.map((cell) => ({ ...cell })));
        let hitMine = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              !updated[nr][nc].isFlagged &&
              !updated[nr][nc].isRevealed
            ) {
              if (updated[nr][nc].isMine) hitMine = true;
              else updated = revealFlood(updated, nr, nc);
            }
          }
        }
        if (hitMine) {
          updated.forEach((row) =>
            row.forEach((cell) => {
              if (cell.isMine) cell.isRevealed = true;
            })
          );
          setGrid(updated);
          setStatus('lost');
          arcadeSound.explosion(muted);
          return;
        }
        setGrid(updated);
        if (checkWin(updated, config.mines)) {
          const finalScore = (preset === '12x12' ? 1400 : 900) - Math.min(600, seconds * 4);
          onSolved(finalScore);
          setStatus('won');
          arcadeSound.victory(muted);
        } else {
          arcadeSound.click(muted);
        }
      }
      return;
    }

    if (target.isRevealed) return;

    if (target.isMine) {
      const revealedAll = currentBoard.map((row) =>
        row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
      );
      setGrid(revealedAll);
      setStatus('lost');
      arcadeSound.explosion(muted);
      return;
    }

    const updated = revealFlood(currentBoard, r, c);
    setGrid(updated);

    if (checkWin(updated, config.mines)) {
      const finalScore = (preset === '12x12' ? 1400 : 900) - Math.min(600, seconds * 4);
      onSolved(finalScore);
      setStatus('won');
      arcadeSound.victory(muted);
    } else {
      arcadeSound.click(muted);
    }
  };

  const flaggedCount = grid.flat().filter((c) => c.isFlagged).length;
  const minesRemaining = config.mines - flaggedCount;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-[480px] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono tabular-nums text-rose-400">Mines: {minesRemaining}</span>
          <span className="font-mono tabular-nums text-slate-300">{seconds}s</span>
          <span className="font-mono tabular-nums text-emerald-400">
            Solved: {stats.solvedCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next: Preset = preset === '9x9' ? '12x12' : '9x9';
              setPreset(next);
              resetBoard(next);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            {config.label}
          </button>
          <button
            type="button"
            onClick={() => setFlagMode((f) => !f)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              flagMode
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            {flagMode ? 'Flagging' : 'Probing'}
          </button>
          <button
            type="button"
            onClick={() => resetBoard(preset)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
            aria-label="New field"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const sizeClass =
                preset === '9x9'
                  ? 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base'
                  : 'w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm';

              if (!cell.isRevealed) {
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleFlag(r, c);
                    }}
                    className={`${sizeClass} rounded-md bg-slate-700/80 hover:bg-slate-600 border border-slate-600 flex items-center justify-center transition-colors`}
                  >
                    {cell.isFlagged ? (
                      <Flag className="w-4 h-4 text-rose-400 fill-rose-400" />
                    ) : null}
                  </button>
                );
              }

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={`${sizeClass} rounded-md border flex items-center justify-center font-mono tabular-nums font-bold ${
                    cell.isMine
                      ? 'bg-rose-500/30 border-rose-400'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  {cell.isMine ? (
                    <Bomb className="w-4 h-4 text-rose-300" />
                  ) : cell.adjacent > 0 ? (
                    <span className={NUM_COLORS[cell.adjacent]}>{cell.adjacent}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {(status === 'won' || status === 'lost') && (
        <div
          className={`w-full max-w-[440px] p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            status === 'won'
              ? 'bg-emerald-500/15 border-emerald-500/40'
              : 'bg-rose-500/15 border-rose-500/40'
          }`}
        >
          <span className={`text-sm font-medium ${status === 'won' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {status === 'won' ? `Field deduced in ${seconds}s!` : 'Mine triggered.'}
          </span>
          <button
            type="button"
            onClick={() => resetBoard(preset)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold"
          >
            New Field
          </button>
        </div>
      )}
    </div>
  );
};
