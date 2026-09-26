import { CONFIG } from '../config';
import { finalPot, requiredEquity, ruleOf4And2Pct } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { equitySteps, outsSteps } from './explain';
import { bb, pct } from './format';
import { dealDrawSpot, dealPotAndBet, type DrawSpot, OVERCARDS_STATEMENT } from './spots';
import type { Question } from './types';

export interface CallFoldSpot {
  spot: DrawSpot;
  pot: number;
  bet: number;
  equityPct: number;
  requiredPct: number;
}

/**
 * Deal a call/fold spot that is never within the borderline margin. Calls and
 * folds are equally likely, so "always fold" never scores well.
 */
export function dealCallFoldSpot(rng: Rng): CallFoldSpot {
  const wantCall = rng.chance(0.5);
  for (let attempt = 0; ; attempt++) {
    const spot = dealDrawSpot(rng);
    const { pot, bet } = dealPotAndBet(rng);
    const equityPct = ruleOf4And2Pct(spot.outs.cards.length, spot.street);
    const requiredPct = requiredEquity(pot, bet, bet) * 100;
    if (Math.abs(equityPct - requiredPct) < CONFIG.borderlineMarginPct) continue;
    if (equityPct > requiredPct !== wantCall && attempt < 200) continue;
    return { spot, pot, bet, equityPct, requiredPct };
  }
}

export function generateLevel5(rng: Rng): Question {
  const s = dealCallFoldSpot(rng);
  const { spot, pot, bet, equityPct, requiredPct } = s;
  const call = equityPct > requiredPct;
  const fp = finalPot(pot, bet, bet);
  // On the flop the opponent is all-in, so two cards really do come.
  const action = spot.street === 'flop' ? `moves all-in for ${bb(bet)}` : `bets ${bb(bet)}`;
  return {
    type: 'L5.callFold',
    typeLabel: 'Call or fold',
    sourceLevel: '5',
    prompt: `${spot.street === 'flop' ? 'Flop' : 'Turn'}. The pot is ${bb(pot)} and your opponent ${action}. Call or fold?${spot.overcardsStated ? ` ${OVERCARDS_STATEMENT}` : ''}`,
    cards: { hero: spot.hero, board: spot.board },
    facts: [
      { label: 'Pot', value: bb(pot) },
      { label: spot.street === 'flop' ? 'Opponent all-in' : 'Opponent bets', value: bb(bet) },
    ],
    answer: {
      kind: 'choice',
      options: [
        { id: 'call', label: 'Call' },
        { id: 'fold', label: 'Fold' },
      ],
      correct: call ? 'call' : 'fold',
    },
    answerText: call ? 'Call' : 'Fold',
    explanation: [
      ...outsSteps(spot),
      ...equitySteps(spot.outs.cards.length, spot.street),
      `Required equity = ${bet} ÷ (${pot} + ${bet} + ${bet}) = ${bet} ÷ ${fp} = ${pct(requiredPct)}.`,
      `${pct(equityPct)} ${call ? '>' : '<'} ${pct(requiredPct)}, so ${call ? 'call' : 'fold'}.`,
    ],
    hint: {
      thinkAbout: 'Run the loop every time: outs → equity (Rule of 4 and 2) → required equity (call ÷ final pot) → call only if your equity is higher.',
      choices: call
        ? { fold: `You have ${pct(equityPct)} but only need ${pct(requiredPct)} — folding gives up a profitable call. Check your outs count and the final pot.` }
        : { call: `You need ${pct(requiredPct)} but only have ${pct(equityPct)}. Did you count too many outs, or forget the bet and your call in the final pot?` },
    },
  };
}
