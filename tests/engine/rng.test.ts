import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/engine/rng';

describe('seeded rng', () => {
  it('is reproducible', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 10; i++) expect(a.next()).toBe(b.next());
  });
  it('int stays in range', () => {
    const r = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });
  it('shuffle keeps all items', () => {
    expect(createRng(5).shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
  });
});
