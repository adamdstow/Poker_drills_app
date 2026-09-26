import { describe, expect, it } from 'vitest';
import { isCorrect, parseNumber } from '../../src/questions/grade';

describe('parseNumber', () => {
  it.each([
    ['25', 25], ['25%', 25], [' 3:1 ', 3], ['3 : 1', 3], ['2,5', 2.5], ['.5', 0.5], ['40 bb', 40], ['15 outs', 15],
  ])('%s → %s', (raw, n) => expect(parseNumber(raw)).toBe(n));
  it.each(['', 'abc', '1/3', '--2'])('rejects %s', (raw) => expect(parseNumber(raw)).toBeNull());
});

describe('isCorrect', () => {
  const a = { kind: 'number' as const, value: 53, tolerance: 1, unit: '%' };
  it('accepts within tolerance', () => {
    expect(isCorrect(a, { kind: 'number', raw: '52' })).toBe(true);
    expect(isCorrect(a, { kind: 'number', raw: '54' })).toBe(true);
    expect(isCorrect(a, { kind: 'number', raw: '55' })).toBe(false);
  });
  it('timeouts are wrong', () => expect(isCorrect(a, { kind: 'timeout' })).toBe(false));
});
