import React from 'react';
import { RotateCcw } from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { AllPuzzleStats, PuzzleId } from '../types/puzzle';

interface MasteryTableProps {
  allStats: AllPuzzleStats;
  onLaunchPuzzle: (id: PuzzleId) => void;
  onResetStats: () => void;
}

export const MasteryTable: React.FC<MasteryTableProps> = ({
  allStats,
  onLaunchPuzzle,
  onResetStats,
}) => {
  const hasProgress = Object.values(allStats).some((s) => s.solvedCount > 0 || s.bestScore > 0);

  return (
    <section
      id="mastery-board"
      className="py-12 px-4 sm:px-6 max-w-[1220px] mx-auto border-t border-slate-800/80"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Scoreboard &amp; Progress
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personal completion records stored locally across all sixteen problem-solving games.
          </p>
        </div>

        {hasProgress && (
          <button
            type="button"
            onClick={onResetStats}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#131722] hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Progress
          </button>
        )}
      </div>

      <div className="rounded-xl bg-[#131722] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0F131C] text-xs font-semibold text-slate-400">
                <th className="py-3 px-4 sm:px-5">Puzzle</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Complexity</th>
                <th className="py-3 px-4 text-right">Solved</th>
                <th className="py-3 px-4 text-right">Best Score</th>
                <th className="py-3 px-4 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {PUZZLES.map((p) => {
                const st = allStats[p.id];
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 sm:px-5 font-medium text-white">
                      {p.title}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{p.domain}</td>
                    <td className="py-3 px-4 text-slate-400">{p.difficulty}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {st?.solvedCount || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-white">
                      {st?.bestScore ? `${st.bestScore} pts` : '—'}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onLaunchPuzzle(p.id)}
                        className="text-xs font-semibold text-sky-400 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
