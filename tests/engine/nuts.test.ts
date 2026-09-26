import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { checkNuts } from '../../src/engine/nuts';

describe('nuts check', () => {
  it('ace-high flush on an unpaired, unconnected board is the nuts', () => {
    expect(checkNuts(parseCards('Ah 7h'), parseCards('Kh 4h 2c 9s Jh')).isNuts).toBe(true);
  });
  it('king-high flush is not the nuts when the ace is unseen', () => {
    const r = checkNuts(parseCards('Kh 7h'), parseCards('Qh 4h 2c 9s 3h'));
    expect(r.isNuts).toBe(false);
    expect(r.bestOpponent).toBeDefined();
  });
  it('a straight is not the nuts when three of a suit are on board', () => {
    expect(checkNuts(parseCards('9c 8d'), parseCards('7h 6h 2c Kd Th')).isNuts).toBe(false);
  });
  it('a straight is not the nuts on a paired board', () => {
    expect(checkNuts(parseCards('9c 8d'), parseCards('7h 6s 6c Kd Th')).isNuts).toBe(false);
  });
  it('low end of a straight is beaten by a higher straight', () => {
    expect(checkNuts(parseCards('4c 3d'), parseCards('7h 6s 5c Kd 2h')).isNuts).toBe(false);
  });
});
