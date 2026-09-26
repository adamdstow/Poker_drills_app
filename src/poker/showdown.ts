import { Card, Rng, deal } from './cards';
import { HandValue, compareHands, evaluate } from './evaluator';

export type Winner = 'A' | 'B' | 'split';

export interface ShowdownQuestion {
  board: Card[];
  handA: Card[];
  handB: Card[];
  valueA: HandValue;
  valueB: HandValue;
  winner: Winner;
}

export function makeShowdownQuestion(rng: Rng = Math.random): ShowdownQuestion {
  for (;;) {
    const cards = deal(9, rng);
    const board = cards.slice(0, 5);
    const handA = cards.slice(5, 7);
    const handB = cards.slice(7, 9);
    const valueA = evaluate([...handA, ...board]);
    const valueB = evaluate([...handB, ...board]);
    // Hands of different categories are easy to call, so reroll half of them
    // and let most questions hinge on ranks and kickers.
    if (valueA.category !== valueB.category && rng() < 0.5) continue;
    const cmp = compareHands(valueA, valueB);
    return { board, handA, handB, valueA, valueB, winner: cmp > 0 ? 'A' : cmp < 0 ? 'B' : 'split' };
  }
}
