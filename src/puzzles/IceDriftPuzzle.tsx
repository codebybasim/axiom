import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface IceLevel {
  name: string;
  par: number;
  start: [number, number];
  goal: [number, number];
  grid: number[][]; // 0 = ice, 1 = rock wall
}

// All 5 levels BFS-verified solvable
const LEVELS: IceLevel[] = [
  {
    name: 'Frozen Crossing',
    par: 6,
    start: [2, 4],
    goal: [3, 2],
    grid: [
      [0, 1, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 0],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1],
    ],
  },
  {
    name: 'Glacier Basin',
    par: 7,
    start: [3, 0],
    goal: [1, 0],
    grid: [
      [0, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 0, 1, 1],
      [0, 0, 0, 0, 1, 0, 0],
    ],
  },
  {
    name: 'Frost Ridge',
    par: 9,
    start: [6, 7],
    goal: [0, 2],
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0],
      [1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 1],
    ],
  },
  {
    name: 'Subzero Vault',
    par: 12,
    start: [7, 3],
    goal: [2, 5],
    grid: [
      [0, 0, 0, 0, 0, 1, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 1, 0],
    ],
  },
  {
    name: 'Polar Core',
    par: 13,
    start: [4, 2],
    goal: [3, 5],
    grid: [
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 1],
      [0, 0, 0, 1, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1],
    ],
  },
];

export const IceDriftPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [pos, setPos] = useState<[number, number]>(level.start);
  const [trail, setTrail] = useState<string[]>([]);
  const [history, setHistory] = useState<[number, number][]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      const lv = LEVELS[idx];
      setLevelIdx(idx);
      setPos(lv.start);
      setTrail([]);
      setHistory([]);
      setMoves(0);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const undo = useCallback(() => {
    if (history.length === 0 || won) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPos(prev);
    setTrail([]);
    setMoves((m) => Math.max(0, m - 1));
    arcadeSound.click(muted);
  }, [history, won, muted]);

  const slide = useCallback(
    (dr: number, dc: number) => {
      if (won) return;
      const R = level.grid.length;
      const C = level.grid[0].length;
      let nr = pos[0];
      let nc = pos[1];
      const visitedCells: string[] = [`${nr},${nc}`];

      while (
        nr + dr >= 0 &&
        nr + dr < R &&
        nc + dc >= 0 &&
        nc + dc < C &&
        level.grid[nr + dr][nc + dc] !== 1
      ) {
        nr += dr;
        nc += dc;
        visitedCells.push(`${nr},${nc}`);
      }

      if (nr === pos[0] && nc === pos[1]) {
        arcadeSound.chomp(muted);
        return;
      }

      const nextMoves = moves + 1;
      setHistory((h) => [...h, pos]);
      setPos([nr, nc]);
      setTrail(visitedCells);
      setMoves(nextMoves);

      if (nr === level.goal[0] && nc === level.goal[1]) {
        setWon(true);
        const bonus = Math.max(0, level.par * 15 - (nextMoves - level.par) * 12);
        onSolved(Math.max(150, 200 + levelIdx * 75 + bonus));
        arcadeSound.victory(muted);
      } else {
        arcadeSound.flap(muted);
      }
    },
    [won, level, pos, moves, levelIdx, onSolved, muted]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        undo();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        slide(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        slide(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        slide(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        slide(0, 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slide, undo]);

  const size = level.grid.length;

  return (
    <div className="w-full max-w-[540px] mx-auto flex flex-col items-center gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {LEVELS.map((lv, idx) => (
            <button
              key={lv.name}
              type="button"
              onClick={() => loadLevel(idx)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-blue-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Slides: <strong className="text-white">{moves}</strong>
          </span>
          <span>
            Par: <strong className="text-emerald-400">{level.par}</strong>
          </span>
        </div>
      </div>

      <div
        className="w-full max-w-[400px] aspect-square rounded-2xl bg-[#0B1220] border border-slate-800 p-2.5 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {level.grid.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = pos[0] === r && pos[1] === c;
            const isGoal = level.goal[0] === r && level.goal[1] === c;
            const onTrail = trail.includes(`${r},${c}`);

            if (cell === 1) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="rounded-lg bg-slate-700/90 border border-slate-600/80 shadow-inner"
                />
              );
            }

            return (
              <div
                key={`${r}-${c}`}
                className={`rounded-lg border flex items-center justify-center transition-colors ${
                  isGoal
                    ? 'bg-emerald-500/20 border-emerald-400/70'
                    : onTrail
                    ? 'bg-sky-400/15 border-sky-400/30'
                    : 'bg-[#121D32] border-sky-900/40'
                }`}
              >
                {isPlayer ? (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_16px_rgba(56,189,248,0.8)]" />
                ) : isGoal ? (
                  <div className="w-5 h-5 rounded-md border-2 border-emerald-400 bg-emerald-400/30 rotate-45" />
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Touch D-pad */}
      <div className="grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button
          type="button"
          onClick={() => slide(-1, 0)}
          disabled={won}
          aria-label="Slide Up"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button
          type="button"
          onClick={() => slide(0, -1)}
          disabled={won}
          aria-label="Slide Left"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => slide(1, 0)}
          disabled={won}
          aria-label="Slide Down"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => slide(0, 1)}
          disabled={won}
          aria-label="Slide Right"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            {level.name} solved in <span className="font-mono font-bold">{moves}</span> slides.
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Ice Maze
          </button>
        </div>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0 || won}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo (Z)
        </button>
        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>
    </div>
  );
};
