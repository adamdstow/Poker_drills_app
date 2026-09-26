import { type Card, cardsLabel, rankChar, SUIT_SYMBOL } from './cards';
import type { OutsResult } from './outs';

export type StraightDrawKind = 'none' | 'oesd' | 'doubleGutshot' | 'gutshot' | 'oneEnded' | 'other';
export type DrawKind = 'flush' | 'oesd' | 'doubleGutshot' | 'gutshot' | 'oneEnded' | 'straight' | 'overcards';

export interface Draw {
  kind: DrawKind;
  name: string;
  outs: Card[];
  /** Short description of what completes it, e.g. "any ♥" or "a 9". */
  needs: string;
}

/** Map rank to ace-low when it is 1. */
function low(r: number): number {
  return r === 1 ? 14 : r;
}

function hasFourConsecutive(ranks: readonly number[], start: number): boolean {
  const set = new Set(ranks.flatMap((r) => (r === 14 ? [1, 14] : [r])));
  for (let i = 0; i < 4; i++) if (!set.has(start + i)) return false;
  return true;
}

/** Classify a straight draw from the known ranks and the ranks that complete it. */
export function classifyStraightDraw(knownRanks: readonly number[], completing: readonly number[]): StraightDrawKind {
  if (completing.length === 0) return 'none';
  if (completing.length === 1) {
    const r = completing[0];
    // One-ended: the four known ranks are consecutive and only one end completes (A-2-3-4 or J-Q-K-A).
    for (let start = 1; start <= 11; start++) {
      if (!hasFourConsecutive(knownRanks, start)) continue;
      const ends = [start - 1, start + 4].filter((x) => x >= 1 && x <= 14).map(low);
      if (ends.includes(r)) return 'oneEnded';
    }
    return 'gutshot';
  }
  if (completing.length === 2) {
    const [a, b] = completing;
    for (let start = 1; start <= 11; start++) {
      if (!hasFourConsecutive(knownRanks, start)) continue;
      const ends = [low(start - 1), low(start + 4)];
      if (ends.includes(a) && ends.includes(b)) return 'oesd';
    }
    return 'doubleGutshot';
  }
  return 'other';
}

function rankList(ranks: readonly number[]): string {
  const chars = ranks.slice().sort((x, y) => x - y).map(rankChar);
  return chars.length <= 1 ? `a ${chars[0] ?? '?'}` : `${chars.slice(0, -1).join(', ')} or ${chars[chars.length - 1]}`;
}

/** Name each draw and the outs that complete it. */
export function describeDraws(hero: readonly Card[], board: readonly Card[], outs: OutsResult): Draw[] {
  const draws: Draw[] = [];
  if (outs.flush.length) {
    const suit = outs.flush[0].suit;
    draws.push({ kind: 'flush', name: 'Flush draw', outs: outs.flush, needs: `any ${SUIT_SYMBOL[suit]}` });
  }
  if (outs.straight.length) {
    const ranks = [...new Set(outs.straight.map((c) => c.rank))];
    const known = [...hero, ...board].map((c) => c.rank);
    const kind = classifyStraightDraw(known, ranks);
    const names: Record<StraightDrawKind, string> = {
      none: 'Straight draw',
      oesd: 'Open-ended straight draw',
      doubleGutshot: 'Double gutshot',
      gutshot: 'Gutshot',
      oneEnded: 'One-ended straight draw',
      other: 'Straight draw',
    };
    draws.push({
      kind: kind === 'none' || kind === 'other' ? 'straight' : kind,
      name: names[kind],
      outs: outs.straight,
      needs: rankList(ranks),
    });
  }
  if (outs.overcards.length) {
    draws.push({
      kind: 'overcards',
      name: 'Two overcards',
      outs: outs.overcards,
      needs: rankList(hero.map((c) => c.rank)),
    });
  }
  return draws;
}

/** Cards counted by more than one draw. */
export function doubleCounted(draws: readonly Draw[]): Card[] {
  const seen = new Map<string, { card: Card; n: number }>();
  for (const d of draws) {
    for (const c of d.outs) {
      const key = `${c.rank}${c.suit}`;
      const e = seen.get(key) ?? { card: c, n: 0 };
      e.n++;
      seen.set(key, e);
    }
  }
  return [...seen.values()].filter((e) => e.n > 1).map((e) => e.card);
}

/** e.g. "9 + 8 − 2 = 15". */
export function outsSum(draws: readonly Draw[], total: number): string {
  const parts = draws.map((d) => d.outs.length);
  const sum = parts.reduce((a, b) => a + b, 0);
  const over = sum - total;
  if (parts.length <= 1) return `${total}`;
  return `${parts.join(' + ')}${over > 0 ? ` − ${over}` : ''} = ${total}`;
}

export function outsList(cards: readonly Card[]): string {
  return cardsLabel(cards);
}
