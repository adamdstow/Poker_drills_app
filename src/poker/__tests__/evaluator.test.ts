import { describe, expect, it } from 'vitest';
import { parseCards } from '../cards';
import { HandCategory, compareHands, describeHand, evaluate } from '../evaluator';

const ev = (text: string) => evaluate(parseCards(text));

describe('evaluate', () => {
  it.each([
    ['As Ks Qs Js Ts 2d 3c', HandCategory.StraightFlush, 'Royal Flush'],
    ['9h 9d 9s 9c Kd 2c 3h', HandCategory.FourOfAKind, 'Four Nines'],
    ['Kh Kd Ks 7c 7d 2c 3h', HandCategory.FullHouse, 'Full House, Kings full of Sevens'],
    ['Ah 9h 7h 4h 2h Kd Qc', HandCategory.Flush, 'Flush, Ace high'],
    ['Ah 2d 3c 4s 5h Kd Kc', HandCategory.Straight, 'Straight, Five high'],
    ['6h 6d 6s Kc 2d 9c 3h', HandCategory.ThreeOfAKind, 'Three Sixes'],
    ['Kh Kd 9s 9c 2d 4c 3h', HandCategory.TwoPair, 'Two Pair, Kings and Nines'],
    ['Qh Qd 9s 7c 2d 4c 3h', HandCategory.OnePair, 'Pair of Queens'],
    ['Ah Jd 9s 7c 2d 4c 3h', HandCategory.HighCard, 'High Card, Ace high'],
  ])('%s is %s', (cards, category, description) => {
    const value = ev(cards);
    expect(value.category).toBe(category);
    expect(describeHand(value)).toBe(description);
    expect(value.cards).toHaveLength(5);
  });

  it('picks the higher straight when a six extends the wheel', () => {
    expect(ev('Ah 2d 3c 4s 5h 6d Kc').tiebreak).toEqual([6]);
  });

  it('prefers a flush over a straight', () => {
    expect(ev('4h 5h 6h 7h 9h 8d 2c').category).toBe(HandCategory.Flush);
  });

  it('chooses the best full house from two sets', () => {
    expect(ev('Kh Kd Ks 7c 7d 7s 2c').tiebreak).toEqual([13, 7]);
  });

  it('orders the wheel with the ace last', () => {
    expect(ev('Ah 2d 3c 4s 5h').cards.map((c) => c.rank)).toEqual([5, 4, 3, 2, 14]);
  });
});

describe('compareHands', () => {
  it('uses kickers', () => {
    expect(compareHands(ev('Ah Ad Kc 7s 3d'), ev('As Ac Qc 7d 3h'))).toBeGreaterThan(0);
  });

  it('ranks a wheel below a six-high straight', () => {
    expect(compareHands(ev('Ah 2d 3c 4s 5h'), ev('2h 3d 4c 5s 6h'))).toBeLessThan(0);
  });

  it('ties identical ranks in different suits', () => {
    expect(compareHands(ev('Ah Kd Qc Js 9h'), ev('Ad Kc Qs Jh 9c'))).toBe(0);
  });
});
