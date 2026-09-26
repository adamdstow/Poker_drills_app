import { CONFIG, type MedalTier } from '../config';
import { type Card, rankChar, SUIT_NAME, SUIT_SYMBOL } from '../engine/cards';
import type { Coaching } from '../questions/grade';
import type { CardDisplay, CheatSheet } from '../questions/types';
import { type MedalStatus, TIER_NAMES, TIERS } from '../progress/medals';
import { h } from './dom';

export function cardEl(c: Card, highlight = false): HTMLElement {
  return h(
    'div',
    { class: `pcard suit-${c.suit}${highlight ? ' highlight' : ''}`, role: 'img', 'aria-label': `${rankChar(c.rank)} of ${SUIT_NAME[c.suit]}` },
    h('span', { class: 'rank' }, rankChar(c.rank) === 'T' ? '10' : rankChar(c.rank)),
    h('span', { class: 'suit' }, SUIT_SYMBOL[c.suit]),
  );
}

export function tableEl(cards: CardDisplay): HTMLElement {
  return h(
    'div',
    { class: 'table' },
    h('div', { class: 'hand-group' }, h('div', { class: 'label' }, 'Your hand'), h('div', { class: 'cards' }, cards.hero.map((c) => cardEl(c)))),
    h(
      'div',
      { class: 'hand-group' },
      h('div', { class: 'label' }, cards.board.length === 3 ? 'Flop' : cards.board.length === 4 ? 'Turn' : 'River'),
      h('div', { class: 'cards' }, cards.board.map((c, i) => cardEl(c, i === cards.highlightBoardIndex))),
    ),
  );
}

export function medalBadge(tier: MedalTier, earned: boolean, small = false, progress?: string): HTMLElement {
  return h(
    'div',
    { class: `medal medal-${tier}${earned ? ' earned' : ''}${small ? ' small' : ''}`, title: `${TIER_NAMES[tier]}${earned ? ' — earned' : ''}` },
    h('span', { class: 'medal-disc' }, TIER_NAMES[tier][0]),
    small ? null : h('span', { class: 'medal-name' }, TIER_NAMES[tier]),
    progress && !small ? h('span', { class: 'medal-progress' }, progress) : null,
  );
}

export function medalRow(status: MedalStatus, small = false): HTMLElement {
  return h(
    'div',
    { class: `medal-row${small ? ' small' : ''}` },
    TIERS.map((t) =>
      medalBadge(
        t,
        status[t],
        small,
        t === 'platinum' && status.gold && !status.platinum ? `${status.platinumRuns}/${CONFIG.medals.platinum.runsNeeded}` : undefined,
      ),
    ),
  );
}

export function topBar(title: string, onBack?: () => void, right?: Node): HTMLElement {
  return h(
    'header',
    { class: 'topbar' },
    onBack ? h('button', { class: 'btn-ghost back', onClick: onBack, 'aria-label': 'Back' }, '‹ Back') : h('span'),
    h('h1', { class: 'topbar-title' }, title),
    right ?? h('span'),
  );
}

const CHEAT_KEY = 'poker-drills.cheatsheet';

function cheatPref(): 'open' | 'closed' | null {
  try {
    const v = localStorage.getItem(CHEAT_KEY);
    return v === 'open' || v === 'closed' ? v : null;
  } catch {
    return null;
  }
}

/** The cheat sheet body: tricks, worked examples and a reference table. */
export function cheatSheetBody(sheet: CheatSheet): HTMLElement {
  return h(
    'div',
    { class: 'cheat-body' },
    h('div', { class: 'cheat-col' }, h('h4', null, 'How to'), h('ul', { class: 'cheat-howto' }, sheet.howTo.map((t) => h('li', null, t)))),
    h(
      'div',
      { class: 'cheat-col' },
      h('h4', null, 'Worked examples'),
      sheet.examples.map((ex) => h('div', { class: 'cheat-example' }, h('div', { class: 'cheat-q' }, ex.q), h('div', { class: 'cheat-steps' }, ex.steps.join('  →  ')))),
    ),
    sheet.table
      ? h(
          'div',
          { class: 'cheat-col' },
          h('h4', null, sheet.table.title),
          h(
            'table',
            { class: 'cheat-table' },
            h('thead', null, h('tr', null, sheet.table.head.map((c) => h('th', null, c)))),
            h('tbody', null, sheet.table.rows.map((r) => h('tr', null, r.map((c) => h('td', null, c))))),
          ),
        )
      : null,
  );
}

/** Collapsible cheat sheet for the run screen; open by default on iPad-sized screens. */
export function cheatSheetPanel(sheet: CheatSheet): HTMLElement {
  const pref = cheatPref();
  const open = pref ? pref === 'open' : window.matchMedia('(min-width: 820px)').matches;
  const el = h('details', { class: 'cheatsheet panel', open }, h('summary', null, 'Cheat sheet'), cheatSheetBody(sheet));
  el.addEventListener('toggle', () => {
    try {
      localStorage.setItem(CHEAT_KEY, el.open ? 'open' : 'closed');
    } catch {
      /* storage unavailable: keep the default next time */
    }
  });
  return el;
}

/** "What went wrong / think about" box shown after a wrong answer. */
export function coachEl(c: Coaching): HTMLElement {
  return h(
    'div',
    { class: 'coach' },
    h('div', { class: 'coach-title' }, 'What went wrong'),
    h('p', null, c.whatWentWrong),
    h('div', { class: 'coach-title' }, 'Think about'),
    h('p', null, c.thinkAbout),
  );
}
