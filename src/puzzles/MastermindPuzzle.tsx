import React, { useCallback, useState } from 'react';
import { Check, Delete, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

const SYMBOLS = [
  { id: 0, label: 'Cyan', bg: 'bg-sky-400 text-slate-950', code: 'A' },
  { id: 1, label: 'Emerald', bg: 'bg-emerald-400 text-slate-950', code: 'B' },
  { id: 2, label: 'Amber', bg: 'bg-amber-400 text-slate-950', code: 'C' },
  { id: 3, label: 'Rose', bg: 'bg-rose-400 text-slate-950', code: 'D' },
  { id: 4, label: 'Violet', bg: 'bg-violet-400 text-slate-950', code: 'E' },
  { id: 5, label: 'Slate', bg: 'bg-slate-200 text-slate-950', code: 'F' },
];

const CODE_LEN = 4;
const MAX_ATTEMPTS = 10;

interface GuessRow {
  guess: number[];
  exact: number;
  misplaced: number;
}

function createSecret(allowDupes: boolean): number[] {
  if (allowDupes) {
    return Array.from({ length: CODE_LEN }, () => Math.floor(Math.random() * SYMBOLS.length));
  }
  const pool = [0, 1, 2, 3, 4, 5];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, CODE_LEN);
}

function evaluateGuess(secret: number[], guess: number[]): { exact: number; misplaced: number } {
  let exact = 0;
  const secRem: number[] = [];
  const gueRem: number[] = [];

  for (let i = 0; i < CODE_LEN; i++) {
    if (guess[i] === secret[i]) {
      exact++;
    } else {
      secRem.push(secret[i]);
      gueRem.push(guess[i]);
    }
  }

  let misplaced = 0;
  for (const g of gueRem) {
    const idx = secRem.indexOf(g);
    if (idx !== -1) {
      misplaced++;
      secRem.splice(idx, 1);
    }
  }

  return { exact, misplaced };
}

export const MastermindPuzzle: React.FC<PuzzleComponentProps> = ({
  stats,
  onSolved,
  muted,
}) => {
  const [allowDupes, setAllowDupes] = useState(false);
  const [secret, setSecret] = useState<number[]>(() => createSecret(false));
  const [history, setHistory] = useState<GuessRow[]>([]);
  const [draft, setDraft] = useState<number[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const reset = useCallback(
    (dupes = allowDupes) => {
      setAllowDupes(dupes);
      setSecret(createSecret(dupes));
      setHistory([]);
      setDraft([]);
      setStatus('playing');
      arcadeSound.click(muted);
    },
    [allowDupes, muted]
  );

  const pushSymbol = (symId: number) => {
    if (status !== 'playing' || draft.length >= CODE_LEN) return;
    setDraft((prev) => [...prev, symId]);
    arcadeSound.click(muted);
  };

  const popSymbol = () => {
    if (status !== 'playing' || draft.length === 0) return;
    setDraft((prev) => prev.slice(0, -1));
    arcadeSound.click(muted);
  };

  const submitGuess = () => {
    if (status !== 'playing' || draft.length !== CODE_LEN) return;
    const { exact, misplaced } = evaluateGuess(secret, draft);
    const nextHistory = [...history, { guess: draft, exact, misplaced }];
    setHistory(nextHistory);
    setDraft([]);

    if (exact === CODE_LEN) {
      setStatus('won');
      const score = Math.max(200, 1100 - (nextHistory.length - 1) * 90);
      onSolved(score);
      arcadeSound.victory(muted);
    } else if (nextHistory.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      arcadeSound.gameOver(muted);
    } else {
      arcadeSound.bounce(muted, exact > 0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-[440px] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => reset(false)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              !allowDupes ? 'bg-rose-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Unique Pins
          </button>
          <button
            type="button"
            onClick={() => reset(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              allowDupes ? 'bg-rose-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Duplicates
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-slate-300">
            Attempt {Math.min(MAX_ATTEMPTS, history.length + 1)}/{MAX_ATTEMPTS}
          </span>
          <span className="font-mono tabular-nums text-emerald-400">
            Solved: {stats.solvedCount}
          </span>
          <button
            type="button"
            onClick={() => reset(allowDupes)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
            aria-label="New secret code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History + Active Probe */}
      <div className="w-full max-w-[440px] p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
        {history.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">
            Select 4 symbols below and submit your opening probe.
          </p>
        )}

        {history.map((row, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800"
          >
            <span className="font-mono tabular-nums text-xs text-slate-500 w-5">
              {idx + 1}.
            </span>
            <div className="flex items-center gap-2">
              {row.guess.map((symId, i) => {
                const sym = SYMBOLS[symId];
                return (
                  <span
                    key={i}
                    className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${sym.bg}`}
                  >
                    {sym.code}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="text-emerald-400">{row.exact} exact</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300">{row.misplaced} moved</span>
            </div>
          </div>
        ))}

        {/* Current Draft Row */}
        {status === 'playing' && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-600">
            <span className="font-mono tabular-nums text-xs text-slate-300 w-5">
              {history.length + 1}.
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: CODE_LEN }, (_, i) => {
                const symId = draft[i];
                const sym = symId !== undefined ? SYMBOLS[symId] : null;
                return (
                  <span
                    key={i}
                    className={`w-8 h-8 rounded-full font-mono text-xs font-bold flex items-center justify-center border ${
                      sym
                        ? `${sym.bg} border-transparent`
                        : 'bg-slate-900 border-slate-600 text-slate-600'
                    }`}
                  >
                    {sym ? sym.code : '?'}
                  </span>
                );
              })}
            </div>
            <button
              type="button"
              onClick={submitGuess}
              disabled={draft.length !== CODE_LEN}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-35 text-slate-950 text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Test
            </button>
          </div>
        )}
      </div>

      {/* Symbol Palette */}
      {status === 'playing' ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SYMBOLS.map((sym) => (
            <button
              key={sym.id}
              type="button"
              onClick={() => pushSymbol(sym.id)}
              className={`w-10 h-10 rounded-full font-mono text-sm font-bold flex items-center justify-center transition-transform hover:scale-105 ${sym.bg}`}
              aria-label={`Symbol ${sym.code} (${sym.label})`}
            >
              {sym.code}
            </button>
          ))}
          <button
            type="button"
            onClick={popSymbol}
            disabled={draft.length === 0}
            className="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 flex items-center gap-1 text-xs font-medium"
          >
            <Delete className="w-4 h-4" />
            Back
          </button>
        </div>
      ) : (
        <div
          className={`w-full max-w-[440px] p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            status === 'won'
              ? 'bg-emerald-500/15 border-emerald-500/40'
              : 'bg-rose-500/15 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className={status === 'won' ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>
              {status === 'won'
                ? `Code cracked in ${history.length} guesses!`
                : 'Out of attempts. Secret was:'}
            </span>
            <div className="flex items-center gap-1">
              {secret.map((id, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full font-mono text-[11px] font-bold flex items-center justify-center ${SYMBOLS[id].bg}`}
                >
                  {SYMBOLS[id].code}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => reset(allowDupes)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold"
          >
            New Code
          </button>
        </div>
      )}
    </div>
  );
};
