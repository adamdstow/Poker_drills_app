import { describe, expect, it } from 'vitest';
import { parseCards } from '../cards';
import { POSITIONS, gridHand, handClassOf, makePreflopQuestion, parseRange, rangeFor, rangePercent } from '../ranges';
import { seededRng } from '@/test-helpers';

describe('parseRange', () => {
  it('expands pair ranges', () => {
    expect([...parseRange('TT+')].sort()).toEqual(['AA', 'JJ', 'KK', 'QQ', 'TT']);
    expect([...parseRange('99-77')].sort()).toEqual(['77', '88', '99']);
  });

  it('expands kicker ranges up to the top card', () => {
    expect([...parseRange('KTs+')]).toEqual(['KQs', 'KJs', 'KTs']);
    expect([...parseRange('97s+')]).toEqual(['98s', '97s']);
    expect([...parseRange('A9o-A7o')]).toEqual(['A9o', 'A8o', 'A7o']);
  });
});

describe('RFI ranges', () => {
  it('widen from early to late position (SB aside)', () => {
    const pct = POSITIONS.map((p) => rangePercent(rangeFor(p)));
    expect(pct[0]).toBeLessThan(pct[1]);
    expect(pct[1]).toBeLessThan(pct[2]);
    expect(pct[2]).toBeLessThan(pct[3]);
  });

  it('each earlier range is contained in the button range', () => {
    for (const p of ['UTG', 'HJ', 'CO'] as const) {
      for (const hand of rangeFor(p)) expect(rangeFor('BTN').has(hand)).toBe(true);
    }
  });
});

describe('hand classes', () => {
  it('names suited, offsuit and pairs', () => {
    const classOf = (text: string) => {
      const [a, b] = parseCards(text);
      return handClassOf(a, b);
    };
    expect(classOf('Kh Ah')).toBe('AKs');
    expect(classOf('9c Td')).toBe('T9o');
    expect(classOf('7c 7d')).toBe('77');
  });

  it('lays out the grid with suited hands above the diagonal', () => {
    expect(gridHand(0, 0)).toBe('AA');
    expect(gridHand(0, 1)).toBe('AKs');
    expect(gridHand(1, 0)).toBe('AKo');
    expect(gridHand(12, 12)).toBe('22');
  });

  it('builds consistent questions', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 200; i++) {
      const q = makePreflopQuestion(rng);
      expect(q.shouldRaise).toBe(q.openFrom.includes(q.position));
    }
  });
});
