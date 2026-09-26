import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { CATEGORY, categoryOf, evaluate } from '../../src/engine/evaluator';

const ev = (s: string) => evaluate(parseCards(s));
const cat = (s: string) => categoryOf(ev(s));

describe('hand evaluator categories', () => {
  it.each([
    ['Ah Kh Qh Jh Th 2c 3d', CATEGORY.straightFlush],
    ['5h 4h 3h 2h Ah Kc Kd', CATEGORY.straightFlush],
    ['9c 9d 9h 9s 2c 3d 4h', CATEGORY.quads],
    ['9c 9d 9h 2s 2c 3d 4h', CATEGORY.fullHouse],
    ['9c 9d 9h 2s 2c 2d 4h', CATEGORY.fullHouse],
    ['Ah 9h 7h 4h 2h Kc Kd', CATEGORY.flush],
    ['Ac 2d 3h 4s 5c Kd Qd', CATEGORY.straight],
    ['Tc Jd Qh Ks Ac 2d 3d', CATEGORY.straight],
    ['9c 9d 9h 2s 5c Kd Qd', CATEGORY.trips],
    ['9c 9d 2h 2s 5c Kd Qd', CATEGORY.twoPair],
    ['9c 9d 2h 7s 5c Kd Qd', CATEGORY.pair],
    ['9c 3d 2h 7s 5c Kd Qd', CATEGORY.highCard],
  ])('%s', (hand, expected) => expect(cat(hand)).toBe(expected));
});

describe('hand evaluator ordering', () => {
  it('higher straight beats wheel', () => expect(ev('2c 3d 4h 5s 6c Kd Kh')).toBeGreaterThan(ev('Ac 2d 3h 4s 5c Kd Kh')));
  it('kicker decides pairs', () => expect(ev('Ac Ad Kh 7s 5c')).toBeGreaterThan(ev('Ac Ad Qh 7s 5c')));
  it('flush compares all five cards', () => expect(ev('Ah 9h 7h 4h 3h')).toBeGreaterThan(ev('Ah 9h 7h 4h 2h')));
  it('two pair uses best kicker, including a third pair', () => {
    expect(ev('Ac Ad Kh Ks Qc Qd 2h')).toBeGreaterThan(ev('Ac Ad Kh Ks Jc Jd Th'));
  });
  it('full house prefers higher trips', () => expect(ev('3c 3d 3h 2s 2c')).toBeLessThan(ev('4c 4d 4h 2s 2c')));
  it('identical five-card hands tie', () => expect(ev('Ac Kd Qh Js 9c 2d 3h')).toBe(ev('Ah Kc Qd Jc 9d 2s 3c')));
  it('rejects wrong card counts', () => expect(() => ev('Ac Kd')).toThrow());
});
