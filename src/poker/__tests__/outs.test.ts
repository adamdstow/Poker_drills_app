import { describe, expect, it } from 'vitest';
import { parseCards } from '../cards';
import { HandCategory, evaluate } from '../evaluator';
import { findOuts, makeDrawScenario, outsChoices } from '../outs';
import { makePotOddsQuestion, requiredEquity } from '../potOdds';
import { makeShowdownQuestion } from '../showdown';
import { seededRng } from './helpers';

describe('findOuts', () => {
  it('counts 9 outs for a flush draw', () => {
    expect(findOuts(parseCards('Ah 7h'), parseCards('Kh 2h 9c'))).toHaveLength(9);
  });

  it('counts 8 outs for an open-ended straight draw', () => {
    expect(findOuts(parseCards('9c 8d'), parseCards('7h 6s 2c'))).toHaveLength(8);
  });

  it('counts 4 outs for a gutshot', () => {
    expect(findOuts(parseCards('9c 8d'), parseCards('6h 5s Kc'))).toHaveLength(4);
  });

  it('counts 15 outs for a flush draw plus open-ender', () => {
    expect(findOuts(parseCards('9h 8h'), parseCards('7h 6c 2h'))).toHaveLength(15);
  });

  it('ignores cards that only make a straight on the board', () => {
    // Board 5-6-7-8: any 4 or 9 puts a straight on board that uses no hole card.
    const outs = findOuts(parseCards('Ah Ad'), parseCards('5c 6d 7s 8c'));
    expect(outs).toHaveLength(0);
  });
});

describe('generators', () => {
  const rng = seededRng(42);

  it('makes draws below a straight with 4-15 outs', () => {
    for (let i = 0; i < 100; i++) {
      const s = makeDrawScenario(rng);
      expect(evaluate([...s.hole, ...s.board]).category).toBeLessThan(HandCategory.Straight);
      expect(s.outs.length).toBeGreaterThanOrEqual(4);
      expect(s.outs.length).toBeLessThanOrEqual(15);
      expect(s.flushOuts + s.straightOuts + s.fullHouseOuts).toBe(s.outs.length);
    }
  });

  it('offers four distinct choices including the answer', () => {
    for (let n = 1; n <= 15; n++) {
      const choices = outsChoices(n, rng);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(n);
    }
  });

  it('computes pot odds', () => {
    expect(requiredEquity(100, 50)).toBeCloseTo(0.25);
    expect(requiredEquity(100, 100)).toBeCloseTo(1 / 3);
    for (let i = 0; i < 50; i++) {
      const q = makePotOddsQuestion(rng);
      expect(q.shouldCall).toBe(q.equity >= q.requiredEquity);
    }
  });

  it('makes showdowns with a correct winner', () => {
    for (let i = 0; i < 100; i++) {
      const q = makeShowdownQuestion(rng);
      expect(['A', 'B', 'split']).toContain(q.winner);
    }
  });
});
