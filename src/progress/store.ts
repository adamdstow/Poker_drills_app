import type { StorageAdapter } from './adapter';
import { medalStatus, type MedalStatus } from './medals';
import { migrate, toExport } from './schema';
import { levelStats, type LevelStats } from './stats';
import type { ProgressData, RunRecord } from './types';

/** The app's single entry point for progress. Only this talks to the adapter. */
export class ProgressStore {
  private runs: RunRecord[] = [];

  constructor(private readonly adapter: StorageAdapter) {}

  async load(): Promise<void> {
    this.runs = await this.adapter.loadRuns();
  }

  allRuns(): readonly RunRecord[] {
    return this.runs;
  }

  async recordRun(run: RunRecord): Promise<void> {
    await this.adapter.saveRun(run);
    this.runs = [...this.runs.filter((r) => r.id !== run.id), run];
  }

  medals(level: number): MedalStatus {
    return medalStatus(level, this.runs);
  }

  stats(level: number): LevelStats {
    return levelStats(level, this.runs);
  }

  exportData(now = new Date()): ProgressData {
    return toExport(this.runs, now);
  }

  /** Merge runs from an export (by id), returning how many were new. */
  async importData(raw: unknown): Promise<{ added: number; total: number }> {
    const data = migrate(raw);
    const known = new Set(this.runs.map((r) => r.id));
    const added = data.runs.filter((r) => !known.has(r.id)).length;
    await this.adapter.putRuns(data.runs);
    await this.load();
    return { added, total: data.runs.length };
  }

  async reset(): Promise<void> {
    await this.adapter.clear();
    this.runs = [];
  }
}

export function newRunId(now = Date.now()): string {
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${now.toString(36)}-${rand}`;
}
