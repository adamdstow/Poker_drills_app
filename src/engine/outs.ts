import { type Card, sameCard, unseenCards } from './cards';
import { hasFlush, hasStraight, rankMask, straightHigh } from './evaluator';

export interface OutsOptions {
  /**
   * Count the six overcard outs. Only set when the question states the
   * opponent holds a single pair below both hole cards.
   */
  countOvercards?: boolean;
}

export interface OutsResult {
  /** Every out, counted once. */
  cards: Card[];
  /** Cards that complete a flush using a hole card. */
  flush: Card[];
  /** Cards that complete a straight using a hole card. */
  straight: Card[];
  /** Cards that pair an overcard (only when countOvercards applies). */
  overcards: Card[];
}

export function hasTwoOvercards(hero: readonly Card[], board: readonly Card[]): boolean {
  return (
    hero.length === 2 &&
    hero[0].rank !== hero[1].rank &&
    hero.every((h) => board.every((b) => h.rank > b.rank))
  );
}

/**
 * Enumerate every unseen card and keep the ones that complete a draw, so a
 * card completing two draws is only counted once.
 */
export function computeOuts(hero: readonly Card[], board: readonly Card[], opts: OutsOptions = {}): OutsResult {
  const known = [...hero, ...board];
  const alreadyFlush = hasFlush(known);
  const alreadyStraight = hasStraight(known);
  const overcardsApply = !!opts.countOvercards && hasTwoOvercards(hero, board);
  const heroRanks = hero.map((c) => c.rank);

  const result: OutsResult = { cards: [], flush: [], straight: [], overcards: [] };
  for (const c of unseenCards(known)) {
    const next = [...known, c];
    const boardNext = [...board, c];
    const f = !alreadyFlush && hasFlush(next) && !hasFlush(boardNext);
    const s = !alreadyStraight && hasStraight(next) && !hasStraight(boardNext);
    const o = overcardsApply && heroRanks.includes(c.rank);
    if (f) result.flush.push(c);
    if (s) result.straight.push(c);
    if (o) result.overcards.push(c);
    if (f || s || o) result.cards.push(c);
  }
  return result;
}

export function isOut(outs: OutsResult, card: Card): boolean {
  return outs.cards.some((c) => sameCard(c, card));
}

/** Ranks (rank-only view) that complete a straight using a hole card. */
export function straightCompletingRanks(heroRanks: readonly number[], boardRanks: readonly number[]): number[] {
  const known = [...heroRanks, ...boardRanks];
  if (straightHigh(rankMask(known))) return [];
  const out: number[] = [];
  for (let r = 2; r <= 14; r++) {
    if (known.includes(r)) continue;
    if (straightHigh(rankMask([...known, r])) && !straightHigh(rankMask([...boardRanks, r]))) out.push(r);
  }
  return out;
}
