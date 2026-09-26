import { CONFIG } from '../config';
import { balancedBluffShare, bluffCombos, bluffsPerValueCombo, valueCombosForBluffs } from '../engine/formulas';
import type { Rng } from '../engine/rng';
import { num, pct, sizeName } from './format';
import type { Question } from './types';

/** Choose a combo count that makes the answer a whole number. */
function denominatorFor(fraction: number): { per: number; unit: number } {
  // bluffs per value = f ÷ (1 + f) as a reduced fraction n/d.
  for (let d = 1; d <= 20; d++) {
    const n = (fraction / (1 + fraction)) * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return { per: Math.round(n), unit: d };
  }
  throw new Error(`no whole-number ratio for ${fraction}`);
}

const THINK = 'Bluffs per value combo = B ÷ (P + B), the same as the caller\'s pot odds. Bigger bets allow more bluffs. Check: bluffs ÷ all bets should equal B ÷ (P + 2B).';

function checkLine(value: number, bluffs: number, fraction: number): string {
  return `Check: bluffs ÷ all bets = ${num(bluffs, 1)} ÷ ${num(value + bluffs, 1)} = ${pct((bluffs / (value + bluffs)) * 100)} = the balanced bluff share B ÷ (P + 2B) = ${pct(balancedBluffShare(1, fraction) * 100)}.`;
}

export function generateLevel9(rng: Rng): Question {
  const fraction = rng.pick(CONFIG.betFractions);
  const { per, unit } = denominatorFor(fraction);
  const k = rng.int(1, Math.max(1, Math.floor(40 / unit)));
  const value = unit * k;
  const bluffs = bluffCombos(value, 1, fraction);
  const ratio = bluffsPerValueCombo(1, fraction);
  const ratioLine = `Bluffs per value combo = B ÷ (P + B) = ${num(fraction, 3)} ÷ ${num(1 + fraction, 3)} = ${per}/${unit} (the caller's pot odds).`;

  if (rng.chance(0.65)) {
    return {
      type: 'L9.bluffs',
      typeLabel: 'Bluffs to add',
      sourceLevel: '9',
      prompt: `You bet a ${sizeName(fraction)} on the river with ${value} value combos. How many bluff combos balance the range?`,
      answer: { kind: 'number', value: bluffs, tolerance: CONFIG.tolerance.combos, unit: 'combos' },
      answerText: `${num(bluffs)} combos`,
      explanation: [ratioLine, `Bluffs = ${value} × ${per}/${unit} = ${num(bluffs)}.`, checkLine(value, bluffs, fraction)],
      hint: {
        thinkAbout: THINK,
        mistakes: [
          { value: value * balancedBluffShare(1, fraction), text: 'You used the bluff share of the whole range, B ÷ (P + 2B). Per value combo it is B ÷ (P + B).' },
          { value: value * fraction, text: 'You used B ÷ P. Bluffs per value combo is B ÷ (P + B) — the caller\'s pot odds.' },
          { value: value / ratio, text: 'You divided instead of multiplied: bluffs = value × B ÷ (P + B).' },
        ],
      },
    };
  }
  const v = valueCombosForBluffs(bluffs, 1, fraction);
  return {
    type: 'L9.value',
    typeLabel: 'Value combos for bluffs',
    sourceLevel: '9',
    prompt: `You bet a ${sizeName(fraction)} on the river and have ${num(bluffs)} bluff combos. How many value combos do you need for a balanced range?`,
    answer: { kind: 'number', value: v, tolerance: CONFIG.tolerance.combos, unit: 'combos' },
    answerText: `${num(v)} combos`,
    explanation: [ratioLine, `Value = bluffs ÷ ${num(ratio, 3)} = ${num(bluffs)} × ${unit}/${per} = ${num(v)}.`, checkLine(v, bluffs, fraction)],
    hint: {
      thinkAbout: THINK,
      mistakes: [{ value: bluffs * ratio, text: 'You multiplied. To go from bluffs back to value combos, divide by B ÷ (P + B).' }],
    },
  };
}
