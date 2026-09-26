import { CONFIG, type MedalTier } from '../config';
import type { RunRecord } from './types';

export const TIERS: MedalTier[] = ['silver', 'gold', 'platinum'];
export const TIER_NAMES: Record<MedalTier, string> = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

export interface MedalStatus {
  silver: boolean;
  gold: boolean;
  platinum: boolean;
  /** Qualifying Platinum runs so far (after Gold was earned). */
  platinumRuns: number;
}

/** Correct answers needed to pass a tier, e.g. 18 of 20 for 90%. */
export function passMark(tier: MedalTier, total: number = CONFIG.runLength): number {
  return Math.ceil(CONFIG.medals[tier].minAccuracy * total - 1e-9);
}

export function runPasses(run: RunRecord): boolean {
  const req = CONFIG.medals[run.tier];
  if (req.timed && !run.timed) return false;
  return run.total > 0 && run.score >= passMark(run.tier, run.total);
}

/**
 * Medals for one level, earned in order: a Gold run only counts once Silver
 * is held, and Platinum runs only once Gold is held.
 */
export function medalStatus(level: number, runs: readonly RunRecord[]): MedalStatus {
  const status: MedalStatus = { silver: false, gold: false, platinum: false, platinumRuns: 0 };
  const ordered = runs.filter((r) => r.level === level).sort((a, b) => a.date.localeCompare(b.date));
  for (const r of ordered) {
    if (!runPasses(r)) continue;
    if (r.tier === 'silver') status.silver = true;
    else if (r.tier === 'gold' && status.silver) status.gold = true;
    else if (r.tier === 'platinum' && status.gold && !status.platinum) {
      status.platinumRuns++;
      if (status.platinumRuns >= CONFIG.medals.platinum.runsNeeded) status.platinum = true;
    }
  }
  return status;
}

/** Tiers the user may attempt: Silver always, then each tier once the one before is earned. */
export function unlockedTiers(status: MedalStatus): MedalTier[] {
  const out: MedalTier[] = ['silver'];
  if (status.silver) out.push('gold');
  if (status.gold) out.push('platinum');
  return out;
}

/** The next tier to work on, or null when Platinum is done. */
export function nextTier(status: MedalStatus): MedalTier | null {
  if (!status.silver) return 'silver';
  if (!status.gold) return 'gold';
  if (!status.platinum) return 'platinum';
  return null;
}

export function highestMedal(status: MedalStatus): MedalTier | null {
  if (status.platinum) return 'platinum';
  if (status.gold) return 'gold';
  if (status.silver) return 'silver';
  return null;
}
