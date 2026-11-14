import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Lightbulb, RotateCcw, Shuffle } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface Point {
  x: number;
  y: number;
}

interface UntangleLevel {
  name: string;
  solvedPos: Point[];
  edges: [number, number][];
}

// Hand-verified 100% planar layouts (zero crossings at solvedPos)
const LEVELS: UntangleLevel[] = [
  {
    name: '6-Node Prism',
    solvedPos: [
      { x: 250, y: 55 },
      { x: 430, y: 175 },
      { x: 360, y: 385 },
      { x: 140, y: 385 },
      { x: 70, y: 175 },
      { x: 250, y: 225 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
      [5, 0], [5, 1], [5, 2], [5, 3], [5, 4],
    ],
  },
  {
    name: '8-Node Octa-Mesh',
    solvedPos: [
      { x: 250, y: 45 },
      { x: 425, y: 135 },
      { x: 425, y: 315 },
      { x: 250, y: 405 },
      { x: 75, y: 315 },
      { x: 75, y: 135 },
      { x: 195, y: 225 },
      { x: 305, y: 225 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [6, 0], [6, 5], [6, 4], [6, 3],
      [7, 0], [7, 1], [7, 2], [7, 3],
      [6, 7],
    ],
  },
  {
    name: '10-Node Diamond Ring',
    solvedPos: [
      { x: 250, y: 40 },
      { x: 435, y: 150 },
      { x: 435, y: 300 },
      { x: 250, y: 410 },
      { x: 65, y: 300 },
      { x: 65, y: 150 },
      { x: 250, y: 135 },
      { x: 335, y: 225 },
      { x: 250, y: 315 },
      { x: 165, y: 225 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [6, 7], [7, 8], [8, 9], [9, 6],
      [0, 6], [1, 6], [1, 7], [2, 7], [2, 8], [3, 8], [4, 9], [5, 9], [5, 6],
    ],
  },
  {
    name: '12-Node Fortress',
    solvedPos: [
      { x: 140, y: 50 },
      { x: 360, y: 50 },
      { x: 445, y: 225 },
      { x: 360, y: 400 },
      { x: 140, y: 400 },
      { x: 55, y: 225 },
      { x: 185, y: 140 },
      { x: 315, y: 140 },
      { x: 350, y: 225 },
      { x: 315, y: 310 },
      { x: 185, y: 310 },
      { x: 150, y: 225 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6],
      [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
      [6, 10], [7, 9], [0, 11], [1, 8],
    ],
  },
];

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const ccw = (p1: Point, p2: Point, p3: Point) =>
    (p3.y - p1.y) * (p2.x - p1.x) - (p2.y - p1.y) * (p3.x - p1.x);
  const d1 = ccw(a, b, c);
  const d2 = ccw(a, b, d);
  const d3 = ccw(c, d, a);
  const d4 = ccw(c, d, b);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function countCrossings(nodes: Point[], edges: [number, number][]) {
  const edgeCrossed = new Array(edges.length).fill(false);
  let total = 0;
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsCross(nodes[a], nodes[b], nodes[c], nodes[d])) {
        edgeCrossed[i] = true;
        edgeCrossed[j] = true;
        total++;
      }
    }
  }
  return { total, edgeCrossed };
}

function scrambleOnCircle(level: UntangleLevel): Point[] {
  const n = level.solvedPos.length;
  for (let tries = 0; tries < 20; tries++) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const pts: Point[] = new Array(n);
    for (let k = 0; k < n; k++) {
      const angle = (k / n) * Math.PI * 2 - Math.PI / 2;
      pts[order[k]] = {
        x: Math.round(250 + Math.cos(angle) * 165),
        y: Math.round(225 + Math.sin(angle) * 165),
      };
    }
    if (countCrossings(pts, level.edges).total >= 3) return pts;
  }
  return level.solvedPos.map((_, k) => {
    const angle = (k / n) * Math.PI * 2;
    return { x: 250 + Math.cos(angle) * 165, y: 225 + Math.sin(angle) * 165 };
  });
}

export const UntanglePuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const [initialNodes, setInitialNodes] = useState<Point[]>(() => scrambleOnCircle(LEVELS[0]));
  const [nodes, setNodes] = useState<Point[]>(() => initialNodes.map((p) => ({ ...p })));
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const loadLevel = useCallback(
    (idx: number) => {
      const nextLv = LEVELS[idx];
      const scrambled = scrambleOnCircle(nextLv);
      setLevelIdx(idx);
      setInitialNodes(scrambled);
      setNodes(scrambled.map((p) => ({ ...p })));
      setDraggingIdx(null);
      setMoves(0);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const resetCurrent = () => {
    setNodes(initialNodes.map((p) => ({ ...p })));
    setDraggingIdx(null);
    setMoves(0);
    setWon(false);
    arcadeSound.click(muted);
  };

  const { total: crossings, edgeCrossed } = useMemo(
    () => countCrossings(nodes, level.edges),
    [nodes, level.edges]
  );

  const toSvgCoords = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(26, Math.min(474, ((clientX - rect.left) / rect.width) * 500));
    const y = Math.max(26, Math.min(424, ((clientY - rect.top) / rect.height) * 450));
    return { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingIdx === null || won) return;
    const pt = toSvgCoords(e.clientX, e.clientY);
    if (!pt) return;
    setNodes((prev) => prev.map((p, idx) => (idx === draggingIdx ? pt : p)));
  };

  const handlePointerUp = () => {
    if (draggingIdx === null) return;
    setDraggingIdx(null);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    const { total } = countCrossings(nodes, level.edges);
    if (total === 0 && !won) {
      setWon(true);
      onSolved(Math.max(180, (levelIdx + 1) * 150 - nextMoves * 4));
      arcadeSound.victory(muted);
    } else {
      arcadeSound.click(muted);
    }
  };

  const handleHint = () => {
    if (won) return;
    // Place one node furthest from its planar target directly onto its solved position
    let bestIdx = 0;
    let maxDist = -1;
    nodes.forEach((p, idx) => {
      const t = level.solvedPos[idx];
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d > maxDist) {
        maxDist = d;
        bestIdx = idx;
      }
    });
    const next = nodes.map((p, idx) =>
      idx === bestIdx ? { ...level.solvedPos[idx] } : p
    );
    setNodes(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    if (countCrossings(next, level.edges).total === 0) {
      setWon(true);
      onSolved(Math.max(150, (levelIdx + 1) * 130 - nextMoves * 4));
      arcadeSound.victory(muted);
    } else {
      arcadeSound.bonus(muted);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto flex flex-col items-center gap-5">
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
              L{idx + 1} · {lv.solvedPos.length} Nodes
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums">
          <span className={crossings === 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Crossings: <strong>{crossings}</strong>
          </span>
          <span className="text-slate-300">
            Drags: <strong className="text-white">{moves}</strong>
          </span>
        </div>
      </div>

      <div className="w-full rounded-2xl bg-[#0C101A] border border-slate-800 overflow-hidden touch-none">
        <svg
          ref={svgRef}
          viewBox="0 0 500 450"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-auto block select-none"
        >
          {/* Subtle coordinate grid */}
          <defs>
            <pattern id="untangleGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1E293B" strokeWidth="0.7" opacity="0.45" />
            </pattern>
          </defs>
          <rect width="500" height="450" fill="url(#untangleGrid)" />

          {/* Edges */}
          {level.edges.map(([a, b], i) => {
            const p1 = nodes[a];
            const p2 = nodes[b];
            const crossed = edgeCrossed[i];
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={crossed ? '#FB7185' : '#34D399'}
                strokeWidth={crossed ? 2.5 : 3}
                strokeOpacity={crossed ? 0.85 : 0.9}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((pt, idx) => {
            const isDragging = draggingIdx === idx;
            return (
              <g
                key={idx}
                onPointerDown={(e) => {
                  if (won) return;
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  setDraggingIdx(idx);
                }}
                style={{ cursor: won ? 'default' : isDragging ? 'grabbing' : 'grab' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isDragging ? 19 : 16}
                  fill={crossings === 0 ? '#10B981' : isDragging ? '#38BDF8' : '#1E293B'}
                  stroke={crossings === 0 ? '#A7F3D0' : isDragging ? '#E0F2FE' : '#94A3B8'}
                  strokeWidth="2.5"
                />
                <text
                  x={pt.x}
                  y={pt.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                  fill={crossings === 0 || isDragging ? '#090D16' : '#E2E8F0'}
                  pointerEvents="none"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            {level.name} untangled cleanly with zero crossing lines.
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Web
          </button>
        </div>
      )}

      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHint}
            disabled={won}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-40 text-xs font-medium text-amber-300 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Snap 1 Node
          </button>
          <button
            type="button"
            onClick={resetCurrent}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Re-Tangle
        </button>
      </div>
    </div>
  );
};
