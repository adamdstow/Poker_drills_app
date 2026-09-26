import { type Card, SUITS, type Suit } from './cards';

/** Hand categories, weakest first. The index is the category number. */
export const HAND_CATEGORIES = [
  'High card',
  'Pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
] as const;

export const CATEGORY = {
  highCard: 0,
  pair: 1,
  twoPair: 2,
  trips: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  quads: 7,
  straightFlush: 8,
} as const;

const BASE = 15;
const SLOTS = 5;

function pack(category: number, kickers: number[]): number {
  let score = category;
  for (let i = 0; i < SLOTS; i++) score = score * BASE + (kickers[i] ?? 0);
  return score;
}

export function categoryOf(score: number): number {
  return Math.floor(score / BASE ** SLOTS);
}

export function categoryName(score: number): string {
  return HAND_CATEGORIES[categoryOf(score)];
}

/** Bitmask of ranks present; an ace also sets bit 1 so A-2-3-4-5 is found. */
export function rankMask(ranks: readonly number[]): number {
  let mask = 0;
  for (const r of ranks) mask |= 1 << r;
  if (mask & (1 << 14)) mask |= 1 << 1;
  return mask;
}

/** High card of the best straight in the mask (5 for the wheel), or 0. */
export function straightHigh(mask: number): number {
  for (let hi = 14; hi >= 5; hi--) {
    const need = 0b11111 << (hi - 4);
    if ((mask & need) === need) return hi;
  }
  return 0;
}

export function hasStraight(cards: readonly Card[]): boolean {
  return straightHigh(rankMask(cards.map((c) => c.rank))) > 0;
}

export function flushSuit(cards: readonly Card[]): Suit | null {
  for (const s of SUITS) if (cards.filter((c) => c.suit === s).length >= 5) return s;
  return null;
}

export function hasFlush(cards: readonly Card[]): boolean {
  return flushSuit(cards) !== null;
}

/**
 * Score the best five-card hand from 5 to 7 cards. Higher is better; equal
 * scores tie.
 */
export function evaluate(cards: readonly Card[]): number {
  if (cards.length < 5 || cards.length > 7) throw new Error(`evaluate needs 5-7 cards, got ${cards.length}`);

  const counts = new Array<number>(15).fill(0);
  for (const c of cards) counts[c.rank]++;

  const fs = flushSuit(cards);
  const flushRanks = fs
    ? cards.filter((c) => c.suit === fs).map((c) => c.rank).sort((a, b) => b - a)
    : null;
  if (flushRanks) {
    const sf = straightHigh(rankMask(flushRanks));
    if (sf) return pack(CATEGORY.straightFlush, [sf]);
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  const present: number[] = [];
  for (let r = 14; r >= 2; r--) {
    if (counts[r] === 0) continue;
    present.push(r);
    if (counts[r] === 4) quads.push(r);
    else if (counts[r] === 3) trips.push(r);
    else if (counts[r] === 2) pairs.push(r);
  }
  const others = (...exclude: number[]) => present.filter((r) => !exclude.includes(r));

  if (quads.length) return pack(CATEGORY.quads, [quads[0], others(quads[0])[0]]);
  if (trips.length && (trips.length >= 2 || pairs.length)) {
    return pack(CATEGORY.fullHouse, [trips[0], Math.max(trips[1] ?? 0, pairs[0] ?? 0)]);
  }
  if (flushRanks) return pack(CATEGORY.flush, flushRanks.slice(0, 5));
  const st = straightHigh(rankMask(present));
  if (st) return pack(CATEGORY.straight, [st]);
  if (trips.length) return pack(CATEGORY.trips, [trips[0], ...others(trips[0]).slice(0, 2)]);
  if (pairs.length >= 2) {
    return pack(CATEGORY.twoPair, [pairs[0], pairs[1], others(pairs[0], pairs[1])[0]]);
  }
  if (pairs.length === 1) return pack(CATEGORY.pair, [pairs[0], ...others(pairs[0]).slice(0, 3)]);
  return pack(CATEGORY.highCard, present.slice(0, 5));
}
