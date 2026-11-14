import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface SokoLevel {
  name: string;
  par: number;
  map: string[];
}

// All 5 warehouse layouts BFS-verified solvable
const LEVELS: SokoLevel[] = [
  {
    name: 'Loading Bay',
    par: 9,
    map: [
      '#######',
      '#  .  #',
      '# .$. #',
      '# $@$ #',
      '#     #',
      '#     #',
      '#######',
    ],
  },
  {
    name: 'Split Dock',
    par: 11,
    map: [
      '#######',
      '#     #',
      '# .$. #',
      '#  @  #',
      '#  $  #',
      '#     #',
      '#######',
    ],
  },
  {
    name: 'Center Pillar',
    par: 15,
    map: [
      '########',
      '#  #   #',
      '# $  . #',
      '# .#$$.#',
      '#  @   #',
      '########',
    ],
  },
  {
    name: 'Double Corridor',
    par: 17,
    map: [
      '########',
      '#   .  #',
      '# #$$# #',
      '#  ..  #',
      '#  $@  #',
      '#      #',
      '########',
    ],
  },
  {
    name: 'Alcove Shift',
    par: 18,
    map: [
      '#######',
      '#..   #',
      '# # $ #',
      '#   $ #',
      '#  @  #',
      '#######',
    ],
  },
];

interface SokoState {
  player: [number, number];
  boxes: string[];
}

function parseLevel(map: string[]) {
  const walls = new Set<string>();
  const targets = new Set<string>();
  const boxes: string[] = [];
  let player: [number, number] = [1, 1];

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      const ch = map[r][c];
      const key = `${r},${c}`;
      if (ch === '#') walls.add(key);
      if (ch === '.' || ch === '*' || ch === '+') targets.add(key);
      if (ch === '$' || ch === '*') boxes.push(key);
      if (ch === '@' || ch === '+') player = [r, c];
    }
  }
  return { walls, targets, initialState: { player, boxes } };
}

export const SokobanPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const parsed = parseLevel(level.map);

  const [state, setState] = useState<SokoState>(parsed.initialState);
  const [history, setHistory] = useState<SokoState[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      const nextParsed = parseLevel(LEVELS[idx].map);
      setLevelIdx(idx);
      setState(nextParsed.initialState);
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
    setState(prev);
    setMoves((m) => Math.max(0, m - 1));
    arcadeSound.click(muted);
  }, [history, won, muted]);

  const step = useCallback(
    (dr: number, dc: number) => {
      if (won) return;
      const { walls, targets } = parseLevel(level.map);
      const [r, c] = state.player;
      const nr = r + dr;
      const nc = c + dc;
      const nKey = `${nr},${nc}`;
      if (walls.has(nKey)) {
        arcadeSound.chomp(muted);
        return;
      }

      const boxIdx = state.boxes.indexOf(nKey);
      let nextBoxes = state.boxes;
      let pushed = false;

      if (boxIdx !== -1) {
        const br = nr + dr;
        const bc = nc + dc;
        const bKey = `${br},${bc}`;
        if (walls.has(bKey) || state.boxes.includes(bKey)) {
          arcadeSound.chomp(muted);
          return;
        }
        nextBoxes = state.boxes.map((b, i) => (i === boxIdx ? bKey : b));
        pushed = true;
      }

      const nextMoves = moves + 1;
      setHistory((h) => [...h, { player: [...state.player] as [number, number], boxes: [...state.boxes] }]);
      setState({ player: [nr, nc], boxes: nextBoxes });
      setMoves(nextMoves);

      const solved = nextBoxes.every((b) => targets.has(b));
      if (solved) {
        setWon(true);
        const bonus = Math.max(0, level.par * 15 - (nextMoves - level.par) * 10);
        onSolved(Math.max(160, 220 + levelIdx * 75 + bonus));
        arcadeSound.victory(muted);
      } else if (pushed) {
        arcadeSound.merge(muted, 1);
      } else {
        arcadeSound.click(muted);
      }
    },
    [won, level, state, moves, levelIdx, onSolved, muted]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        undo();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        step(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        step(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        step(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        step(0, 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, undo]);

  const rows = level.map.length;
  const cols = level.map[0].length;
  const dockedCount = state.boxes.filter((b) => parsed.targets.has(b)).length;

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
            Docked:{' '}
            <strong className="text-emerald-400">
              {dockedCount}/{state.boxes.length}
            </strong>
          </span>
          <span>
            Steps: <strong className="text-white">{moves}</strong>
          </span>
        </div>
      </div>

      <div
        className="w-full max-w-[400px] rounded-2xl bg-[#0C1018] border border-slate-800 p-3 grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {level.map.map((rowStr, r) =>
          rowStr.split('').map((_, c) => {
            const key = `${r},${c}`;
            const isWall = parsed.walls.has(key);
            const isTarget = parsed.targets.has(key);
            const hasBox = state.boxes.includes(key);
            const isPlayer = state.player[0] === r && state.player[1] === c;

            if (isWall) {
              return (
                <div
                  key={key}
                  className="aspect-square rounded-md bg-slate-700/80 border border-slate-600/80"
                />
              );
            }

            return (
              <div
                key={key}
                className={`aspect-square rounded-md border flex items-center justify-center relative ${
                  isTarget
                    ? 'bg-amber-500/10 border-amber-400/50'
                    : 'bg-[#141926] border-slate-800/80'
                }`}
              >
                {isTarget && !hasBox && !isPlayer && (
                  <div className="w-3 h-3 rounded-full border-2 border-amber-400/80" />
                )}
                {hasBox && (
                  <div
                    className={`w-[82%] h-[82%] rounded-md border-2 flex items-center justify-center text-[10px] font-mono font-bold ${
                      isTarget
                        ? 'bg-emerald-400 border-emerald-200 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-amber-500 border-amber-300 text-slate-950'
                    }`}
                  >
                    ✕
                  </div>
                )}
                {isPlayer && (
                  <div className="w-[70%] h-[70%] rounded-full bg-sky-400 border-2 border-white shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* D-pad */}
      <div className="grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button
          type="button"
          onClick={() => step(-1, 0)}
          disabled={won}
          aria-label="Move Up"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button
          type="button"
          onClick={() => step(0, -1)}
          disabled={won}
          aria-label="Move Left"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => step(1, 0)}
          disabled={won}
          aria-label="Move Down"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => step(0, 1)}
          disabled={won}
          aria-label="Move Right"
          className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            All crates docked in {level.name} ({moves} steps).
          </div>
          <button
            type="button"
            onClick={() => loadLevel((levelIdx + 1) % LEVELS.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Warehouse
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
