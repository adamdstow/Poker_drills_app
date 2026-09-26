/**
 * Every poker formula the app grades against. Fractions are 0..1 unless the
 * name ends in Pct (percentage points).
 */

export type Street = 'flop' | 'turn';

/** Rule of 4 and 2: flop = outs × 4 − (outs − 8) above 8 outs; turn = outs × 2. */
export function ruleOf4And2Pct(outs: number, street: Street): number {
  if (street === 'turn') return outs * 2;
  return outs * 4 - Math.max(0, outs - 8);
}

function choose2(n: number): number {
  return (n * (n - 1)) / 2;
}

/** Exact chance to hit at least one out: flop 1 − C(47−outs,2)/C(47,2); turn outs/46. */
export function exactEquity(outs: number, street: Street): number {
  if (street === 'turn') return outs / 46;
  return 1 - choose2(47 - outs) / choose2(47);
}

/** Odds against, X in "X:1", from equity (fraction). */
export function equityToOddsAgainst(equity: number): number {
  return (1 - equity) / equity;
}

/** Equity (fraction) from odds against X:1. */
export function oddsAgainstToEquity(x: number): number {
  return 1 / (x + 1);
}

/** Final pot = pot + opponent's bet + your call. */
export function finalPot(pot: number, bet: number, call: number): number {
  return pot + bet + call;
}

/** Required equity = call ÷ final pot. */
export function requiredEquity(pot: number, bet: number, call: number): number {
  return call / finalPot(pot, bet, call);
}

/** Equity a caller needs facing bet B into pot P: B ÷ (P + 2B). */
export function callerNeeds(pot: number, bet: number): number {
  return bet / (pot + 2 * bet);
}

/** Smallest bet, as a fraction of pot, that denies a draw with equity e correct odds: e / (1 − 2e). */
export function denialBetFraction(equity: number): number {
  if (equity >= 0.5) return Infinity;
  return equity / (1 - 2 * equity);
}

/** Smallest bet in chips that denies correct odds: e·P / (1 − 2e). */
export function denialBet(equity: number, pot: number): number {
  return denialBetFraction(equity) * pot;
}

/** Future winnings needed to break even: call ÷ equity − final pot. */
export function impliedWinningsNeeded(call: number, equity: number, finalPotSize: number): number {
  return call / equity - finalPotSize;
}

/** Effective required equity with implied odds: call ÷ (final pot + future winnings). */
export function impliedRequiredEquity(call: number, finalPotSize: number, futureWinnings: number): number {
  return call / (finalPotSize + futureWinnings);
}

/** Break-even fold % for a pure bluff: B ÷ (P + B). */
export function breakEvenFold(pot: number, bet: number): number {
  return bet / (pot + bet);
}

/** Balanced bluff share of a betting range: B ÷ (P + 2B). */
export function balancedBluffShare(pot: number, bet: number): number {
  return bet / (pot + 2 * bet);
}

/** Minimum defence frequency: P ÷ (P + B). */
export function minimumDefenceFrequency(pot: number, bet: number): number {
  return pot / (pot + bet);
}

/** Bluff combos per value combo for a balanced range: B ÷ (P + B). */
export function bluffsPerValueCombo(pot: number, bet: number): number {
  return bet / (pot + bet);
}

/** Bluff combos to add to N value combos: N × B ÷ (P + B). */
export function bluffCombos(valueCombos: number, pot: number, bet: number): number {
  return valueCombos * bluffsPerValueCombo(pot, bet);
}

/** Value combos that balance a given number of bluffs: bluffs × (P + B) ÷ B. */
export function valueCombosForBluffs(bluffs: number, pot: number, bet: number): number {
  return bluffs / bluffsPerValueCombo(pot, bet);
}

/** EV of a pure bluff: fold% × P − (1 − fold%) × B. */
export function bluffEv(foldFreq: number, pot: number, bet: number): number {
  return foldFreq * pot - (1 - foldFreq) * bet;
}

/** Reverse solves: bet size as a fraction of pot. */
export function betFractionFromBreakEvenFold(fold: number): number {
  return fold / (1 - fold);
}

export function betFractionFromBluffShare(share: number): number {
  return share / (1 - 2 * share);
}

export function betFractionFromMdf(mdf: number): number {
  return (1 - mdf) / mdf;
}
