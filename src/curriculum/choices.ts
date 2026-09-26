import { Rng, pick, shuffle } from '@/poker/cards';

export interface Choices {
  choices: string[];
  answer: number;
}

/**
 * The correct value plus three distinct distractors, in ascending order.
 * Distractors come from `mistakes` first (common wrong workings), then from
 * steps of `step` either side. Values closer than half a step are skipped.
 */
export function numericChoices(
  correct: number,
  mistakes: number[],
  format: (n: number) => string,
  rng: Rng,
  step: number,
  max = Infinity,
): Choices {
  const values = [correct];
  const labels = new Set([format(correct)]);
  const tryAdd = (v: number) => {
    if (values.length >= 4 || v <= 0 || v >= max || !Number.isFinite(v)) return;
    if (labels.has(format(v)) || values.some((x) => Math.abs(x - v) < step / 2)) return;
    values.push(v);
    labels.add(format(v));
  };
  for (const v of shuffle(mistakes, rng)) tryAdd(v);
  for (let k = 1; values.length < 4 && k < 50; k++) {
    for (const v of shuffle([correct + k * step, correct - k * step], rng)) tryAdd(v);
  }
  values.sort((a, b) => a - b);
  return { choices: values.map(format), answer: values.indexOf(correct) };
}

/** Correct answer shuffled in among the others. */
export function textChoices(correct: string, others: string[], rng: Rng): Choices {
  const choices = shuffle([correct, ...others], rng);
  return { choices, answer: choices.indexOf(correct) };
}

/** Choices kept in a fixed order, e.g. Fold / Call. */
export function fixedChoices(choices: string[], correct: string): Choices {
  return { choices, answer: choices.indexOf(correct) };
}

export const pct = (n: number) => `${Math.round(n)}%`;
export const money = (n: number) => `$${Math.round(n)}`;

/** Pot sizes $40-$300 and a bet that's a common fraction of it, rounded to $5. */
export function potAndBet(rng: Rng, fractions = [0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5]): { pot: number; bet: number } {
  const pot = 40 + 10 * Math.floor(rng() * 27);
  const bet = Math.max(10, Math.round((pot * pick(fractions, rng)) / 5) * 5);
  return { pot, bet };
}

export interface BetSize {
  fraction: number;
  label: string;
}

export const BET_SIZES: BetSize[] = [
  { fraction: 1 / 3, label: '⅓ pot' },
  { fraction: 0.5, label: '½ pot' },
  { fraction: 0.75, label: '¾ pot' },
  { fraction: 1, label: 'Pot' },
  { fraction: 1.5, label: '1.5× pot' },
  { fraction: 2, label: '2× pot' },
];

export interface NamedDraw {
  name: string;
  outs: number;
}

/** Standard draws and their out counts. */
export const DRAWS: NamedDraw[] = [
  { name: 'a gutshot', outs: 4 },
  { name: 'two overcards', outs: 6 },
  { name: 'an open-ended straight draw', outs: 8 },
  { name: 'a flush draw', outs: 9 },
  { name: 'a gutshot plus two overcards', outs: 10 },
  { name: 'a flush draw plus a gutshot', outs: 12 },
  { name: 'an open-ended straight draw plus two overcards', outs: 14 },
  { name: 'a flush draw plus an open-ended straight draw', outs: 15 },
];
