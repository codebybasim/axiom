import React from 'react';

const DISCIPLINES = [
  {
    title: 'Spatial Planning',
    games: 'Traffic Escape · Shape Fit · Crate Mover · Untangle Web',
    summary:
      'Train mental rotation, lookahead sequencing, and collision avoidance by rearranging constrained objects without boxing yourself into dead ends.',
  },
  {
    title: 'Path & Optical Routing',
    games: 'Laser Mirrors · Flow Connect · Pipe Plumber · Ice Labyrinth · One-Stroke Path',
    summary:
      'Practice graph traversal, continuous line planning, and reflection geometry where every turn reshapes downstream paths.',
  },
  {
    title: 'Evidence & Circuit Deduction',
    games: 'Detective Grid · Circuit Lab · Safe Cracker · Mine Sweep',
    summary:
      'Combine elimination matrices, Boolean gate propagation, and probabilistic hazard reasoning to rule out impossibilities systematically.',
  },
  {
    title: 'Numerical & State Optimization',
    games: 'Color Flask Sort · Matchstick Fix · Sudoku 9x9',
    summary:
      'Balance finite move budgets, invariant preservation, and constraint satisfaction across clean numeric and symbolic boards.',
  },
];

export const PuzzleGuide: React.FC = () => {
  return (
    <section
      aria-labelledby="reasoning-guide-heading"
      className="py-12 px-4 sm:px-6 max-w-[1220px] mx-auto border-t border-slate-800/80"
    >
      <div className="max-w-2xl mb-8">
        <h2
          id="reasoning-guide-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-white"
        >
          Four Reasoning Disciplines
        </h2>
        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
          Each game targets a distinct problem-solving skill—ranging from visual spatial planning and circuit wiring to multi-clue deduction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DISCIPLINES.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-[#131722] border border-slate-800 p-6 flex flex-col gap-2"
          >
            <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
            <p className="text-xs text-sky-400 font-medium">{item.games}</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-1">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
