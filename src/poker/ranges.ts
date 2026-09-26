import { Card, RANKS, Rank, Rng, deal, parseRank, pick, rankChar } from './cards';

/** Starting hand class such as "AKs", "T9o" or "77". */
export type HandClass = string;

export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB';
export const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];

export const POSITION_NAMES: Record<Position, string> = {
  UTG: 'Under the Gun',
  HJ: 'Hijack',
  CO: 'Cutoff',
  BTN: 'Button',
  SB: 'Small Blind',
};

/**
 * Simplified 6-max, 100bb raise-first-in charts: everyone before you folded,
 * so the choice is raise or fold. Real solver strategies mix some hands.
 */
export const RFI_RANGES: Record<Position, string> = {
  UTG: '55+, A2s+, K9s+, QTs+, JTs, T9s, 98s, 87s, 76s, AJo+, KQo',
  HJ: '33+, A2s+, K8s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, 65s, ATo+, KJo+, QJo',
  CO: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo',
  BTN: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o',
  SB: '22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A4o+, K9o+, Q9o+, J9o+, T9o',
};

export function handClassOf(a: Card, b: Card): HandClass {
  const [hi, lo] = a.rank >= b.rank ? [a, b] : [b, a];
  if (hi.rank === lo.rank) return rankChar(hi.rank) + rankChar(lo.rank);
  return rankChar(hi.rank) + rankChar(lo.rank) + (hi.suit === lo.suit ? 's' : 'o');
}

/** Number of specific two-card combos in a hand class: 6 pairs, 4 suited, 12 offsuit. */
export function comboCount(hand: HandClass): number {
  if (hand.length === 2) return 6;
  return hand.endsWith('s') ? 4 : 12;
}

function nonPair(hi: Rank, lo: Rank, suffix: string): HandClass {
  return rankChar(hi) + rankChar(lo) + suffix;
}

/**
 * Parses range notation: "77", "22+", "99-66", "AKs", "A2s+", "K9s-K6s", "KTo+".
 * For non-pairs "+" raises the kicker up to one below the top card.
 */
export function parseRange(text: string): Set<HandClass> {
  const hands = new Set<HandClass>();
  for (const raw of text.split(',').map((t) => t.trim()).filter(Boolean)) {
    const plus = raw.endsWith('+');
    const [from, to] = raw.replace('+', '').split('-');
    const r1 = parseRank(from[0]);
    const r2 = parseRank(from[1]);
    if (r1 === r2) {
      const low = to ? parseRank(to[0]) : r1;
      const high = plus ? 14 : r1;
      for (const r of RANKS) if (r >= Math.min(low, r1) && r <= Math.max(high, r1)) hands.add(rankChar(r).repeat(2));
      continue;
    }
    const suffix = from[2];
    if (suffix !== 's' && suffix !== 'o') throw new Error(`Missing s/o in ${raw}`);
    const kickerLow = to ? parseRank(to[1]) : r2;
    const kickerHigh = plus ? r1 - 1 : r2;
    for (const k of RANKS) {
      if (k >= Math.min(kickerLow, r2) && k <= Math.max(kickerHigh, r2)) hands.add(nonPair(r1, k, suffix));
    }
  }
  return hands;
}

const PARSED_RANGES = Object.fromEntries(
  POSITIONS.map((p) => [p, parseRange(RFI_RANGES[p])]),
) as Record<Position, Set<HandClass>>;

export function rangeFor(position: Position): Set<HandClass> {
  return PARSED_RANGES[position];
}

/** Share of all 1326 starting combos contained in the range, 0-1. */
export function rangePercent(range: Set<HandClass>): number {
  let combos = 0;
  for (const h of range) combos += comboCount(h);
  return combos / 1326;
}

/** Hand class at a given cell of the standard 13x13 grid (suited above the diagonal). */
export function gridHand(row: number, col: number): HandClass {
  const a = RANKS[row];
  const b = RANKS[col];
  if (row === col) return rankChar(a) + rankChar(b);
  return row < col ? nonPair(a, b, 's') : nonPair(b, a, 'o');
}

export interface PreflopQuestion {
  position: Position;
  hole: Card[];
  hand: HandClass;
  shouldRaise: boolean;
  /** Positions where this hand is a standard open. */
  openFrom: Position[];
}

export function makePreflopQuestion(rng: Rng = Math.random): PreflopQuestion {
  const position = pick(POSITIONS, rng);
  // Pure random deals are ~70% trivial folds; bias toward hands that are
  // opened from somewhere so the interesting decisions come up more often.
  let hole = deal(2, rng);
  if (rng() < 0.6) {
    while (!POSITIONS.some((p) => rangeFor(p).has(handClassOf(hole[0], hole[1])))) hole = deal(2, rng);
  }
  hole.sort((a, b) => b.rank - a.rank);
  const hand = handClassOf(hole[0], hole[1]);
  return {
    position,
    hole,
    hand,
    shouldRaise: rangeFor(position).has(hand),
    openFrom: POSITIONS.filter((p) => rangeFor(p).has(hand)),
  };
}
