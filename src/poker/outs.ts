import { Card, Rng, deal, pick, remainingDeck, shuffle } from './cards';
import { HandCategory, compareHands, evaluate } from './evaluator';

export type Street = 'flop' | 'turn';

export interface DrawScenario {
  hole: Card[];
  board: Card[];
  street: Street;
  outs: Card[];
  flushOuts: number;
  straightOuts: number;
  /** Outs that fill up a set or two pair (full house or quads). */
  fullHouseOuts: number;
}

/**
 * Cards that give you a straight or better using at least one hole card.
 * Cards that only improve the board (so everyone plays it) don't count.
 */
export function findOuts(hole: Card[], board: Card[]): Card[] {
  const known = [...hole, ...board];
  return remainingDeck(known).filter((card) => {
    const made = evaluate([...known, card]);
    if (made.category < HandCategory.Straight) return false;
    const boardOnly = [...board, card];
    return boardOnly.length < 5 || compareHands(evaluate(boardOnly), made) !== 0;
  });
}

/** Unseen cards from the player's point of view before the next card. */
export function unseenCount(street: Street): number {
  return street === 'flop' ? 47 : 46;
}

/**
 * Deals random spots until one has a real draw: the player is currently below
 * a straight and has between `minOuts` and `maxOuts` outs to one.
 */
export function makeDrawScenario(rng: Rng = Math.random, minOuts = 4, maxOuts = 15): DrawScenario {
  const street: Street = pick(['flop', 'turn'] as const, rng);
  const boardSize = street === 'flop' ? 3 : 4;
  for (;;) {
    const cards = deal(2 + boardSize, rng);
    const hole = cards.slice(0, 2).sort((a, b) => b.rank - a.rank);
    const board = cards.slice(2);
    if (evaluate([...hole, ...board]).category >= HandCategory.Straight) continue;
    const outs = findOuts(hole, board);
    if (outs.length < minOuts || outs.length > maxOuts) continue;

    let flushOuts = 0;
    let straightOuts = 0;
    let fullHouseOuts = 0;
    for (const out of outs) {
      const category = evaluate([...hole, ...board, out]).category;
      if (category === HandCategory.Straight) straightOuts++;
      else if (category === HandCategory.Flush || category === HandCategory.StraightFlush) flushOuts++;
      else fullHouseOuts++;
    }
    return { hole, board, street, outs, flushOuts, straightOuts, fullHouseOuts };
  }
}

/** Four distinct multiple-choice answers including the correct one, ascending. */
export function outsChoices(correct: number, rng: Rng = Math.random): number[] {
  const candidates = [correct - 4, correct - 3, correct - 1, correct + 1, correct + 2, correct + 3, correct + 4]
    .filter((n) => n > 0 && n <= 20);
  return [correct, ...shuffle(candidates, rng).slice(0, 3)].sort((a, b) => a - b);
}
