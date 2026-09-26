import type { MedalTier } from '../config';
import { SCHEMA_VERSION, type ProgressData, type RunRecord } from './types';

const TIERS: MedalTier[] = ['silver', 'gold', 'platinum'];

export class ImportError extends Error {}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function validRun(x: unknown): RunRecord {
  if (!isRecord(x)) throw new ImportError('A run is not an object.');
  const { id, level, tier, date, score, total, timed, durationMs, missed } = x;
  if (typeof id !== 'string' || !id) throw new ImportError('A run has no id.');
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 10) throw new ImportError(`Run ${id}: bad level.`);
  if (typeof tier !== 'string' || !TIERS.includes(tier as MedalTier)) throw new ImportError(`Run ${id}: bad tier.`);
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) throw new ImportError(`Run ${id}: bad date.`);
  if (typeof score !== 'number' || typeof total !== 'number' || score < 0 || score > total) throw new ImportError(`Run ${id}: bad score.`);
  if (!Array.isArray(missed)) throw new ImportError(`Run ${id}: bad missed list.`);
  return {
    id,
    level,
    tier: tier as MedalTier,
    date,
    score,
    total,
    timed: timed === true,
    durationMs: typeof durationMs === 'number' ? durationMs : 0,
    missed: missed.filter(isRecord).map((m) => ({
      type: String(m.type ?? ''),
      typeLabel: String(m.typeLabel ?? m.type ?? ''),
      prompt: String(m.prompt ?? ''),
      given: String(m.given ?? ''),
      correct: String(m.correct ?? ''),
    })),
  };
}

/**
 * Validate and upgrade any saved/exported data to the current schema.
 * Add a step here for each future schema version.
 */
export function migrate(data: unknown): ProgressData {
  if (!isRecord(data)) throw new ImportError('Not a progress file.');
  const version = data.schemaVersion;
  if (typeof version !== 'number') throw new ImportError('Missing schemaVersion.');
  if (version > SCHEMA_VERSION) throw new ImportError(`This file is from a newer version of the app (schema ${version}).`);
  if (!Array.isArray(data.runs)) throw new ImportError('Missing runs.');
  // version 1 is current: nothing to upgrade yet.
  return { schemaVersion: SCHEMA_VERSION, runs: data.runs.map(validRun) };
}

export function toExport(runs: RunRecord[], now = new Date()): ProgressData {
  return { schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), runs };
}
