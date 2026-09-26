import { CONFIG, type MedalTier, timeLimitFor } from '../../config';
import { getLevel, levelTitle } from '../../questions';
import { nextTier, passMark, TIER_NAMES, TIERS, unlockedTiers } from '../../progress/medals';
import { recentRuns } from '../../progress/stats';
import type { App, Rendered } from '../app';
import { cheatSheetBody, medalRow, topBar } from '../components';
import { formatDate, formatDuration, h } from '../dom';

function requirement(tier: MedalTier, level: string): string {
  const m = CONFIG.medals[tier];
  const parts = [`${passMark(tier)}/${CONFIG.runLength} correct`, m.timed ? `${timeLimitFor(level)}s per question` : 'untimed'];
  if (m.runsNeeded > 1) parts.push(`${m.runsNeeded} runs`);
  return parts.join(' · ');
}

export function renderLevel(app: App, key: string): Rendered {
  const level = getLevel(key);
  const status = app.store.medals(key);
  const stats = app.store.stats(key);
  const unlocked = unlockedTiers(status);
  const next = nextTier(status);
  const recent = recentRuns(key, app.store.allRuns());

  const tierButtons = TIERS.map((tier) => {
    const open = unlocked.includes(tier);
    const earned = status[tier];
    const prev = TIERS[TIERS.indexOf(tier) - 1];
    return h(
      'button',
      {
        class: `tier-btn tier-${tier}${tier === next ? ' primary' : ''}${earned ? ' earned' : ''}`,
        disabled: !open,
        onClick: () => app.startRun(key, tier),
      },
      h('span', { class: 'tier-name' }, `${earned ? '✓ ' : ''}${TIER_NAMES[tier]} run`),
      h('span', { class: 'tier-req' }, open ? requirement(tier, key) : `Earn ${TIER_NAMES[prev]} first`),
      tier === 'platinum' && status.gold && !status.platinum
        ? h('span', { class: 'tier-req' }, `${status.platinumRuns} of ${CONFIG.medals.platinum.runsNeeded} qualifying runs`)
        : null,
    );
  });

  const el = h(
    'main',
    { class: 'screen level' },
    topBar(level.group === 'arithmetic' ? level.key : `Level ${level.key}`, () => app.go(app.backFromLevel(key))),
    h(
      'div',
      { class: 'level-layout' },
      h(
        'div',
        { class: 'level-main' },
        h(
          'section',
          { class: 'panel' },
          h('h2', null, levelTitle(level)),
          h('p', { class: 'muted' }, level.summary),
          medalRow(status),
          h('div', { class: 'tier-list' }, tierButtons),
        ),
        h(
          'section',
          { class: 'panel' },
          h('h3', { class: 'first' }, 'Stats'),
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
      h('section', { class: 'panel cheat-static' }, h('h3', { class: 'first' }, 'Cheat sheet'), cheatSheetBody(level.cheatSheet)),
    ),
  );
  return { el };
}
