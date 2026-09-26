import { CONFIG, type MedalTier, timeLimitFor } from '../../config';
import { getLevel } from '../../questions';
import { passMark, TIER_NAMES, TIERS, unlockedTiers, nextTier } from '../../progress/medals';
import { recentRuns } from '../../progress/stats';
import type { App, Rendered } from '../app';
import { medalRow, topBar } from '../components';
import { formatDate, formatDuration, h } from '../dom';

function requirement(tier: MedalTier, level: number): string {
  const m = CONFIG.medals[tier];
  const parts = [`${passMark(tier)}/${CONFIG.runLength} correct`, m.timed ? `${timeLimitFor(level)}s per question` : 'untimed'];
  if (m.runsNeeded > 1) parts.push(`${m.runsNeeded} runs`);
  return parts.join(' · ');
}

export function renderLevel(app: App, levelId: number): Rendered {
  const level = getLevel(levelId);
  const status = app.store.medals(levelId);
  const stats = app.store.stats(levelId);
  const unlocked = unlockedTiers(status);
  const next = nextTier(status);
  const recent = recentRuns(levelId, app.store.allRuns());

  const tierButtons = TIERS.map((tier) => {
    const open = unlocked.includes(tier);
    const earned = status[tier];
    const prev = TIERS[TIERS.indexOf(tier) - 1];
    return h(
      'button',
      {
        class: `tier-btn tier-${tier}${tier === next ? ' primary' : ''}${earned ? ' earned' : ''}`,
        disabled: !open,
        onClick: () => app.startRun(levelId, tier),
      },
      h('span', { class: 'tier-name' }, `${earned ? '✓ ' : ''}${TIER_NAMES[tier]} run`),
      h('span', { class: 'tier-req' }, open ? requirement(tier, levelId) : `Earn ${TIER_NAMES[prev]} first`),
      tier === 'platinum' && status.gold && !status.platinum
        ? h('span', { class: 'tier-req' }, `${status.platinumRuns} of ${CONFIG.medals.platinum.runsNeeded} qualifying runs`)
        : null,
    );
  });

  const el = h(
    'main',
    { class: 'screen level' },
    topBar(`Level ${level.id}`, () => app.go({ name: 'home' })),
    h(
      'div',
      { class: 'level-layout' },
      h(
        'section',
        { class: 'panel' },
        h('h2', null, level.name),
        h('p', { class: 'muted' }, level.summary),
        medalRow(status),
        h('div', { class: 'tier-list' }, tierButtons),
      ),
      h(
        'section',
        { class: 'panel' },
        h('h3', null, 'Stats'),
        h(
          'div',
          { class: 'stat-grid' },
          h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, String(stats.attempts)), h('div', { class: 'stat-label' }, 'Runs')),
          h(
            'div',
            { class: 'stat' },
            h('div', { class: 'stat-value' }, stats.bestScore === null ? '—' : `${stats.bestScore}/${stats.bestTotal}`),
            h('div', { class: 'stat-label' }, 'Best score'),
          ),
        ),
        h('h3', null, 'Most missed'),
        stats.mostMissed.length
          ? h('ol', { class: 'missed-types' }, stats.mostMissed.map((m) => h('li', null, `${m.typeLabel} `, h('span', { class: 'muted' }, `× ${m.count}`))))
          : h('p', { class: 'muted' }, 'Nothing missed yet.'),
        h('h3', null, 'Recent runs'),
        recent.length
          ? h(
              'ul',
              { class: 'recent' },
              recent.map((r) =>
                h(
                  'li',
                  null,
                  h('span', { class: `dot dot-${r.tier}` }),
                  h('span', null, `${TIER_NAMES[r.tier]} · ${r.score}/${r.total}`),
                  h('span', { class: 'muted' }, `${formatDuration(r.durationMs)} · ${formatDate(r.date)}`),
                ),
              ),
            )
          : h('p', { class: 'muted' }, 'No runs yet.'),
      ),
    ),
  );
  return { el };
}
