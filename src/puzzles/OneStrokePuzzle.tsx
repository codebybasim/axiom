import React, { useCallback, useState } from 'react';
import { RotateCcw, Shuffle, Undo2 } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface OneStrokeLevel {
  R: number;
  C: number;
  start: [number, number];
  walls: [number, number][];
}

// 4 verified solvable layouts
const PRESET_LEVELS: OneStrokeLevel[] = [
  { R: 5, C: 5, start: [4, 3], walls: [[1, 3], [2, 2], [2, 3], [2, 4]] },
  { R: 5, C: 5, start: [3, 3], walls: [[0, 0], [1, 0], [1, 1], [2, 0], [2, 1]] },
  { R: 6, C: 6, start: [2, 5], walls: [[4, 2], [4, 3], [4, 4], [5, 2], [5, 3], [5, 4]] },
  { R: 6, C: 6, start: [1, 0], walls: [[2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1]] },
];

function generateRandomOneStroke(R: number, C: number, wallCount: number): OneStrokeLevel {
  for (let t = 0; t < 350; t++) {
    const targetLen = R * C - wallCount;
    const sr = Math.floor(Math.random() * R);
    const sc = Math.floor(Math.random() * C);
    const seen = new Set([`${sr},${sc}`]);
    const path: [number, number][] = [[sr, sc]];
    let r = sr;
    let c = sc;
    while (path.length < targetLen) {
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]
        .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
        .filter(([nr, nc]) => nr >= 0 && nr < R && nc >= 0 && nc < C && !seen.has(`${nr},${nc}`));
      if (!dirs.length) break;
      dirs.sort((a, b) => {
        const deg = ([x, y]: [number, number]) =>
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].filter(
            ([dx, dy]) =>
              x + dx >= 0 && x + dx < R && y + dy >= 0 && y + dy < C && !seen.has(`${x + dx},${y + dy}`)
          ).length;
        return deg(a) - deg(b) + (Math.random() - 0.5) * 0.4;
      });
      [r, c] = dirs[0];
      seen.add(`${r},${c}`);
      path.push([r, c]);
    }
    if (path.length === targetLen) {
      const walls: [number, number][] = [];
      for (let rr = 0; rr < R; rr++) {
        for (let cc = 0; cc < C; cc++) {
          if (!seen.has(`${rr},${cc}`)) walls.push([rr, cc]);
        }
      }
      return { R, C, start: [sr, sc], walls };
    }
  }
  return PRESET_LEVELS[0];
}

export const OneStrokePuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [level, setLevel] = useState<OneStrokeLevel>(PRESET_LEVELS[0]);
  const [path, setPath] = useState<[number, number][]>([PRESET_LEVELS[0].start]);
  const [dragging, setDragging] = useState(false);
  const [won, setWon] = useState(false);

  const wallSet = new Set(level.walls.map(([r, c]) => `${r},${c}`));
  const totalOpen = level.R * level.C - level.walls.length;

  const selectPreset = useCallback(
    (idx: number) => {
      const lv = PRESET_LEVELS[idx];
      setLevelIdx(idx);
      setLevel(lv);
      setPath([lv.start]);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const generateNew = () => {
    const lv = generateRandomOneStroke(level.R, level.C, level.walls.length);
    setLevel(lv);
    setPath([lv.start]);
    setWon(false);
    arcadeSound.click(muted);
  };

  const resetPath = () => {
    setPath([level.start]);
    setWon(false);
    arcadeSound.click(muted);
  };

  const stepTo = (r: number, c: number) => {
    if (won) return;
    if (wallSet.has(`${r},${c}`)) return;

    const existingIdx = path.findIndex(([pr, pc]) => pr === r && pc === c);
    // Clicking the previous step backtracks 1 cell
    if (existingIdx !== -1 && existingIdx === path.length - 2) {
      setPath((p) => p.slice(0, -1));
      arcadeSound.click(muted);
      return;
    }
    if (existingIdx !== -1) return;

    const [lr, lc] = path[path.length - 1];
    if (Math.abs(lr - r) + Math.abs(lc - c) !== 1) return;

    const next = [...path, [r, c] as [number, number]];
    setPath(next);

    if (next.length === totalOpen) {
      setWon(true);
      setDragging(false);
      onSolved(160 + totalOpen * 10);
      arcadeSound.victory(muted);
    } else {
      arcadeSound.merge(muted, Math.min(6, Math.floor(next.length / 4)));
    }
  };

  return (
    <div
      className="w-full max-w-[540px] mx-auto flex flex-col items-center gap-5"
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {PRESET_LEVELS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectPreset(idx)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-teal-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Room {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Covered:{' '}
            <strong className="text-teal-400">
              {path.length}/{totalOpen}
            </strong>
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-[400px] aspect-square rounded-2xl bg-[#0B1019] border border-slate-800 p-3 touch-none select-none">
        <div
          className="w-full h-full grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${level.C}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: level.R * level.C }).map((_, idx) => {
            const r = Math.floor(idx / level.C);
            const c = idx % level.C;
            const isWall = wallSet.has(`${r},${c}`);
            const visitOrder = path.findIndex(([pr, pc]) => pr === r && pc === c);
            const isStart = r === level.start[0] && c === level.start[1];
            const isHead = visitOrder === path.length - 1;
            const [hr, hc] = path[path.length - 1];
            const isReachable =
              !isWall && visitOrder === -1 && Math.abs(hr - r) + Math.abs(hc - c) === 1;

            if (isWall) {
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-800/80 border border-slate-700/70"
                />
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onPointerDown={() => {
                  setDragging(true);
                  stepTo(r, c);
                }}
                onPointerEnter={() => {
                  if (dragging) stepTo(r, c);
                }}
                aria-label={`Tile ${r + 1},${c + 1}`}
                className={`relative rounded-xl border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  isHead
                    ? 'bg-teal-400 border-white text-slate-950 scale-[1.03] shadow-[0_0_16px_rgba(45,212,191,0.5)]'
                    : visitOrder !== -1
                    ? 'bg-teal-500/25 border-teal-400/70 text-teal-200'
                    : isReachable
                    ? 'bg-[#162235] border-teal-500/40 text-slate-500 hover:border-teal-300'
                    : 'bg-[#121826] border-slate-800 text-slate-600'
                }`}
              >
                {isStart && visitOrder === 0 ? 'S' : visitOrder !== -1 ? visitOrder + 1 : ''}
              </button>
            );
          })}
        </div>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            All {totalOpen} tiles connected in a single continuous stroke.
          </div>
          <button
            type="button"
            onClick={() => selectPreset((levelIdx + 1) % PRESET_LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Room
          </button>
        </div>
      )}

      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => path.length > 1 && !won && setPath((p) => p.slice(0, -1))}
            disabled={path.length <= 1 || won}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Step Back
          </button>
          <button
            type="button"
            onClick={resetPath}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Trail
          </button>
        </div>

        <button
          type="button"
          onClick={generateNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-semibold transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          New Room
        </button>
      </div>
    </div>
  );
};
