import { CONFIG } from '../config';
import { ruleOf4And2Pct, type Street } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { equitySteps } from './explain';
import { pct } from './format';
import { pickStreet, streetPhrase } from './spots';
import type { Question } from './types';

const COMMON_OUTS = [4, 6, 8, 9, 10, 12, 15];

export function equityQuestion(outs: number, street: Street): Question {
  const eq = ruleOf4And2Pct(outs, street);
  return {
    type: `L2.${street}${street === 'flop' && outs > 8 ? '.over8' : ''}`,
    typeLabel: street === 'turn' ? 'Equity: turn (× 2)' : outs > 8 ? 'Equity: flop above 8 outs' : 'Equity: flop (× 4)',
    sourceLevel: 2,
    prompt: `${streetPhrase(street)}. You have ${outs} outs. What is your equity (Rule of 4 and 2)?`,
    answer: { kind: 'number', value: eq, tolerance: CONFIG.tolerance.percentPoints, unit: '%' },
    answerText: pct(eq),
    explanation: equitySteps(outs, street),
  };
}

export function generateLevel2(rng: Rng): Question {
  const street = pickStreet(rng);
  // Bias towards the counts that come up at the table, and above-8 flop cases.
  const outs = rng.chance(0.6) ? rng.pick(COMMON_OUTS) : rng.int(street === 'flop' ? 9 : 1, 20);
  return equityQuestion(outs, street);
}
