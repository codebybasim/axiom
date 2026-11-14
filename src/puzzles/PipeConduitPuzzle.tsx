import React, { useCallback, useMemo, useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

// Bitmask for pipe openings: N=1, E=2, S=4, W=8
const N = 1;
const E = 2;
const S = 4;
const W = 8;

const DIRS = [
  { bit: N, opp: S, dr: -1, dc: 0 },
  { bit: E, opp: W, dr: 0, dc: 1 },
  { bit: S, opp: N, dr: 1, dc: 0 },
  { bit: W, opp: E, dr: 0, dc: -1 },
];

function rotateMask(mask: number, steps: number): number {
  let m = mask;
  for (let s = 0; s < (steps % 4); s++) {
    let next = 0;
    if (m & N) next |= E;
    if (m & E) next |= S;
    if (m & S) next |= W;
    if (m & W) next |= N;
    m = next;
  }
  return m;
}

interface Tile {
  baseMask: number;
  rotation: number; // 0..3
  isSource: boolean;
  isTerminal: boolean;
}

function generatePipeBoard(size: number): Tile[][] {
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const masks = Array.from({ length: size }, () => Array(size).fill(0));

  // Spanning tree DFS from (0, 0)
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = DIRS.map((d) => ({
      ...d,
      nr: r + d.dr,
      nc: c + d.dc,
    })).filter(
      ({ nr, nc }) => nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]
    );

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      masks[r][c] |= pick.bit;
      masks[pick.nr][pick.nc] |= pick.opp;
      visited[pick.nr][pick.nc] = true;
      stack.push([pick.nr, pick.nc]);
    }
  }

  const grid: Tile[][] = [];
  for (let r = 0; r < size; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < size; c++) {
      const m = masks[r][c];
      const deg = ((m & 1) ? 1 : 0) + ((m & 2) ? 1 : 0) + ((m & 4) ? 1 : 0) + ((m & 8) ? 1 : 0);
      const isSource = r === 0 && c === 0;
      const isTerminal = !isSource && deg === 1;
      const isSymmetricStraight = m === (N | S) || m === (E | W);
      const isCross = m === (N | E | S | W);

      let rot = 0;
      if (!isCross) {
        const mod = isSymmetricStraight ? 2 : 4;
        // Scramble most tiles so puzzle starts unsolved
        rot = Math.floor(Math.random() * mod);
        if (rot === 0 && Math.random() < 0.72) {
          rot = 1 + Math.floor(Math.random() * (mod - 1));
        }
      }

      row.push({
        baseMask: m,
        rotation: rot,
        isSource,
        isTerminal,
      });
    }
    grid.push(row);
  }
  return grid;
}

const SIZES = [
  { label: '5×5 Standard', size: 5 },
  { label: '6×6 Complex', size: 6 },
  { label: '7×7 Master', size: 7 },
];

export const PipeConduitPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [sizeIdx, setSizeIdx] = useState(0);
  const [initialGrid, setInitialGrid] = useState<Tile[][]>(() => generatePipeBoard(5));
  const [grid, setGrid] = useState<Tile[][]>(() =>
    initialGrid.map((row) => row.map((t) => ({ ...t })))
  );
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const size = SIZES[sizeIdx].size;

  const newBoard = useCallback(
    (idx: number) => {
      const nextSize = SIZES[idx].size;
      const generated = generatePipeBoard(nextSize);
      setSizeIdx(idx);
      setInitialGrid(generated);
      setGrid(generated.map((row) => row.map((t) => ({ ...t }))));
      setMoves(0);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const resetBoard = () => {
    setGrid(initialGrid.map((row) => row.map((t) => ({ ...t }))));
    setMoves(0);
    setWon(false);
    arcadeSound.click(muted);
  };

  // Compute live flow from (0,0) and check for leaks or disconnected terminals
  const analysis = useMemo(() => {
    const powered = Array.from({ length: size }, () => Array(size).fill(false));
    const queue: [number, number][] = [[0, 0]];
    powered[0][0] = true;

    let openLeaks = 0;
    let totalTerminals = 0;
    let poweredTerminals = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const tile = grid[r][c];
      const mask = rotateMask(tile.baseMask, tile.rotation);

      for (const d of DIRS) {
        if (!(mask & d.bit)) continue;
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
          openLeaks++;
          continue;
        }
        const nMask = rotateMask(grid[nr][nc].baseMask, grid[nr][nc].rotation);
        if (!(nMask & d.opp)) {
          openLeaks++;
          continue;
        }
        if (!powered[nr][nc]) {
          powered[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c].isTerminal) {
          totalTerminals++;
          if (powered[r][c]) poweredTerminals++;
        }
      }
    }

    const solved = poweredTerminals === totalTerminals && openLeaks === 0 && totalTerminals > 0;
    return { powered, openLeaks, totalTerminals, poweredTerminals, solved };
  }, [grid, size]);

  const rotateTile = (r: number, c: number) => {
    if (won) return;
    const next = grid.map((row, ri) =>
      row.map((tile, ci) =>
        ri === r && ci === c ? { ...tile, rotation: (tile.rotation + 1) % 4 } : tile
      )
    );
    setGrid(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    // Check win inline on next grid
    const powered = Array.from({ length: size }, () => Array(size).fill(false));
    const queue: [number, number][] = [[0, 0]];
    powered[0][0] = true;
    let leaks = 0;
    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      const mask = rotateMask(next[cr][cc].baseMask, next[cr][cc].rotation);
      for (const d of DIRS) {
        if (!(mask & d.bit)) continue;
        const nr = cr + d.dr;
        const nc = cc + d.dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
          leaks++;
          continue;
        }
        const nMask = rotateMask(next[nr][nc].baseMask, next[nr][nc].rotation);
        if (!(nMask & d.opp)) {
          leaks++;
          continue;
        }
        if (!powered[nr][nc]) {
          powered[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    let allTerms = true;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (next[rr][cc].isTerminal && !powered[rr][cc]) allTerms = false;
      }
    }

    if (allTerms && leaks === 0) {
      setWon(true);
      onSolved(Math.max(150, size * size * 18 - nextMoves * 2));
      arcadeSound.victory(muted);
    } else {
      arcadeSound.click(muted);
    }
  };

  return (
    <div className="w-full max-w-[540px] mx-auto flex flex-col items-center gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {SIZES.map((s, idx) => (
            <button
              key={s.label}
              type="button"
              onClick={() => newBoard(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                sizeIdx === idx
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums text-slate-300">
          <span>
            Valves:{' '}
            <strong className="text-emerald-400">
              {analysis.poweredTerminals}/{analysis.totalTerminals}
            </strong>
          </span>
          <span>
            Leaks:{' '}
            <strong className={analysis.openLeaks > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {analysis.openLeaks}
            </strong>
          </span>
          <span>
            Turns: <strong className="text-white">{moves}</strong>
          </span>
        </div>
      </div>

      <div
        className="w-full aspect-square max-w-[440px] rounded-2xl bg-[#0D121D] border border-slate-800 p-2.5 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isPowered = analysis.powered[r][c];
            const mask = rotateMask(tile.baseMask, tile.rotation);
            const stroke = isPowered ? '#38BDF8' : '#475569';

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => rotateTile(r, c)}
                aria-label={`Pipe at row ${r + 1} column ${c + 1}`}
                className={`relative rounded-xl border transition-all flex items-center justify-center overflow-hidden ${
                  tile.isSource
                    ? 'bg-sky-500/15 border-sky-400/60'
                    : tile.isTerminal && isPowered
                    ? 'bg-emerald-500/15 border-emerald-400/60'
                    : isPowered
                    ? 'bg-[#131C2D] border-sky-500/30 hover:border-sky-400/70'
                    : 'bg-[#121723] border-slate-800 hover:border-slate-600'
                }`}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {Boolean(mask & N) && (
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="0"
                      stroke={stroke}
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                  )}
                  {Boolean(mask & E) && (
                    <line
                      x1="50"
                      y1="50"
                      x2="100"
                      y2="50"
                      stroke={stroke}
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                  )}
                  {Boolean(mask & S) && (
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="100"
                      stroke={stroke}
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                  )}
                  {Boolean(mask & W) && (
                    <line
                      x1="50"
                      y1="50"
                      x2="0"
                      y2="50"
                      stroke={stroke}
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                  )}
                  {tile.isSource ? (
                    <circle cx="50" cy="50" r="22" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="4" />
                  ) : tile.isTerminal ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="18"
                      fill={isPowered ? '#10B981' : '#1E293B'}
                      stroke={isPowered ? '#A7F3D0' : '#64748B'}
                      strokeWidth="4"
                    />
                  ) : (
                    <circle cx="50" cy="50" r="10" fill={stroke} />
                  )}
                </svg>
              </button>
            );
          })
        )}
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            Circuit pressurized with zero leaks in <span className="font-mono font-bold">{moves}</span> turns.
          </div>
          <button
            type="button"
            onClick={() => newBoard((sizeIdx + 1) % SIZES.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Grid
          </button>
        </div>
      )}

      <div className="w-full flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={resetBoard}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Rotations
        </button>

        <button
          type="button"
          onClick={() => newBoard(sizeIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          New Pipeline
        </button>
      </div>
    </div>
  );
};
