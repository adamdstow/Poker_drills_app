import { CONFIG } from '../config';
import {
  balancedBluffShare, betFractionFromBluffShare, betFractionFromBreakEvenFold, betFractionFromMdf,
  breakEvenFold, minimumDefenceFrequency,
} from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { bb, num, pct, sizeName } from './format';
import { dealPotAndBet } from './spots';
import type { Question } from './types';

export type GtoFigure = 'breakEven' | 'bluffShare' | 'mdf';

export const FIGURES: Record<GtoFigure, { name: string; formula: string; meaning: string; of: (p: number, b: number) => number; reverse: (x: number) => number }> = {
  breakEven: {
    name: 'Break-even fold % for a pure bluff',
    formula: 'B ÷ (P + B)',
    meaning: 'how often a pure bluff must work so it does not lose money (risk ÷ (risk + reward))',
    of: breakEvenFold,
    reverse: betFractionFromBreakEvenFold,
  },
  bluffShare: {
    name: 'Balanced bluff share of the betting range',
    formula: 'B ÷ (P + 2B)',
    meaning: 'the share of your bets that should be bluffs so the caller gains nothing by calling or folding',
    of: balancedBluffShare,
    reverse: betFractionFromBluffShare,
  },
  mdf: {
    name: 'Minimum defence frequency (MDF)',
    formula: 'P ÷ (P + B)',
    meaning: "how often the defender must continue, or the bettor profits by bluffing any two cards",
    of: minimumDefenceFrequency,
    reverse: betFractionFromMdf,
  },
};

const ORDER: GtoFigure[] = ['breakEven', 'bluffShare', 'mdf'];

const THINK = 'First decide WHICH figure is asked. Bluffer risking B to win P → break-even fold B ÷ (P + B). Share of your bets that are bluffs → B ÷ (P + 2B). Defender facing a bet → MDF P ÷ (P + B).';

function whichLine(fig: GtoFigure): string {
  const others = ORDER.filter((f) => f !== fig).map((f) => `${FIGURES[f].name} = ${FIGURES[f].formula}`);
  return `This asks for the ${FIGURES[fig].name.toUpperCase()} = ${FIGURES[fig].formula}: ${FIGURES[fig].meaning}. Not to be confused with: ${others.join('; ')}.`;
}

function contrast(pot: number, bet: number): string {
  return `For this size: break-even fold ${pct(breakEvenFold(pot, bet) * 100)}, balanced bluff share ${pct(balancedBluffShare(pot, bet) * 100)}, MDF ${pct(minimumDefenceFrequency(pot, bet) * 100)}.`;
}

function forwardPrompt(fig: GtoFigure, sizeText: string): string {
  switch (fig) {
    case 'breakEven':
      return `You make ${sizeText} as a pure bluff. How often must your opponent fold for the bluff to break even?`;
    case 'bluffShare':
      return `You make ${sizeText} on the river. For a balanced betting range, what % of your bets should be bluffs?`;
    case 'mdf':
      return `Your opponent makes ${sizeText}. What is your minimum defence frequency?`;
  }
}

function reversePrompt(fig: GtoFigure, given: string): string {
  switch (fig) {
    case 'breakEven':
      return `A pure bluff breaks even when your opponent folds ${given} of the time. What bet size is that, as % of pot?`;
    case 'bluffShare':
      return `Your river betting range is balanced with ${given} bluffs. What bet size is it balanced for, as % of pot?`;
    case 'mdf':
      return `Facing a bet, your minimum defence frequency is ${given}. What is the bet size, as % of pot?`;
  }
}

function substitute(fig: GtoFigure, pot: number, bet: number): string {
  const P = num(pot, 3);
  const B = num(bet, 3);
  switch (fig) {
    case 'breakEven':
      return `${B} ÷ (${P} + ${B})`;
    case 'bluffShare':
      return `${B} ÷ (${P} + 2 × ${B})`;
    case 'mdf':
      return `${P} ÷ (${P} + ${B})`;
  }
}

function forward(rng: Rng, fig: GtoFigure): Question {
  const { pot, bet, fraction } = dealPotAndBet(rng);
  const inBb = rng.chance(0.5);
  const sizeText = inBb ? `a ${bb(bet)} bet into ${bb(pot)}` : `a ${sizeName(fraction)}`;
  const P = inBb ? pot : 1;
  const B = inBb ? bet : fraction;
  const value = FIGURES[fig].of(P, B) * 100;
  const sub = substitute(fig, P, B);
  return {
    type: `L8.${fig}.forward`,
    typeLabel: `${FIGURES[fig].name} (size → %)`,
    sourceLevel: '8',
    prompt: forwardPrompt(fig, sizeText),
    facts: inBb ? [{ label: 'Pot', value: bb(pot) }, { label: 'Bet', value: bb(bet) }] : undefined,
    answer: { kind: 'number', value, tolerance: CONFIG.tolerance.percentPoints, unit: '%' },
    answerText: pct(value),
    explanation: [
      whichLine(fig),
      `${FIGURES[fig].formula} = ${sub} = ${pct(value)}${inBb ? '' : ' (taking the pot as 1)'}.`,
      contrast(P, B),
    ],
    hint: {
      thinkAbout: THINK,
      mistakes: ORDER.filter((f) => f !== fig).map((f) => ({
        value: FIGURES[f].of(P, B) * 100,
        text: `That is the ${FIGURES[f].name.toLowerCase()} (${FIGURES[f].formula}). This question asks for the ${FIGURES[fig].name.toLowerCase()}: ${FIGURES[fig].formula}.`,
      })),
    },
  };
}

function reverse(rng: Rng, fig: GtoFigure): Question {
  const fraction = rng.pick(CONFIG.betFractions);
  // Show the given % to one decimal, and grade against that shown value.
  const givenPct = Math.round(FIGURES[fig].of(1, fraction) * 1000) / 10;
  const value = FIGURES[fig].reverse(givenPct / 100) * 100;
  const given = pct(givenPct);
  const solve: Record<GtoFigure, string> = {
    breakEven: `From f = B ÷ (P + B): B ÷ P = f ÷ (1 − f) = ${num(givenPct / 100, 3)} ÷ ${num(1 - givenPct / 100, 3)}`,
    bluffShare: `From s = B ÷ (P + 2B): B ÷ P = s ÷ (1 − 2s) = ${num(givenPct / 100, 3)} ÷ ${num(1 - (2 * givenPct) / 100, 3)}`,
    mdf: `From m = P ÷ (P + B): B ÷ P = (1 − m) ÷ m = ${num(1 - givenPct / 100, 3)} ÷ ${num(givenPct / 100, 3)}`,
  };
  return {
    type: `L8.${fig}.reverse`,
    typeLabel: `${FIGURES[fig].name} (% → size)`,
    sourceLevel: '8',
    prompt: reversePrompt(fig, given),
    answer: { kind: 'number', value, tolerance: CONFIG.tolerance.betPctOfPot, unit: '% of pot' },
    answerText: `${num(value, 0)}% of pot`,
    explanation: [
      whichLine(fig),
      `${solve[fig]} = ${pct(value)} of the pot (a ${sizeName(fraction)}).`,
      contrast(1, fraction),
    ],
    hint: {
      thinkAbout: THINK,
      mistakes: ORDER.filter((f) => f !== fig)
        .map((f) => ({
          value: FIGURES[f].reverse(givenPct / 100) * 100,
          text: `You solved with the ${FIGURES[f].name.toLowerCase()} formula (${FIGURES[f].formula}). This one is the ${FIGURES[fig].name.toLowerCase()}: ${FIGURES[fig].formula}.`,
        }))
        // A bluff share of 50%+ has no bet size, so skip impossible mix-ups.
        .filter((m) => Number.isFinite(m.value) && m.value > 0),
    },
  };
}

export function generateLevel8(rng: Rng): Question {
  const fig = rng.pick(ORDER);
  return rng.chance(0.5) ? forward(rng, fig) : reverse(rng, fig);
}
