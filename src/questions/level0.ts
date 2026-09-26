import { CONFIG } from '../config';
import type { Rng } from '../engine/rng';
import { num, pct } from './format';
import type { Question } from './types';

const T = CONFIG.tolerance;

function base(type: string, typeLabel: string, prompt: string, value: number, unit: string, tolerance: number, explanation: string[]): Question {
  return {
    type: `L0.${type}`,
    typeLabel,
    sourceLevel: 0,
    prompt,
    answer: { kind: 'number', value, tolerance, unit },
    answerText: unit === '%' ? pct(value) : `${num(value, 2)}${unit ? ` ${unit}` : ''}`,
    explanation,
  };
}

/** a ÷ b as a percentage, with a whole-number answer. */
function divisionPct(rng: Rng): Question {
  const b = rng.pick([20, 40, 50, 60, 80, 100, 120, 150, 160, 200, 240, 300]);
  const p = rng.pick([5, 10, 20, 25, 30, 40, 50, 60, 75].filter((x) => (b * x) % 100 === 0));
  const a = (b * p) / 100;
  return base('divisionPct', 'Division → %', `${a} ÷ ${b} = ?%`, p, '%', T.arithmeticExact, [
    `${a} ÷ ${b} = ${num(a / b, 3)}.`,
    `× 100 = ${p}%.`,
  ]);
}

function multiply(rng: Rng): Question {
  const outs = rng.int(2, 17);
  const m = rng.pick([2, 4]);
  return base('multiply', 'Outs × 2 / × 4', `${outs} × ${m} = ?`, outs * m, '', T.arithmeticExact, [
    `${outs} × ${m} = ${outs * m}.`,
    m === 4 ? 'This is the first step of the Rule of 4 on the flop.' : 'This is the Rule of 2 on the turn.',
  ]);
}

const FRACTIONS: [number, number][] = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [2, 7], [3, 7],
];

function fractionToPct(rng: Rng): Question {
  const [n, d] = rng.pick(FRACTIONS);
  const p = (n / d) * 100;
  return base('fractionPct', 'Fraction → %', `${n}/${d} as a percentage (nearest whole %)`, p, '%', Number.isInteger(p) ? T.arithmeticExact : T.arithmeticRounded, [
    `${n} ÷ ${d} = ${num(n / d, 4)}.`,
    `× 100 = ${pct(p)}.`,
  ]);
}

function fractionOf(rng: Rng): Question {
  const [n, d] = rng.pick([[1, 3], [1, 2], [2, 3], [3, 4], [1, 4], [3, 2]] as [number, number][]);
  const pot = d * rng.int(2, 30);
  const v = (pot * n) / d;
  return base('fractionOf', 'Fraction of pot', `${n}/${d} of ${pot} = ?`, v, '', T.arithmeticExact, [
    `${pot} ÷ ${d} = ${pot / d}.`,
    `× ${n} = ${v}.`,
  ]);
}

function finalPotSum(rng: Rng): Question {
  const pot = 10 * rng.int(2, 30);
  const bet = 5 * rng.int(1, Math.max(2, pot / 5));
  return base('finalPot', 'Final pot sum', `Pot ${pot} + bet ${bet} + your call ${bet} = ?`, pot + 2 * bet, '', T.arithmeticExact, [
    `${pot} + ${bet} + ${bet} = ${pot + 2 * bet}.`,
    'The final pot always includes the bet and your call.',
  ]);
}

function oddsDivision(rng: Rng): Question {
  const e = rng.pick([5, 10, 20, 25, 50, 40, 12.5]);
  const x = (100 - e) / e;
  return base('oddsDivision', '(100 − e) ÷ e', `(100 − ${e}) ÷ ${e} = ?`, x, '', Number.isInteger(x) ? T.arithmeticExact : T.arithmeticDecimal, [
    `100 − ${e} = ${100 - e}.`,
    `${100 - e} ÷ ${e} = ${num(x, 2)}.`,
  ]);
}

export function generateLevel0(rng: Rng): Question {
  return rng.pick([divisionPct, multiply, fractionToPct, fractionOf, finalPotSum, oddsDivision])(rng);
}
