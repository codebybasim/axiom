import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface Vehicle {
  id: string;
  r: number;
  c: number;
  len: 2 | 3;
  dir: 'H' | 'V';
}

interface TrafficLevel {
  name: string;
  par: number;
  cars: Vehicle[];
}

const CAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  X: { bg: '#F43F5E', border: '#FDA4AF', text: '#FFFFFF' },
  A: { bg: '#38BDF8', border: '#7DD3FC', text: '#090D16' },
  B: { bg: '#F59E0B', border: '#FCD34D', text: '#090D16' },
  C: { bg: '#10B981', border: '#6EE7B7', text: '#090D16' },
  D: { bg: '#A78BFA', border: '#C4B5FD', text: '#090D16' },
  E: { bg: '#FB923C', border: '#FDBA74', text: '#090D16' },
  F: { bg: '#2DD4BF', border: '#5EEAD4', text: '#090D16' },
  G: { bg: '#60A5FA', border: '#93C5FD', text: '#090D16' },
  H: { bg: '#FBBF24', border: '#FDE68A', text: '#090D16' },
  I: { bg: '#818CF8', border: '#A5B4FC', text: '#090D16' },
  J: { bg: '#34D399', border: '#6EE7B7', text: '#090D16' },
  K: { bg: '#E879F9', border: '#F0ABFC', text: '#090D16' },
};

// All 5 levels BFS-verified solvable with exact optimal move counts
const LEVELS: TrafficLevel[] = [
  {
    name: 'Morning Commute',
    par: 4,
    cars: [
      { id: 'X', r: 2, c: 1, len: 2, dir: 'H' },
      { id: 'A', r: 1, c: 3, len: 3, dir: 'V' },
      { id: 'B', r: 4, c: 2, len: 2, dir: 'H' },
      { id: 'C', r: 2, c: 4, len: 2, dir: 'V' },
      { id: 'D', r: 0, c: 3, len: 2, dir: 'H' },
    ],
  },
  {
    name: 'Crosswalk Jam',
    par: 6,
    cars: [
      { id: 'X', r: 2, c: 1, len: 2, dir: 'H' },
      { id: 'A', r: 5, c: 0, len: 3, dir: 'H' },
      { id: 'B', r: 1, c: 2, len: 3, dir: 'H' },
      { id: 'C', r: 4, c: 1, len: 2, dir: 'H' },
      { id: 'D', r: 0, c: 3, len: 2, dir: 'H' },
      { id: 'E', r: 0, c: 1, len: 2, dir: 'V' },
      { id: 'F', r: 5, c: 3, len: 2, dir: 'H' },
      { id: 'G', r: 2, c: 4, len: 2, dir: 'V' },
      { id: 'H', r: 0, c: 0, len: 2, dir: 'V' },
      { id: 'I', r: 3, c: 5, len: 3, dir: 'V' },
      { id: 'J', r: 2, c: 0, len: 3, dir: 'V' },
      { id: 'K', r: 4, c: 3, len: 2, dir: 'H' },
    ],
  },
  {
    name: 'Boxed Delivery',
    par: 8,
    cars: [
      { id: 'X', r: 2, c: 1, len: 2, dir: 'H' },
      { id: 'A', r: 5, c: 2, len: 3, dir: 'H' },
      { id: 'B', r: 1, c: 3, len: 2, dir: 'V' },
      { id: 'C', r: 3, c: 3, len: 3, dir: 'H' },
      { id: 'D', r: 1, c: 0, len: 3, dir: 'H' },
      { id: 'E', r: 0, c: 1, len: 2, dir: 'H' },
      { id: 'F', r: 0, c: 5, len: 3, dir: 'V' },
      { id: 'G', r: 4, c: 1, len: 2, dir: 'V' },
      { id: 'H', r: 3, c: 1, len: 2, dir: 'H' },
      { id: 'I', r: 4, c: 4, len: 2, dir: 'H' },
      { id: 'J', r: 1, c: 4, len: 2, dir: 'V' },
      { id: 'K', r: 2, c: 0, len: 2, dir: 'V' },
    ],
  },
  {
    name: 'Midtown Gridlock',
    par: 11,
    cars: [
      { id: 'X', r: 2, c: 0, len: 2, dir: 'H' },
      { id: 'A', r: 4, c: 5, len: 2, dir: 'V' },
      { id: 'B', r: 1, c: 3, len: 3, dir: 'V' },
      { id: 'C', r: 4, c: 2, len: 2, dir: 'H' },
      { id: 'D', r: 0, c: 3, len: 2, dir: 'H' },
      { id: 'E', r: 0, c: 1, len: 2, dir: 'V' },
      { id: 'F', r: 3, c: 4, len: 2, dir: 'H' },
      { id: 'G', r: 3, c: 0, len: 3, dir: 'H' },
      { id: 'H', r: 5, c: 0, len: 3, dir: 'H' },
      { id: 'I', r: 5, c: 3, len: 2, dir: 'H' },
    ],
  },
  {
    name: 'Rush Hour Vault',
    par: 14,
    cars: [
      { id: 'X', r: 2, c: 1, len: 2, dir: 'H' },
      { id: 'A', r: 4, c: 1, len: 2, dir: 'V' },
      { id: 'B', r: 0, c: 5, len: 2, dir: 'V' },
      { id: 'C', r: 0, c: 3, len: 2, dir: 'H' },
      { id: 'D', r: 2, c: 3, len: 3, dir: 'V' },
      { id: 'E', r: 3, c: 4, len: 2, dir: 'V' },
      { id: 'F', r: 0, c: 0, len: 2, dir: 'H' },
      { id: 'G', r: 3, c: 0, len: 2, dir: 'H' },
      { id: 'H', r: 5, c: 3, len: 3, dir: 'H' },
      { id: 'I', r: 2, c: 5, len: 2, dir: 'V' },
    ],
  },
];

function buildOccupancy(cars: Vehicle[]): (string | null)[][] {
  const g: (string | null)[][] = Array.from({ length: 6 }, () => Array(6).fill(null));
  for (const car of cars) {
    for (let k = 0; k < car.len; k++) {
      const rr = car.dir === 'H' ? car.r : car.r + k;
      const cc = car.dir === 'H' ? car.c + k : car.c;
      if (rr >= 0 && rr < 6 && cc >= 0 && cc < 6) {
        g[rr][cc] = car.id;
      }
    }
  }
  return g;
}

export const TrafficEscapePuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [cars, setCars] = useState<Vehicle[]>(() => level.cars.map((c) => ({ ...c })));
  const [history, setHistory] = useState<Vehicle[][]>([]);
  const [selectedId, setSelectedId] = useState<string>('X');
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      const lv = LEVELS[idx];
      setLevelIdx(idx);
      setCars(lv.cars.map((c) => ({ ...c })));
      setHistory([]);
      setSelectedId('X');
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
    setCars(prev);
    setMoves((m) => Math.max(0, m - 1));
    arcadeSound.click(muted);
  }, [history, won, muted]);

  const moveSelected = useCallback(
    (delta: -1 | 1, steps = 1) => {
      if (won) return;
      const idx = cars.findIndex((c) => c.id === selectedId);
      if (idx === -1) return;
      const car = cars[idx];
      const occ = buildOccupancy(cars);

      let validSteps = 0;
      for (let s = 1; s <= steps; s++) {
        const nr = car.dir === 'V' ? car.r + delta * s : car.r;
        const nc = car.dir === 'H' ? car.c + delta * s : car.c;
        const checkR = car.dir === 'H' ? nr : delta > 0 ? nr + car.len - 1 : nr;
        const checkC = car.dir === 'V' ? nc : delta > 0 ? nc + car.len - 1 : nc;
        if (checkR < 0 || checkR >= 6 || checkC < 0 || checkC >= 6) break;
        const occupant = occ[checkR][checkC];
        if (occupant !== null && occupant !== car.id) break;
        validSteps = s;
      }

      if (validSteps === 0) {
        arcadeSound.chomp(muted);
        return;
      }

      const next = cars.map((c, i) =>
        i === idx
          ? {
              ...c,
              r: c.dir === 'V' ? c.r + delta * validSteps : c.r,
              c: c.dir === 'H' ? c.c + delta * validSteps : c.c,
            }
          : c
      );

      const nextMoves = moves + 1;
      setHistory((h) => [...h, cars.map((c) => ({ ...c }))]);
      setCars(next);
      setMoves(nextMoves);

      const targetCar = next.find((c) => c.id === 'X');
      if (targetCar && targetCar.c === 4) {
        setWon(true);
        const bonus = Math.max(0, level.par * 20 - (nextMoves - level.par) * 15);
        onSolved(Math.max(150, 220 + levelIdx * 80 + bonus));
        arcadeSound.victory(muted);
      } else {
        arcadeSound.click(muted);
      }
    },
    [cars, selectedId, moves, won, level.par, levelIdx, onSolved, muted]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        undo();
        return;
      }
      const car = cars.find((c) => c.id === selectedId);
      if (!car) return;
      if (car.dir === 'H' && (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        moveSelected(-1);
      } else if (car.dir === 'H' && (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        moveSelected(1);
      } else if (car.dir === 'V' && (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        moveSelected(-1);
      } else if (car.dir === 'V' && (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        moveSelected(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cars, selectedId, moveSelected, undo]);

  const handleEmptyCellClick = (r: number, c: number) => {
    if (won) return;
    const car = cars.find((x) => x.id === selectedId);
    if (!car) return;
    if (car.dir === 'H' && r === car.r) {
      if (c < car.c) moveSelected(-1, car.c - c);
      else if (c >= car.c + car.len) moveSelected(1, c - (car.c + car.len - 1));
    } else if (car.dir === 'V' && c === car.c) {
      if (r < car.r) moveSelected(-1, car.r - r);
      else if (r >= car.r + car.len) moveSelected(1, r - (car.r + car.len - 1));
    }
  };

  const selectedCar = cars.find((c) => c.id === selectedId);

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
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Moves: <strong className="text-white">{moves}</strong>
          </span>
          <span>
            Par: <strong className="text-emerald-400">{level.par}</strong>
          </span>
        </div>
      </div>

      {/* 6x6 Garage Bay + Right Exit Gate */}
      <div className="relative w-full max-w-[400px] pr-6">
        <div
          className="relative aspect-square w-full rounded-2xl bg-[#0D111A] border-2 border-slate-700 p-2 grid grid-cols-6 grid-rows-6 gap-1.5"
        >
          {/* Background Lane Cells */}
          {Array.from({ length: 36 }).map((_, idx) => {
            const r = Math.floor(idx / 6);
            const c = idx % 6;
            const isExitLane = r === 2;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleEmptyCellClick(r, c)}
                aria-label={`Lane row ${r + 1} col ${c + 1}`}
                className={`rounded-lg border transition-colors ${
                  isExitLane
                    ? 'bg-rose-500/[0.06] border-rose-500/20 hover:bg-rose-500/15'
                    : 'bg-[#141A28] border-slate-800/80 hover:border-slate-700'
                }`}
              />
            );
          })}

          {/* Vehicles overlay */}
          <div className="absolute inset-2 grid grid-cols-6 grid-rows-6 gap-1.5 pointer-events-none">
            {cars.map((car) => {
              const palette = CAR_COLORS[car.id] ?? CAR_COLORS.A;
              const isSel = car.id === selectedId;
              const isTarget = car.id === 'X';
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(car.id);
                    arcadeSound.click(muted);
                  }}
                  style={{
                    gridColumn: `${car.c + 1} / span ${car.dir === 'H' ? car.len : 1}`,
                    gridRow: `${car.r + 1} / span ${car.dir === 'V' ? car.len : 1}`,
                    backgroundColor: palette.bg,
                    borderColor: isSel ? '#FFFFFF' : palette.border,
                    color: palette.text,
                  }}
                  className={`pointer-events-auto rounded-xl border-2 flex items-center justify-center font-mono font-bold text-xs tracking-wider shadow-lg transition-transform duration-150 ${
                    isSel ? 'ring-2 ring-white/80 scale-[1.02] z-10' : 'opacity-95 hover:opacity-100'
                  }`}
                >
                  {isTarget ? 'EXIT →' : car.dir === 'H' ? '↔' : '↕'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exit gate indicator on row 2 */}
        <div
          className="absolute right-0 top-[40%] -translate-y-1/2 flex flex-col items-center text-[10px] font-mono font-bold text-rose-400"
          aria-hidden="true"
        >
          <span>EXIT</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Directional nudge controls for selected vehicle */}
      <div className="flex items-center gap-2">
        {selectedCar?.dir === 'H' ? (
          <>
            <button
              type="button"
              onClick={() => moveSelected(-1)}
              disabled={won}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Slide Left
            </button>
            <button
              type="button"
              onClick={() => moveSelected(1)}
              disabled={won}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
            >
              Slide Right
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => moveSelected(-1)}
              disabled={won}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
              Slide Up
            </button>
            <button
              type="button"
              onClick={() => moveSelected(1)}
              disabled={won}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
            >
              Slide Down
              <ArrowDown className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            {level.name} cleared in <span className="font-mono font-bold">{moves}</span> moves (Par {level.par}).
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Jam
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
          Reset Level
        </button>
      </div>
    </div>
  );
};
