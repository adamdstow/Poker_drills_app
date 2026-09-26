import { CONFIG } from '../config';
import { equityToOddsAgainst, oddsAgainstToEquity } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { num, pct } from './format';
import type { Question } from './types';

const T = CONFIG.tolerance;
const EQUITIES = [50, 40, 33, 30, 25, 20, 17, 16, 14, 12, 11, 10, 9, 8];
const ODDS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20];

export function generateLevel3(rng: Rng): Question {
  if (rng.chance(0.5)) {
    const e = rng.pick(EQUITIES);
    const x = equityToOddsAgainst(e / 100);
    return {
      type: 'L3.toOdds',
      typeLabel: 'Equity → odds',
      sourceLevel: 3,
      prompt: `Your equity is ${e}%. What are the odds against, as X:1?`,
      answer: { kind: 'number', value: x, tolerance: Math.max(T.oddsAbs, T.oddsRel * x), unit: ':1' },
      answerText: `${num(x, 1)}:1`,
      explanation: [
        'Odds against = (100 − equity) : equity.',
        `(100 − ${e}) : ${e} = ${100 - e} : ${e}.`,
        `Divide by ${e}: ${num(x, 2)} : 1.`,
      ],
    };
  }
  const x = rng.pick(ODDS);
  const e = oddsAgainstToEquity(x) * 100;
  return {
    type: 'L3.toEquity',
    typeLabel: 'Odds → equity',
    sourceLevel: 3,
    prompt: `The odds against are ${num(x)}:1. What is the equity %?`,
    answer: { kind: 'number', value: e, tolerance: T.percentPoints, unit: '%' },
    answerText: pct(e),
    explanation: [
      `${num(x)}:1 means ${num(x)} losses for every 1 win: ${num(x + 1)} outcomes in total.`,
      `Equity = 1 ÷ (${num(x)} + 1) = ${pct(e)}.`,
    ],
  };
}
