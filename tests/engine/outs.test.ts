import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { classifyStraightDraw, describeDraws, doubleCounted, outsSum } from '../../src/engine/draws';
import { computeOuts, straightCompletingRanks } from '../../src/engine/outs';

const outs = (hero: string, board: string, countOvercards = false) =>
  computeOuts(parseCards(hero), parseCards(board), { countOvercards });

describe('standard out counts', () => {
  it('flush draw = 9', () => expect(outs('Ah 7h', 'Kh 4h 2c').cards).toHaveLength(9));
  it('open-ended straight draw = 8', () => expect(outs('9c 8d', '7h 6s 2c').cards).toHaveLength(8));
  it('gutshot = 4', () => expect(outs('9c 8d', '6h 5s Kc').cards).toHaveLength(4));
  it('double gutshot = 8', () => expect(outs('9c 7d', 'Jh 8s 5c').cards).toHaveLength(8));
  it('two overcards = 6 only when stated', () => {
    expect(outs('Ac Kd', '9h 6s 2c', true).cards).toHaveLength(6);
    expect(outs('Ac Kd', '9h 6s 2c', false).cards).toHaveLength(0);
  });
  it('overcards need both hole cards above the board', () => {
    expect(outs('Ac 8d', '9h 6s 2c', true).cards).toHaveLength(0);
  });
  it('flush + OESD = 9 + 8 − 2 = 15 (no double counting)', () => {
    const r = outs('9h 8h', '7h 6c 2h');
    expect(r.flush).toHaveLength(9);
    expect(r.straight).toHaveLength(8);
    expect(r.cards).toHaveLength(15);
  });
  it('flush + gutshot = 12', () => expect(outs('9h 8h', '6h 5c Kh').cards).toHaveLength(12));
  it('works on the turn (46 unseen)', () => expect(outs('Ah 7h', 'Kh 4h 2c 9s').cards).toHaveLength(9));
  it('a made straight is not drawing to a straight', () => {
    expect(outs('9c 8d', '7h 6s 5c').straight).toHaveLength(0);
  });
  it('board-only straights are not outs', () => {
    // Board 5-6-7-8: a 4 or 9 makes a straight for everyone. Hero AK has no straight outs.
    expect(outs('Ac Kd', '5h 6s 7c 8d').straight).toHaveLength(0);
  });
  it('one-ended A-2-3-4 draw = 4 outs', () => expect(outs('Ac 2d', '3h 4s Jc').cards).toHaveLength(4));
});

describe('draw naming', () => {
  it('classifies straight draws', () => {
    expect(classifyStraightDraw([9, 8, 7, 6, 2], [5, 10])).toBe('oesd');
    expect(classifyStraightDraw([9, 7, 11, 8, 5], [6, 10])).toBe('doubleGutshot');
    expect(classifyStraightDraw([9, 8, 6, 5, 13], [7])).toBe('gutshot');
    expect(classifyStraightDraw([14, 2, 3, 4, 11], [5])).toBe('oneEnded');
    expect(classifyStraightDraw([2, 3, 4, 5, 11], [14, 6])).toBe('oesd');
  });
  it('describes a combo draw with its double-counted cards', () => {
    const hero = parseCards('9h 8h');
    const board = parseCards('7h 6c 2h');
    const r = computeOuts(hero, board);
    const draws = describeDraws(hero, board, r);
    expect(draws.map((d) => d.kind)).toEqual(['flush', 'oesd']);
    expect(doubleCounted(draws)).toHaveLength(2);
    expect(outsSum(draws, r.cards.length)).toBe('9 + 8 − 2 = 15');
  });
  it('rank-only straight completion matches card enumeration', () => {
    expect(straightCompletingRanks([9, 8], [7, 6, 2])).toEqual([5, 10]);
    expect(straightCompletingRanks([14, 13], [5, 6, 7, 8])).toEqual([]);
  });
});
