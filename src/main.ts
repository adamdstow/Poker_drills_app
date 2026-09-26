import { registerSW } from 'virtual:pwa-register';
import { MemoryAdapter, type StorageAdapter } from './progress/adapter';
import { IndexedDbAdapter } from './progress/localAdapter';
import { ProgressStore } from './progress/store';
import { App } from './ui/app';
import './ui/styles.css';

function createAdapter(): StorageAdapter {
  // Swap in a remote (VPS) adapter here when sync is added.
  return typeof indexedDB !== 'undefined' ? new IndexedDbAdapter() : new MemoryAdapter();
}

async function start() {
  const root = document.getElementById('app')!;
  let store = new ProgressStore(createAdapter());
  try {
    await store.load();
  } catch (err) {
    console.error('Falling back to memory storage', err);
    store = new ProgressStore(new MemoryAdapter());
    await store.load();
  }
  // Ask the browser not to evict saved progress.
  void navigator.storage?.persist?.();
  new App(root, store).go({ name: 'home' });
}

registerSW({ immediate: true });
void start();
