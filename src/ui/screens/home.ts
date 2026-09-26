import { CONFIG } from '../../config';
import { ARITHMETIC_LEVELS, POKER_LEVELS, type LevelDef } from '../../questions';
import { TIERS } from '../../progress/medals';
import type { App, Rendered } from '../app';
import { medalRow, topBar } from '../components';
import { h } from '../dom';

function levelCard(app: App, level: LevelDef): HTMLElement {
  const status = app.store.medals(level.key);
  const stats = app.store.stats(level.key);
  return h(
    'button',
    { class: 'level-card', onClick: () => app.go({ name: 'level', level: level.key }) },
    h('div', { class: 'level-num' }, level.badge),
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
}

export function renderHome(app: App): Rendered {
  const earned = ARITHMETIC_LEVELS.reduce((n, l) => {
    const s = app.store.medals(l.key);
    return n + TIERS.filter((t) => s[t]).length;
  }, 0);
  const el = h(
    'main',
    { class: 'screen home' },
    h(
      'header',
      { class: 'home-header' },
      h('div', null, h('h1', null, 'Poker Drills'), h('p', { class: 'muted' }, 'No-Limit Hold’em maths, drilled to automatic.')),
      h('button', { class: 'btn-ghost', onClick: () => app.go({ name: 'data' }) }, 'Backup'),
    ),
    h('h3', { class: 'section-title' }, 'Foundations'),
    h(
      'button',
      { class: 'level-card package-card', onClick: () => app.go({ name: 'arithmetic' }) },
      h('div', { class: 'level-num' }, '0'),
      h(
        'div',
        { class: 'level-body' },
        h('div', { class: 'level-name' }, 'Arithmetic'),
        h('div', { class: 'level-summary muted' }, 'Six levels from pot addition to multi-step pot-odds sums. Start here.'),
        h(
          'div',
          { class: 'level-meta' },
          h('div', { class: 'package-pips' }, ARITHMETIC_LEVELS.map((l) => h('span', { class: `pip pip-${highest(app, l.key)}` }, l.key))),
          h('span', { class: 'muted small' }, `${earned}/${ARITHMETIC_LEVELS.length * 3} medals`),
        ),
      ),
      h('span', { class: 'chevron' }, '›'),
    ),
    h('h3', { class: 'section-title' }, 'Poker maths'),
    h('div', { class: 'level-grid' }, POKER_LEVELS.map((l) => levelCard(app, l))),
  );
  return { el };
}

function highest(app: App, key: string): string {
  const s = app.store.medals(key);
  return s.platinum ? 'platinum' : s.gold ? 'gold' : s.silver ? 'silver' : 'none';
}

export function renderArithmetic(app: App): Rendered {
  const el = h(
    'main',
    { class: 'screen arithmetic' },
    topBar('Arithmetic', () => app.go({ name: 'home' })),
    h('p', { class: 'muted' }, 'Work up from A1. Each run starts easy and gets harder towards question 20. Every level has a cheat sheet.'),
    h('div', { class: 'level-grid' }, ARITHMETIC_LEVELS.map((l) => levelCard(app, l))),
  );
  return { el };
}
