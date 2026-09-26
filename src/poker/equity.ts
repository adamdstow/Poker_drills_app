/** Rule of 4 and 2, in percent. Above 9 outs the Rule of 4 drops 1% per out above 8. */
export function ruleOfFourTwo(outs: number, cardsToCome: 1 | 2): number {
  if (cardsToCome === 1) return outs * 2;
  return outs * 4 - (outs > 9 ? outs - 8 : 0);
}

/** Exact chance to hit at least one out, 0-1. */
export function exactEquity(outs: number, cardsToCome: 1 | 2): number {
  if (cardsToCome === 1) return outs / 46;
  const unseen = 47;
  const missBoth = ((unseen - outs) * (unseen - outs - 1)) / (unseen * (unseen - 1));
  return 1 - missBoth;
}

/** Break-even equity for a call: call ÷ final pot (pot + bet + call). `pot` excludes the bet. */
export function requiredEquity(pot: number, bet: number, impliedWinnings = 0): number {
  return bet / (pot + 2 * bet + impliedWinnings);
}

/** "x:1 against" for an equity, e.g. 0.25 -> 3. */
export function equityToOdds(equity: number): number {
  return (1 - equity) / equity;
}

export function oddsToEquity(oddsAgainst: number): number {
  return 1 / (oddsAgainst + 1);
}

/** How often a pure bluff of `fraction` × pot must make them fold to break even: bet ÷ (pot + bet). */
export function bluffBreakEven(fraction: number): number {
  return fraction / (1 + fraction);
}

/**
 * Share of a balanced river betting range that should be bluffs:
 * bet ÷ (pot + 2 × bet), the same as the caller's pot odds.
 */
export function bluffShare(fraction: number): number {
  return fraction / (1 + 2 * fraction);
}

/** Bluff combos per value combo for a balanced range: bet ÷ (pot + bet). */
export function bluffsPerValue(fraction: number): number {
  return fraction / (1 + fraction);
}
