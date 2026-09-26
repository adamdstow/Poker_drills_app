import { CONFIG, type MedalTier } from '../config';
import { type Card, rankChar, SUIT_NAME, SUIT_SYMBOL } from '../engine/cards';
import type { CardDisplay } from '../questions/types';
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
