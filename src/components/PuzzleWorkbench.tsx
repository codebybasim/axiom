import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { AllPuzzleStats, PuzzleId } from '../types/puzzle';
import { PuzzleDiagram } from './PuzzleDiagram';
import { AdUnit } from './AdUnit';
import { TrafficEscapePuzzle } from '../puzzles/TrafficEscapePuzzle';
import { LaserMirrorsPuzzle } from '../puzzles/LaserMirrorsPuzzle';
import { FlowConnectPuzzle } from '../puzzles/FlowConnectPuzzle';
import { FlaskSortPuzzle } from '../puzzles/FlaskSortPuzzle';
import { PipeConduitPuzzle } from '../puzzles/PipeConduitPuzzle';
import { UntanglePuzzle } from '../puzzles/UntanglePuzzle';
import { SokobanPuzzle } from '../puzzles/SokobanPuzzle';
import { IceDriftPuzzle } from '../puzzles/IceDriftPuzzle';
import { BlockFitPuzzle } from '../puzzles/BlockFitPuzzle';
import { OneStrokePuzzle } from '../puzzles/OneStrokePuzzle';
import { LogicGatesPuzzle } from '../puzzles/LogicGatesPuzzle';
import { MatchstickPuzzle } from '../puzzles/MatchstickPuzzle';
import { MysteryGridPuzzle } from '../puzzles/MysteryGridPuzzle';
import { MastermindPuzzle } from '../puzzles/MastermindPuzzle';
import { MinesweeperPuzzle } from '../puzzles/MinesweeperPuzzle';
import { SudokuPuzzle } from '../puzzles/SudokuPuzzle';

interface PuzzleWorkbenchProps {
  activeId: PuzzleId;
  onSelectPuzzle: (id: PuzzleId) => void;
  allStats: AllPuzzleStats;
  onSolved: (id: PuzzleId, score: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  nonPersonalizedAds: boolean;
}

export const PuzzleWorkbench: React.FC<PuzzleWorkbenchProps> = ({
  activeId,
  onSelectPuzzle,
  allStats,
  onSolved,
  muted,
  onToggleMute,
  nonPersonalizedAds,
}) => {
  const activeMeta = PUZZLES.find((p) => p.id === activeId) ?? PUZZLES[0];

  const uniqueSolved = PUZZLES.filter((p) => (allStats[p.id]?.solvedCount ?? 0) > 0).length;
  const totalSolves = Object.values(allStats).reduce((s, st) => s + st.solvedCount, 0);

  const renderPuzzle = () => {
    const common = {
      stats: allStats[activeId],
      onSolved: (score: number) => onSolved(activeId, score),
      muted,
    };

    switch (activeId) {
      case 'traffic':
        return <TrafficEscapePuzzle key="traffic" {...common} />;
      case 'lasermirrors':
        return <LaserMirrorsPuzzle key="lasermirrors" {...common} />;
      case 'flowconnect':
        return <FlowConnectPuzzle key="flowconnect" {...common} />;
      case 'flasksort':
        return <FlaskSortPuzzle key="flasksort" {...common} />;
      case 'pipeconduit':
        return <PipeConduitPuzzle key="pipeconduit" {...common} />;
      case 'untangle':
        return <UntanglePuzzle key="untangle" {...common} />;
      case 'sokoban':
        return <SokobanPuzzle key="sokoban" {...common} />;
      case 'icedrift':
        return <IceDriftPuzzle key="icedrift" {...common} />;
      case 'blockfit':
        return <BlockFitPuzzle key="blockfit" {...common} />;
      case 'onestroke':
        return <OneStrokePuzzle key="onestroke" {...common} />;
      case 'logicgates':
        return <LogicGatesPuzzle key="logicgates" {...common} />;
      case 'matchstick':
        return <MatchstickPuzzle key="matchstick" {...common} />;
      case 'mysterygrid':
        return <MysteryGridPuzzle key="mysterygrid" {...common} />;
      case 'safecracker':
        return <MastermindPuzzle key="safecracker" {...common} />;
      case 'minesweeper':
        return <MinesweeperPuzzle key="minesweeper" {...common} />;
      case 'sudoku':
        return <SudokuPuzzle key="sudoku" {...common} />;
      default:
        return <TrafficEscapePuzzle key="traffic" {...common} />;
    }
  };

  return (
    <section id="workbench" className="pt-8 pb-8 px-4 sm:px-6 max-w-[1220px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Sixteen visual problem-solving games in one modern studio.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1.5 max-w-2xl">
            Every challenge loads straight onto the board—untangle networks, bounce lasers, clear traffic jams, sort flasks, wire circuits, and crack detective cases.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-400 shrink-0">
          <span>
            Cleared{' '}
            <strong className="font-mono tabular-nums text-white">{uniqueSolved}/16</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total Solves{' '}
            <strong className="font-mono tabular-nums text-emerald-400">{totalSolves}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-stretch">
        <div className="rounded-2xl bg-[#131722] border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-xl font-bold text-white">
                  {activeMeta.title}
                </h2>
                <span className="text-xs text-slate-400">
                  {activeMeta.domain}
                  <span aria-hidden="true" className="mx-1.5">
                    ·
                  </span>
                  {activeMeta.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeMeta.ruleSummary}</p>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              aria-label={muted ? 'Unmute audio feedback' : 'Mute audio feedback'}
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              )}
              {muted ? 'Muted' : 'Sound'}
            </button>
          </div>

          <div className="p-4 sm:p-8 flex-1 flex flex-col items-center justify-center bg-[#0E1119]">
            {renderPuzzle()}
          </div>

          <div className="px-5 py-3 border-t border-slate-800 bg-[#131722] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>{activeMeta.controls}</span>
            <span className="font-mono tabular-nums text-slate-300 shrink-0">
              Best Score: {allStats[activeId]?.bestScore || 0}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <aside
            aria-label="Game selector"
            className="rounded-2xl bg-[#131722] border border-slate-800 flex flex-col overflow-hidden flex-1"
          >
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-white">
                Game Switcher
              </span>
              <span className="font-mono tabular-nums text-xs text-slate-400">16 games</span>
            </div>

            <div className="p-2 flex-1 overflow-y-auto max-h-[380px] space-y-1">
              {PUZZLES.map((puzzle) => {
                const isActive = puzzle.id === activeId;
                const solvedCount = allStats[puzzle.id]?.solvedCount ?? 0;

                return (
                  <button
                    key={puzzle.id}
                    type="button"
                    onClick={() => onSelectPuzzle(puzzle.id)}
                    className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${
                      isActive
                        ? 'bg-sky-400 text-slate-950'
                        : 'hover:bg-slate-800/70 text-slate-100'
                    }`}
                  >
                    <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0B0D12] border border-slate-700/70 p-0.5">
                      <PuzzleDiagram id={puzzle.id} accentColor={puzzle.accentColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold truncate">
                        {puzzle.title}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isActive ? 'text-slate-900 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {puzzle.domain} · {puzzle.difficulty}
                        {solvedCount > 0 ? ` · ${solvedCount} solved` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <AdUnit variant="sidebar" nonPersonalizedAds={nonPersonalizedAds} />
        </div>
      </div>
    </section>
  );
};
