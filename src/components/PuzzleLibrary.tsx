import React, { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { AllPuzzleStats, PuzzleDomain, PuzzleId } from '../types/puzzle';
import { PuzzleDiagram } from './PuzzleDiagram';

interface PuzzleLibraryProps {
  activeId: PuzzleId;
  domain: PuzzleDomain;
  onDomainChange: (d: PuzzleDomain) => void;
  onLaunchPuzzle: (id: PuzzleId) => void;
  allStats: AllPuzzleStats;
}

const DOMAINS: PuzzleDomain[] = ['All', 'Spatial', 'Paths', 'Deduction', 'Numbers'];

export const PuzzleLibrary: React.FC<PuzzleLibraryProps> = ({
  activeId,
  domain,
  onDomainChange,
  onLaunchPuzzle,
  allStats,
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = PUZZLES.filter((p) => {
    const matchDomain = domain === 'All' || p.domain === domain;
    const matchQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q);
    return matchDomain && matchQuery;
  });

  return (
    <section
      id="puzzle-library"
      className="py-12 px-4 sm:px-6 max-w-[1220px] mx-auto border-t border-slate-800/80"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            All 16 Problem-Solving Games
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Filter by puzzle style or click any card to jump straight onto the board.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games..."
              aria-label="Search games"
              className="w-full sm:w-52 pl-9 pr-3 py-1.5 rounded-lg bg-[#131722] border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by puzzle category"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#131722] rounded-lg border border-slate-800 self-start sm:self-auto"
          >
            {DOMAINS.map((d) => {
              const active = domain === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDomainChange(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[#131722] border border-slate-800 p-10 text-center">
          <p className="text-sm text-slate-400 mb-3">
            No games matched &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onDomainChange('All');
            }}
            className="px-4 py-2 rounded-lg bg-sky-400 text-slate-950 text-xs font-semibold"
          >
            Show All 16 Games
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((puzzle) => {
            const isLoaded = puzzle.id === activeId;
            const st = allStats[puzzle.id];

            return (
              <article
                key={puzzle.id}
                onClick={() => onLaunchPuzzle(puzzle.id)}
                className={`group rounded-2xl bg-[#131722] border transition-all cursor-pointer overflow-hidden flex flex-col ${
                  isLoaded
                    ? 'border-sky-400 ring-1 ring-sky-400/30'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="h-36 w-full bg-[#0B0D12] border-b border-slate-800/80 p-3 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
                  <PuzzleDiagram id={puzzle.id} accentColor={puzzle.accentColor} />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {puzzle.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{puzzle.domain}</span>
                      <span aria-hidden="true">·</span>
                      <span>{puzzle.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-emerald-400">
                        {st?.solvedCount || 0} solved
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">
                      {puzzle.tagline}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      Best {st?.bestScore || 0} pts
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchPuzzle(puzzle.id);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isLoaded
                          ? 'bg-slate-800 text-sky-300'
                          : 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                      }`}
                    >
                      {isLoaded ? 'Playing' : 'Play'}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
