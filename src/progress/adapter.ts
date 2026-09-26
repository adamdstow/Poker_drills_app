import type { RunRecord } from './types';

/**
 * All saving and loading goes through this interface. The local IndexedDB
 * adapter implements it now; a remote (VPS) adapter can implement it later
 * without touching any other code.
 */
export interface StorageAdapter {
  loadRuns(): Promise<RunRecord[]>;
  saveRun(run: RunRecord): Promise<void>;
  /** Add or overwrite runs by id. */
  putRuns(runs: RunRecord[]): Promise<void>;
  clear(): Promise<void>;
}

/** In-memory adapter for tests and as a fallback when IndexedDB is unavailable. */
export class MemoryAdapter implements StorageAdapter {
  private runs = new Map<string, RunRecord>();

  async loadRuns(): Promise<RunRecord[]> {
    return [...this.runs.values()].map((r) => structuredClone(r));
  }

  async saveRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, structuredClone(run));
  }

  async putRuns(runs: RunRecord[]): Promise<void> {
    for (const r of runs) this.runs.set(r.id, structuredClone(r));
  }

  async clear(): Promise<void> {
    this.runs.clear();
  }
}
