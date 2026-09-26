import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { MedalTier } from '../../src/config';
import {
  IndexedDbAdapter, ImportError, MemoryAdapter, medalStatus, migrate, nextTier, passMark, ProgressStore,
  levelStats, SCHEMA_VERSION, unlockedTiers, type RunRecord,
} from '../../src/progress';

let n = 0;
function run(level: string, tier: MedalTier, score: number, opts: Partial<RunRecord> = {}): RunRecord {
  n++;
  return {
    id: `r${n}`,
    level,
    tier,
    date: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
    score,
    total: 20,
    timed: tier !== 'silver',
    durationMs: 60000,
    missed: [],
    ...opts,
  };
}

describe('medals', () => {
  it('pass marks: 18/20 for Silver and Gold, 19/20 for Platinum', () => {
    expect(passMark('silver')).toBe(18);
    expect(passMark('gold')).toBe(18);
    expect(passMark('platinum')).toBe(19);
  });

  it('Silver needs one run at ≥ 90%', () => {
    expect(medalStatus('0', [run('0', 'silver', 17)]).silver).toBe(false);
    expect(medalStatus('0', [run('0', 'silver', 18)]).silver).toBe(true);
  });

  it('Gold must be timed and comes after Silver', () => {
    expect(medalStatus('0', [run('0', 'gold', 20)]).gold).toBe(false);
    expect(medalStatus('0', [run('0', 'silver', 18), run('0', 'gold', 20, { timed: false })]).gold).toBe(false);
    expect(medalStatus('0', [run('0', 'silver', 18), run('0', 'gold', 18)]).gold).toBe(true);
  });

  it('Platinum needs three separate runs at ≥ 95%, not necessarily consecutive', () => {
    const runs = [
      run('1', 'silver', 19), run('1', 'gold', 19),
      run('1', 'platinum', 19), run('1', 'platinum', 15), run('1', 'platinum', 20),
    ];
    let s = medalStatus('1', runs);
    expect(s.platinumRuns).toBe(2);
    expect(s.platinum).toBe(false);
    s = medalStatus('1', [...runs, run('1', 'platinum', 19)]);
    expect(s.platinumRuns).toBe(3);
    expect(s.platinum).toBe(true);
  });

  it('18/20 is not enough for Platinum', () => {
    const runs = [run('1', 'silver', 19), run('1', 'gold', 19), run('1', 'platinum', 18), run('1', 'platinum', 18), run('1', 'platinum', 18)];
    expect(medalStatus('1', runs).platinumRuns).toBe(0);
  });

  it('medals are per level', () => {
    expect(medalStatus('2', [run('1', 'silver', 20)]).silver).toBe(false);
  });

  it('tiers unlock in order', () => {
    const none = medalStatus('3', []);
    expect(unlockedTiers(none)).toEqual(['silver']);
    expect(nextTier(none)).toBe('silver');
    const silver = medalStatus('3', [run('3', 'silver', 20)]);
    expect(unlockedTiers(silver)).toEqual(['silver', 'gold']);
    expect(nextTier(silver)).toBe('gold');
  });
});

describe('stats', () => {
  it('best score, attempts and most-missed types', () => {
    const miss = (type: string) => ({ type, typeLabel: type, prompt: '', given: '', correct: '' });
    const runs = [
      run('4', 'silver', 15, { missed: [miss('a'), miss('b'), miss('a')] }),
      run('4', 'silver', 18, { missed: [miss('a'), miss('c')] }),
      run('5', 'silver', 20),
    ];
    const s = levelStats('4', runs);
    expect(s.attempts).toBe(2);
    expect(s.bestScore).toBe(18);
    expect(s.mostMissed[0]).toMatchObject({ type: 'a', count: 3 });
    expect(s.mostMissed).toHaveLength(3);
  });
  it('empty level', () => {
    expect(levelStats('9', [])).toMatchObject({ attempts: 0, bestScore: null, mostMissed: [] });
  });
});

describe('schema', () => {
  it('accepts the current schema', () => {
    const data = migrate({ schemaVersion: SCHEMA_VERSION, runs: [run('0', 'silver', 18)] });
    expect(data.runs).toHaveLength(1);
  });
  it.each([
    [null],
    [{}],
    [{ schemaVersion: 1 }],
    [{ schemaVersion: 99, runs: [] }],
    [{ schemaVersion: 1, runs: [{ id: 'x' }] }],
    [{ schemaVersion: 1, runs: [{ ...run('0', 'silver', 25) }] }],
  ])('rejects bad data %#', (bad) => {
    expect(() => migrate(bad)).toThrow(ImportError);
  });
});

describe('ProgressStore', () => {
  it('records runs and round-trips export → import on another device', async () => {
    const a = new ProgressStore(new MemoryAdapter());
    await a.load();
    await a.recordRun(run('0', 'silver', 19));
    await a.recordRun(run('0', 'gold', 18));
    const exported = JSON.parse(JSON.stringify(a.exportData()));

    const b = new ProgressStore(new MemoryAdapter());
    await b.load();
    await b.recordRun(run('2', 'silver', 20));
    const res = await b.importData(exported);
    expect(res).toEqual({ added: 2, total: 2 });
    expect(b.allRuns()).toHaveLength(3);
    expect(b.medals('0').gold).toBe(true);

    // Importing the same file again adds nothing.
    expect((await b.importData(exported)).added).toBe(0);
    expect(b.allRuns()).toHaveLength(3);
  });

  it('reset clears everything', async () => {
    const s = new ProgressStore(new MemoryAdapter());
    await s.recordRun(run('0', 'silver', 19));
    await s.reset();
    await s.load();
    expect(s.allRuns()).toHaveLength(0);
  });
});

describe('schema migration v1 → v2', () => {
  it('turns numeric levels into string keys', () => {
    const v1 = { schemaVersion: 1, runs: [{ ...run('3', 'silver', 18), level: 3 }] };
    expect(migrate(v1).runs[0].level).toBe('3');
  });
  it('rejects numeric levels in a v2 file', () => {
    expect(() => migrate({ schemaVersion: 2, runs: [{ ...run('3', 'silver', 18), level: 3 }] })).toThrow(ImportError);
  });
});

describe('IndexedDbAdapter', () => {
  it('upgrades a v1 database in place', async () => {
    const name = `v1-${Math.random()}`;
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('runs', { keyPath: 'id' });
        store.createIndex('level', 'level');
        req.result.createObjectStore('meta');
        store.put({ ...run('5', 'silver', 18), level: 5 });
      };
      req.onsuccess = () => {
        req.result.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
    const runs = await new IndexedDbAdapter(indexedDB, name).loadRuns();
    expect(runs).toHaveLength(1);
    expect(runs[0].level).toBe('5');
  });

  it('persists runs across instances', async () => {
    const name = `test-${Math.random()}`;
    const first = new IndexedDbAdapter(indexedDB, name);
    await first.saveRun(run('6', 'silver', 18));
    await first.putRuns([run('6', 'gold', 19), run('7', 'silver', 12)]);
    const second = new IndexedDbAdapter(indexedDB, name);
    const runs = await second.loadRuns();
    expect(runs).toHaveLength(3);
    await second.clear();
    expect(await new IndexedDbAdapter(indexedDB, name).loadRuns()).toHaveLength(0);
  });
});
