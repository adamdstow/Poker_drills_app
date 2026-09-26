import { type Card, unseenCards } from './cards';
import { evaluate } from './evaluator';

export interface NutsCheck {
  isNuts: boolean;
  heroScore: number;
  /** Strongest opponent holding and its score (when it beats hero). */
  bestOpponent?: { cards: Card[]; score: number };
}

/** On a complete 5-card board, can any two unseen cards beat the hero? Ties count as the nuts. */
export function checkNuts(hero: readonly Card[], board: readonly Card[]): NutsCheck {
  if (board.length !== 5) throw new Error('checkNuts needs a 5-card board');
  const heroScore = evaluate([...hero, ...board]);
  const unseen = unseenCards([...hero, ...board]);
  let best: { cards: Card[]; score: number } | undefined;
  for (let i = 0; i < unseen.length; i++) {
    for (let j = i + 1; j < unseen.length; j++) {
      const score = evaluate([unseen[i], unseen[j], ...board]);
      if (!best || score > best.score) best = { cards: [unseen[i], unseen[j]], score };
    }
  }
  const isNuts = !best || best.score <= heroScore;
  return isNuts ? { isNuts, heroScore } : { isNuts, heroScore, bestOpponent: best };
}
