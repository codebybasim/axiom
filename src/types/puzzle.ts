export type PuzzleId =
  | 'traffic'
  | 'lasermirrors'
  | 'flowconnect'
  | 'flasksort'
  | 'pipeconduit'
  | 'untangle'
  | 'sokoban'
  | 'icedrift'
  | 'blockfit'
  | 'onestroke'
  | 'logicgates'
  | 'matchstick'
  | 'mysterygrid'
  | 'safecracker'
  | 'minesweeper'
  | 'sudoku';

export type PuzzleDomain =
  | 'All'
  | 'Spatial'
  | 'Paths'
  | 'Deduction'
  | 'Numbers';

export interface PuzzleMeta {
  id: PuzzleId;
  title: string;
  domain: Exclude<PuzzleDomain, 'All'>;
  difficulty: 'Medium' | 'Challenging' | 'Deep';
  tagline: string;
  ruleSummary: string;
  controls: string;
  accentColor: string;
}

export interface PuzzleStats {
  solvedCount: number;
  bestScore: number;
}

export type AllPuzzleStats = Record<PuzzleId, PuzzleStats>;

export interface PuzzleComponentProps {
  stats: PuzzleStats;
  onSolved: (score: number) => void;
  muted: boolean;
}
