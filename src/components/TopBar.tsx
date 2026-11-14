import React from 'react';
import { Shuffle } from 'lucide-react';
import { PuzzleDomain } from '../types/puzzle';

interface TopBarProps {
  onSelectDomain: (domain: PuzzleDomain) => void;
  onRandomPuzzle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSelectDomain, onRandomPuzzle }) => {
  const scrollTo = (id: string, domain?: PuzzleDomain) => {
    if (domain) onSelectDomain(domain);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B0D12]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-[1220px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#workbench"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('workbench');
          }}
          className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          Axiom
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('workbench');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Play Studio
          </a>
          <a
            href="#puzzle-library"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('puzzle-library', 'All');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            All 16 Games
          </a>
          <a
            href="#puzzle-library"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('puzzle-library', 'Spatial');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Spatial
          </a>
          <a
            href="#puzzle-library"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('puzzle-library', 'Paths');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Paths
          </a>
          <a
            href="#mastery-board"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('mastery-board');
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Scoreboard
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRandomPuzzle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Random Game
          </button>
        </div>
      </div>
    </header>
  );
};
