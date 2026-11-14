import React, { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface FlowPair {
  id: number;
  label: string;
  color: string;
  a: [number, number];
  b: [number, number];
}

interface FlowLevel {
  name: string;
  size: number;
  pairs: FlowPair[];
}

const FLOW_PALETTE = [
  { label: '1', color: '#F43F5E' },
  { label: '2', color: '#38BDF8' },
  { label: '3', color: '#10B981' },
  { label: '4', color: '#F59E0B' },
  { label: '5', color: '#A78BFA' },
  { label: '6', color: '#2DD4BF' },
];

// All 4 levels verified 100% full-grid coverable with zero crossings
const LEVELS: FlowLevel[] = [
  {
    name: '5×5 Quad Circuit',
    size: 5,
    pairs: [
      { id: 0, ...FLOW_PALETTE[0], a: [0, 0], b: [1, 4] },
      { id: 1, ...FLOW_PALETTE[1], a: [1, 0], b: [4, 2] },
      { id: 2, ...FLOW_PALETTE[2], a: [1, 1], b: [2, 2] },
      { id: 3, ...FLOW_PALETTE[3], a: [2, 1], b: [2, 4] },
    ],
  },
  {
    name: '5×5 Five-Way Bus',
    size: 5,
    pairs: [
      { id: 0, ...FLOW_PALETTE[0], a: [0, 0], b: [1, 2] },
      { id: 1, ...FLOW_PALETTE[1], a: [0, 3], b: [3, 4] },
      { id: 2, ...FLOW_PALETTE[2], a: [1, 0], b: [1, 3] },
      { id: 3, ...FLOW_PALETTE[3], a: [2, 0], b: [3, 1] },
      { id: 4, ...FLOW_PALETTE[4], a: [4, 2], b: [4, 4] },
    ],
  },
  {
    name: '6×6 Crosslink',
    size: 6,
    pairs: [
      { id: 0, ...FLOW_PALETTE[0], a: [0, 0], b: [2, 3] },
      { id: 1, ...FLOW_PALETTE[1], a: [0, 4], b: [5, 5] },
      { id: 2, ...FLOW_PALETTE[2], a: [1, 0], b: [1, 4] },
      { id: 3, ...FLOW_PALETTE[3], a: [2, 0], b: [4, 1] },
      { id: 4, ...FLOW_PALETTE[4], a: [4, 2], b: [4, 3] },
    ],
  },
  {
    name: '6×6 Six-Node Matrix',
    size: 6,
    pairs: [
      { id: 0, ...FLOW_PALETTE[0], a: [0, 0], b: [2, 1] },
      { id: 1, ...FLOW_PALETTE[1], a: [0, 1], b: [1, 1] },
      { id: 2, ...FLOW_PALETTE[2], a: [0, 4], b: [1, 4] },
      { id: 3, ...FLOW_PALETTE[3], a: [2, 2], b: [4, 1] },
      { id: 4, ...FLOW_PALETTE[4], a: [4, 0], b: [4, 3] },
      { id: 5, ...FLOW_PALETTE[5], a: [3, 4], b: [4, 4] },
    ],
  },
];

type PathsMap = Record<number, [number, number][]>;

function sameCell(a: [number, number], b: [number, number]) {
  return a[0] === b[0] && a[1] === b[1];
}

export const FlowConnectPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [paths, setPaths] = useState<PathsMap>({});
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      setLevelIdx(idx);
      setPaths({});
      setActiveColor(null);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const getEndpointColor = (r: number, c: number): FlowPair | undefined =>
    level.pairs.find((p) => (p.a[0] === r && p.a[1] === c) || (p.b[0] === r && p.b[1] === c));

  const isPairConnected = (pair: FlowPair, map: PathsMap): boolean => {
    const pts = map[pair.id];
    if (!pts || pts.length < 2) return false;
    const first = pts[0];
    const last = pts[pts.length - 1];
    return (
      (sameCell(first, pair.a) && sameCell(last, pair.b)) ||
      (sameCell(first, pair.b) && sameCell(last, pair.a))
    );
  };

  const checkSolved = (map: PathsMap): boolean => {
    if (!level.pairs.every((p) => isPairConnected(p, map))) return false;
    const covered = new Set<string>();
    Object.values(map).forEach((pts) => pts.forEach(([r, c]) => covered.add(`${r},${c}`)));
    return covered.size === level.size * level.size;
  };

  const handleCellDown = (r: number, c: number) => {
    if (won) return;
    const ep = getEndpointColor(r, c);
    if (ep) {
      setActiveColor(ep.id);
      setPaths((prev) => ({ ...prev, [ep.id]: [[r, c]] }));
      arcadeSound.click(muted);
      return;
    }

    // Resume drawing from an existing path tip or truncate mid-path
    for (const pair of level.pairs) {
      const pts = paths[pair.id];
      if (!pts) continue;
      const idx = pts.findIndex(([pr, pc]) => pr === r && pc === c);
      if (idx !== -1) {
        setActiveColor(pair.id);
        setPaths((prev) => ({ ...prev, [pair.id]: pts.slice(0, idx + 1) }));
        arcadeSound.click(muted);
        return;
      }
    }
  };

  const handleCellEnter = (r: number, c: number) => {
    if (won || activeColor === null) return;
    const curPath = paths[activeColor];
    if (!curPath || curPath.length === 0) return;

    const pair = level.pairs.find((p) => p.id === activeColor)!;
    const last = curPath[curPath.length - 1];
    if (Math.abs(last[0] - r) + Math.abs(last[1] - c) !== 1) return;

    // If backtracking onto previous cell of same path
    if (curPath.length >= 2 && sameCell(curPath[curPath.length - 2], [r, c])) {
      setPaths((prev) => ({ ...prev, [activeColor]: curPath.slice(0, -1) }));
      return;
    }

    // Cannot enter another color's endpoint
    const ep = getEndpointColor(r, c);
    if (ep && ep.id !== activeColor) return;

    // Cannot cross self
    if (curPath.some(([pr, pc]) => pr === r && pc === c)) return;

    // If already finished at both endpoints, stop extending beyond second endpoint
    if (isPairConnected(pair, paths)) return;

    // Trim any other color path that occupied this cell (standard Flow behavior)
    const nextPaths: PathsMap = {};
    for (const [kStr, pts] of Object.entries(paths)) {
      const k = Number(kStr);
      if (k === activeColor) continue;
      const hitIdx = pts.findIndex(([pr, pc]) => pr === r && pc === c);
      if (hitIdx !== -1) {
        nextPaths[k] = pts.slice(0, hitIdx);
      } else {
        nextPaths[k] = pts;
      }
    }

    const updatedCur = [...curPath, [r, c] as [number, number]];
    nextPaths[activeColor] = updatedCur;
    setPaths(nextPaths);

    if (isPairConnected(pair, nextPaths)) {
      arcadeSound.bonus(muted);
      setActiveColor(null);
      if (checkSolved(nextPaths)) {
        setWon(true);
        onSolved(200 + levelIdx * 80);
        arcadeSound.victory(muted);
      }
    } else {
      arcadeSound.click(muted);
    }
  };

  // Compute coverage stats
  const coveredSet = new Set<string>();
  Object.values(paths).forEach((pts) => pts.forEach(([r, c]) => coveredSet.add(`${r},${c}`)));
  const connectedCount = level.pairs.filter((p) => isPairConnected(p, paths)).length;
  const coveragePct = Math.round((coveredSet.size / (level.size * level.size)) * 100);

  return (
    <div
      className="w-full max-w-[540px] mx-auto flex flex-col items-center gap-5"
      onPointerUp={() => setActiveColor(null)}
      onPointerLeave={() => setActiveColor(null)}
    >
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {LEVELS.map((lv, idx) => (
            <button
              key={lv.name}
              type="button"
              onClick={() => loadLevel(idx)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Pairs:{' '}
            <strong className="text-emerald-400">
              {connectedCount}/{level.pairs.length}
            </strong>
          </span>
          <span>
            Board: <strong className="text-white">{coveragePct}%</strong>
          </span>
        </div>
      </div>

      {/* Grid + Continuous SVG Tubes */}
      <div className="relative w-full max-w-[400px] aspect-square rounded-2xl bg-[#0B1019] border border-slate-800 p-2.5 touch-none select-none">
        <div
          className="w-full h-full grid gap-1"
          style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: level.size * level.size }).map((_, idx) => {
            const r = Math.floor(idx / level.size);
            const c = idx % level.size;
            const ep = getEndpointColor(r, c);

            return (
              <div
                key={idx}
                onPointerDown={() => handleCellDown(r, c)}
                onPointerEnter={() => handleCellEnter(r, c)}
                className="relative rounded-lg bg-[#131926] border border-slate-800/80 flex items-center justify-center cursor-pointer"
              >
                {ep && (
                  <div
                    style={{ backgroundColor: ep.color }}
                    className="w-[62%] h-[62%] rounded-full border-2 border-white/80 flex items-center justify-center text-[11px] font-mono font-bold text-slate-950 z-10 shadow-md"
                  >
                    {ep.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <svg
          viewBox={`0 0 ${level.size * 100} ${level.size * 100}`}
          className="absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)] pointer-events-none"
        >
          {level.pairs.map((pair) => {
            const pts = paths[pair.id];
            if (!pts || pts.length < 2) return null;
            const d = pts.map(([r, c]) => `${c * 100 + 50},${r * 100 + 50}`).join(' ');
            return (
              <polyline
                key={pair.id}
                points={d}
                fill="none"
                stroke={pair.color}
                strokeWidth="30"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.85"
              />
            );
          })}
        </svg>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            {level.name} fully wired with 100% board coverage.
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Circuit
          </button>
        </div>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Connect all pairs and cover 100% of squares to complete.
        </span>
        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear All
        </button>
      </div>
    </div>
  );
};
