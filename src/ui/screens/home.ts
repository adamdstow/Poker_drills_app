import { CONFIG } from '../../config';
import { LEVELS } from '../../questions';
import type { App, Rendered } from '../app';
import { medalRow } from '../components';
import { h } from '../dom';

export function renderHome(app: App): Rendered {
  const el = h(
    'main',
    { class: 'screen home' },
    h(
      'header',
      { class: 'home-header' },
      h('div', null, h('h1', null, 'Poker Drills'), h('p', { class: 'muted' }, 'No-Limit Hold’em maths, drilled to automatic.')),
      h('button', { class: 'btn-ghost', onClick: () => app.go({ name: 'data' }) }, 'Backup'),
    ),
    h(
      'div',
      { class: 'level-grid' },
      LEVELS.map((level) => {
        const status = app.store.medals(level.id);
        const stats = app.store.stats(level.id);
        return h(
          'button',
          { class: 'level-card', onClick: () => app.go({ name: 'level', level: level.id }) },
          h('div', { class: 'level-num' }, String(level.id)),
          h(
            'div',
            { class: 'level-body' },
            h('div', { class: 'level-name' }, level.name),
            h('div', { class: 'level-summary muted' }, level.summary),
            h(
              'div',
              { class: 'level-meta' },
              medalRow(status, true),
              h('span', { class: 'muted small' }, stats.attempts ? `Best ${stats.bestScore}/${stats.bestTotal ?? CONFIG.runLength}` : 'Not started'),
            ),
          ),
        );
      }),
    ),
  );
  return { el };
}
