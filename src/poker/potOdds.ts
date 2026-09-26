import { Rng, pick } from './cards';
import { DrawScenario, makeDrawScenario, unseenCount } from './outs';

export interface PotOddsQuestion {
  draw: DrawScenario;
  /** Pot before the villain's bet. */
  pot: number;
  bet: number;
  /** Equity needed to break even on the call, 0-1. */
  requiredEquity: number;
  /** Chance of hitting on the next card, 0-1. */
  equity: number;
  shouldCall: boolean;
}

const BET_FRACTIONS = [0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2];

/** Break-even equity for calling `bet`, where `pot` is the pot before the bet. */
export function requiredEquity(pot: number, bet: number): number {
  return bet / (pot + 2 * bet);
}

/**
 * One-card-to-come decision: you're facing a bet with a draw and only
 * count the next card (no implied odds). Near coin-flip spots are skipped
 * so every question has a clear answer.
 */
export function makePotOddsQuestion(rng: Rng = Math.random): PotOddsQuestion {
  for (;;) {
    const draw = makeDrawScenario(rng);
    const pot = 20 + 10 * Math.floor(rng() * 19);
    const bet = Math.max(5, Math.round((pot * pick(BET_FRACTIONS, rng)) / 5) * 5);
    const needed = requiredEquity(pot, bet);
    const equity = draw.outs.length / unseenCount(draw.street);
    if (Math.abs(equity - needed) < 0.02) continue;
    return { draw, pot, bet, requiredEquity: needed, equity, shouldCall: equity >= needed };
  }
}
