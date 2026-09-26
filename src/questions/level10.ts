import { CONFIG } from '../config';
import { bluffEv, breakEvenFold } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { bb, num, pct, sizeName } from './format';
import { dealPotAndBet } from './spots';
import type { Generator, Question } from './types';

function exploit(rng: Rng): Question {
  for (;;) {
    const { pot, bet, fraction } = dealPotAndBet(rng);
    const foldPct = 5 * rng.int(4, 16);
    const bePct = breakEvenFold(pot, bet) * 100;
    if (Math.abs(foldPct - bePct) < CONFIG.exploitMarginPct) continue;
    const ev = bluffEv(foldPct / 100, pot, bet);
    const plus = ev > 0;
    return {
      type: 'L10.exploit',
      typeLabel: 'Exploit: is the bluff +EV?',
      sourceLevel: 10,
      prompt: `The pot is ${bb(pot)}. Your opponent folds ${foldPct}% of the time to a ${sizeName(fraction)} (${bb(bet)}). Is a pure bluff +EV?`,
      facts: [
        { label: 'Pot', value: bb(pot) },
        { label: 'Your bet', value: bb(bet) },
        { label: 'Opponent folds', value: `${foldPct}%` },
      ],
      answer: {
        kind: 'choice',
        options: [
          { id: 'yes', label: 'Yes — +EV' },
          { id: 'no', label: 'No — −EV' },
        ],
        correct: plus ? 'yes' : 'no',
      },
      answerText: plus ? 'Yes — +EV' : 'No — −EV',
      explanation: [
        `EV = fold% × pot − (1 − fold%) × bet = ${num(foldPct / 100, 2)} × ${pot} − ${num(1 - foldPct / 100, 2)} × ${bet} = ${ev < 0 ? '−' : ''}${bb(Math.abs(ev))}.`,
        `Shortcut: break-even fold % = B ÷ (P + B) = ${bet} ÷ ${pot + bet} = ${pct(bePct)}. They fold ${foldPct}%, ${plus ? 'more' : 'less'} than that, so the bluff is ${plus ? '+EV' : '−EV'}.`,
      ],
    };
  }
}

/** Level 10 mixes levels 1–9 with exploit spots, each equally likely. */
export function makeLevel10(mixed: Generator[]): Generator {
  const pool: Generator[] = [...mixed, exploit];
  return (rng) => rng.pick(pool)(rng);
}
