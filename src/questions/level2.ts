import { CONFIG } from '../config';
import { ruleOf4And2Pct, type Street } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { equitySteps } from './explain';
import { pct } from './format';
import { pickStreet, streetPhrase } from './spots';
import type { Mistake, Question } from './types';

const COMMON_OUTS = [4, 6, 8, 9, 10, 12, 15];

export const EQUITY_THINK = 'Flop (two cards to come): outs × 4, and above 8 outs subtract (outs − 8). Turn (one card to come): outs × 2.';

export function equityQuestion(outs: number, street: Street): Question {
  const eq = ruleOf4And2Pct(outs, street);
  const mistakes: Mistake[] =
    street === 'flop'
      ? [
          { value: outs * 4, text: `Above 8 outs, subtract (outs − 8) = ${outs - 8}: ${outs * 4} − ${outs - 8} = ${eq}.` },
          { value: outs * 2, text: 'That is the turn rule (× 2). On the flop two cards are still to come: × 4.' },
        ]
      : [{ value: outs * 4, text: 'On the turn only one card is to come: × 2, not × 4.' }];
  return {
    type: `L2.${street}${street === 'flop' && outs > 8 ? '.over8' : ''}`,
    typeLabel: street === 'turn' ? 'Equity: turn (× 2)' : outs > 8 ? 'Equity: flop above 8 outs' : 'Equity: flop (× 4)',
    sourceLevel: '2',
    prompt: `${streetPhrase(street)}. You have ${outs} outs. What is your equity (Rule of 4 and 2)?`,
    answer: { kind: 'number', value: eq, tolerance: CONFIG.tolerance.percentPoints, unit: '%' },
    answerText: pct(eq),
    explanation: equitySteps(outs, street),
    hint: { thinkAbout: EQUITY_THINK, mistakes },
  };
}

export function generateLevel2(rng: Rng): Question {
  const street = pickStreet(rng);
  // Bias towards the counts that come up at the table, and above-8 flop cases.
  const outs = rng.chance(0.6) ? rng.pick(COMMON_OUTS) : rng.int(street === 'flop' ? 9 : 1, 20);
  return equityQuestion(outs, street);
}
