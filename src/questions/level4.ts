import { CONFIG } from '../config';
import { finalPot, requiredEquity } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { bb, pct } from './format';
import { dealPotAndBet } from './spots';
import type { Question } from './types';

const THINK = 'Required equity = your call ÷ the final pot, where the final pot is the pot + their bet + your call. Your call is only what you add now.';

function facingBet(rng: Rng): Question {
  const { pot, bet } = dealPotAndBet(rng);
  const fp = finalPot(pot, bet, bet);
  const req = requiredEquity(pot, bet, bet) * 100;
  return {
    type: 'L4.bet',
    typeLabel: 'Required equity: facing a bet',
    sourceLevel: '4',
    prompt: `The pot is ${bb(pot)}. Your opponent bets ${bb(bet)}. What equity do you need to call?`,
    facts: [
      { label: 'Pot', value: bb(pot) },
      { label: 'Opponent bets', value: bb(bet) },
      { label: 'Your call', value: bb(bet) },
    ],
    answer: { kind: 'number', value: req, tolerance: CONFIG.tolerance.percentPoints, unit: '%' },
    answerText: pct(req),
    explanation: [
      `Final pot = pot + bet + your call = ${pot} + ${bet} + ${bet} = ${bb(fp)}.`,
      `Required equity = call ÷ final pot = ${bet} ÷ ${fp} = ${pct(req)}.`,
      `Trap: ${bet} ÷ ${pot} (call ÷ current pot) = ${pct((bet / pot) * 100)} is wrong — the bet and your call go into the pot too.`,
    ],
    hint: {
      thinkAbout: THINK,
      mistakes: [
        { value: (bet / pot) * 100, text: `You divided by the pot before the bet (${pot}). The final pot includes their bet and your call: ${fp}.` },
        { value: (bet / (pot + bet)) * 100, text: `You left your own call out: final pot = ${pot} + ${bet} + ${bet} = ${fp}.` },
      ],
    },
  };
}

function facingRaise(rng: Rng): Question {
  const pot = CONFIG.potUnit * rng.int(1, 8);
  const myBet = Math.round(pot * rng.pick([1 / 3, 1 / 2, 2 / 3, 3 / 4]));
  const raiseTo = myBet * rng.pick([2.5, 3, 3.5, 4]);
  const call = raiseTo - myBet;
  const fp = pot + myBet + raiseTo + call;
  const req = (call / fp) * 100;
  return {
    type: 'L4.raise',
    typeLabel: 'Required equity: facing a raise',
    sourceLevel: '4',
    prompt: `The pot is ${bb(pot)}. You bet ${bb(myBet)} and your opponent raises to ${bb(raiseTo)}. What equity do you need to call?`,
    facts: [
      { label: 'Pot before your bet', value: bb(pot) },
      { label: 'You bet', value: bb(myBet) },
      { label: 'Opponent raises to', value: bb(raiseTo) },
    ],
    answer: { kind: 'number', value: req, tolerance: CONFIG.tolerance.percentPoints, unit: '%' },
    answerText: pct(req),
    explanation: [
      `To call you put in ${raiseTo} − ${myBet} = ${bb(call)} more.`,
      `Final pot = ${pot} + your ${myBet} + their ${raiseTo} + your call ${call} = ${bb(fp)}.`,
      `Required equity = call ÷ final pot = ${call} ÷ ${fp} = ${pct(req)}.`,
    ],
    hint: {
      thinkAbout: THINK,
      mistakes: [
        { value: (raiseTo / fp) * 100, text: `Your call is only the extra ${call} (${raiseTo} − ${myBet}); your first ${myBet} is already in.` },
        { value: (call / (pot + myBet + raiseTo)) * 100, text: `Your ${call} call goes into the final pot too: ${fp}.` },
        { value: (call / pot) * 100, text: `Divide by the final pot (${fp}), not the starting pot.` },
      ],
    },
  };
}

export function generateLevel4(rng: Rng): Question {
  return rng.chance(0.75) ? facingBet(rng) : facingRaise(rng);
}
