import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { PuzzleWorkbench } from './components/PuzzleWorkbench';
import { PuzzleLibrary } from './components/PuzzleLibrary';
import { PuzzleGuide } from './components/PuzzleGuide';
import { MasteryTable } from './components/MasteryTable';
import { AdUnit } from './components/AdUnit';
import { PolicyModal, PolicyPage } from './components/PolicyModal';
import { PUZZLES } from './data/puzzles';
import { AllPuzzleStats, PuzzleDomain, PuzzleId } from './types/puzzle';
import { arcadeSound } from './utils/sound';

const STATS_KEY = 'axiom_puzzle_stats_v2';
const MUTE_KEY = 'axiom_muted_v1';
const NPA_KEY = 'axiom_npa_v1';

const DEFAULT_STATS: AllPuzzleStats = {
  traffic: { solvedCount: 0, bestScore: 0 },
  lasermirrors: { solvedCount: 0, bestScore: 0 },
  flowconnect: { solvedCount: 0, bestScore: 0 },
  flasksort: { solvedCount: 0, bestScore: 0 },
  pipeconduit: { solvedCount: 0, bestScore: 0 },
  untangle: { solvedCount: 0, bestScore: 0 },
  sokoban: { solvedCount: 0, bestScore: 0 },
  icedrift: { solvedCount: 0, bestScore: 0 },
  blockfit: { solvedCount: 0, bestScore: 0 },
  onestroke: { solvedCount: 0, bestScore: 0 },
  logicgates: { solvedCount: 0, bestScore: 0 },
  matchstick: { solvedCount: 0, bestScore: 0 },
  mysterygrid: { solvedCount: 0, bestScore: 0 },
  safecracker: { solvedCount: 0, bestScore: 0 },
  minesweeper: { solvedCount: 0, bestScore: 0 },
  sudoku: { solvedCount: 0, bestScore: 0 },
};

function loadStats(): AllPuzzleStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as Partial<AllPuzzleStats>;
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function loadBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [activeId, setActiveId] = useState<PuzzleId>('traffic');
  const [domain, setDomain] = useState<PuzzleDomain>('All');
  const [allStats, setAllStats] = useState<AllPuzzleStats>(loadStats);
  const [muted, setMuted] = useState<boolean>(() => loadBool(MUTE_KEY));
  const [nonPersonalizedAds, setNonPersonalizedAds] = useState<boolean>(() => loadBool(NPA_KEY));
  const [policyPage, setPolicyPage] = useState<PolicyPage>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(allStats));
    } catch {
      // Ignore storage errors
    }
  }, [allStats]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
    } catch {
      // Ignore storage errors
    }
  }, [muted]);

  useEffect(() => {
    try {
      localStorage.setItem(NPA_KEY, String(nonPersonalizedAds));
    } catch {
      // Ignore storage errors
    }
  }, [nonPersonalizedAds]);

  const handleSolved = useCallback((id: PuzzleId, score: number) => {
    setAllStats((prev) => {
      const cur = prev[id] ?? { solvedCount: 0, bestScore: 0 };
      return {
        ...prev,
        [id]: {
          solvedCount: cur.solvedCount + 1,
          bestScore: Math.max(cur.bestScore, score),
        },
      };
    });
  }, []);

  const handleSelectPuzzle = useCallback(
    (id: PuzzleId) => {
      setActiveId(id);
      arcadeSound.click(muted);
    },
    [muted]
  );

  const handleLaunchPuzzle = useCallback(
    (id: PuzzleId) => {
      handleSelectPuzzle(id);
      const el = document.getElementById('workbench');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [handleSelectPuzzle]
  );

  const handleRandomPuzzle = useCallback(() => {
    const pool = PUZZLES.filter((p) => p.id !== activeId);
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? PUZZLES[0];
    handleLaunchPuzzle(chosen.id);
  }, [activeId, handleLaunchPuzzle]);

  const handleResetStats = useCallback(() => {
    setAllStats({ ...DEFAULT_STATS });
    arcadeSound.click(muted);
  }, [muted]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-slate-100">
      <TopBar onSelectDomain={setDomain} onRandomPuzzle={handleRandomPuzzle} />

      <main className="flex-1">
        <PuzzleWorkbench
          activeId={activeId}
          onSelectPuzzle={handleSelectPuzzle}
          allStats={allStats}
          onSolved={handleSolved}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          nonPersonalizedAds={nonPersonalizedAds}
        />

        {/* Leaderboard Display Ad separated safely from active gameplay controls */}
        <div className="py-5 px-4 sm:px-6 max-w-[1220px] mx-auto">
          <AdUnit variant="leaderboard" nonPersonalizedAds={nonPersonalizedAds} />
        </div>

        <PuzzleLibrary
          activeId={activeId}
          domain={domain}
          onDomainChange={setDomain}
          onLaunchPuzzle={handleLaunchPuzzle}
          allStats={allStats}
        />

        <PuzzleGuide />

        {/* Responsive Display Ad between Editorial Guide and Scoreboard */}
        <div className="py-4 px-4 sm:px-6 max-w-[1220px] mx-auto">
          <AdUnit variant="banner" nonPersonalizedAds={nonPersonalizedAds} />
        </div>

        <MasteryTable
          allStats={allStats}
          onLaunchPuzzle={handleLaunchPuzzle}
          onResetStats={handleResetStats}
        />
      </main>

      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 mt-8">
        <div className="max-w-[1220px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Axiom — Sixteen interactive problem-solving games in one modern studio.</span>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setPolicyPage('about')}
              className="hover:text-slate-200 transition-colors"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setPolicyPage('privacy')}
              className="hover:text-slate-200 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setPolicyPage('terms')}
              className="hover:text-slate-200 transition-colors"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setPolicyPage('contact')}
              className="hover:text-slate-200 transition-colors"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setPolicyPage('ads')}
              className="hover:text-slate-200 transition-colors"
            >
              Ad Preferences
            </button>
          </div>
        </div>
      </footer>

      <PolicyModal
        page={policyPage}
        onClose={() => setPolicyPage(null)}
        nonPersonalizedAds={nonPersonalizedAds}
        onToggleNonPersonalized={setNonPersonalizedAds}
      />
    </div>
  );
}
