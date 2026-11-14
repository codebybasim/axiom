import React, { useCallback, useEffect, useState } from 'react';
import { FlipHorizontal2, RotateCcw, RotateCw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

type Coord = [number, number];

interface PieceDef {
  id: string;
  color: string;
  cells: Coord[]; // Normalized so minR=0, minC=0
}

interface ShapeLevel {
  name: string;
  R: number;
  C: number;
  blocked: string[];
  pieces: PieceDef[];
}

function normalize(coords: Coord[]): Coord[] {
  const minR = Math.min(...coords.map(([r]) => r));
  const minC = Math.min(...coords.map(([, c]) => c));
  return coords
    .map(([r, c]) => [r - minR, c - minC] as Coord)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function rotateCoords(coords: Coord[]): Coord[] {
  return normalize(coords.map(([r, c]) => [c, -r]));
}

function flipCoords(coords: Coord[]): Coord[] {
  return normalize(coords.map(([r, c]) => [r, -c]));
}

// All 4 levels partition-verified 100% solvable
const LEVELS: ShapeLevel[] = [
  {
    name: '4×4 Core Frame',
    R: 4,
    C: 4,
    blocked: [],
    pieces: [
      { id: 'A', color: '#38BDF8', cells: normalize([[0, 0], [0, 1], [1, 0], [2, 0]]) },
      { id: 'B', color: '#F59E0B', cells: normalize([[0, 0], [1, -1], [1, 0], [2, 0]]) },
      { id: 'C', color: '#10B981', cells: normalize([[0, 0], [1, 0], [2, 0], [3, 0]]) },
      { id: 'D', color: '#F43F5E', cells: normalize([[0, 1], [1, 0], [1, 1], [1, 2]]) },
    ],
  },
  {
    name: '4×5 Circuit Bay',
    R: 4,
    C: 5,
    blocked: [],
    pieces: [
      { id: 'A', color: '#38BDF8', cells: normalize([[0, 0], [0, 1], [1, 0], [2, 0]]) },
      { id: 'B', color: '#A78BFA', cells: normalize([[0, 0], [0, 1], [0, 2], [1, 1]]) },
      { id: 'C', color: '#10B981', cells: normalize([[0, 0], [0, 1], [1, 0]]) },
      { id: 'D', color: '#FB923C', cells: normalize([[0, 1], [1, 0], [1, 1], [2, 1]]) },
      { id: 'E', color: '#F43F5E', cells: normalize([[0, 2], [1, 0], [1, 1], [1, 2], [1, 3]]) },
    ],
  },
  {
    name: 'Chamfered Cross',
    R: 5,
    C: 5,
    blocked: ['0,0', '0,4', '4,0', '4,4'],
    pieces: [
      { id: 'A', color: '#38BDF8', cells: normalize([[0, 0], [0, 1], [0, 2], [1, 1]]) },
      { id: 'B', color: '#F59E0B', cells: normalize([[0, 0], [0, 1], [1, 0], [2, 0]]) },
      { id: 'C', color: '#10B981', cells: normalize([[0, 0], [0, 1], [1, 1], [2, 1]]) },
      { id: 'D', color: '#A78BFA', cells: normalize([[0, 0], [0, 1], [0, 2], [1, 2]]) },
      { id: 'E', color: '#FB923C', cells: normalize([[0, 0], [0, 1], [1, 0], [1, 1], [1, 2]]) },
    ],
  },
  {
    name: '5×5 Monolith',
    R: 5,
    C: 5,
    blocked: [],
    pieces: [
      { id: 'A', color: '#38BDF8', cells: normalize([[0, 0], [0, 1], [0, 2], [1, 0]]) },
      { id: 'B', color: '#F59E0B', cells: normalize([[0, 0], [0, 1], [1, 0], [2, 0]]) },
      { id: 'C', color: '#10B981', cells: normalize([[0, 1], [0, 2], [1, 0], [1, 1], [2, 0]]) },
      { id: 'D', color: '#A78BFA', cells: normalize([[0, 1], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1]]) },
      { id: 'E', color: '#F43F5E', cells: normalize([[0, 2], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]) },
    ],
  },
];

interface PlacedPiece {
  id: string;
  color: string;
  cells: Coord[]; // absolute board coords
}

export const BlockFitPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const [pieceShapes, setPieceShapes] = useState<Record<string, Coord[]>>(() => {
    const m: Record<string, Coord[]> = {};
    LEVELS[0].pieces.forEach((p) => {
      m[p.id] = p.cells;
    });
    return m;
  });
  const [placed, setPlaced] = useState<PlacedPiece[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(LEVELS[0].pieces[0].id);
  const [hoverCell, setHoverCell] = useState<Coord | null>(null);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      const lv = LEVELS[idx];
      const m: Record<string, Coord[]> = {};
      lv.pieces.forEach((p) => {
        m[p.id] = p.cells;
      });
      setLevelIdx(idx);
      setPieceShapes(m);
      setPlaced([]);
      setSelectedId(lv.pieces[0].id);
      setHoverCell(null);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const rotateSelected = useCallback(() => {
    if (!selectedId || won) return;
    setPieceShapes((prev) => ({
      ...prev,
      [selectedId]: rotateCoords(prev[selectedId]),
    }));
    arcadeSound.click(muted);
  }, [selectedId, won, muted]);

  const flipSelected = useCallback(() => {
    if (!selectedId || won) return;
    setPieceShapes((prev) => ({
      ...prev,
      [selectedId]: flipCoords(prev[selectedId]),
    }));
    arcadeSound.click(muted);
  }, [selectedId, won, muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') rotateSelected();
      else if (e.key === 'f' || e.key === 'F') flipSelected();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotateSelected, flipSelected]);

  const placedMap = new Map<string, PlacedPiece>();
  placed.forEach((pp) => {
    pp.cells.forEach(([r, c]) => placedMap.set(`${r},${c}`, pp));
  });

  const canPlaceAt = (shape: Coord[], r: number, c: number): Coord[] | null => {
    // Anchor at first cell of shape or top-left offset
    const anchorC = shape[0][1];
    const abs = shape.map(([sr, sc]) => [r + sr, c + sc - anchorC] as Coord);
    for (const [ar, ac] of abs) {
      if (ar < 0 || ar >= level.R || ac < 0 || ac >= level.C) return null;
      const key = `${ar},${ac}`;
      if (level.blocked.includes(key) || placedMap.has(key)) return null;
    }
    return abs;
  };

  const handleCellClick = (r: number, c: number) => {
    if (won) return;
    const key = `${r},${c}`;
    if (level.blocked.includes(key)) return;

    const existing = placedMap.get(key);
    if (existing) {
      // Remove placed piece and re-select it
      setPlaced((prev) => prev.filter((p) => p.id !== existing.id));
      setSelectedId(existing.id);
      arcadeSound.click(muted);
      return;
    }

    if (!selectedId) return;
    const shape = pieceShapes[selectedId];
    const abs = canPlaceAt(shape, r, c);
    if (!abs) {
      arcadeSound.chomp(muted);
      return;
    }

    const pieceMeta = level.pieces.find((p) => p.id === selectedId)!;
    const nextPlaced = [...placed, { id: selectedId, color: pieceMeta.color, cells: abs }];
    setPlaced(nextPlaced);

    const remaining = level.pieces.filter((p) => !nextPlaced.some((np) => np.id === p.id));
    setSelectedId(remaining[0]?.id ?? null);

    if (remaining.length === 0) {
      setWon(true);
      onSolved(210 + levelIdx * 90);
      arcadeSound.victory(muted);
    } else {
      arcadeSound.merge(muted, 2);
    }
  };

  const hoverPreview =
    !won && selectedId && hoverCell
      ? (() => {
          const shape = pieceShapes[selectedId];
          const anchorC = shape[0][1];
          const raw = shape.map(([sr, sc]) => [hoverCell[0] + sr, hoverCell[1] + sc - anchorC] as Coord);
          const valid = canPlaceAt(shape, hoverCell[0], hoverCell[1]) !== null;
          return { keys: new Set(raw.map(([ar, ac]) => `${ar},${ac}`)), valid };
        })()
      : null;

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col items-center gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {LEVELS.map((lv, idx) => (
            <button
              key={lv.name}
              type="button"
              onClick={() => loadLevel(idx)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-orange-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          Fitted:{' '}
          <strong className="text-emerald-400">
            {placed.length}/{level.pieces.length}
          </strong>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5 items-start">
        {/* Blueprint Board */}
        <div className="flex flex-col items-center">
          <div
            onMouseLeave={() => setHoverCell(null)}
            className="w-full max-w-[330px] rounded-2xl bg-[#0B1019] border border-slate-800 p-3 grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${level.C}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: level.R * level.C }).map((_, idx) => {
              const r = Math.floor(idx / level.C);
              const c = idx % level.C;
              const key = `${r},${c}`;
              const isBlocked = level.blocked.includes(key);
              const occ = placedMap.get(key);
              const isHover = hoverPreview?.keys.has(key);

              if (isBlocked) {
                return <div key={key} className="aspect-square rounded-lg bg-transparent" />;
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHoverCell([r, c])}
                  aria-label={`Blueprint cell ${r + 1},${c + 1}`}
                  style={occ ? { backgroundColor: occ.color } : undefined}
                  className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center text-xs font-mono font-bold ${
                    occ
                      ? 'border-white/40 text-slate-950 shadow-md hover:brightness-110'
                      : isHover
                      ? hoverPreview?.valid
                        ? 'bg-emerald-400/30 border-emerald-400'
                        : 'bg-rose-500/25 border-rose-400'
                      : 'bg-[#141A28] border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {occ ? occ.id : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Piece Tray */}
        <div className="rounded-2xl bg-[#111624] border border-slate-800 p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">Shape Tray</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={rotateSelected}
                disabled={!selectedId || won}
                title="Rotate 90° (R)"
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={flipSelected}
                disabled={!selectedId || won}
                title="Flip (F)"
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {level.pieces.map((p) => {
              const isPlaced = placed.some((pp) => pp.id === p.id);
              const isSel = selectedId === p.id;
              const shape = pieceShapes[p.id];
              const maxR = Math.max(...shape.map(([r]) => r)) + 1;
              const maxC = Math.max(...shape.map(([, c]) => c)) + 1;
              const cellSet = new Set(shape.map(([r, c]) => `${r},${c}`));

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isPlaced}
                  onClick={() => {
                    setSelectedId(p.id);
                    arcadeSound.click(muted);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center min-h-[72px] transition-all ${
                    isPlaced
                      ? 'opacity-30 bg-slate-900/40 border-slate-800 cursor-not-allowed'
                      : isSel
                      ? 'bg-slate-800 border-orange-400 ring-1 ring-orange-400/40'
                      : 'bg-[#0C1018] border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div
                    className="grid gap-0.5"
                    style={{ gridTemplateColumns: `repeat(${maxC}, 12px)` }}
                  >
                    {Array.from({ length: maxR * maxC }).map((_, i) => {
                      const rr = Math.floor(i / maxC);
                      const cc = i % maxC;
                      const filled = cellSet.has(`${rr},${cc}`);
                      return (
                        <div
                          key={i}
                          style={filled ? { backgroundColor: p.color } : undefined}
                          className={`w-3 h-3 rounded-[2px] ${filled ? '' : 'opacity-0'}`}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            {level.name} locked with zero gaps.
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Blueprint
          </button>
        </div>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">Click placed blocks on board to pick back up.</span>
        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Pieces
        </button>
      </div>
    </div>
  );
};
