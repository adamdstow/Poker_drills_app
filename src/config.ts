/**
 * Every tunable number in the app lives here: time limits, medal thresholds,
 * grading tolerances, bet sizes and generator ranges.
 */

export type MedalTier = 'silver' | 'gold' | 'platinum';

export const CONFIG = {
  /** Questions per run. */
  runLength: 20,

  /** Medal requirements per tier, earned in order within a level. */
  medals: {
    silver: { minAccuracy: 0.9, timed: false, runsNeeded: 1 },
    gold: { minAccuracy: 0.9, timed: true, runsNeeded: 1 },
    platinum: { minAccuracy: 0.95, timed: true, runsNeeded: 3 },
  } satisfies Record<MedalTier, { minAccuracy: number; timed: boolean; runsNeeded: number }>,

  /** Per-question time limit (seconds) for timed runs, by level. */
  timeLimitsSec: {
    0: 8,
    1: 12,
    2: 10,
    3: 10,
    4: 12,
    5: 20,
    6: 15,
    7: 18,
    8: 15,
    9: 15,
    10: 20,
  } as Record<number, number>,

  /** Grading tolerances. */
  tolerance: {
    /** Equity %, required equity %, GTO % answers: ± percentage points. */
    percentPoints: 1,
    /** Arithmetic answers with an exact integer result. */
    arithmeticExact: 0.5,
    /** Arithmetic answers that need rounding (e.g. 1/3 as %). */
    arithmeticRounded: 1,
    /** Arithmetic answers with an exact decimal result (e.g. 1.5). */
    arithmeticDecimal: 0.1,
    /** Odds "X:1": accept within max(abs, rel × X). */
    oddsAbs: 0.2,
    oddsRel: 0.06,
    /** Bet size answered as % of pot: ± points of pot. */
    betPctOfPot: 3,
    /** Bet size / winnings answered in bb: within max(abs, rel × answer). */
    bbAbs: 2,
    bbRel: 0.05,
    /** Bluff/value combo counts. */
    combos: 0.5,
  },

  /** Bet sizes as fractions of pot (1/3, 1/2, 2/3, 3/4, pot, 1.5x, 2x). */
  betFractions: [1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, 1.5, 2],

  /**
   * Pots are 12 × k bb so every bet fraction above is a whole number of bb.
   */
  potUnit: 12,
  potMultiplierRange: [1, 12] as [number, number],

  /** Skip call/fold spots where shortcut and required equity are this close (points). */
  borderlineMarginPct: 2,

  /** Skip bluff +EV/-EV spots where fold % and break-even fold % are this close (points). */
  exploitMarginPct: 3,

  /** Skip "which size denies" options within this many points of the draw's equity. */
  denialMarginPct: 1,

  /** Share of questions dealt on the turn (the rest are on the flop). */
  turnShare: 0.5,
} as const;

export function timeLimitFor(level: number): number {
  return CONFIG.timeLimitsSec[level] ?? 15;
}
