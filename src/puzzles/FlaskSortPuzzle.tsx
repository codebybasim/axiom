import React, { useCallback, useEffect, useState } from 'react';
import { Lightbulb, RotateCcw, Shuffle, Undo2 } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

const FLASK_CAPACITY = 4;

interface ColorDef {
  id: number;
  label: string;
  bg: string;
  border: string;
}

const COLORS: ColorDef[] = [
  { id: 1, label: 'A', bg: '#F43F5E', border: '#FDA4AF' }, // Crimson
  { id: 2, label: 'B', bg: '#38BDF8', border: '#BAE6FD' }, // Sky
  { id: 3, label: 'C', bg: '#10B981', border: '#A7F3D0' }, // Emerald
  { id: 4, label: 'D', bg: '#F59E0B', border: '#FDE68A' }, // Amber
  { id: 5, label: 'E', bg: '#A78BFA', border: '#DDD6FE' }, // Violet
  { id: 6, label: 'F', bg: '#FB923C', border: '#FED7AA' }, // Orange
  { id: 7, label: 'G', bg: '#2DD4BF', border: '#99F6E4' }, // Teal
];

type Flask = number[]; // bottom = index 0, top = last index

function isFlaskSolved(flask: Flask): boolean {
  if (flask.length === 0) return true;
  if (flask.length !== FLASK_CAPACITY) return false;
  return flask.every((c) => c === flask[0]);
}

function isBoardSolved(flasks: Flask[]): boolean {
  return flasks.every(isFlaskSolved);
}

function canPour(src: Flask, dst: Flask): boolean {
  if (src.length === 0 || dst.length >= FLASK_CAPACITY) return false;
  // Avoid pointless pour of pure flask into empty flask
  if (dst.length === 0 && src.every((c) => c === src[0])) return false;
  if (dst.length === 0) return true;
  return src[src.length - 1] === dst[dst.length - 1];
}

function applyPour(flasks: Flask[], from: number, to: number): Flask[] {
  const next = flasks.map((f) => [...f]);
  const src = next[from];
  const dst = next[to];
  const color = src[src.length - 1];
  while (src.length > 0 && src[src.length - 1] === color && dst.length < FLASK_CAPACITY) {
    dst.push(src.pop()!);
  }
  return next;
}

function encodeFlasks(flasks: Flask[]): string {
  return flasks
    .map((f) => f.join(','))
    .sort()
    .join('|');
}

function findHintMove(flasks: Flask[]): [number, number] | null {
  const visited = new Set<string>([encodeFlasks(flasks)]);
  const queue: { state: Flask[]; firstMove: [number, number] | null }[] = [
    { state: flasks, firstMove: null },
  ];
  let head = 0;
  while (head < queue.length && visited.size < 2500) {
    const { state, firstMove } = queue[head++];
    if (isBoardSolved(state)) return firstMove;

    for (let i = 0; i < state.length; i++) {
      if (state[i].length === 0 || isFlaskSolved(state[i])) continue;
      let usedEmpty = false;
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue;
        if (state[j].length === 0) {
          if (usedEmpty) continue;
          usedEmpty = true;
        }
        if (!canPour(state[i], state[j])) continue;
        const next = applyPour(state, i, j);
        const key = encodeFlasks(next);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ state: next, firstMove: firstMove ?? [i, j] });
        }
      }
    }
  }
  return null;
}

function generateSolvablePuzzle(numColors: number): Flask[] {
  for (let attempt = 0; attempt < 25; attempt++) {
    const pool: number[] = [];
    for (let c = 1; c <= numColors; c++) {
      for (let k = 0; k < FLASK_CAPACITY; k++) pool.push(c);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const flasks: Flask[] = [];
    for (let f = 0; f < numColors; f++) {
      flasks.push(pool.slice(f * FLASK_CAPACITY, (f + 1) * FLASK_CAPACITY));
    }
    flasks.push([], []);
    if (!isBoardSolved(flasks) && findHintMove(flasks) !== null) {
      return flasks;
    }
  }
  // Fallback deterministic solvable 4-color setup
  return [
    [1, 2, 3, 4],
    [2, 3, 4, 1],
    [3, 4, 1, 2],
    [4, 1, 2, 3],
    [],
    [],
  ];
}

const LEVELS = [
  { label: '4 Colors', colors: 4 },
  { label: '5 Colors', colors: 5 },
  { label: '6 Colors', colors: 6 },
  { label: '7 Colors', colors: 7 },
];

export const FlaskSortPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [initialFlasks, setInitialFlasks] = useState<Flask[]>(() => generateSolvablePuzzle(4));
  const [flasks, setFlasks] = useState<Flask[]>(() => initialFlasks.map((f) => [...f]));
  const [history, setHistory] = useState<Flask[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const startNew = useCallback(
    (idx: number) => {
      const nextInit = generateSolvablePuzzle(LEVELS[idx].colors);
      setLevelIdx(idx);
      setInitialFlasks(nextInit);
      setFlasks(nextInit.map((f) => [...f]));
      setHistory([]);
      setSelected(null);
      setMoves(0);
      setWon(false);
      setHint(null);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const resetCurrent = () => {
    setFlasks(initialFlasks.map((f) => [...f]));
    setHistory([]);
    setSelected(null);
    setMoves(0);
    setWon(false);
    setHint(null);
    arcadeSound.click(muted);
  };

  const undo = useCallback(() => {
    if (history.length === 0 || won) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFlasks(prev);
    setSelected(null);
    setHint(null);
    setMoves((m) => Math.max(0, m - 1));
    arcadeSound.click(muted);
  }, [history, won, muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  const handleFlaskClick = (idx: number) => {
    if (won) return;
    setHint(null);

    if (selected === null) {
      if (flasks[idx].length === 0) return;
      setSelected(idx);
      arcadeSound.click(muted);
      return;
    }

    if (selected === idx) {
      setSelected(null);
      arcadeSound.click(muted);
      return;
    }

    if (canPour(flasks[selected], flasks[idx])) {
      const next = applyPour(flasks, selected, idx);
      const nextMoves = moves + 1;
      setHistory((h) => [...h, flasks.map((f) => [...f])]);
      setFlasks(next);
      setSelected(null);
      setMoves(nextMoves);
      if (isBoardSolved(next)) {
        setWon(true);
        const score = Math.max(180, LEVELS[levelIdx].colors * 120 - nextMoves * 5);
        onSolved(score);
        arcadeSound.victory(muted);
      } else {
        arcadeSound.merge(muted, 2);
      }
    } else {
      if (flasks[idx].length > 0) {
        setSelected(idx);
        arcadeSound.click(muted);
      } else {
        setSelected(null);
        arcadeSound.chomp(muted);
      }
    }
  };

  const handleHint = () => {
    if (won) return;
    const mv = findHintMove(flasks);
    if (mv) {
      setHint(mv);
      setSelected(mv[0]);
      arcadeSound.bonus(muted);
    }
  };

  const sortedCount = flasks.filter((f) => f.length === FLASK_CAPACITY && isFlaskSolved(f)).length;
  const totalColors = LEVELS[levelIdx].colors;

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col items-center gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {LEVELS.map((lv, idx) => (
            <button
              key={lv.label}
              type="button"
              onClick={() => startNew(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-violet-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lv.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Sorted:{' '}
            <strong className="text-emerald-400">
              {sortedCount}/{totalColors}
            </strong>
          </span>
          <span>
            Pours: <strong className="text-white">{moves}</strong>
          </span>
        </div>
      </div>

      {/* Flask Rack */}
      <div className="w-full rounded-2xl bg-[#111623] border border-slate-800 px-4 py-8 flex flex-wrap items-end justify-center gap-4 sm:gap-5 min-h-[260px]">
        {flasks.map((flask, idx) => {
          const isSel = selected === idx;
          const isDone = flask.length === FLASK_CAPACITY && isFlaskSolved(flask);
          const isHintSrc = hint && hint[0] === idx;
          const isHintDst = hint && hint[1] === idx;
          const canReceive =
            selected !== null && selected !== idx && canPour(flasks[selected], flask);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleFlaskClick(idx)}
              aria-label={`Flask ${idx + 1} with ${flask.length} layers`}
              className={`group relative flex flex-col items-center transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                isSel ? '-translate-y-4' : 'hover:-translate-y-1'
              }`}
            >
              {/* Lip */}
              <div
                className={`w-14 sm:w-16 h-2.5 rounded-t-full border-2 border-b-0 transition-colors ${
                  isSel
                    ? 'border-sky-400 bg-sky-400/20'
                    : isHintDst
                    ? 'border-amber-400 bg-amber-400/20'
                    : isDone
                    ? 'border-emerald-400 bg-emerald-400/20'
                    : canReceive
                    ? 'border-slate-400 bg-slate-800'
                    : 'border-slate-700 bg-slate-900'
                }`}
              />
              {/* Glass Body */}
              <div
                className={`w-12 sm:w-14 h-36 sm:h-40 rounded-b-2xl border-2 p-1 flex flex-col-reverse gap-1 bg-[#090D16]/90 overflow-hidden transition-colors ${
                  isSel
                    ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.28)]'
                    : isHintDst
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.28)]'
                    : isHintSrc
                    ? 'border-amber-400'
                    : isDone
                    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.22)]'
                    : canReceive
                    ? 'border-slate-500'
                    : 'border-slate-700'
                }`}
              >
                {flask.map((colorId, layerIdx) => {
                  const def = COLORS[colorId - 1] ?? COLORS[0];
                  return (
                    <div
                      key={layerIdx}
                      style={{ backgroundColor: def.bg, borderColor: def.border }}
                      className="w-full h-7 sm:h-8 rounded-md border-t flex items-center justify-center text-[11px] font-mono font-bold text-slate-950/80 select-none transition-all"
                    >
                      {showLabels ? def.label : ''}
                    </div>
                  );
                })}
              </div>
              <span className="mt-2 text-[11px] font-mono tabular-nums text-slate-500">
                {isHintSrc ? 'From' : isHintDst ? 'To' : isDone ? 'Pure' : `#${idx + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            All {totalColors} flasks purified in{' '}
            <span className="font-mono font-bold">{moves}</span> pours.
          </div>
          <button
            type="button"
            onClick={() => startNew((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Challenge
          </button>
        </div>
      )}

      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0 || won}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleHint}
            disabled={won}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-40 text-xs font-medium text-amber-300 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Hint
          </button>
          <button
            type="button"
            onClick={() => setShowLabels((s) => !s)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            {showLabels ? 'Hide Letters' : 'Show Letters'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCurrent}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
          <button
            type="button"
            onClick={() => startNew(levelIdx)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-400 hover:bg-violet-300 text-slate-950 text-xs font-semibold transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            New Mix
          </button>
        </div>
      </div>
    </div>
  );
};
