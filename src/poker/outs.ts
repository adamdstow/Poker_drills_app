import { Card, Rng, deal, pick, remainingDeck } from './cards';

export type Street = 'flop' | 'turn';

export interface OutsCount {
  flush: Card[];
  straight: Card[];
  /** Cards that pair a Ten-or-better hole card that's above every board card. */
  overcards: Card[];
  /** Every distinct out. A card that completes two draws is counted once. */
  all: Card[];
  /** How many cards appear in more than one group. */
  overlap: number;
}

export interface OutsSpot {
  hole: Card[];
  board: Card[];
  street: Street;
  outs: OutsCount;
}

function hasStraight(ranks: Iterable<number>): boolean {
  const set = new Set(ranks);
  if (set.has(14)) set.add(1);
  for (let high = 14; high >= 5; high--) {
    let run = 0;
    while (run < 5 && set.has(high - run)) run++;
    if (run === 5) return true;
  }
  return false;
}

/**
 * Counts outs the way players count them at the table: cards that complete a
 * flush or straight using a hole card, plus overcard outs. Assumes the hand is
 * currently unpaired and unmade (see `isDrawSpot`).
 */
export function countOuts(hole: Card[], board: Card[]): OutsCount {
  const known = [...hole, ...board];
  const boardHigh = Math.max(...board.map((c) => c.rank));
  const flush: Card[] = [];
  const straight: Card[] = [];
  const overcards: Card[] = [];

  for (const card of remainingDeck(known)) {
    const all = [...known, card];
    const suited = all.filter((c) => c.suit === card.suit).length;
    if (suited >= 5 && hole.some((h) => h.suit === card.suit)) flush.push(card);
    // A straight that's entirely on the board is shared, not an out.
    if (hasStraight(all.map((c) => c.rank)) && !hasStraight([...board, card].map((c) => c.rank))) {
      straight.push(card);
    }
    if (hole.some((h) => h.rank === card.rank && h.rank > boardHigh && h.rank >= 10)) overcards.push(card);
  }

  const all = [...new Set([...flush, ...straight, ...overcards])];
  return { flush, straight, overcards, all, overlap: flush.length + straight.length + overcards.length - all.length };
}

/** Unpaired, unmade hand with a board that has no pair and at most three of a suit. */
export function isDrawSpot(hole: Card[], board: Card[]): boolean {
  const known = [...hole, ...board];
  if (new Set(known.map((c) => c.rank)).size !== known.length) return false;
  for (const suit of ['s', 'h', 'd', 'c']) {
    if (board.filter((c) => c.suit === suit).length > 3) return false;
    if (known.filter((c) => c.suit === suit).length >= 5) return false;
  }
  return !hasStraight(known.map((c) => c.rank));
}

type DrawKind = 'flush' | 'openEnded' | 'gutshot' | 'overcards' | 'combo';
const KINDS: DrawKind[] = ['flush', 'openEnded', 'gutshot', 'overcards', 'combo', 'combo'];

function kindOf(outs: OutsCount): DrawKind | null {
  const groups = [outs.flush, outs.straight, outs.overcards].filter((g) => g.length > 0).length;
  if (groups === 0) return null;
  if (groups > 1) return 'combo';
  if (outs.flush.length) return 'flush';
  if (outs.straight.length) return outs.straight.length >= 8 ? 'openEnded' : 'gutshot';
  return 'overcards';
}

/** Deals a random drawing hand, aiming for a mix of draw types. */
export function makeOutsSpot(rng: Rng = Math.random, street?: Street): OutsSpot {
  const target = pick(KINDS, rng);
  const s: Street = street ?? pick(['flop', 'turn'] as const, rng);
  for (let attempt = 0; ; attempt++) {
    const cards = deal(s === 'flop' ? 5 : 6, rng);
    const hole = cards.slice(0, 2).sort((a, b) => b.rank - a.rank);
    const board = cards.slice(2);
    if (!isDrawSpot(hole, board)) continue;
    const outs = countOuts(hole, board);
    const kind = kindOf(outs);
    if (!kind || (kind !== target && attempt < 3000)) continue;
    return { hole, board, street: s, outs };
  }
}

/** e.g. "flush draw (9) + gutshot (4)". */
export function describeDraw(outs: OutsCount): string {
  const parts: string[] = [];
  if (outs.flush.length) parts.push(`flush draw (${outs.flush.length})`);
  const st = outs.straight.length;
  if (st) parts.push(`${st >= 8 ? 'open-ended straight draw' : st === 4 ? 'gutshot' : 'straight draw'} (${st})`);
  const ov = outs.overcards.length;
  if (ov) parts.push(`${ov === 6 ? 'two overcards' : 'one overcard'} (${ov})`);
  return parts.join(' + ');
}
