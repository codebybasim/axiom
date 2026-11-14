import React, { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { PuzzleComponentProps } from '../types/puzzle';
import { arcadeSound } from '../utils/sound';

type GateType = 'AND' | 'OR' | 'XOR' | 'NAND';

function evalGate(type: GateType, a: boolean, b: boolean): boolean {
  switch (type) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
  }
}

interface GateNode {
  id: string;
  defaultType: GateType;
  locked: boolean;
  in1: string; // 'A'|'B'|'C' or gate id
  in2: string;
}

interface CircuitLevel {
  name: string;
  description: string;
  inputs: string[];
  gates: GateNode[];
  targets: { gateId: string; label: string; want: boolean }[];
}

const LEVELS: CircuitLevel[] = [
  {
    name: 'Dual Signal Lock',
    description: 'Set switches A, B, and C so Output 1 turns ON (1) and Output 2 stays OFF (0).',
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'G1', defaultType: 'XOR', locked: true, in1: 'A', in2: 'B' },
      { id: 'G2', defaultType: 'AND', locked: true, in1: 'G1', in2: 'C' },
      { id: 'G3', defaultType: 'AND', locked: true, in1: 'A', in2: 'B' },
    ],
    targets: [
      { gateId: 'G2', label: 'Out 1', want: true },
      { gateId: 'G3', label: 'Out 2', want: false },
    ],
  },
  {
    name: 'Parity Bridge',
    description: 'Set all 3 switches so BOTH security relays evaluate to 1.',
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'G1', defaultType: 'NAND', locked: true, in1: 'A', in2: 'B' },
      { id: 'G2', defaultType: 'XOR', locked: true, in1: 'B', in2: 'C' },
      { id: 'G3', defaultType: 'AND', locked: true, in1: 'G1', in2: 'G2' },
    ],
    targets: [
      { gateId: 'G3', label: 'Relay 1', want: true },
      { gateId: 'G2', label: 'Relay 2', want: true },
    ],
  },
  {
    name: 'Gate Swap Repair',
    description: 'Click the unlocked chip(s) to change gate logic and toggle switches to power both outputs.',
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'G1', defaultType: 'AND', locked: false, in1: 'A', in2: 'B' },
      { id: 'G2', defaultType: 'OR', locked: true, in1: 'B', in2: 'C' },
      { id: 'G3', defaultType: 'AND', locked: false, in1: 'G1', in2: 'G2' },
    ],
    targets: [
      { gateId: 'G1', label: 'Bus X', want: false },
      { gateId: 'G3', label: 'Bus Y', want: true },
    ],
  },
  {
    name: 'Vault Interlock',
    description: 'Balance 4 input breakers through two tiers of gates to satisfy all 3 lock targets.',
    inputs: ['A', 'B', 'C', 'D'],
    gates: [
      { id: 'G1', defaultType: 'XOR', locked: true, in1: 'A', in2: 'B' },
      { id: 'G2', defaultType: 'NAND', locked: true, in1: 'C', in2: 'D' },
      { id: 'G3', defaultType: 'AND', locked: false, in1: 'G1', in2: 'G2' },
    ],
    targets: [
      { gateId: 'G1', label: 'Lock 1', want: true },
      { gateId: 'G2', label: 'Lock 2', want: false },
      { gateId: 'G3', label: 'Master', want: true },
    ],
  },
];

const GATE_CYCLE: GateType[] = ['AND', 'OR', 'XOR', 'NAND'];

export const LogicGatesPuzzle: React.FC<PuzzleComponentProps> = ({ onSolved, muted }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const initInputs = (lv: CircuitLevel) => {
    const m: Record<string, boolean> = {};
    lv.inputs.forEach((id) => {
      m[id] = false;
    });
    return m;
  };

  const initGates = (lv: CircuitLevel) => {
    const m: Record<string, GateType> = {};
    lv.gates.forEach((g) => {
      m[g.id] = g.defaultType;
    });
    return m;
  };

  const [inputs, setInputs] = useState<Record<string, boolean>>(() => initInputs(LEVELS[0]));
  const [gateTypes, setGateTypes] = useState<Record<string, GateType>>(() => initGates(LEVELS[0]));
  const [won, setWon] = useState(false);

  const loadLevel = useCallback(
    (idx: number) => {
      const lv = LEVELS[idx];
      setLevelIdx(idx);
      setInputs(initInputs(lv));
      setGateTypes(initGates(lv));
      setWon(false);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const computeSignals = (
    inp: Record<string, boolean>,
    gTypes: Record<string, GateType>
  ): Record<string, boolean> => {
    const sig: Record<string, boolean> = { ...inp };
    for (const g of level.gates) {
      sig[g.id] = evalGate(gTypes[g.id], Boolean(sig[g.in1]), Boolean(sig[g.in2]));
    }
    return sig;
  };

  const signals = computeSignals(inputs, gateTypes);

  const checkWin = (inp: Record<string, boolean>, gTypes: Record<string, GateType>) => {
    const sig = computeSignals(inp, gTypes);
    return level.targets.every((t) => sig[t.gateId] === t.want);
  };

  const toggleInput = (id: string) => {
    if (won) return;
    const nextInputs = { ...inputs, [id]: !inputs[id] };
    setInputs(nextInputs);
    if (checkWin(nextInputs, gateTypes)) {
      setWon(true);
      onSolved(190 + levelIdx * 80);
      arcadeSound.victory(muted);
    } else {
      arcadeSound.click(muted);
    }
  };

  const cycleGate = (gateId: string) => {
    if (won) return;
    const gate = level.gates.find((g) => g.id === gateId);
    if (!gate || gate.locked) return;
    const cur = gateTypes[gateId];
    const nextType = GATE_CYCLE[(GATE_CYCLE.indexOf(cur) + 1) % GATE_CYCLE.length];
    const nextGates = { ...gateTypes, [gateId]: nextType };
    setGateTypes(nextGates);
    if (checkWin(inputs, nextGates)) {
      setWon(true);
      onSolved(190 + levelIdx * 80);
      arcadeSound.victory(muted);
    } else {
      arcadeSound.click(muted);
    }
  };

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
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              L{idx + 1}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">{level.name}</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-300 text-center max-w-lg">
        {level.description}
      </p>

      {/* 3-Column Interactive Logic Flow */}
      <div className="w-full rounded-2xl bg-[#0B1019] border border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
        {/* Column 1: Input Switches */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-400 text-center">Input Switches</div>
          {level.inputs.map((id) => {
            const on = inputs[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInput(id)}
                className={`px-4 py-2.5 rounded-xl border-2 flex items-center justify-between font-mono text-sm font-bold transition-all ${
                  on
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-[#131926] border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>Switch {id}</span>
                <span>{on ? '1' : '0'}</span>
              </button>
            );
          })}
        </div>

        {/* Column 2: Logic Gates */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-400 text-center">Logic Gates</div>
          {level.gates.map((g) => {
            const out = signals[g.id];
            const type = gateTypes[g.id];
            return (
              <button
                key={g.id}
                type="button"
                disabled={g.locked || won}
                onClick={() => cycleGate(g.id)}
                className={`px-3.5 py-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                  g.locked
                    ? 'bg-[#121723] border-slate-800 cursor-default'
                    : 'bg-[#161F33] border-sky-400/60 hover:border-sky-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    {g.in1} · {g.in2}
                  </span>
                  <span className={out ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    → {out ? '1' : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">{type}</span>
                  <span className="text-[11px] text-slate-500">
                    {g.locked ? 'Fixed' : 'Tap to swap'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Column 3: Target Output Bulbs */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-400 text-center">Target Outputs</div>
          {level.targets.map((t) => {
            const actual = signals[t.gateId];
            const matched = actual === t.want;
            return (
              <div
                key={t.gateId}
                className={`px-4 py-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                  matched
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-[#131926] border-rose-500/40 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{t.label}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Need {t.want ? 'ON (1)' : 'OFF (0)'}
                  </div>
                </div>
                <span className="font-mono text-sm font-bold">
                  {actual ? '1' : '0'} {matched ? '✓' : '✕'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {won && (
        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-300 font-medium">
            All target relays matched in {level.name}.
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

      <div className="w-full flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>AND=both 1 · OR=any 1 · XOR=different · NAND=not both 1</span>
        <button
          type="button"
          onClick={() => loadLevel(levelIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
};
