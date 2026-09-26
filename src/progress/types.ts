import type { MedalTier } from '../config';

/**
 * v1: level was a number 0–10.
 * v2: level is a string key ("A1"–"A6" for arithmetic, "1"–"10" for poker levels).
 */
export const SCHEMA_VERSION = 2;

export interface MissedQuestion {
  type: string;
  typeLabel: string;
  prompt: string;
  given: string;
  correct: string;
}

export interface RunRecord {
  id: string;
  /** Level key, e.g. "A3" or "5". */
  level: string;
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
