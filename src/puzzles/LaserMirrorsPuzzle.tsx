import React, { useCallback, useMemo, useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

type MirrorType = '/' | '\\';

interface LaserLevel {
  name: string;
  size: number;
  budget: number;
  emitter: { r: number; c: number; dr: number; dc: number };
  walls: string[];
  targets: string[];
  solution: Record<string, MirrorType>;
}

// All 4 optical paths raytrace-verified
const LEVELS: LaserLevel[] = [
  {
    name: 'Prism Bounce',
    size: 6,
    budget: 3,
    emitter: { r: 0, c: 0, dr: 0, dc: 1 },
    walls: ['0,5', '2,3', '3,2', '5,4'],
    targets: ['4,2', '1,1'],
    solution: { '0,4': '\\', '4,4': '/', '4,1': '\\' },
  },
  {
    name: 'Vault Deflection',
    size: 6,
    budget: 3,
    emitter: { r: 5, c: 0, dr: -1, dc: 0 },
    walls: ['0,0', '2,3', '3,4', '4,1', '2,2'],
    targets: ['1,2', '3,5', '5,2'],
    solution: { '1,0': '/', '1,5': '\\', '5,5': '/' },
  },
  {
    name: 'Perimeter Loop',
    size: 7,
    budget: 5,
    emitter: { r: 3, c: 0, dr: 0, dc: 1 },
    walls: ['3,3', '1,4', '4,3', '5,5', '2,5', '4,2'],
    targets: ['0,4', '3,6', '6,3', '2,1'],
    solution: { '3,2': '/', '0,2': '\\', '0,6': '\\', '6,6': '/', '6,1': '\\' },
  },
  {
    name: 'Crystal Chamber',
    size: 7,
    budget: 4,
    emitter: { r: 0, c: 3, dr: 1, dc: 0 },
    walls: ['3,3', '1,1', '4,2', '3,4', '6,3', '0,5'],
    targets: ['2,1', '5,3', '2,5'],
    solution: { '2,3': '/', '2,0': '/', '5,0': '\\', '5,5': '/' },
  },
];

export const LaserMirrorsPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [mirrors, setMirrors] = useState<Record<string, MirrorType>>({});
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      setLevelIdx(idx);
      setMirrors({});
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const ray = useMemo(() => {
    const wallSet = new Set(level.walls);
    const targetSet = new Set(level.targets);
    const hitTargets = new Set<string>();
    const seen = new Set<string>();

    // Points in 0..size coordinate space (cell centers at c+0.5, r+0.5)
    let { r, c, dr, dc } = level.emitter;
    const points: [number, number][] = [[c + 0.5, r + 0.5]];

    for (let step = 0; step < 80; step++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= level.size || nc < 0 || nc >= level.size) {
        points.push([c + 0.5 + dc * 0.5, r + 0.5 + dr * 0.5]);
        break;
      }
      r = nr;
      c = nc;
      const key = `${r},${c}`;
      if (wallSet.has(key)) {
        points.push([c + 0.5 - dc * 0.45, r + 0.5 - dr * 0.45]);
        break;
      }
      points.push([c + 0.5, r + 0.5]);
      const stateKey = `${key},${dr},${dc}`;
      if (seen.has(stateKey)) break;
      seen.add(stateKey);

      if (targetSet.has(key)) hitTargets.add(key);

      const m = mirrors[key];
      if (m === '/') {
        [dr, dc] = [-dc, -dr];
      } else if (m === '\\') {
        [dr, dc] = [dc, dr];
      }
    }

    return {
      points,
      hitTargets,
      allLit: hitTargets.size === level.targets.length,
    };
  }, [level, mirrors]);

  const placedCount = Object.keys(mirrors).length;

  const cycleCell = (r: number, c: number) => {
    if (won) return;
    const key = `${r},${c}`;
    if (
      (r === level.emitter.r && c === level.emitter.c) ||
      level.walls.includes(key) ||
      level.targets.includes(key)
    ) {
      return;
    }

    const cur = mirrors[key];
    const nextMirrors = { ...mirrors };
    if (!cur) {
      if (placedCount >= level.budget) {
        arcadeSound.chomp(muted);
        return;
      }
      nextMirrors[key] = '/';
    } else if (cur === '/') {
      nextMirrors[key] = '\\';
    } else {
      delete nextMirrors[key];
    }

    setMirrors(nextMirrors);

    // Check win synchronously on nextMirrors
    const wallSet = new Set(level.walls);
    const targetSet = new Set(level.targets);
    const hit = new Set<string>();
    const seen = new Set<string>();
    let { r: cr, c: cc, dr, dc } = level.emitter;
    for (let s = 0; s < 80; s++) {
      cr += dr;
      cc += dc;
      if (cr < 0 || cr >= level.size || cc < 0 || cc >= level.size) break;
      const k = `${cr},${cc}`;
      if (wallSet.has(k)) break;
      const sk = `${k},${dr},${dc}`;
      if (seen.has(sk)) break;
      seen.add(sk);
      if (targetSet.has(k)) hit.add(k);
      const m = nextMirrors[k];
      if (m === '/') [dr, dc] = [-dc, -dr];
      else if (m === '\\') [dr, dc] = [dc, dr];
    }

    if (hit.size === level.targets.length) {
      setWon(true);
      onSolved(240 + levelIdx * 85);
      arcadeSound.victory(muted);
    } else {
      arcadeSound.laser(muted);
    }
  };

  const handleHint = () => {
    if (won) return;
    const missing = Object.entries(level.solution).find(([k, val]) => mirrors[k] !== val);
    if (!missing) return;
    const [k, val] = missing;
    const next = { ...mirrors, [k]: val };
    // Trim excess if over budget
    if (Object.keys(next).length > level.budget) {
      const extraKey = Object.keys(next).find((ek) => !(ek in level.solution));
      if (extraKey) delete next[extraKey];
    }
    setMirrors(next);
    arcadeSound.bonus(muted);
    const allSolved = Object.entries(level.solution).every(([sk, sv]) => next[sk] === sv);
    if (allSolved) {
      setWon(true);
      onSolved(200 + levelIdx * 65);
      arcadeSound.victory(muted);
    }
  };

  const polylineStr = ray.points.map(([x, y]) => `${x * 100},${y * 100}`).join(' ');

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
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Crystals:{' '}
            <strong className="text-emerald-400">
              {ray.hitTargets.size}/{level.targets.length}
            </strong>
          </span>
          <span>
            Mirrors:{' '}
            <strong className={placedCount >= level.budget ? 'text-amber-400' : 'text-white'}>
              {placedCount}/{level.budget}
            </strong>
          </span>
        </div>
      </div>

      {/* Board with live SVG Laser Overlay */}
      <div className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-[#0B0F19] border border-slate-800 p-2.5">
        <div
          className="w-full h-full grid gap-1"
          style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: level.size * level.size }).map((_, idx) => {
            const r = Math.floor(idx / level.size);
            const c = idx % level.size;
            const key = `${r},${c}`;
            const isEmitter = r === level.emitter.r && c === level.emitter.c;
            const isWall = level.walls.includes(key);
            const isTarget = level.targets.includes(key);
            const isLit = ray.hitTargets.has(key);
            const mirror = mirrors[key];

            return (
              <button
                key={key}
                type="button"
                onClick={() => cycleCell(r, c)}
                disabled={isEmitter || isWall || isTarget}
                aria-label={`Optics cell ${r + 1},${c + 1}`}
                className={`relative rounded-lg border flex items-center justify-center transition-colors ${
                  isWall
                    ? 'bg-slate-700/90 border-slate-600 cursor-not-allowed'
                    : isEmitter
                    ? 'bg-sky-500/20 border-sky-400 cursor-default'
                    : isTarget
                    ? isLit
                      ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                      : 'bg-amber-500/10 border-amber-400/50'
                    : mirror
                    ? 'bg-slate-800/90 border-sky-400/60 hover:border-sky-300'
                    : 'bg-[#121826] border-slate-800/80 hover:border-slate-600'
                }`}
              >
                {isEmitter && (
                  <div className="w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                )}
                {isTarget && (
                  <div
                    className={`w-4 h-4 rotate-45 border-2 transition-colors ${
                      isLit
                        ? 'bg-emerald-400 border-white'
                        : 'bg-transparent border-amber-400'
                    }`}
                  />
                )}
                {mirror && (
                  <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    {mirror === '/' ? (
                      <line
                        x1="20"
                        y1="80"
                        x2="80"
                        y2="20"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    ) : (
                      <line
                        x1="20"
                        y1="20"
                        x2="80"
                        y2="80"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Laser Beam SVG */}
        <svg
          viewBox={`0 0 ${level.size * 100} ${level.size * 100}`}
          className="absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)] pointer-events-none"
        >
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="14"
            strokeOpacity="0.22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            All {level.targets.length} crystals energized in {level.name}.
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Optics Room
          </button>
        </div>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleHint}
          disabled={won}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-40 text-xs font-medium text-amber-300 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Place 1 Mirror
        </button>
        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Mirrors
        </button>
      </div>
    </div>
  );
};
