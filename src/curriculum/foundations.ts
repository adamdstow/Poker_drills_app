import { Rng, pick, randomInt } from '@/poker/cards';
import { exactEquity, oddsToEquity, requiredEquity, ruleOfFourTwo } from '@/poker/equity';
import { OutsCount, makeOutsSpot } from '@/poker/outs';
import { DRAWS, fixedChoices, money, numericChoices, pct, potAndBet } from './choices';
import { Level, Question } from './types';

// ---------- Level 0: arithmetic ----------

function multiply(rng: Rng): Question {
  const n = 2 + randomInt(14, rng);
  const k = pick([2, 4] as const, rng);
  const answer = n * k;
  return {
    prompt: 'Work it out in your head.',
    display: `${n} × ${k}`,
    ...numericChoices(answer, [n * (6 - k), answer + k, answer - k, answer + 2, answer - 2], String, rng, 1),
    explanation: [
      `${n} × ${k} = ${answer}.`,
      k === 4
        ? `This is the Rule of 4: ${n} outs with two cards to come ≈ ${answer}%${n > 9 ? ' before the big-draw correction' : ''}.`
        : `This is the Rule of 2: ${n} outs with one card to come ≈ ${answer}%.`,
    ],
  };
}

const FRACTIONS: [label: string, value: number][] = [
  ['1/2', 1 / 2], ['1/3', 1 / 3], ['2/3', 2 / 3], ['1/4', 1 / 4], ['3/4', 3 / 4],
  ['1/5', 1 / 5], ['2/5', 2 / 5], ['1/6', 1 / 6], ['1/10', 1 / 10], ['3/10', 3 / 10],
];

function fractionToPercent(rng: Rng): Question {
  const [label, value] = pick(FRACTIONS, rng);
  const [num, den] = label.split('/');
  return {
    prompt: 'Convert the fraction to a percentage.',
    display: label,
    ...numericChoices(value * 100, FRACTIONS.map(([, v]) => v * 100), pct, rng, 5, 100),
    explanation: [`${label} = ${pct(value * 100)}.`, `${num} ÷ ${den} = ${(value).toFixed(3)} → ${pct(value * 100)}.`],
  };
}

function percentOfTotal(rng: Rng): Question {
  for (;;) {
    const total = pick([100, 120, 150, 160, 200, 240, 250, 300, 400, 500], rng);
    const [, f] = pick(FRACTIONS, rng);
    const part = total * f;
    if (Math.abs(part - Math.round(part)) > 1e-9) continue;
    return {
      prompt: `What percentage of $${total} is $${part}?`,
      display: `$${part} ÷ $${total}`,
      ...numericChoices(f * 100, [(part / (total - part)) * 100, (1 - f) * 100], pct, rng, 5, 100),
      explanation: [
        `$${part} ÷ $${total} = ${pct(f * 100)}.`,
        'Call ÷ final pot is exactly this calculation, so it turns into required equity later on.',
      ],
    };
  }
}

function percentOfAmount(rng: Rng): Question {
  for (;;) {
    const p = pick([10, 20, 25, 30, 40, 50, 75], rng);
    const amount = pick([40, 60, 80, 100, 120, 150, 200, 240, 300, 400], rng);
    const answer = (amount * p) / 100;
    if (!Number.isInteger(answer)) continue;
    const step = Math.max(5, Math.round(amount / 20));
    return {
      prompt: `What is ${p}% of $${amount}?`,
      display: `${p}% × $${amount}`,
      ...numericChoices(answer, [amount - answer, (amount * (p + 10)) / 100, (amount * (p - 5)) / 100], money, rng, step),
      explanation: [`${p}% of $${amount} = $${answer}.`, `$${amount} × ${p / 100} = $${answer}.`],
    };
  }
}

export const arithmetic: Level = {
  id: 'arithmetic',
  number: 0,
  title: 'Arithmetic Foundation',
  summary: 'Mental math: ×2 and ×4, fractions and percentages.',
  generate: (rng) => pick([multiply, fractionToPercent, percentOfTotal, percentOfAmount], rng)(rng),
};

// ---------- Level 1: counting outs ----------

export function outsExplanation(outs: OutsCount): string[] {
  const groups = [
    outs.flush.length && `flush ${outs.flush.length}`,
    outs.straight.length && `straight ${outs.straight.length}`,
    outs.overcards.length && `overcards ${outs.overcards.length}`,
  ].filter(Boolean) as string[];
  const lines = [`${outs.all.length} outs: ${groups.join(' + ')}${outs.overlap ? ` − ${outs.overlap} overlap` : ''}.`];
  if (outs.overlap) {
    lines.push(
      `${outs.overlap} card${outs.overlap > 1 ? 's complete' : ' completes'} more than one draw, so count ${outs.overlap > 1 ? 'them' : 'it'} once, not twice.`,
    );
  }
  if (outs.overcards.length) {
    lines.push('Overcard outs pair a Ten-or-better hole card that beats every board card. They only win if top pair is good.');
  }
  return lines;
}

export const outsLevel: Level = {
  id: 'outs',
  number: 1,
  title: 'Counting Outs',
  summary: 'Find the outs from your hand and the board. Don’t double-count overlaps.',
  generate(rng) {
    const spot = makeOutsSpot(rng);
    const n = spot.outs.all.length;
    return {
      prompt: 'How many outs do you have?',
      hole: spot.hole,
      board: spot.board,
      ...numericChoices(n, [n + spot.outs.overlap, n - 1, n + 1, n + 2, n - 3], String, rng, 1),
      explanation: outsExplanation(spot.outs),
      reveal: { label: 'Your outs', cards: spot.outs.all },
    };
  },
};

// ---------- Level 2: equity from outs ----------

export const equityLevel: Level = {
  id: 'equity',
  number: 2,
  title: 'Equity from Outs',
  summary: 'Rule of 4 and 2, including the correction for big draws.',
  generate(rng) {
    const draw = pick(DRAWS, rng);
    const cards = pick([1, 2] as const, rng);
    const n = draw.outs;
    const answer = ruleOfFourTwo(n, cards);
    const exact = exactEquity(n, cards) * 100;
    const where = cards === 2 ? 'on the flop and all-in, so you see the turn and river' : 'on the turn, with just the river to come';
    const working =
      cards === 1
        ? `${n} × 2 = ${answer}%.`
        : n > 9
          ? `${n} × 4 = ${n * 4}, minus ${n - 8} (1% per out above 8) = ${answer}%.`
          : `${n} × 4 = ${answer}%.`;
    return {
      prompt: `You have ${draw.name} (${n} outs). You're ${where}. Roughly what's your equity?`,
      facts: [
        { label: 'Outs', value: String(n) },
        { label: 'Cards to come', value: String(cards), accent: true },
      ],
      ...numericChoices(answer, [n * (cards === 2 ? 2 : 4), n * 4, answer + 8, answer - 6], pct, rng, 4),
      explanation: [`About ${answer}%.`, `Rule of ${cards === 2 ? 4 : 2}: ${working}`, `Exact: ${exact.toFixed(1)}%.`],
    };
  },
};

// ---------- Level 3: equity <-> odds ----------

const ODDS = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
const oddsLabel = (x: number) => `${x}:1`;

export const oddsLevel: Level = {
  id: 'odds',
  number: 3,
  title: 'Equity ↔ Odds',
  summary: 'Convert between equity % and odds ratios using the benchmark table.',
  generate(rng) {
    const x = pick(ODDS, rng);
    const equity = oddsToEquity(x) * 100;
    const eq = Math.round(equity);
    if (rng() < 0.5) {
      return {
        prompt: `You have ${eq}% equity. What are the odds against you?`,
        display: `${eq}%`,
        ...numericChoices(x, [Math.round(100 / eq), x + 1, ...ODDS], oddsLabel, rng, 1),
        explanation: [
          `${eq}% equity ≈ ${oddsLabel(x)} against.`,
          `(100 − ${eq}) : ${eq} = ${100 - eq} : ${eq} ≈ ${oddsLabel(x)}.`,
        ],
      };
    }
    return {
      prompt: `The pot is laying you ${oddsLabel(x)}. What equity do you need to call?`,
      display: oddsLabel(x),
      ...numericChoices(equity, [100 / x, ...ODDS.map((o) => oddsToEquity(o) * 100)], pct, rng, 5, 100),
      explanation: [`${oddsLabel(x)} → ${pct(equity)}.`, `1 ÷ (${x} + 1) = ${pct(equity)}. Add both sides of the ratio and divide.`],
    };
  },
};

// ---------- Level 4: pot odds and required equity ----------

export function potOddsWorking(pot: number, bet: number, youBet = false): string[] {
  const finalPot = pot + 2 * bet;
  const [bettor, caller] = youBet ? ['your bet', 'their call'] : ['their bet', 'your call'];
  return [
    `Final pot = $${pot} + $${bet} (${bettor}) + $${bet} (${caller}) = $${finalPot}.`,
    `Required equity = $${bet} ÷ $${finalPot} = ${pct(requiredEquity(pot, bet) * 100)}.`,
  ];
}

export const potOddsLevel: Level = {
  id: 'potOdds',
  number: 4,
  title: 'Pot Odds & Required Equity',
  summary: 'Calculate the final pot correctly, then the equity you need to call.',
  generate(rng) {
    const { pot, bet } = potAndBet(rng);
    const finalPot = pot + 2 * bet;
    const req = requiredEquity(pot, bet) * 100;
    const facts = [
      { label: 'Pot', value: money(pot) },
      { label: 'Villain bets', value: money(bet), accent: true },
    ];
    const kind = pick(['finalPot', 'required', 'decision'] as const, rng);

    if (kind === 'finalPot') {
      return {
        prompt: 'If you call, how big is the final pot?',
        facts,
        ...numericChoices(finalPot, [pot + bet, pot + 3 * bet, 2 * (pot + bet)], money, rng, Math.max(10, bet / 2)),
        explanation: [`$${finalPot}.`, potOddsWorking(pot, bet)[0]],
      };
    }
    if (kind === 'required') {
      return {
        prompt: 'What equity do you need to call?',
        facts,
        ...numericChoices(req, [(bet / (pot + bet)) * 100, (bet / pot) * 100], pct, rng, 5, 100),
        explanation: [`${pct(req)}.`, ...potOddsWorking(pot, bet)],
      };
    }
    const margin = 4 + randomInt(12, rng);
    const equity = Math.round(req + (rng() < 0.5 ? margin : -margin));
    if (equity <= 2 || equity >= 95) return potOddsLevel.generate(rng);
    const call = equity > req;
    return {
      prompt: `Your equity is ${equity}%. Call or fold?`,
      facts: [...facts, { label: 'Your equity', value: `${equity}%` }],
      ...fixedChoices(['Fold', 'Call'], call ? 'Call' : 'Fold'),
      explanation: [
        `${call ? 'Call' : 'Fold'}: ${equity}% is ${call ? 'more' : 'less'} than the ${pct(req)} you need.`,
        ...potOddsWorking(pot, bet),
      ],
    };
  },
};
