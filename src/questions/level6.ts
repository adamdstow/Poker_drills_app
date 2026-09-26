import { CONFIG } from '../config';
import { callerNeeds, denialBet, denialBetFraction, ruleOf4And2Pct } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { bb, capitalise, num, pct, sizeName } from './format';
import { dealPotAndBet } from './spots';
import type { Question } from './types';

/** Turn draws the opponent might hold, with their Rule of 2 equity. */
const TURN_DRAWS: { name: string; outs: number }[] = [
  { name: 'a gutshot', outs: 4 },
  { name: 'two overcards', outs: 6 },
  { name: 'an open-ended straight draw', outs: 8 },
  { name: 'a flush draw', outs: 9 },
  { name: 'two overcards and a gutshot', outs: 10 },
  { name: 'a flush draw and a gutshot', outs: 12 },
  { name: 'a flush draw and an open-ender', outs: 15 },
];

function drawIntro(d: { name: string; outs: number }): { text: string; e: number } {
  const e = ruleOf4And2Pct(d.outs, 'turn');
  return { text: `On the turn your opponent has ${d.name}: ${d.outs} outs ≈ ${e}% equity (Rule of 2).`, e };
}

function denialSteps(ePct: number, pot?: number): string[] {
  const e = ePct / 100;
  const f = denialBetFraction(e);
  const steps = [
    'Facing bet B into pot P, the caller needs B ÷ (P + 2B).',
    `Their call is a mistake when B ÷ (P + 2B) > ${ePct}%, i.e. B > e × P ÷ (1 − 2e).`,
    `e ÷ (1 − 2e) = ${num(e, 2)} ÷ ${num(1 - 2 * e, 2)} = ${pct(f * 100)} of the pot.`,
  ];
  if (pot !== undefined) steps.push(`${pct(f * 100)} × ${pot} = ${bb(denialBet(e, pot))}.`);
  return steps;
}

function thresholdPct(rng: Rng): Question {
  const { text, e } = drawIntro(rng.pick(TURN_DRAWS));
  const value = denialBetFraction(e / 100) * 100;
  return {
    type: 'L6.denyPct',
    typeLabel: 'Denial size (% of pot)',
    sourceLevel: 6,
    prompt: `${text} Bets above what size (as % of pot) make their call a mistake?`,
    answer: { kind: 'number', value, tolerance: CONFIG.tolerance.betPctOfPot, unit: '% of pot' },
    answerText: `${num(value, 1)}% of pot`,
    explanation: denialSteps(e),
  };
}

function thresholdBb(rng: Rng): Question {
  const { text, e } = drawIntro(rng.pick(TURN_DRAWS));
  const pot = CONFIG.potUnit * rng.int(2, 10);
  const value = denialBet(e / 100, pot);
  return {
    type: 'L6.denyBb',
    typeLabel: 'Denial size (bb)',
    sourceLevel: 6,
    prompt: `The pot is ${bb(pot)}. ${text} Bets above how many bb make their call a mistake?`,
    facts: [{ label: 'Pot', value: bb(pot) }],
    answer: { kind: 'number', value, tolerance: Math.max(CONFIG.tolerance.bbAbs, CONFIG.tolerance.bbRel * value), unit: 'bb' },
    answerText: bb(value),
    explanation: denialSteps(e, pot),
  };
}

/** Flop all-in: the opponent sees two cards, so use the Rule of 4. */
function flopIntro(d: { name: string; outs: number }): { text: string; e: number } {
  const e = ruleOf4And2Pct(d.outs, 'flop');
  return { text: `On the flop you put your opponent all-in. They have ${d.name}: ${d.outs} outs ≈ ${e}% equity (Rule of 4).`, e };
}

function pickSize(rng: Rng): Question {
  const margin = CONFIG.denialMarginPct;
  for (;;) {
    const d = rng.pick(TURN_DRAWS);
    const { text, e } = rng.chance(0.5) ? drawIntro(d) : flopIntro(d);
    const sizes = rng.shuffle(CONFIG.betFractions).slice(0, 4).sort((a, b) => a - b);
    const needs = sizes.map((f) => callerNeeds(1, f) * 100);
    if (needs.some((n) => Math.abs(n - e) < margin)) continue;
    const idx = needs.findIndex((n) => n > e);
    // At least one size must fail to deny, so the choice is a real test.
    if (idx < 1) continue;
    const { pot } = dealPotAndBet(rng);
    const options = sizes.map((f, i) => ({ id: String(i), label: `${sizeName(f)} (${bb(pot * f)})` }));
    return {
      type: 'L6.pickSize',
      typeLabel: 'Pick the denying size',
      sourceLevel: 6,
      prompt: `The pot is ${bb(pot)}. ${text} Which is the smallest of these bets that makes their call a mistake?`,
      facts: [{ label: 'Pot', value: bb(pot) }],
      answer: { kind: 'choice', options, correct: String(idx) },
      answerText: options[idx].label,
      explanation: [
        'Facing bet B into pot P, the caller needs B ÷ (P + 2B).',
        ...sizes.map((f, i) => `${capitalise(sizeName(f))}: caller needs ${pct(needs[i])} — ${needs[i] > e ? `more than ${e}%, so calling is a mistake` : `${e}% is enough, so calling is fine`}.`),
        `Smallest size that denies: ${sizeName(sizes[idx])}.`,
      ],
    };
  }
}

export function generateLevel6(rng: Rng): Question {
  return rng.pick([thresholdPct, thresholdBb, pickSize])(rng);
}
