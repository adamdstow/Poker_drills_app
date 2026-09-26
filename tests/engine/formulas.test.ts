import { describe, expect, it } from 'vitest';
import {
  balancedBluffShare, betFractionFromBluffShare, betFractionFromBreakEvenFold, betFractionFromMdf,
  bluffCombos, bluffEv, bluffsPerValueCombo, breakEvenFold, callerNeeds, denialBet, denialBetFraction,
  equityToOddsAgainst, exactEquity, finalPot, impliedRequiredEquity, impliedWinningsNeeded,
  minimumDefenceFrequency, oddsAgainstToEquity, requiredEquity, ruleOf4And2Pct, valueCombosForBluffs,
} from '../../src/engine/formulas';

describe('Rule of 4 and 2', () => {
  it('flop: outs × 4 up to 8 outs', () => {
    expect(ruleOf4And2Pct(4, 'flop')).toBe(16);
    expect(ruleOf4And2Pct(8, 'flop')).toBe(32);
    expect(ruleOf4And2Pct(9, 'flop')).toBe(35); // 36 − 1
  });
  it('flop: subtracts (outs − 8) above 8 outs (spec example 15 → 53)', () => {
    expect(ruleOf4And2Pct(15, 'flop')).toBe(53);
    expect(ruleOf4And2Pct(12, 'flop')).toBe(44);
  });
  it('turn: outs × 2', () => {
    expect(ruleOf4And2Pct(9, 'turn')).toBe(18);
    expect(ruleOf4And2Pct(15, 'turn')).toBe(30);
  });
});

describe('exact equity', () => {
  it('flop 15 outs = 54.1%', () => expect(exactEquity(15, 'flop') * 100).toBeCloseTo(54.1, 1));
  it('flop 9 outs = 35.0%', () => expect(exactEquity(9, 'flop') * 100).toBeCloseTo(34.97, 1));
  it('turn 9 outs = 9/46 = 19.6%', () => expect(exactEquity(9, 'turn') * 100).toBeCloseTo(19.57, 1));
  it('0 outs = 0', () => {
    expect(exactEquity(0, 'flop')).toBe(0);
    expect(exactEquity(0, 'turn')).toBe(0);
  });
});

describe('equity ↔ odds', () => {
  it.each([
    [0.5, 1], [0.25, 3], [0.2, 4], [0.1, 9],
  ])('%s equity = %s:1', (e, x) => expect(equityToOddsAgainst(e)).toBeCloseTo(x));
  it('matches the spec table within rounding', () => {
    expect(equityToOddsAgainst(0.33)).toBeCloseTo(2, 0);
    expect(equityToOddsAgainst(0.17)).toBeCloseTo(5, 0);
    expect(equityToOddsAgainst(0.14)).toBeCloseTo(6, 0);
    expect(equityToOddsAgainst(0.11)).toBeCloseTo(8, 0);
    expect(equityToOddsAgainst(0.09)).toBeCloseTo(10, 0);
  });
  it('reverses', () => {
    expect(oddsAgainstToEquity(3)).toBeCloseTo(0.25);
    expect(oddsAgainstToEquity(4)).toBeCloseTo(0.2);
  });
});

describe('pot odds', () => {
  it('spec example: pot 100, bet 50, call 50 → final pot 200, 25%', () => {
    expect(finalPot(100, 50, 50)).toBe(200);
    expect(requiredEquity(100, 50, 50)).toBeCloseTo(0.25);
    expect(callerNeeds(100, 50)).toBeCloseTo(0.25);
  });
  it('pot-size bet needs 33%', () => expect(callerNeeds(60, 60)).toBeCloseTo(1 / 3));
});

describe('denial', () => {
  it('turn flush draw (9/46) → about ⅓ pot', () => {
    expect(denialBetFraction(9 / 46)).toBeCloseTo(0.322, 2);
  });
  it('bet exactly at the threshold makes the call break-even', () => {
    const e = 0.18;
    const b = denialBet(e, 100);
    expect(callerNeeds(100, b)).toBeCloseTo(e);
  });
  it('is infinite at 50% equity', () => expect(denialBetFraction(0.5)).toBe(Infinity));
});

describe('implied odds', () => {
  it('future winnings needed = call ÷ equity − final pot', () => {
    // pot 60, bet 20, call 20 → final 100; 10% equity → need 200 total → 100 more
    expect(impliedWinningsNeeded(20, 0.1, 100)).toBeCloseTo(100);
  });
  it('effective required equity with implied winnings', () => {
    expect(impliedRequiredEquity(20, 100, 100)).toBeCloseTo(0.1);
  });
});

describe('GTO figures (corrected table)', () => {
  const cases: [string, number, number, number, number, number][] = [
    // label, pot, bet, breakEven, bluffShare, mdf
    ['½ pot', 100, 50, 1 / 3, 0.25, 2 / 3],
    ['pot', 100, 100, 0.5, 1 / 3, 0.5],
    ['2× pot', 100, 200, 2 / 3, 0.4, 1 / 3],
  ];
  it.each(cases)('%s', (_l, p, b, be, share, mdf) => {
    expect(breakEvenFold(p, b)).toBeCloseTo(be);
    expect(balancedBluffShare(p, b)).toBeCloseTo(share);
    expect(minimumDefenceFrequency(p, b)).toBeCloseTo(mdf);
    expect(bluffsPerValueCombo(p, b)).toBeCloseTo(be);
  });
  it('reverse solves return the bet fraction', () => {
    for (const f of [1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2]) {
      expect(betFractionFromBreakEvenFold(breakEvenFold(1, f))).toBeCloseTo(f);
      expect(betFractionFromBluffShare(balancedBluffShare(1, f))).toBeCloseTo(f);
      expect(betFractionFromMdf(minimumDefenceFrequency(1, f))).toBeCloseTo(f);
    }
  });
});

describe('range construction and bluff EV', () => {
  it('bluffs = N × B ÷ (P + B)', () => {
    expect(bluffCombos(12, 100, 100)).toBeCloseTo(6);
    expect(bluffCombos(12, 100, 50)).toBeCloseTo(4);
    expect(valueCombosForBluffs(6, 100, 100)).toBeCloseTo(12);
  });
  it('bluff EV: fold 60% vs pot bet is +EV', () => {
    expect(bluffEv(0.6, 100, 100)).toBeCloseTo(20);
    expect(bluffEv(0.5, 100, 100)).toBeCloseTo(0);
    expect(bluffEv(0.4, 100, 100)).toBeCloseTo(-20);
  });
});
