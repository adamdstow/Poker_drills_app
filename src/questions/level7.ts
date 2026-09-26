import { CONFIG } from '../config';
import { cardLabel, cardsLabel } from '../engine/cards';
import { categoryName } from '../engine/evaluator';
import { finalPot, impliedRequiredEquity, impliedWinningsNeeded, requiredEquity, ruleOf4And2Pct } from '../engine/formulas';
import { checkNuts } from '../engine/nuts';
import type { Rng } from '../engine/rng';
import { outsSteps } from './explain';
import { bb, pct } from './format';
import { dealDrawSpot, dealPotAndBet, type DrawTarget } from './spots';
import type { Question } from './types';

const T = CONFIG.tolerance;

function winningsNeeded(rng: Rng): Question {
  for (;;) {
    const spot = dealDrawSpot(rng, { street: 'turn' });
    const { pot, bet } = dealPotAndBet(rng);
    const outs = spot.outs.cards.length;
    const e = ruleOf4And2Pct(outs, 'turn');
    const req = requiredEquity(pot, bet, bet) * 100;
    if (req - e < CONFIG.borderlineMarginPct) continue; // only spots that are a fold on direct odds
    const fp = finalPot(pot, bet, bet);
    const value = impliedWinningsNeeded(bet, e / 100, fp);
    return {
      type: 'L7.winningsNeeded',
      typeLabel: 'Implied odds: winnings needed',
      sourceLevel: 7,
      prompt: `Turn. The pot is ${bb(pot)} and your opponent bets ${bb(bet)}. You have ${outs} outs ≈ ${e}% equity. How much more must you win on the river when you hit to make calling break even?`,
      cards: { hero: spot.hero, board: spot.board },
      facts: [
        { label: 'Pot', value: bb(pot) },
        { label: 'Opponent bets', value: bb(bet) },
        { label: 'Your equity', value: `${e}%` },
      ],
      answer: { kind: 'number', value, tolerance: Math.max(T.bbAbs, T.bbRel * value), unit: 'bb' },
      answerText: bb(value),
      explanation: [
        `Final pot = ${pot} + ${bet} + ${bet} = ${bb(fp)}; you need ${pct(req)} but have ${e}%, so the direct odds are not enough.`,
        'Future winnings needed = call ÷ equity − final pot.',
        `${bet} ÷ ${e / 100} − ${fp} = ${bb(bet / (e / 100))} − ${fp} = ${bb(value)}.`,
        'If you expect to win at least that much more when you hit, the call breaks even.',
      ],
    };
  }
}

function effectiveEquity(rng: Rng): Question {
  const { pot, bet } = dealPotAndBet(rng);
  const fp = finalPot(pot, bet, bet);
  const future = Math.round(pot * (0.5 + rng.int(0, 6) * 0.25));
  const value = impliedRequiredEquity(bet, fp, future) * 100;
  return {
    type: 'L7.effectiveEquity',
    typeLabel: 'Implied odds: effective equity',
    sourceLevel: 7,
    prompt: `The pot is ${bb(pot)} and your opponent bets ${bb(bet)}. You expect to win ${bb(future)} more on later streets when you hit. What equity do you need to call?`,
    facts: [
      { label: 'Pot', value: bb(pot) },
      { label: 'Opponent bets', value: bb(bet) },
      { label: 'Future winnings', value: bb(future) },
    ],
    answer: { kind: 'number', value, tolerance: T.percentPoints, unit: '%' },
    answerText: pct(value),
    explanation: [
      `Final pot = ${pot} + ${bet} + ${bet} = ${bb(fp)}.`,
      'Effective required equity = call ÷ (final pot + future winnings).',
      `${bet} ÷ (${fp} + ${future}) = ${bet} ÷ ${fp + future} = ${pct(value)}.`,
      `Without implied odds you would need ${pct(requiredEquity(pot, bet, bet) * 100)}.`,
    ],
  };
}

const REVERSE_TARGETS: DrawTarget[] = ['flush', 'oesd', 'gutshot', 'doubleGutshot', 'flush+oesd', 'flush+gutshot'];

function nutsOrNot(rng: Rng): Question {
  const wantNuts = rng.chance(0.5);
  for (let attempt = 0; ; attempt++) {
    const spot = dealDrawSpot(rng, { street: 'turn', target: rng.pick(REVERSE_TARGETS) });
    const river = rng.pick(spot.outs.cards);
    const board = [...spot.board, river];
    const check = checkNuts(spot.hero, board);
    if (check.isNuts !== wantNuts && attempt < 60) continue;
    const heroHand = categoryName(check.heroScore);
    const explanation = [
      ...outsSteps(spot),
      `The river ${cardLabel(river)} is one of your outs: you make a ${heroHand.toLowerCase()}.`,
    ];
    if (check.isNuts) {
      explanation.push('No two unseen cards beat you: this is the nuts. Hitting pays you off in full.');
    } else {
      const best = check.bestOpponent!;
      explanation.push(
        `Not the nuts: ${cardsLabel(best.cards)} makes a ${categoryName(best.score).toLowerCase()}, which beats you.`,
        'Reverse implied odds: when a non-nut draw hits you can still lose a big pot, so tighten calls with draws like this.',
      );
    }
    return {
      type: 'L7.reverseImplied',
      typeLabel: 'Reverse implied: nuts or not',
      sourceLevel: 7,
      prompt: `You called on the turn with a draw. The river is the ${cardLabel(river)}. Do you now have the nuts?`,
      cards: { hero: spot.hero, board, highlightBoardIndex: board.length - 1 },
      answer: {
        kind: 'choice',
        options: [
          { id: 'nuts', label: 'Yes — the nuts' },
          { id: 'notNuts', label: 'No — a better hand is possible' },
        ],
        correct: check.isNuts ? 'nuts' : 'notNuts',
      },
      answerText: check.isNuts ? 'Yes — the nuts' : 'No — a better hand is possible',
      explanation,
    };
  }
}

export function generateLevel7(rng: Rng): Question {
  return rng.weighted([
    { value: winningsNeeded, weight: 2 },
    { value: effectiveEquity, weight: 1 },
    { value: nutsOrNot, weight: 2 },
  ])(rng);
}

