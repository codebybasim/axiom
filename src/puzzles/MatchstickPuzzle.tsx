import React, { useCallback, useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

// 7-segment bitmasks: 0:top, 1:tl, 2:tr, 3:mid, 4:bl, 5:br, 6:bot
const DIGIT_MASKS: Record<number, number> = {
  0: 0b1110111,
  1: 0b0100100,
  2: 0b1011101,
  3: 0b1101101,
  4: 0b0101110,
  5: 0b1101011,
  6: 0b1111011,
  7: 0b0100101,
  8: 0b1111111,
  9: 0b1101111,
};

function maskToDigit(mask: number): number | null {
  for (const [d, m] of Object.entries(DIGIT_MASKS)) {
    if (m === mask) return Number(d);
  }
  return null;
}

interface MatchLevel {
  title: string;
  a: number;
  op: '+' | '-';
  b: number;
  c: number;
  maxMoves: number;
  hintText: string;
}

// All 8 levels verified against 7-segment stick conservation
const LEVELS: MatchLevel[] = [
  { title: '6 + 4 = 4', a: 6, op: '+', b: 4, c: 4, maxMoves: 1, hintText: 'Turn + into - and upgrade 6 to 8.' },
  { title: '5 + 7 = 2', a: 5, op: '+', b: 7, c: 2, maxMoves: 1, hintText: 'Take the vertical stick from + to turn 5 into 9.' },
  { title: '3 + 3 = 8', a: 3, op: '+', b: 3, c: 8, maxMoves: 1, hintText: 'Reshape one 3 into a 5.' },
  { title: '9 + 2 = 6', a: 9, op: '+', b: 2, c: 6, maxMoves: 1, hintText: 'Move the + vertical bar onto 9 to form 8.' },
  { title: '8 - 3 = 3', a: 8, op: '-', b: 3, c: 3, maxMoves: 2, hintText: 'Move 2 sticks to form 9 - 3 = 6 or 9 - 6 = 3.' },
  { title: '6 + 6 = 8', a: 6, op: '+', b: 6, c: 8, maxMoves: 2, hintText: 'Form 8 - 0 = 8 or 8 - 8 = 0.' },
  { title: '4 + 3 = 9', a: 4, op: '+', b: 3, c: 9, maxMoves: 2, hintText: 'Try forming 1 + 8 = 9 or 4 + 4 = 8.' },
  { title: '9 - 6 = 5', a: 9, op: '-', b: 6, c: 5, maxMoves: 2, hintText: 'Turn - into + for 0 + 5 = 5 or reshape to 8 - 3 = 5.' },
];

type SlotState = {
  masks: [number, number, number]; // a, b, c
  opIsPlus: boolean;
};

// Coordinates for 7 segments inside a 70x110 digit SVG
const SEG_RECTS: { idx: number; x: number; y: number; w: number; h: number }[] = [
  { idx: 0, x: 14, y: 6, w: 42, h: 9 },   // top
  { idx: 1, x: 6, y: 15, w: 9, h: 36 },   // top-left
  { idx: 2, x: 55, y: 15, w: 9, h: 36 },  // top-right
  { idx: 3, x: 14, y: 51, w: 42, h: 9 },  // mid
  { idx: 4, x: 6, y: 60, w: 9, h: 36 },   // bot-left
  { idx: 5, x: 55, y: 60, w: 9, h: 36 },  // bot-right
  { idx: 6, x: 14, y: 96, w: 42, h: 9 },  // bot
];

function popcnt(x: number) {
  let c = 0;
  let v = x;
  while (v) {
    c += v & 1;
    v >>= 1;
  }
  return c;
}

export const MatchstickPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const initialState = (lv: MatchLevel): SlotState => ({
    masks: [DIGIT_MASKS[lv.a], DIGIT_MASKS[lv.b], DIGIT_MASKS[lv.c]],
    opIsPlus: lv.op === '+',
  });

  const [state, setState] = useState<SlotState>(() => initialState(LEVELS[0]));
  const [holdingStick, setHoldingStick] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      setLevelIdx(idx);
      setState(initialState(LEVELS[idx]));
      setHoldingStick(false);
      setShowHint(false);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const initial = initialState(level);
  // Count how many sticks were moved relative to initial
  const movedOut =
    popcnt(initial.masks[0] & ~state.masks[0]) +
    popcnt(initial.masks[1] & ~state.masks[1]) +
    popcnt(initial.masks[2] & ~state.masks[2]) +
    (initial.opIsPlus && !state.opIsPlus ? 1 : 0);
  const movedIn =
    popcnt(state.masks[0] & ~initial.masks[0]) +
    popcnt(state.masks[1] & ~initial.masks[1]) +
    popcnt(state.masks[2] & ~initial.masks[2]) +
    (!initial.opIsPlus && state.opIsPlus ? 1 : 0);

  const dA = maskToDigit(state.masks[0]);
  const dB = maskToDigit(state.masks[1]);
  const dC = maskToDigit(state.masks[2]);
  const equationTrue =
    dA !== null &&
    dB !== null &&
    dC !== null &&
    (state.opIsPlus ? dA + dB === dC : dA - dB === dC);

  const checkWin = (next: SlotState) => {
    const na = maskToDigit(next.masks[0]);
    const nb = maskToDigit(next.masks[1]);
    const nc = maskToDigit(next.masks[2]);
    if (na === null || nb === null || nc === null) return false;
    const ok = next.opIsPlus ? na + nb === nc : na - nb === nc;
    if (!ok) return false;

    const outC =
      popcnt(initial.masks[0] & ~next.masks[0]) +
      popcnt(initial.masks[1] & ~next.masks[1]) +
      popcnt(initial.masks[2] & ~next.masks[2]) +
      (initial.opIsPlus && !next.opIsPlus ? 1 : 0);
    const inC =
      popcnt(next.masks[0] & ~initial.masks[0]) +
      popcnt(next.masks[1] & ~initial.masks[1]) +
      popcnt(next.masks[2] & ~initial.masks[2]) +
      (!initial.opIsPlus && next.opIsPlus ? 1 : 0);

    return outC === inC && outC > 0 && outC <= level.maxMoves;
  };

  const toggleSegment = (slot: 0 | 1 | 2, bitIdx: number) => {
    if (won) return;
    const bit = 1 << bitIdx;
    const isLit = Boolean(state.masks[slot] & bit);

    if (!holdingStick && isLit) {
      // Pick up a stick
      const nextMasks = [...state.masks] as [number, number, number];
      nextMasks[slot] &= ~bit;
      setState({ ...state, masks: nextMasks });
      setHoldingStick(true);
      arcadeSound.click(muted);
    } else if (holdingStick && !isLit) {
      // Drop the held stick
      const nextMasks = [...state.masks] as [number, number, number];
      nextMasks[slot] |= bit;
      const nextState = { ...state, masks: nextMasks };
      setState(nextState);
      setHoldingStick(false);
      if (checkWin(nextState)) {
        setWon(true);
        onSolved(180 + level.maxMoves * 60);
        arcadeSound.victory(muted);
      } else {
        arcadeSound.merge(muted, 1);
      }
    }
  };

  const toggleOperatorStick = () => {
    if (won) return;
    if (!holdingStick && state.opIsPlus) {
      setState({ ...state, opIsPlus: false });
      setHoldingStick(true);
      arcadeSound.click(muted);
    } else if (holdingStick && !state.opIsPlus) {
      const nextState = { ...state, opIsPlus: true };
      setState(nextState);
      setHoldingStick(false);
      if (checkWin(nextState)) {
        setWon(true);
        onSolved(180 + level.maxMoves * 60);
        arcadeSound.victory(muted);
      } else {
        arcadeSound.merge(muted, 1);
      }
    }
  };

  const renderDigit = (slot: 0 | 1 | 2) => {
    const mask = state.masks[slot];
    const valid = maskToDigit(mask);
    return (
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 70 110" className="w-16 sm:w-20 h-24 sm:h-28">
          {SEG_RECTS.map((seg) => {
            const lit = Boolean(mask & (1 << seg.idx));
            const interactive = (!holdingStick && lit) || (holdingStick && !lit);
            return (
              <rect
                key={seg.idx}
                x={seg.x}
                y={seg.y}
                width={seg.w}
                height={seg.h}
                rx={4.5}
                onClick={() => toggleSegment(slot, seg.idx)}
                style={{ cursor: won ? 'default' : interactive ? 'pointer' : 'default' }}
                fill={
                  lit
                    ? won
                      ? '#34D399'
                      : '#FBBF24'
                    : holdingStick
                    ? 'rgba(251, 191, 36, 0.16)'
                    : '#1A2233'
                }
                stroke={
                  lit
                    ? won
                      ? '#A7F3D0'
                      : '#FEF08A'
                    : holdingStick
                    ? 'rgba(251, 191, 36, 0.45)'
                    : '#263046'
                }
                strokeWidth="1.2"
              />
            );
          })}
        </svg>
        <span className="text-[11px] font-mono text-slate-500">
          {valid !== null ? valid : '?'}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[600px] mx-auto flex flex-col items-center gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {LEVELS.map((lv, idx) => (
            <button
              key={lv.title}
              type="button"
              onClick={() => loadLevel(idx)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                levelIdx === idx
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Moves Left:{' '}
            <strong className={movedOut > level.maxMoves ? 'text-rose-400' : 'text-amber-400'}>
              {Math.max(0, level.maxMoves - Math.max(movedOut, movedIn))}
            </strong>
          </span>
          <span className={holdingStick ? 'text-sky-400 font-semibold' : 'text-slate-400'}>
            {holdingStick ? 'Holding Stick — Click empty slot' : 'Click lit stick to lift'}
          </span>
        </div>
      </div>

      {/* Equation Workbench */}
      <div className="w-full rounded-2xl bg-[#0C1019] border border-slate-800 py-8 px-4 flex items-center justify-center gap-2 sm:gap-4">
        {renderDigit(0)}

        {/* Operator (+ or -) */}
        <svg
          viewBox="0 0 50 110"
          onClick={toggleOperatorStick}
          className="w-10 sm:w-12 h-24 sm:h-28 cursor-pointer"
        >
          <rect x="6" y="50" width="38" height="9" rx="4.5" fill={won ? '#34D399' : '#FBBF24'} />
          <rect
            x="20.5"
            y="35"
            width="9"
            height="38"
            rx="4.5"
            fill={
              state.opIsPlus
                ? won
                  ? '#34D399'
                  : '#FBBF24'
                : holdingStick
                ? 'rgba(251, 191, 36, 0.16)'
                : '#1A2233'
            }
            stroke={
              state.opIsPlus
                ? won
                  ? '#A7F3D0'
                  : '#FEF08A'
                : holdingStick
                ? 'rgba(251, 191, 36, 0.45)'
                : '#263046'
            }
            strokeWidth="1.2"
          />
        </svg>

        {renderDigit(1)}

        {/* Fixed Equals */}
        <svg viewBox="0 0 46 110" className="w-9 sm:w-11 h-24 sm:h-28">
          <rect x="5" y="42" width="36" height="8" rx="4" fill="#94A3B8" />
          <rect x="5" y="60" width="36" height="8" rx="4" fill="#94A3B8" />
        </svg>

        {renderDigit(2)}
      </div>

      {movedOut > level.maxMoves && !won && (
        <div className="w-full rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs text-rose-300 text-center">
          Used more than {level.maxMoves} move{level.maxMoves > 1 ? 's' : ''} — reset to solve within exact stick budget.
        </div>
      )}

      {showHint && !won && (
        <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 text-center">
          Hint: {level.hintText}
        </div>
      )}

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            Equation repaired: <span className="font-mono font-bold">{dA} {state.opIsPlus ? '+' : '-'} {dB} = {dC}</span>
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Equation
          </button>
        </div>
      )}

      {!won && equationTrue && movedOut > level.maxMoves && (
        <span className="text-xs text-amber-400">
          Equation is true, but solve it in at most {level.maxMoves} move{level.maxMoves > 1 ? 's' : ''}!
        </span>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowHint((h) => !h)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {showHint ? 'Hide Hint' : 'Hint'}
        </button>

        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sticks
        </button>
      </div>
    </div>
  );
};
