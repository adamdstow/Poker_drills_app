import { describe, expect, it } from 'vitest';
import { seededRng } from '@/test-helpers';
import { parseCards } from '../cards';
import { bluffBreakEven, bluffShare, bluffsPerValue, equityToOdds, exactEquity, requiredEquity, ruleOfFourTwo } from '../equity';
import { countOuts, isDrawSpot, makeOutsSpot } from '../outs';
import { makeShowdownQuestion } from '../showdown';

const outs = (hole: string, board: string) => countOuts(parseCards(hole), parseCards(board));

describe('countOuts', () => {
  it('flush draw = 9', () => expect(outs('7h 6h', 'Kh 2h 9c').all).toHaveLength(9));
  it('open-ended straight draw = 8', () => expect(outs('9c 8d', '7h 6s 2c').all).toHaveLength(8));
  it('gutshot = 4', () => expect(outs('9c 8d', '6h 5s Kc').all).toHaveLength(4));
  it('two overcards = 6', () => expect(outs('Ah Kd', '9c 7s 2h').all).toHaveLength(6));
  it('gutshot plus two overcards = 10', () => expect(outs('Ah Kd', 'Qc Ts 5h').all).toHaveLength(10));

  it('flush draw plus open-ender = 15, with 2 overlapping cards counted once', () => {
    const o = outs('9h 8h', '7h 6c 2h');
    expect(o.flush).toHaveLength(9);
    expect(o.straight).toHaveLength(8);
    expect(o.overlap).toBe(2);
    expect(o.all).toHaveLength(15);
  });

  it('ignores straights that are entirely on the board', () => {
    expect(outs('Ks Qd', '5c 6d 7s 8c').straight).toHaveLength(0);
  });
});

describe('makeOutsSpot', () => {
  it('always deals an unmade drawing hand', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 150; i++) {
      const s = makeOutsSpot(rng);
      expect(isDrawSpot(s.hole, s.board)).toBe(true);
      expect(s.outs.all.length).toBeGreaterThan(0);
      expect(s.board).toHaveLength(s.street === 'flop' ? 3 : 4);
    }
  });
});

describe('equity maths', () => {
  it('matches the Rule of 4 and 2 with the big-draw correction', () => {
    expect(ruleOfFourTwo(9, 2)).toBe(36);
    expect(ruleOfFourTwo(12, 2)).toBe(44);
    expect(ruleOfFourTwo(15, 2)).toBe(53);
    expect(ruleOfFourTwo(8, 1)).toBe(16);
  });

  it('computes exact equity', () => {
    expect(exactEquity(9, 2)).toBeCloseTo(0.35, 2);
    expect(exactEquity(9, 1)).toBeCloseTo(9 / 46);
  });

  it('matches the doc example: pot 100, bet 50 -> 25%', () => {
    expect(requiredEquity(100, 50)).toBeCloseTo(0.25);
    expect(requiredEquity(100, 50, 100)).toBeCloseTo(50 / 300);
  });

  it('converts equity to odds', () => {
    expect(equityToOdds(0.25)).toBeCloseTo(3);
    expect(equityToOdds(0.5)).toBeCloseTo(1);
  });

  it('bluff maths', () => {
    expect(bluffBreakEven(0.5)).toBeCloseTo(1 / 3);
    expect(bluffBreakEven(1)).toBeCloseTo(0.5);
    expect(bluffBreakEven(2)).toBeCloseTo(2 / 3);
    expect(bluffShare(1)).toBeCloseTo(1 / 3);
    expect(bluffShare(0.5)).toBeCloseTo(0.25);
    expect(bluffsPerValue(1)).toBeCloseTo(0.5);
  });
});

describe('showdown generator', () => {
  it('names a winner', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 100; i++) expect(['A', 'B', 'split']).toContain(makeShowdownQuestion(rng).winner);
  });
});
