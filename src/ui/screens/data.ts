import { ImportError } from '../../progress/schema';
import type { App, Rendered } from '../app';
import { topBar } from '../components';
import { h } from '../dom';

async function shareOrDownload(json: string, filename: string): Promise<string> {
  const file = new File([json], filename, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'Poker Drills backup' });
      return 'Backup shared.';
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return 'Export cancelled.';
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'Backup downloaded.';
}

export function renderData(app: App): Rendered {
  const message = h('p', { class: 'message', role: 'status' });
  const say = (text: string, bad = false) => {
    message.textContent = text;
    message.classList.toggle('bad', bad);
  };

  const fileInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const { added, total } = await app.store.importData(data);
      say(`Imported ${total} runs (${added} new).`);
    } catch (err) {
      say(err instanceof ImportError ? `Import failed: ${err.message}` : 'Import failed: not a valid backup file.', true);
    }
  });

  const runs = app.store.allRuns().length;
  const el = h(
    'main',
    { class: 'screen data' },
    topBar('Backup & restore', () => app.go({ name: 'home' })),
    h(
      'section',
      { class: 'panel' },
      h('p', null, `Progress is saved on this device only (${runs} run${runs === 1 ? '' : 's'}). Export a backup to keep it safe or to copy it to your other device, then import it there. Importing merges runs; nothing is overwritten.`),
      h(
        'div',
        { class: 'data-actions' },
        h(
          'button',
          {
            class: 'btn primary big',
            onClick: async () => {
              const date = new Date().toISOString().slice(0, 10);
              say(await shareOrDownload(JSON.stringify(app.store.exportData(), null, 2), `poker-drills-backup-${date}.json`));
            },
          },
          'Export backup',
        ),
        h('button', { class: 'btn big', onClick: () => fileInput.click() }, 'Import backup'),
        fileInput,
      ),
      message,
    ),
    h(
      'section',
      { class: 'panel danger-zone' },
      h('h3', null, 'Reset'),
      h('p', { class: 'muted' }, 'Delete every run and medal on this device.'),
      h(
        'button',
        {
          class: 'btn danger',
          onClick: async () => {
            if (!confirm('Delete all progress on this device? Export a backup first if you want to keep it.')) return;
            await app.store.reset();
            say('Progress reset.');
          },
        },
        'Reset progress',
      ),
    ),
    h('p', { class: 'muted small center' }, `Poker Drills v${__APP_VERSION__}`),
  );
  return { el };
}
