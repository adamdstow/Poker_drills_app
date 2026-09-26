import { cardsLabel } from '../engine/cards';
import { doubleCounted, outsSum } from '../engine/draws';
import { exactEquity, ruleOf4And2Pct, type Street } from '../engine/formulas';
import { hasTwoOvercards } from '../engine/outs';
import { pct } from './format';
import type { DrawSpot } from './spots';

/** Steps that count the outs in a spot. */
export function outsSteps(spot: DrawSpot): string[] {
  const steps: string[] = [];
  for (const d of spot.draws) {
    steps.push(`${d.name} — needs ${d.needs}: ${d.outs.length} outs (${cardsLabel(d.outs)}).`);
  }
  const twice = doubleCounted(spot.draws);
  if (twice.length) {
    steps.push(`${cardsLabel(twice)} complete${twice.length === 1 ? 's' : ''} two draws, so count ${twice.length === 1 ? 'it' : 'them'} once.`);
  }
  if (spot.draws.length > 1) steps.push(`Total outs: ${outsSum(spot.draws, spot.outs.cards.length)}.`);
  else steps.push(`Total outs: ${spot.outs.cards.length}.`);
  if (!spot.overcardsStated && hasTwoOvercards(spot.hero, spot.board)) {
    steps.push('Your overcards are not counted: the question does not say the opponent holds a pair below them.');
  }
  return steps;
}

/** Steps for outs → equity with the Rule of 4 and 2, plus the exact figure. */
export function equitySteps(outs: number, street: Street): string[] {
  const shortcut = ruleOf4And2Pct(outs, street);
  const exact = exactEquity(outs, street) * 100;
  if (street === 'turn') {
    return [
      `Turn, one card to come: outs × 2 = ${outs} × 2 = ${pct(shortcut)}.`,
      `Exact: ${outs} ÷ 46 = ${pct(exact)}.`,
    ];
  }
  const steps = [`Flop, two cards to come: outs × 4 = ${outs} × 4 = ${outs * 4}%.`];
  if (outs > 8) steps.push(`Above 8 outs subtract (outs − 8) = ${outs - 8}: ${outs * 4} − ${outs - 8} = ${pct(shortcut)}.`);
  steps.push(`Exact: 1 − C(${47 - outs},2) ÷ C(47,2) = ${pct(exact)}.`);
  return steps;
}
