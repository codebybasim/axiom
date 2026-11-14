import React, { useCallback, useState } from 'react';
import { CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

interface MysteryCase {
  title: string;
  brief: string;
  people: string[];
  items: string[];
  locations: string[];
  clues: string[];
  // Correct mapping: person index -> { itemIdx, locIdx }
  solution: { itemIdx: number; locIdx: number }[];
}

// Each scenario uniquely deduced from its clues
const CASES: MysteryCase[] = [
  {
    title: 'Case 01: The Vault Heist',
    brief: 'Three suspects breached different rooms using three distinct tools. Deduce who took which tool and where.',
    people: ['Elena', 'Marcus', 'Victor'],
    items: ['Laser', 'Lockpick', 'Keycard'],
    locations: ['Atrium', 'Archive', 'Vault'],
    clues: [
      '1. Elena never entered the Vault and did not carry the Laser.',
      '2. The person using the Keycard was spotted inside the Atrium.',
      '3. Marcus did not use the Lockpick and was not in the Archive.',
      '4. Victor was not in the Atrium.',
    ],
    // Check unique solution:
    // Clue 2: Keycard <-> Atrium
    // Clue 4: Victor != Atrium -> Victor != Keycard
    // Clue 3: Marcus != Archive, Marcus != Lockpick
    // Wait check Elena: Elena != Vault, Elena != Laser.
    // Suppose Elena = Atrium + Keycard:
    //   Then Marcus != Archive -> Marcus = Vault! And Marcus != Lockpick -> Marcus = Laser!
    //   Then Victor = Archive + Lockpick!
    // Check another? Suppose Marcus = Atrium + Keycard:
    //   Then Victor != Atrium -> Victor in Vault or Archive. Elena != Vault -> Elena = Archive, Victor = Vault.
    //   Then Elena != Laser -> Elena = Lockpick, Victor = Laser!
    // Wait TWO solutions! Let's add 1 decisive clue: "5. The Laser was found in the Vault, and Victor was in the Archive."
    // Let's verify with Clue 5:
    //   Victor = Archive, Vault = Laser -> Marcus = Vault + Laser (since Elena != Vault), Elena = Atrium + Keycard, Victor = Archive + Lockpick!
    // 100% UNIQUE!
    solution: [
      { itemIdx: 2, locIdx: 0 }, // Elena: Keycard, Atrium
      { itemIdx: 0, locIdx: 2 }, // Marcus: Laser, Vault
      { itemIdx: 1, locIdx: 1 }, // Victor: Lockpick, Archive
    ],
  },
  {
    title: 'Case 02: Cloud Outage',
    brief: 'Three engineers diagnosed three failing services caused by three distinct bugs. Match each engineer, service, and root cause.',
    people: ['Nadia', 'Owen', 'Priya'],
    items: ['Auth API', 'Billing', 'Search'],
    locations: ['Timeout', 'Leak', 'Bad Config'],
    clues: [
      '1. Nadia resolved the Timeout, which was not in Search.',
      '2. Owen did not handle Billing and did not trace a Bad Config.',
      '3. The Billing failure was caused by a Bad Config.',
      '4. The Search outage was NOT handled by Priya.',
    ],
    // Verify uniqueness:
    // Clue 3: Billing <-> Bad Config.
    // Clue 1: Nadia = Timeout (so Nadia != Bad Config -> Nadia != Billing, Nadia != Search -> Nadia = Auth API!).
    // Clue 4: Search != Priya, and Nadia = Auth API -> Owen = Search!
    // Clue 2: Owen != Bad Config -> Owen = Leak!
    // Remaining: Priya = Billing + Bad Config!
    // 100% UNIQUE!
    solution: [
      { itemIdx: 0, locIdx: 0 }, // Nadia: Auth API, Timeout
      { itemIdx: 2, locIdx: 1 }, // Owen: Search, Leak
      { itemIdx: 1, locIdx: 2 }, // Priya: Billing, Bad Config
    ],
  },
  {
    title: 'Case 03: Midnight Express',
    brief: 'Three couriers boarded train cars 1–3 carrying coded briefcases. Identify each courier’s car and destination.',
    people: ['Claire', 'Devon', 'Tariq'],
    items: ['Car 1', 'Car 2', 'Car 3'],
    locations: ['Geneva', 'Milan', 'Vienna'],
    clues: [
      '1. The passenger in Car 2 is traveling to Vienna.',
      '2. Claire is traveling to Geneva and is not in Car 3.',
      '3. Devon is not heading to Vienna.',
      '4. Tariq is not in Car 1.',
    ],
    // Verify uniqueness:
    // Clue 2: Claire = Geneva, Claire != Car 3; Clue 1: Car 2 = Vienna -> Claire != Car 2 -> Claire = Car 1!
    // Clue 3: Devon != Vienna -> Devon != Car 2 -> Devon = Car 3 (Milan)!
    // Remaining: Tariq = Car 2 (Vienna)!
    // 100% UNIQUE!
    solution: [
      { itemIdx: 0, locIdx: 0 }, // Claire: Car 1, Geneva
      { itemIdx: 2, locIdx: 1 }, // Devon: Car 3, Milan
      { itemIdx: 1, locIdx: 2 }, // Tariq: Car 2, Vienna
    ],
  },
];

// Update Case 01 clues array cleanly with the decisive 5th clue
CASES[0].clues = [
  '1. Elena never entered the Vault and did not carry the Laser.',
  '2. The person using the Keycard was spotted inside the Atrium.',
  '3. Marcus did not use the Lockpick and was not in the Archive.',
  '4. The Laser was recovered inside the Vault.',
  '5. Victor operated inside the Archive.',
];

type Mark = 0 | 1 | 2; // 0=blank, 1=X, 2=Check

export const MysteryGridPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [caseIdx, setCaseIdx] = useState(0);
  const c = CASES[caseIdx];

  // Two 3x3 subgrids: people x items, people x locations
  const [piGrid, setPiGrid] = useState<Mark[][]>(() =>
    Array.from({ length: 3 }, () => Array(3).fill(0))
  );
  const [plGrid, setPlGrid] = useState<Mark[][]>(() =>
    Array.from({ length: 3 }, () => Array(3).fill(0))
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const loadCase = useCallback(
    (idx: number) => {
      setCaseIdx(idx);
      setPiGrid(Array.from({ length: 3 }, () => Array(3).fill(0)));
      setPlGrid(Array.from({ length: 3 }, () => Array(3).fill(0)));
      setFeedback(null);
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const cycleMark = (which: 'pi' | 'pl', r: number, col: number) => {
    if (won) return;
    setFeedback(null);
    const updater = (prev: Mark[][]) =>
      prev.map((row, ri) => row.map((v, ci) => (ri === r && ci === col ? ((v + 1) % 3) as Mark : v)));
    if (which === 'pi') setPiGrid(updater);
    else setPlGrid(updater);
    arcadeSound.click(muted);
  };

  const verifyDeduction = () => {
    // Each person row in both grids must have exactly one Check (2) matching solution
    for (let p = 0; p < 3; p++) {
      const piChecks = piGrid[p].map((v, i) => (v === 2 ? i : -1)).filter((i) => i !== -1);
      const plChecks = plGrid[p].map((v, i) => (v === 2 ? i : -1)).filter((i) => i !== -1);
      if (piChecks.length !== 1 || plChecks.length !== 1) {
        setFeedback('Place exactly one ✓ per row in both deduction tables before verifying.');
        arcadeSound.chomp(muted);
        return;
      }
      if (piChecks[0] !== c.solution[p].itemIdx || plChecks[0] !== c.solution[p].locIdx) {
        setFeedback('One or more ✓ matches contradict the case clues. Re-check the evidence.');
        arcadeSound.chomp(muted);
        return;
      }
    }

    setWon(true);
    setFeedback(null);
    onSolved(240 + caseIdx * 80);
    arcadeSound.victory(muted);
  };

  const giveHint = () => {
    if (won) return;
    setFeedback(null);
    for (let p = 0; p < 3; p++) {
      const targetItem = c.solution[p].itemIdx;
      if (piGrid[p][targetItem] !== 2) {
        setPiGrid((prev) =>
          prev.map((row, ri) =>
            ri === p ? row.map((_, ci) => (ci === targetItem ? 2 : 1)) : row
          )
        );
        arcadeSound.bonus(muted);
        return;
      }
      const targetLoc = c.solution[p].locIdx;
      if (plGrid[p][targetLoc] !== 2) {
        setPlGrid((prev) =>
          prev.map((row, ri) =>
            ri === p ? row.map((_, ci) => (ci === targetLoc ? 2 : 1)) : row
          )
        );
        arcadeSound.bonus(muted);
        return;
      }
    }
  };

  const renderMark = (m: Mark) => {
    if (m === 1) return <span className="text-rose-400 font-bold">✕</span>;
    if (m === 2) return <span className="text-emerald-400 font-bold">✓</span>;
    return <span className="text-slate-700">·</span>;
  };

  return (
    <div className="w-full max-w-[660px] mx-auto flex flex-col gap-5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {CASES.map((cs, idx) => (
            <button
              key={cs.title}
              type="button"
              onClick={() => loadCase(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                caseIdx === idx
                  ? 'bg-violet-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Case {idx + 1}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">{c.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.15fr] gap-5 items-start">
        {/* Clues Panel */}
        <div className="rounded-2xl bg-[#111624] border border-slate-800 p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold text-violet-300">Case Brief &amp; Evidence</div>
          <p className="text-xs text-slate-300 leading-relaxed">{c.brief}</p>
          <ul className="space-y-2 text-xs text-slate-200 leading-relaxed border-t border-slate-800 pt-3">
            {c.clues.map((clue, i) => (
              <li key={i}>{clue}</li>
            ))}
          </ul>
        </div>

        {/* Elimination Matrices */}
        <div className="rounded-2xl bg-[#0B1019] border border-slate-800 p-4 flex flex-col gap-5">
          {/* Grid 1: People vs Items */}
          <div>
            <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-400 text-center">
              <div className="text-left">Suspect</div>
              {c.items.map((it) => (
                <div key={it} className="truncate">
                  {it}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {c.people.map((person, r) => (
                <div key={person} className="grid grid-cols-4 gap-1.5 items-center">
                  <div className="text-xs font-semibold text-white truncate">{person}</div>
                  {c.items.map((_, col) => {
                    const mark = piGrid[r][col];
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => cycleMark('pi', r, col)}
                        className={`h-9 rounded-lg border text-sm font-mono transition-colors ${
                          mark === 2
                            ? 'bg-emerald-500/20 border-emerald-400'
                            : mark === 1
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-[#141A28] border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {renderMark(mark)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Grid 2: People vs Locations/Causes */}
          <div className="pt-3 border-t border-slate-800">
            <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-400 text-center">
              <div className="text-left">Suspect</div>
              {c.locations.map((loc) => (
                <div key={loc} className="truncate">
                  {loc}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {c.people.map((person, r) => (
                <div key={person} className="grid grid-cols-4 gap-1.5 items-center">
                  <div className="text-xs font-semibold text-white truncate">{person}</div>
                  {c.locations.map((_, col) => {
                    const mark = plGrid[r][col];
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => cycleMark('pl', r, col)}
                        className={`h-9 rounded-lg border text-sm font-mono transition-colors ${
                          mark === 2
                            ? 'bg-emerald-500/20 border-emerald-400'
                            : mark === 1
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-[#141A28] border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {renderMark(mark)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-300 text-center">
          {feedback}
        </div>
      )}

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            Case cracked! Every suspect, item, and location confirmed.
          </div>
          <button
            type="button"
            onClick={() => loadCase((caseIdx + 1) % CASES.length)}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Next Case
          </button>
        </div>
      )}

      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={giveHint}
            disabled={won}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-40 text-xs font-medium text-amber-300 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Reveal 1 Match
          </button>
          <button
            type="button"
            onClick={() => loadCase(caseIdx)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Grid
          </button>
        </div>

        <button
          type="button"
          onClick={verifyDeduction}
          disabled={won}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-400 hover:bg-violet-300 disabled:opacity-40 text-slate-950 text-xs font-semibold transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Verify Deduction
        </button>
      </div>
    </div>
  );
};
