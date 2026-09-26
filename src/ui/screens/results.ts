import { CONFIG } from '../../config';
import { highestMedal, nextTier, passMark, runPasses, TIER_NAMES, TIERS, type MedalStatus } from '../../progress/medals';
import type { RunRecord } from '../../progress/types';
import { diagnose, getLevel, levelTitle } from '../../questions';
import type { App, Rendered } from '../app';
import { coachEl, medalBadge, medalRow, tableEl } from '../components';
import { formatDuration, h } from '../dom';
import type { RunSession } from '../session';

export function renderResults(app: App, session: RunSession, record: RunRecord, before: MedalStatus): Rendered {
  const after = app.store.medals(record.level);
  const passed = runPasses(record);
  const newMedal = TIERS.find((t) => after[t] && !before[t]);
  const platinumProgress = record.tier === 'platinum' && passed && !after.platinum;
  const upNext = nextTier(after);

  let verdict: string;
  if (newMedal) verdict = `${TIER_NAMES[newMedal]} medal earned!`;
  else if (platinumProgress) verdict = `Qualifying Platinum run: ${after.platinumRuns} of ${CONFIG.medals.platinum.runsNeeded}.`;
  else if (passed) verdict = 'Passed.';
  else verdict = `${TIER_NAMES[record.tier]} needs ${passMark(record.tier)}/${record.total}. Go again!`;

  const el = h(
    'main',
    { class: 'screen results' },
    h(
      'section',
      { class: `panel result-hero ${passed ? 'pass' : 'fail'}` },
      newMedal ? medalBadge(newMedal, true) : null,
      h('div', { class: 'big-score' }, `${record.score}`, h('span', { class: 'of' }, `/${record.total}`)),
      h('p', { class: 'verdict' }, verdict),
      h('p', { class: 'muted' }, `${levelTitle(getLevel(record.level))} · ${TIER_NAMES[record.tier]} · ${formatDuration(record.durationMs)}`),
      medalRow(after),
      h(
        'div',
        { class: 'result-actions' },
        h('button', { class: 'btn primary big', onClick: () => app.startRun(record.level, upNext && newMedal ? upNext : record.tier) }, upNext && newMedal ? `Start ${TIER_NAMES[upNext]} run` : 'Go again'),
        h('button', { class: 'btn big', onClick: () => app.go({ name: 'level', level: record.level }) }, 'Level overview'),
        h('button', { class: 'btn-ghost', onClick: () => app.go({ name: 'home' }) }, 'All levels'),
      ),
      highestMedal(after) === 'platinum' && newMedal === 'platinum' ? h('p', { class: 'muted' }, 'Level mastered.') : null,
    ),
    record.missed.length
      ? h(
          'section',
          { class: 'panel' },
          h('h3', null, `Missed (${record.missed.length})`),
          h(
            'ol',
            { class: 'missed-list' },
            session.results
              .filter((r) => !r.correct)
              .map((r, i) =>
                h(
                  'li',
                  null,
                  h('div', { class: 'q-type' }, r.question.typeLabel),
                  r.question.cards ? h('div', { class: 'compact' }, tableEl(r.question.cards)) : null,
                  h('div', null, r.question.prompt),
                  h('div', { class: 'muted' }, `You: ${record.missed[i].given} · Answer: `, h('strong', null, r.question.answerText)),
                  h('details', null, h('summary', null, 'Hint and explanation'), coachEl(diagnose(r.question, r.response)), h('ol', { class: 'explanation' }, r.question.explanation.map((s) => h('li', null, s)))),
                ),
              ),
          ),
        )
      : null,
  );
  return { el };
}
