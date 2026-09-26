import { describe, expect, it } from 'vitest';
import { seededRng } from '@/test-helpers';
import { LEVELS } from '..';

describe.each(LEVELS.map((l) => [l.number, l.title, l] as const))('level %i: %s', (_n, _t, level) => {
  it('generates well-formed questions', () => {
    const rng = seededRng(level.number + 1);
    for (let i = 0; i < 300; i++) {
      const q = level.generate(rng);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
      expect(q.explanation.length).toBeGreaterThan(0);
      const text = [q.prompt, q.display ?? '', ...q.choices, ...q.explanation, ...(q.facts ?? []).map((f) => f.value)].join(' ');
      expect(text).not.toMatch(/NaN|Infinity|undefined|-\$|\$-/);
      for (const c of q.choices) expect(c).not.toMatch(/^\d{3,}%$/);
    }
  });
});

describe('ordering', () => {
  it('numbers the levels 0-10 in order', () => {
    expect(LEVELS.map((l) => l.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
