import { Rng, pick, shuffle } from '@/poker/cards';
import { bluffBreakEven, bluffShare, bluffsPerValue, exactEquity, requiredEquity, ruleOfFourTwo } from '@/poker/equity';
import { describeDraw, makeOutsSpot } from '@/poker/outs';
import { BET_SIZES, DRAWS, fixedChoices, money, numericChoices, pct, potAndBet, textChoices } from './choices';
import { EXPLOIT_CONCEPTS, IMPLIED_CONCEPTS, SIZING_CONCEPTS, conceptQuestion } from './concepts';
import { outsExplanation, potOddsWorking } from './foundations';
import { Level, Question } from './types';

// ---------- Level 5: full call/fold decisions ----------

export const decisionLevel: Level = {
  id: 'decision',
  number: 5,
  title: 'Call or Fold',
  summary: 'Outs → equity → pot odds → decision, against the clock.',
  timeLimit: 30,
  generate(rng) {
    // Aim for an even split of calls and folds.
    const wantCall = rng() < 0.5;
    for (;;) {
      const spot = makeOutsSpot(rng);
      const n = spot.outs.all.length;
      // Flop: villain is all-in, so you see two cards. Turn: one card to come.
      const cards = spot.street === 'flop' ? 2 : 1;
      const { pot, bet } = potAndBet(rng, [0.33, 0.5, 0.66, 0.75, 1, 1.5, 2]);
      const rule = ruleOfFourTwo(n, cards);
      const req = requiredEquity(pot, bet) * 100;
      const exact = exactEquity(n, cards) * 100;
      // Only keep spots where the shortcut and the exact maths agree clearly.
      if (Math.abs(rule - req) < 4 || rule > req !== exact > req) continue;
      const call = rule > req;
      if (call !== wantCall) continue;
      return {
        prompt:
          spot.street === 'flop'
            ? `Villain goes all-in for $${bet} into $${pot}. Call or fold?`
            : `Villain bets $${bet} into $${pot} on the turn. Call or fold?`,
        hole: spot.hole,
        board: spot.board,
        facts: [
          { label: 'Pot', value: money(pot) },
          { label: spot.street === 'flop' ? 'All-in' : 'Bet', value: money(bet), accent: true },
        ],
        ...fixedChoices(['Fold', 'Call'], call ? 'Call' : 'Fold'),
        explanation: [
          `${call ? 'Call' : 'Fold'}: ${rule}% equity vs ${pct(req)} needed.`,
          `Your draw: ${describeDraw(spot.outs)}. ${n} outs × ${cards === 2 ? 4 : 2}${cards === 2 && n > 9 ? ` − ${n - 8}` : ''} ≈ ${rule}%.`,
          potOddsWorking(pot, bet)[1],
          ...outsExplanation(spot.outs).slice(1),
        ],
        reveal: { label: 'Your outs', cards: spot.outs.all },
      };
    }
  },
};

// ---------- Level 6: bet sizing ----------

const SIZE_PCTS = [25, 33, 50, 66, 75, 100, 125, 150];

function denialQuestion(rng: Rng): Question {
  for (;;) {
    const draw = pick(DRAWS, rng);
    const equity = draw.outs * 2;
    const sizes = shuffle(SIZE_PCTS, rng).slice(0, 4).sort((a, b) => a - b);
    const needs = sizes.map((s) => (s / (100 + 2 * s)) * 100);
    if (needs.some((r) => Math.abs(r - equity) < 1.5)) continue;
    const idx = needs.findIndex((r) => r > equity);
    if (idx < 0) continue;
    return {
      prompt: `It's the turn. Villain has ${draw.name} (${draw.outs} outs ≈ ${equity}%). What's your smallest bet that makes their call a mistake?`,
      facts: [
        { label: 'Their outs', value: String(draw.outs) },
        { label: 'Their equity', value: `${equity}%`, accent: true },
      ],
      choices: sizes.map((s) => `${s}% pot`),
      answer: idx,
      explanation: [
        `${sizes[idx]}% pot: they'd need ${pct(needs[idx])}, more than their ${equity}%.`,
        ...sizes.map((s, i) => `${s}% pot → they need ${s} ÷ (100 + ${2 * s}) = ${pct(needs[i])}.`),
        'This ignores implied odds. If they can win more when they hit, you need to bet bigger still.',
      ],
    };
  }
}

function villainNeedsQuestion(rng: Rng): Question {
  const { pot, bet } = potAndBet(rng);
  const req = requiredEquity(pot, bet) * 100;
  return {
    prompt: `You bet $${bet} into $${pot}. What equity does your opponent need to call?`,
    facts: [
      { label: 'Pot', value: money(pot) },
      { label: 'Your bet', value: money(bet), accent: true },
    ],
    ...numericChoices(req, [(bet / (pot + bet)) * 100, (bet / pot) * 100], pct, rng, 5, 100),
    explanation: [`${pct(req)}.`, ...potOddsWorking(pot, bet, true)],
  };
}

export const sizingLevel: Level = {
  id: 'sizing',
  number: 6,
  title: 'Bet Sizing',
  summary: 'Size bets to deny equity to draws and narrow ranges.',
  generate: (rng) => pick([denialQuestion, denialQuestion, villainNeedsQuestion, conceptQuestion(SIZING_CONCEPTS)], rng)(rng),
};

// ---------- Level 7: implied and reverse implied odds ----------

function effectiveRequired(rng: Rng): Question {
  const { pot, bet } = potAndBet(rng, [0.5, 0.66, 0.75, 1]);
  const implied = Math.round((pot * (0.5 + rng() * 1.5)) / 10) * 10;
  const req = requiredEquity(pot, bet, implied) * 100;
  const finalPot = pot + 2 * bet;
  return {
    prompt: `You expect to win $${implied} more on later streets when you hit. What's your effective required equity?`,
    facts: [
      { label: 'Pot', value: money(pot) },
      { label: 'Bet', value: money(bet), accent: true },
      { label: 'Implied', value: money(implied) },
    ],
    ...numericChoices(req, [requiredEquity(pot, bet) * 100, (bet / (pot + bet + implied)) * 100], pct, rng, 4),
    explanation: [
      `${pct(req)}, down from ${pct(requiredEquity(pot, bet) * 100)} without implied odds.`,
      `$${bet} ÷ ($${finalPot} final pot + $${implied} future winnings) = $${bet} ÷ $${finalPot + implied} = ${pct(req)}.`,
    ],
  };
}

function breakEvenImplied(rng: Rng): Question {
  for (;;) {
    const draw = pick(DRAWS.filter((d) => d.outs <= 9), rng);
    const equity = draw.outs * 2;
    const { pot, bet } = potAndBet(rng, [0.5, 0.66, 0.75, 1]);
    const finalPot = pot + 2 * bet;
    const totalNeeded = Math.round(bet / (equity / 100));
    const needed = Math.round((totalNeeded - finalPot) / 5) * 5;
    if (needed < 20 || needed > 6 * pot) continue;
    return {
      prompt: `Turn: you have ${draw.name} (${draw.outs} outs ≈ ${equity}%). How much more must you win on the river when you hit to make this call break even?`,
      facts: [
        { label: 'Pot', value: money(pot) },
        { label: 'Bet', value: money(bet), accent: true },
      ],
      ...numericChoices(needed, [totalNeeded, needed * 2, needed / 2], money, rng, Math.max(10, Math.round(needed / 4))),
      explanation: [
        `About $${needed}.`,
        `To break even the call must be ${equity}% of what you win: $${bet} ÷ ${equity}% = $${totalNeeded}.`,
        `The final pot is already $${finalPot}, so you need about $${needed} more when you hit.`,
      ],
    };
  }
}

export const impliedLevel: Level = {
  id: 'implied',
  number: 7,
  title: 'Implied & Reverse Implied Odds',
  summary: 'Adjust required equity for future money. Nut vs non-nut draws.',
  generate: (rng) => pick([effectiveRequired, breakEvenImplied, conceptQuestion(IMPLIED_CONCEPTS)], rng)(rng),
};

// ---------- Level 8: GTO bluff frequency ----------

const sizeLabels = BET_SIZES.map((s) => s.label);

export const bluffLevel: Level = {
  id: 'bluffing',
  number: 8,
  title: 'GTO Bluff Frequency',
  summary: 'How often bluffs must work, and how many belong in your range.',
  generate(rng) {
    const size = pick(BET_SIZES, rng);
    const kind = pick(['breakEven', 'share', 'reverseBreakEven', 'reverseShare'] as const, rng);
    const be = bluffBreakEven(size.fraction) * 100;
    const share = bluffShare(size.fraction) * 100;
    const shareWhy = `Bet ÷ (pot + 2 × bet) = ${size.fraction.toFixed(2)} ÷ ${(1 + 2 * size.fraction).toFixed(2)} = ${pct(share)}. That's the same price your opponent gets, so their bluff-catchers break even.`;
    const beWhy = `Bet ÷ (pot + bet) = ${size.fraction.toFixed(2)} ÷ ${(1 + size.fraction).toFixed(2)} = ${pct(be)}.`;
    const others = (label: string) => shuffle(sizeLabels.filter((l) => l !== label), rng).slice(0, 3);

    switch (kind) {
      case 'breakEven':
        return {
          prompt: `You bluff ${size.label} on the river. How often must villain fold for the bluff to break even?`,
          display: size.label,
          ...numericChoices(be, [share, 100 - be], pct, rng, 5),
          explanation: [`${pct(be)}.`, beWhy, 'Bigger bets need more folds to work.'],
        };
      case 'share':
        return {
          prompt: `You bet ${size.label} on the river. What share of your betting range should be bluffs to stay balanced?`,
          display: size.label,
          ...numericChoices(share, [be, 100 - share], pct, rng, 4),
          explanation: [`${pct(share)} bluffs.`, shareWhy, 'Bigger bets give villain a worse price, so they allow more bluffs.'],
        };
      case 'reverseBreakEven': {
        const c = textChoices(size.label, others(size.label), rng);
        return {
          prompt: `Your bluff needs villain to fold ${pct(be)} of the time to break even. What size is it?`,
          display: pct(be),
          ...c,
          explanation: [size.label + '.', beWhy],
        };
      }
      case 'reverseShare': {
        const c = textChoices(size.label, others(size.label), rng);
        return {
          prompt: `Your river betting range is ${pct(share)} bluffs. Which size keeps it balanced?`,
          display: `${pct(share)} bluffs`,
          ...c,
          explanation: [size.label + '.', shareWhy],
        };
      }
    }
  },
};

// ---------- Level 9: range construction ----------

export const rangeLevel: Level = {
  id: 'ranges',
  number: 9,
  title: 'Range Construction',
  summary: 'Balance value hands and bluffs across a whole range.',
  generate(rng) {
    const size = pick(BET_SIZES, rng);
    const ratio = bluffsPerValue(size.fraction);
    // Pick a value count that gives a whole number of bluffs.
    const candidates = Array.from({ length: 30 }, (_, i) => i + 4).filter((v) => Number.isInteger(Math.round(v * ratio * 1e6) / 1e6));
    const value = pick(candidates, rng);
    const bluffs = Math.round(value * ratio);
    const working = `At ${size.label}, bluffs : value = ${size.fraction.toFixed(2)} : ${(1 + size.fraction).toFixed(2)}, so ${value} value × ${ratio.toFixed(2)} = ${bluffs} bluffs.`;
    const shareLine = `Bluffs are then ${bluffs} ÷ ${value + bluffs} = ${pct((bluffs / (value + bluffs)) * 100)} of your betting range.`;
    const kind = pick(['count', 'size', 'check'] as const, rng);

    if (kind === 'count') {
      return {
        prompt: `You bet ${size.label} on the river with ${value} value combos. How many bluff combos balance it?`,
        facts: [
          { label: 'Size', value: size.label },
          { label: 'Value combos', value: String(value), accent: true },
        ],
        ...numericChoices(bluffs, [value, Math.round(value * bluffShare(size.fraction)), bluffs + 2, bluffs - 2], String, rng, 1),
        explanation: [`${bluffs} bluffs.`, working, shareLine],
      };
    }
    if (kind === 'size') {
      const c = textChoices(size.label, shuffle(sizeLabels.filter((l) => l !== size.label), rng).slice(0, 3), rng);
      return {
        prompt: `Your river range has ${value} value combos and ${bluffs} bluffs. Which bet size is balanced?`,
        facts: [
          { label: 'Value', value: String(value) },
          { label: 'Bluffs', value: String(bluffs), accent: true },
        ],
        ...c,
        explanation: [size.label + '.', working, shareLine],
      };
    }
    const delta = pick([-3, -2, 0, 0, 2, 3], rng);
    const actual = Math.max(0, bluffs + delta);
    const verdict = actual > bluffs ? 'Too many bluffs' : actual < bluffs ? 'Too few bluffs' : 'Balanced';
    return {
      prompt: `You bet ${size.label} with ${value} value combos and ${actual} bluffs. How is your range?`,
      facts: [
        { label: 'Size', value: size.label },
        { label: 'Value', value: String(value) },
        { label: 'Bluffs', value: String(actual), accent: true },
      ],
      ...fixedChoices(['Too few bluffs', 'Balanced', 'Too many bluffs'], verdict),
      explanation: [
        `${verdict}: balanced is ${bluffs} bluffs.`,
        working,
        verdict === 'Balanced' ? shareLine : verdict === 'Too many bluffs' ? 'Villain can exploit you by calling more.' : 'Villain can exploit you by folding more.',
      ],
    };
  },
};

// ---------- Level 10: applied / mixed ----------

let mixedSources: Level[] = [];

/** Called once the full level list exists, so level 10 can draw from levels 1-9. */
export function setMixedSources(levels: Level[]) {
  mixedSources = levels;
}

const exploitQuestion = conceptQuestion(EXPLOIT_CONCEPTS);

export const mixedLevel: Level = {
  id: 'mixed',
  number: 10,
  title: 'Applied Mixed Drills',
  summary: 'Everything at random, against the clock, plus exploit reads.',
  timeLimit: 30,
  generate(rng) {
    if (rng() < 0.15) return { ...exploitQuestion(rng), tag: 'Exploit reads' };
    const source = pick(mixedSources, rng);
    return { ...source.generate(rng), tag: `${source.number}. ${source.title}` };
  },
};
