import type { MedalTier } from '../config';

export const SCHEMA_VERSION = 1;

export interface MissedQuestion {
  type: string;
  typeLabel: string;
  prompt: string;
  given: string;
  correct: string;
}

export interface RunRecord {
  id: string;
  level: number;
  tier: MedalTier;
  /** ISO timestamp when the run finished. */
  date: string;
  score: number;
  total: number;
  timed: boolean;
  durationMs: number;
  missed: MissedQuestion[];
}

/** The versioned shape of all saved progress, used for export/import and future sync. */
export interface ProgressData {
  schemaVersion: number;
  exportedAt?: string;
  runs: RunRecord[];
}
