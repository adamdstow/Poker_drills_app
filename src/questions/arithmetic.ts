import { CONFIG } from '../config';
import type { Rng } from '../engine/rng';
import { num, pct } from './format';
import type { GenOptions, Hint, Mistake, Question } from './types';

/**
 * The arithmetic package: six levels (A1–A6) from pot addition to multi-step
 * pot-odds sums. Every generator takes a difficulty (0–3) and runs ramp up
 * through it.
 */

const T = CONFIG.tolerance;

/** 1250 → "1,250". */
export function chips(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString('en-US') : num(n, 2);
}

interface Spec {
  level: string;
  type: string;
  typeLabel: string;
  prompt: string;
  value: number;
  unit?: string;
  tolerance?: number;
  answerText?: string;
  explanation: string[];
  thinkAbout: string;
  mistakes?: Mistake[];
}

function make(s: Spec): Question {
  const unit = s.unit ?? '';
  const tolerance = s.tolerance ?? (Number.isInteger(s.value) ? T.arithmeticExact : T.arithmeticDecimal);
  const hint: Hint = { thinkAbout: s.thinkAbout, mistakes: (s.mistakes ?? []).filter((m) => Math.abs(m.value - s.value) > tolerance) };
  return {
    type: `${s.level}.${s.type}`,
    typeLabel: s.typeLabel,
    sourceLevel: s.level,
    prompt: s.prompt,
    answer: { kind: 'number', value: s.value, tolerance, unit },
    answerText: s.answerText ?? (unit === '%' ? pct(s.value) : unit.startsWith(':') ? `${num(s.value, 2)}${unit}` : `${chips(s.value)}${unit ? ` ${unit}` : ''}`),
    explanation: s.explanation,
    hint,
  };
}

const diff = (opts?: GenOptions) => opts?.difficulty ?? 0;

/** Round to a multiple of `step`, at least `step`. */
function roundTo(x: number, step: number): number {
  return Math.max(step, Math.round(x / step) * step);
}

// ─── A1 · Pot addition ───────────────────────────────────────────────────────

const A1_THINK = 'Every called bet goes in twice — once from them, once from you. Final pot = pot + bet + call. Add the biggest numbers first, then the small change.';

export function generateA1(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A1';

  if (d === 0) {
    const pot = 10 * rng.int(1, 10);
    const bet = 10 * rng.int(1, Math.max(1, pot / 10));
    const who = rng.chance(0.5);
    return make({
      level: L,
      type: 'addBet',
      typeLabel: 'Pot + a bet',
      prompt: who ? `The pot is ${pot}. Your opponent bets ${bet}. How big is the pot now?` : `You bet ${bet} into a pot of ${pot}. How big is the pot now?`,
      value: pot + bet,
      explanation: [`${pot} + ${bet} = ${pot + bet}.`, 'The bet goes straight into the pot.'],
      thinkAbout: A1_THINK,
    });
  }

  if (d === 1) {
    const pot = 5 * rng.int(4, 40);
    const bet = roundTo(pot * rng.pick([1 / 3, 1 / 2, 2 / 3, 3 / 4, 1]), 5);
    return make({
      level: L,
      type: 'finalPot',
      typeLabel: 'Final pot (bet + call)',
      prompt: `The pot is ${pot}. Your opponent bets ${bet} and you call. What is the final pot?`,
      value: pot + 2 * bet,
      explanation: [`Final pot = pot + their bet + your call.`, `${pot} + ${bet} + ${bet} = ${pot + 2 * bet}.`],
      thinkAbout: A1_THINK,
      mistakes: [{ value: pot + bet, text: 'You added their bet but forgot your own call — it goes in the pot too.' }],
    });
  }

  if (d === 2) {
    if (rng.chance(0.5)) {
      const pot = 25 * rng.int(4, 36);
      const bet = roundTo(pot * rng.pick([1 / 3, 1 / 2, 2 / 3, 3 / 4, 1]), 25);
      return make({
        level: L,
        type: 'finalPotHundreds',
        typeLabel: 'Final pot (hundreds)',
        prompt: `The pot is ${chips(pot)}. Your opponent bets ${chips(bet)} and you call. What is the final pot?`,
        value: pot + 2 * bet,
        explanation: [`${chips(bet)} + ${chips(bet)} = ${chips(2 * bet)} (bet and call).`, `${chips(pot)} + ${chips(2 * bet)} = ${chips(pot + 2 * bet)}.`],
        thinkAbout: A1_THINK,
        mistakes: [{ value: pot + bet, text: 'You forgot your own call — both the bet and the call go in.' }],
      });
    }
    const pre = 5 * rng.int(2, 12);
    const flop = roundTo(pre * rng.pick([1 / 2, 2 / 3, 3 / 4]), 5);
    const flopPot = pre + 2 * flop;
    const turn = roundTo(flopPot * rng.pick([1 / 2, 2 / 3, 3 / 4]), 5);
    const total = flopPot + 2 * turn;
    return make({
      level: L,
      type: 'streets',
      typeLabel: 'Pot over several streets',
      prompt: `Preflop the pot is ${pre}. On the flop a ${flop} bet is called. On the turn a ${turn} bet is called. How big is the pot on the river?`,
      value: total,
      explanation: [
        `Flop: ${pre} + ${flop} + ${flop} = ${flopPot}.`,
        `Turn: ${flopPot} + ${turn} + ${turn} = ${total}.`,
      ],
      thinkAbout: 'Build the pot one street at a time: after each called bet, pot = old pot + 2 × bet.',
      mistakes: [{ value: pre + flop + turn, text: 'You added each bet once. Every bet was called, so each one goes in twice.' }],
    });
  }

  // d === 3
  const kind = rng.pick(['thousands', 'uneven', 'raise'] as const);
  if (kind === 'thousands') {
    const pot = 50 * rng.int(20, 180);
    const bet = roundTo(pot * rng.pick([1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, 1.5]), 25);
    return make({
      level: L,
      type: 'finalPotThousands',
      typeLabel: 'Final pot (thousands)',
      prompt: `The pot is ${chips(pot)}. Your opponent bets ${chips(bet)} and you call. What is the final pot?`,
      value: pot + 2 * bet,
      explanation: [`Bet + call = 2 × ${chips(bet)} = ${chips(2 * bet)}.`, `${chips(pot)} + ${chips(2 * bet)} = ${chips(pot + 2 * bet)}.`],
      thinkAbout: `${A1_THINK} With thousands, add the thousands, then the hundreds, then the rest.`,
      mistakes: [{ value: pot + bet, text: 'You forgot your own call — both the bet and the call go in.' }],
    });
  }
  if (kind === 'uneven') {
    const pot = rng.int(31, 199);
    const bet = rng.int(11, Math.max(12, Math.round(pot * 0.9)));
    return make({
      level: L,
      type: 'finalPotUneven',
      typeLabel: 'Final pot (uneven numbers)',
      prompt: `The pot is ${pot}. Your opponent bets ${bet} and you call. What is the final pot?`,
      value: pot + 2 * bet,
      explanation: [`2 × ${bet} = ${2 * bet}.`, `${pot} + ${2 * bet} = ${pot + 2 * bet}.`],
      thinkAbout: `${A1_THINK} For uneven numbers, round to the nearest ten, add, then fix the difference (${pot} + ${2 * bet}: add tens first).`,
      mistakes: [{ value: pot + bet, text: 'You forgot your own call — both the bet and the call go in.' }],
    });
  }
  const pot = 10 * rng.int(6, 30);
  const myBet = roundTo(pot * rng.pick([1 / 2, 2 / 3, 3 / 4]), 10);
  const raiseTo = roundTo(myBet * rng.pick([2.5, 3, 3.5]), 5);
  const call = raiseTo - myBet;
  const total = pot + myBet + raiseTo + call;
  return make({
    level: L,
    type: 'raise',
    typeLabel: 'Final pot after a raise',
    prompt: `The pot is ${pot}. You bet ${myBet}, your opponent raises to ${raiseTo}, and you call. What is the final pot?`,
    value: total,
    explanation: [
      `To call you add ${raiseTo} − ${myBet} = ${call} more.`,
      `Final pot = ${pot} + your ${myBet} + their ${raiseTo} + your ${call} = ${total}.`,
      `Shortcut: you both end up with ${raiseTo} in, so ${pot} + 2 × ${raiseTo} = ${total}.`,
    ],
    thinkAbout: 'After a raise and a call, both players have the raise size in: final pot = old pot + 2 × raise-to amount.',
    mistakes: [
      { value: pot + myBet + raiseTo, text: `You left out your call of ${call}.` },
      { value: pot + myBet + 2 * raiseTo, text: `Your call is only the extra ${call} (${raiseTo} − ${myBet}), not another ${raiseTo} — your first ${myBet} is already in.` },
    ],
  });
}

// ─── A2 · Times tables & multiples ───────────────────────────────────────────

const A2_THINK = 'Split the number: 17 × 4 = (10 × 4) + (7 × 4) = 40 + 28. × 4 is "double, then double again". 1.5 × is "the number plus half of it".';

export function generateA2(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A2';
  const lots = (k: number) => `${k} lot${k === 1 ? '' : 's'}`;
  const offByOne = (a: number, m: number): Mistake[] => [
    { value: a * (m - 1), text: `That is ${lots(m - 1)} of ${a} — one lot short.` },
    { value: a * (m + 1), text: `That is ${lots(m + 1)} of ${a} — one lot too many.` },
  ];

  if (d <= 1) {
    const outs = d === 0 ? rng.int(2, 10) : rng.int(11, 20);
    const m = rng.pick([2, 4]);
    return make({
      level: L,
      type: m === 4 ? 'outsX4' : 'outsX2',
      typeLabel: m === 4 ? 'Outs × 4' : 'Outs × 2',
      prompt: `${outs} outs × ${m} = ?`,
      value: outs * m,
      explanation: m === 4 ? [`Double ${outs} = ${outs * 2}.`, `Double again = ${outs * 4}.`] : [`Double ${outs} = ${outs * 2}.`],
      thinkAbout: A2_THINK,
      mistakes: [
        ...offByOne(outs, m),
        { value: outs * (m === 4 ? 2 : 4), text: `You multiplied by ${m === 4 ? 2 : 4} instead of ${m}.` },
      ],
    });
  }

  if (d === 2) {
    const kind = rng.pick(['potMultiple', 'raiseTo', 'times'] as const);
    if (kind === 'potMultiple') {
      const pot = rng.chance(0.5) ? 5 * rng.int(3, 30) : 2 * rng.int(10, 60);
      const m = rng.pick([1.5, 2, 3]);
      const v = pot * m;
      return make({
        level: L,
        type: 'potMultiple',
        typeLabel: 'Bet as a multiple of pot',
        prompt: `The pot is ${pot}. How much is a ${num(m)}× pot bet?`,
        value: v,
        explanation: m === 1.5 ? [`Half of ${pot} = ${pot / 2}.`, `${pot} + ${pot / 2} = ${v}.`] : [`${pot} × ${m} = ${v}.`],
        thinkAbout: A2_THINK,
        mistakes: m === 1.5 ? [{ value: pot / 2, text: '1.5× is the whole pot plus half of it, not just the half.' }] : offByOne(pot, m),
      });
    }
    if (kind === 'raiseTo') {
      const bet = 5 * rng.int(2, 20);
      const m = rng.pick([2.5, 3, 4]);
      return make({
        level: L,
        type: 'raiseTo',
        typeLabel: 'Raise sizing',
        prompt: `Your opponent bets ${bet}. You raise to ${num(m)}× their bet. What do you raise to?`,
        value: bet * m,
        explanation: [`${bet} × ${num(m)} = ${num(bet * m)}.`],
        thinkAbout: A2_THINK,
      });
    }
    const a = rng.int(12, 45);
    const m = rng.int(3, 6);
    return make({
      level: L,
      type: 'times',
      typeLabel: 'Two-digit × one-digit',
      prompt: `${a} × ${m} = ?`,
      value: a * m,
      explanation: [`${Math.floor(a / 10) * 10} × ${m} = ${Math.floor(a / 10) * 10 * m}.`, `${a % 10} × ${m} = ${(a % 10) * m}.`, `Total ${a * m}.`],
      thinkAbout: A2_THINK,
      mistakes: offByOne(a, m),
    });
  }

  const kind = rng.pick(['halves', 'bigTimes'] as const);
  if (kind === 'halves') {
    const m = rng.pick([1.5, 2.5, 3.5]);
    const a = 2 * rng.int(12, 60);
    const v = a * m;
    return make({
      level: L,
      type: 'halfMultiples',
      typeLabel: '× 1.5 / 2.5 / 3.5',
      prompt: `${num(m)} × ${a} = ?`,
      value: v,
      explanation: [`${Math.floor(m)} × ${a} = ${Math.floor(m) * a}.`, `Half of ${a} = ${a / 2}.`, `${Math.floor(m) * a} + ${a / 2} = ${v}.`],
      thinkAbout: A2_THINK,
      mistakes: [{ value: Math.floor(m) * a, text: `You dropped the half — add half of ${a} (${a / 2}).` }],
    });
  }
  const a = rng.int(13, 99);
  const m = rng.int(6, 9);
  return make({
    level: L,
    type: 'bigTimes',
    typeLabel: 'Harder multiplication',
    prompt: `${a} × ${m} = ?`,
    value: a * m,
    explanation: [`${Math.floor(a / 10) * 10} × ${m} = ${Math.floor(a / 10) * 10 * m}.`, `${a % 10} × ${m} = ${(a % 10) * m}.`, `Total ${a * m}.`],
    thinkAbout: A2_THINK,
    mistakes: offByOne(a, m),
  });
}

// ─── A3 · Division & fractions of pot ────────────────────────────────────────

const A3_THINK = 'Divide in easy steps: ÷ 4 is half, then half again. ⅔ is a third, doubled. ¾ is the pot minus a quarter. ÷ 5 is ÷ 10, then double.';

const FRACTION_WORD: Record<string, string> = { '1/2': '½', '1/3': '⅓', '1/4': '¼', '2/3': '⅔', '3/4': '¾' };

function fractionOfPot(rng: Rng, L: string, pots: number[], fractions: [number, number][]): Question {
  const [n, d] = rng.pick(fractions);
  const pot = rng.pick(pots.filter((p) => p % d === 0));
  const v = (pot * n) / d;
  const label = FRACTION_WORD[`${n}/${d}`] ?? `${n}/${d}`;
  return make({
    level: L,
    type: 'fractionOfPot',
    typeLabel: 'Fraction of pot',
    prompt: `The pot is ${chips(pot)}. How much is a ${label}-pot bet?`,
    value: v,
    explanation: n === 1 ? [`${chips(pot)} ÷ ${d} = ${chips(v)}.`] : [`${chips(pot)} ÷ ${d} = ${chips(pot / d)}.`, `× ${n} = ${chips(v)}.`],
    thinkAbout: A3_THINK,
    mistakes: n > 1 ? [{ value: pot / d, text: `That is ${1}/${d} of the pot. You need ${n}/${d}: multiply by ${n}.` }] : [],
  });
}

export function generateA3(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A3';
  if (d <= 1) {
    const div = d === 0 ? rng.pick([2, 5, 10]) : rng.pick([3, 4]);
    const v = rng.int(2, d === 0 ? 20 : 30);
    const x = v * div;
    return make({
      level: L,
      type: `divide${div}`,
      typeLabel: `Divide by ${div}`,
      prompt: `${chips(x)} ÷ ${div} = ?`,
      value: v,
      explanation: div === 4 ? [`Half of ${x} = ${x / 2}.`, `Half again = ${v}.`] : div === 5 ? [`${x} ÷ 10 = ${x / 10}.`, `Double = ${v}.`] : [`${x} ÷ ${div} = ${v}.`],
      thinkAbout: A3_THINK,
    });
  }
  const pots = Array.from({ length: 50 }, (_, i) => 12 * (i + 1));
  if (d === 2) return fractionOfPot(rng, L, pots.slice(0, 20), [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4]]);
  if (rng.chance(0.5)) {
    return fractionOfPot(rng, L, [...pots.slice(10), 135, 165, 225, 270, 315, 450, 600, 750, 900], [[1, 3], [2, 3], [3, 4], [1, 4]]);
  }
  const div = rng.pick([6, 8, 12]);
  const v = rng.int(4, 30);
  const x = v * div;
  return make({
    level: L,
    type: 'divideHard',
    typeLabel: 'Divide by 6 / 8 / 12',
    prompt: `${chips(x)} ÷ ${div} = ?`,
    value: v,
    explanation:
      div === 8
        ? [`Half: ${x / 2}.`, `Half again: ${x / 4}.`, `Half again: ${v}.`]
        : [`Half: ${x / 2}.`, `÷ ${div / 2}: ${v}.`],
    thinkAbout: A3_THINK,
  });
}

// ─── A4 · Fractions ↔ percentages ────────────────────────────────────────────

const A4_THINK = 'Know the table cold: ½ 50%, ⅓ 33%, ¼ 25%, ⅕ 20%, ⅙ 17%, ⅐ 14%, ⅛ 12.5%, ⅑ 11%, 1/10 10%. For 3/8, take ⅛ (12.5%) three times.';

function fractionToPct(rng: Rng, L: string, fractions: [number, number][]): Question {
  const [n, d] = rng.pick(fractions);
  const v = (n / d) * 100;
  return make({
    level: L,
    type: 'fracToPct',
    typeLabel: 'Fraction → %',
    prompt: `${n}/${d} as a percentage?`,
    value: v,
    unit: '%',
    tolerance: Number.isInteger(v) ? T.arithmeticExact : T.arithmeticRounded,
    explanation: n === 1 ? [`1 ÷ ${d} = ${num(1 / d, 4)} = ${pct(v)}.`] : [`1/${d} = ${pct(100 / d)}.`, `× ${n} = ${pct(v)}.`],
    thinkAbout: A4_THINK,
    mistakes: [
      { value: 100 - v, text: `That is the other part (${d - n}/${d}). You want ${n}/${d}.` },
      { value: (d / n) * 10, text: 'You divided the wrong way round — it is the top number ÷ the bottom number.' },
    ],
  });
}

export function generateA4(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A4';
  if (d === 0) return fractionToPct(rng, L, [[1, 2], [1, 4], [3, 4], [1, 10], [1, 5], [2, 5], [3, 5], [4, 5], [3, 10]]);
  if (d === 1) {
    if (rng.chance(0.6)) return fractionToPct(rng, L, [[1, 3], [2, 3], [1, 8], [3, 8], [1, 6], [5, 8], [7, 8]]);
    const [p, den] = rng.pick([[50, 2], [25, 4], [20, 5], [10, 10], [12.5, 8], [5, 20]] as [number, number][]);
    return make({
      level: L,
      type: 'pctToFraction',
      typeLabel: '% → "1 in ?"',
      prompt: `${num(p)}% is 1 in how many?`,
      value: den,
      explanation: [`100 ÷ ${num(p)} = ${den}.`, `So ${num(p)}% = 1/${den}.`],
      thinkAbout: A4_THINK,
    });
  }
  if (d === 2) {
    const p = rng.pick([10, 20, 25, 50, 75, 40, 60, 30]);
    const base = rng.pick([40, 60, 80, 120, 150, 160, 200, 240, 300, 400].filter((b) => (b * p) % 100 === 0));
    const v = (base * p) / 100;
    return make({
      level: L,
      type: 'pctOf',
      typeLabel: '% of a number',
      prompt: `${p}% of ${base} = ?`,
      value: v,
      explanation: p === 10 ? [`10% of ${base}: move the decimal point one place = ${v}.`] : [`10% of ${base} = ${base / 10}.`, `${p}% = ${p / 10} × ${base / 10} = ${v}.`],
      thinkAbout: 'Find 10% (move the decimal point one place), then scale: 30% = 3 × 10%; 25% = a quarter; 75% = three quarters.',
      mistakes: [{ value: base - v, text: `That is ${100 - p}% of ${base} — the remainder, not ${p}%.` }],
    });
  }
  if (rng.chance(0.7)) return fractionToPct(rng, L, [[1, 6], [1, 7], [1, 9], [2, 7], [3, 7], [5, 6], [5, 8], [4, 9], [1, 12]]);
  const base = 8 * rng.int(5, 40);
  return make({
    level: L,
    type: 'pctOfHard',
    typeLabel: '12.5% of a number',
    prompt: `12.5% of ${base} = ?`,
    value: base / 8,
    explanation: ['12.5% = ⅛.', `${base} ÷ 8 = ${base / 8} (half, half, half).`],
    thinkAbout: A4_THINK,
  });
}

// ─── A5 · Harder division to % ───────────────────────────────────────────────

const A5_THINK = 'Simplify first (40 ÷ 140 = 4 ÷ 14 = 2 ÷ 7), then match a fraction you know (⅐ ≈ 14.3%, so 2/7 ≈ 28.6%). Or find 10% of the bottom number and count how many fit into the top.';

function divisionPct(L: string, type: string, typeLabel: string, a: number, b: number, extra: string[] = []): Question {
  const v = (a / b) * 100;
  const exact = Math.abs(v - Math.round(v)) < 1e-9;
  return make({
    level: L,
    type,
    typeLabel,
    prompt: `${chips(a)} ÷ ${chips(b)} as a %?${exact ? '' : ' (nearest whole %)'}`,
    value: v,
    unit: '%',
    tolerance: exact ? T.arithmeticExact : T.arithmeticRounded,
    explanation: [...extra, `${chips(a)} ÷ ${chips(b)} = ${num(a / b, 3)} = ${pct(v)}.`],
    thinkAbout: A5_THINK,
    mistakes: [
      { value: (b / a) * 100, text: 'You divided the wrong way round — the smaller number (the call) goes on top.' },
      { value: (a / (b - a)) * 100, text: `You divided by ${chips(b - a)} (the rest) instead of the whole ${chips(b)}.` },
    ],
  });
}

const KNOWN_FRACTIONS: [number, number][] = [[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [3, 4], [2, 5], [1, 6], [1, 8], [3, 8], [1, 10], [3, 10]];

export function generateA5(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A5';
  if (d === 0) {
    const b = rng.pick([20, 50, 100, 200, 400]);
    // A whole-number answer: pick the % first, keeping the top a whole number.
    const p = rng.pick(Array.from({ length: 60 }, (_, i) => i + 1).filter((x) => (b * x) % 100 === 0));
    const a = (b * p) / 100;
    return divisionPct(L, 'roundBottom', 'Divide by a round number', a, b, [b === 100 ? 'Out of 100 it is already a %.' : `Scale the bottom to 100: × ${num(100 / b, 2)}.`]);
  }
  if (d === 1) {
    const [n, den] = rng.pick(KNOWN_FRACTIONS);
    const k = rng.pick([5, 10, 15, 20, 25, 30]);
    return divisionPct(L, 'simplify', 'Simplify to a known fraction', n * k, den * k, [`Divide both by ${k}: ${n}/${den}.`]);
  }
  if (d === 2) {
    const pot = CONFIG.potUnit * rng.int(1, 10);
    const bet = Math.round(pot * rng.pick(CONFIG.betFractions));
    return divisionPct(L, 'potOdds', 'Call ÷ final pot', bet, pot + 2 * bet);
  }
  const a = rng.int(11, 99);
  const b = Math.round(a * (2.2 + rng.next() * 4));
  return divisionPct(L, 'awkward', 'Awkward division', a, b, [`10% of ${b} = ${num(b / 10, 1)}; ${a} is about ${num(a / (b / 10), 1)} of those.`]);
}

// ─── A6 · Multi-step poker sums ──────────────────────────────────────────────

const A6_THINK = 'One step at a time, and hold the middle number in your head: work out the final pot (or total) first, then divide.';

export function generateA6(rng: Rng, opts?: GenOptions): Question {
  const d = diff(opts);
  const L = 'A6';
  const pool: (() => Question)[] = [];

  const comboOuts = () => {
    const [a, b, overlap, names] = rng.pick([
      [9, 8, 2, 'a flush draw (9) and an open-ender (8)'],
      [9, 4, 1, 'a flush draw (9) and a gutshot (4)'],
      [9, 8, 2, 'a flush draw (9) and a double gutshot (8)'],
      [6, 4, 0, 'two overcards (6) and a gutshot (4)'],
    ] as [number, number, number, string][]);
    return make({
      level: L,
      type: 'comboOuts',
      typeLabel: 'Combo draw outs',
      prompt: `You have ${names}. ${overlap} card${overlap === 1 ? '' : 's'} complete${overlap === 1 ? 's' : ''} both. How many outs?`,
      value: a + b - overlap,
      unit: 'outs',
      explanation: [`${a} + ${b} = ${a + b}.`, `Minus ${overlap} counted twice = ${a + b - overlap}.`],
      thinkAbout: 'Add the draws, then take away every card you counted twice.',
      mistakes: [{ value: a + b, text: `You counted the ${overlap} shared card${overlap === 1 ? '' : 's'} twice — subtract them.` }],
    });
  };

  const equityToOdds = () => {
    const e = rng.pick([50, 25, 20, 10, 40, 12.5, 5]);
    const v = (100 - e) / e;
    return make({
      level: L,
      type: 'oddsFromEquity',
      typeLabel: 'Equity → odds',
      prompt: `Equity ${num(e)}%. Odds against as X:1 — what is X? Work out (100 − ${num(e)}) ÷ ${num(e)}.`,
      value: v,
      unit: ':1',
      explanation: [`100 − ${num(e)} = ${num(100 - e)}.`, `${num(100 - e)} ÷ ${num(e)} = ${num(v, 2)}.`],
      thinkAbout: 'Odds against = losses : wins. Out of 100, you lose (100 − e) and win e.',
      mistakes: [
        { value: 100 / e, text: `100 ÷ ${num(e)} counts every outcome. Take away the 1 win: odds are ${num(v, 2)}:1.` },
        { value: e / (100 - e), text: 'That is wins : losses. Odds against is losses : wins — flip it.' },
      ],
    });
  };

  const oddsToPct = () => {
    const x = rng.pick([1, 2, 3, 4, 5, 9, 19, 1.5, 7]);
    const v = 100 / (x + 1);
    return make({
      level: L,
      type: 'pctFromOdds',
      typeLabel: 'Odds → %',
      prompt: `Odds of ${num(x)}:1 against. What equity % is that?`,
      value: v,
      unit: '%',
      tolerance: T.arithmeticRounded,
      explanation: [`${num(x)}:1 is ${num(x)} losses + 1 win = ${num(x + 1)} outcomes.`, `100 ÷ ${num(x + 1)} = ${pct(v)}.`],
      thinkAbout: 'Add the two sides of the ratio to get the total, then 1 ÷ total.',
      mistakes: [{ value: 100 / x, text: `You divided by ${num(x)}. Add the 1 win first: 100 ÷ (${num(x)} + 1).` }],
    });
  };

  const rule4 = () => {
    const outs = rng.int(9, 20);
    const v = outs * 4 - (outs - 8);
    return make({
      level: L,
      type: 'rule4',
      typeLabel: 'Rule of 4 above 8 outs',
      prompt: `Flop, ${outs} outs: work out ${outs} × 4 − (${outs} − 8).`,
      value: v,
      unit: '%',
      explanation: [`${outs} × 4 = ${outs * 4}.`, `${outs} − 8 = ${outs - 8}.`, `${outs * 4} − ${outs - 8} = ${v}.`],
      thinkAbout: 'Multiply first, then subtract the correction (outs − 8).',
      mistakes: [{ value: outs * 4, text: `You skipped the correction: subtract (${outs} − 8) = ${outs - 8}.` }],
    });
  };

  const potOdds = (hard: boolean) => {
    const pot = hard ? rng.int(21, 180) : CONFIG.potUnit * rng.int(1, 10);
    const bet = hard ? rng.int(8, Math.round(pot * 1.2)) : Math.round(pot * rng.pick(CONFIG.betFractions));
    const final = pot + 2 * bet;
    const v = (bet / final) * 100;
    return make({
      level: L,
      type: hard ? 'potOddsHard' : 'potOdds',
      typeLabel: hard ? 'Pot odds chain (uneven)' : 'Pot odds chain',
      prompt: `The pot is ${pot}. Your opponent bets ${bet} and you call. What % of the final pot is your call?`,
      value: v,
      unit: '%',
      tolerance: T.arithmeticRounded,
      explanation: [`Final pot = ${pot} + ${bet} + ${bet} = ${final}.`, `${bet} ÷ ${final} = ${pct(v)}.`],
      thinkAbout: A6_THINK,
      mistakes: [
        { value: (bet / pot) * 100, text: `You divided by the old pot (${pot}). Add the bet and your call first: ${final}.` },
        { value: (bet / (pot + bet)) * 100, text: `You left your own call out of the final pot: it is ${final}, not ${pot + bet}.` },
      ],
    });
  };

  const raiseChain = () => {
    const pot = 10 * rng.int(4, 20);
    const myBet = roundTo(pot * rng.pick([1 / 2, 2 / 3, 3 / 4]), 5);
    const raiseTo = roundTo(myBet * rng.pick([2.5, 3]), 5);
    const call = raiseTo - myBet;
    const final = pot + 2 * raiseTo;
    const v = (call / final) * 100;
    return make({
      level: L,
      type: 'raiseChain',
      typeLabel: 'Pot odds after a raise',
      prompt: `The pot is ${pot}. You bet ${myBet}; your opponent raises to ${raiseTo}. You call. What % of the final pot is your call?`,
      value: v,
      unit: '%',
      tolerance: T.arithmeticRounded,
      explanation: [`Your call = ${raiseTo} − ${myBet} = ${call}.`, `Final pot = ${pot} + 2 × ${raiseTo} = ${final}.`, `${call} ÷ ${final} = ${pct(v)}.`],
      thinkAbout: A6_THINK,
      mistakes: [
        { value: (raiseTo / final) * 100, text: `Your call is only the extra ${call}, not ${raiseTo}.` },
        { value: (call / (pot + myBet + raiseTo)) * 100, text: `Include your ${call} call in the final pot (${final}).` },
      ],
    });
  };

  if (d === 0) pool.push(comboOuts, equityToOdds, oddsToPct);
  if (d === 1) pool.push(equityToOdds, oddsToPct, rule4);
  if (d === 2) pool.push(rule4, () => potOdds(false));
  if (d === 3) pool.push(() => potOdds(true), raiseChain);
  return rng.pick(pool)();
}
