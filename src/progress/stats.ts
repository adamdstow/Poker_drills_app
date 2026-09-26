import type { RunRecord } from './types';

export interface MissedType {
  type: string;
  typeLabel: string;
  count: number;
}

export interface LevelStats {
  attempts: number;
  bestScore: number | null;
  bestTotal: number | null;
  lastPlayed: string | null;
  mostMissed: MissedType[];
}

export function levelStats(level: number, runs: readonly RunRecord[], topMissed = 3): LevelStats {
  const mine = runs.filter((r) => r.level === level);
  let best: RunRecord | null = null;
  for (const r of mine) {
    if (!best || r.score / r.total > best.score / best.total) best = r;
  }
  const counts = new Map<string, MissedType>();
  for (const r of mine) {
    for (const m of r.missed) {
      const e = counts.get(m.type) ?? { type: m.type, typeLabel: m.typeLabel, count: 0 };
      e.count++;
      counts.set(m.type, e);
    }
  }
  const mostMissed = [...counts.values()].sort((a, b) => b.count - a.count || a.typeLabel.localeCompare(b.typeLabel)).slice(0, topMissed);
  const lastPlayed = mine.reduce<string | null>((acc, r) => (acc === null || r.date > acc ? r.date : acc), null);
  return {
    attempts: mine.length,
    bestScore: best?.score ?? null,
    bestTotal: best?.total ?? null,
    lastPlayed,
    mostMissed,
  };
}

export function recentRuns(level: number, runs: readonly RunRecord[], n = 5): RunRecord[] {
  return runs
    .filter((r) => r.level === level)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}
