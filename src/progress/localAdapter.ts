import type { StorageAdapter } from './adapter';
import { SCHEMA_VERSION, type RunRecord } from './types';

const DB_NAME = 'poker-drills';
const RUNS = 'runs';
const META = 'meta';

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Local, per-device storage in IndexedDB. The DB version tracks the schema version. */
export class IndexedDbAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly factory: IDBFactory = indexedDB, private readonly name = DB_NAME) {}

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = this.factory.open(this.name, SCHEMA_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          // Future schema versions add migration steps here, keyed on event.oldVersion.
          if (!db.objectStoreNames.contains(RUNS)) {
            const store = db.createObjectStore(RUNS, { keyPath: 'id' });
            store.createIndex('level', 'level');
          }
          if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  async loadRuns(): Promise<RunRecord[]> {
    const db = await this.db();
    return promisify(db.transaction(RUNS).objectStore(RUNS).getAll() as IDBRequest<RunRecord[]>);
  }

  async saveRun(run: RunRecord): Promise<void> {
    await this.putRuns([run]);
  }

  async putRuns(runs: RunRecord[]): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(RUNS, 'readwrite');
    const store = tx.objectStore(RUNS);
    for (const r of runs) store.put(r);
    await txDone(tx);
  }

  async clear(): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(RUNS, 'readwrite');
    tx.objectStore(RUNS).clear();
    await txDone(tx);
  }
}
