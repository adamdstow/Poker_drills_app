import { type Card, RANKS, SUITS, type Suit } from '../engine/cards';
import { classifyStraightDraw, type Draw, describeDraws } from '../engine/draws';
import { rankMask, straightHigh } from '../engine/evaluator';
import type { Street } from '../engine/formulas';
import { computeOuts, hasTwoOvercards, type OutsResult, straightCompletingRanks } from '../engine/outs';
import type { Rng } from '../engine/rng';
import { CONFIG } from '../config';

/** The draw shapes a spot can be built around. */
export type DrawTarget =
  | 'flush'
  | 'oesd'
  | 'gutshot'
  | 'doubleGutshot'
  | 'flush+oesd'
  | 'flush+gutshot'
  | 'flush+doubleGutshot'
  | 'overcards'
  | 'overcards+gutshot'
  | 'overcards+flush';

type StraightPart = 'none' | 'oesd' | 'gutshot' | 'doubleGutshot';

interface TargetShape {
  flush: boolean;
  straight: StraightPart;
  overcards: boolean;
  /** Standard out count the finished spot must have. */
  outs: number;
}

export const TARGETS: Record<DrawTarget, TargetShape> = {
  flush: { flush: true, straight: 'none', overcards: false, outs: 9 },
  oesd: { flush: false, straight: 'oesd', overcards: false, outs: 8 },
  gutshot: { flush: false, straight: 'gutshot', overcards: false, outs: 4 },
  doubleGutshot: { flush: false, straight: 'doubleGutshot', overcards: false, outs: 8 },
  'flush+oesd': { flush: true, straight: 'oesd', overcards: false, outs: 15 },
  'flush+gutshot': { flush: true, straight: 'gutshot', overcards: false, outs: 12 },
  'flush+doubleGutshot': { flush: true, straight: 'doubleGutshot', overcards: false, outs: 15 },
  overcards: { flush: false, straight: 'none', overcards: true, outs: 6 },
  'overcards+gutshot': { flush: false, straight: 'gutshot', overcards: true, outs: 10 },
  'overcards+flush': { flush: true, straight: 'none', overcards: true, outs: 15 },
};

export const TARGET_WEIGHTS: { value: DrawTarget; weight: number }[] = [
  { value: 'flush', weight: 3 },
  { value: 'oesd', weight: 3 },
  { value: 'gutshot', weight: 2 },
  { value: 'doubleGutshot', weight: 1 },
  { value: 'flush+oesd', weight: 2 },
  { value: 'flush+gutshot', weight: 2 },
  { value: 'flush+doubleGutshot', weight: 1 },
  { value: 'overcards', weight: 1 },
  { value: 'overcards+gutshot', weight: 1 },
  { value: 'overcards+flush', weight: 1 },
];

export interface DrawSpot {
  hero: Card[];
  board: Card[];
  street: Street;
  target: DrawTarget;
  /** The question states the opponent holds a single pair below both hole cards. */
  overcardsStated: boolean;
  outs: OutsResult;
  draws: Draw[];
}

export const OVERCARDS_STATEMENT = 'Your opponent holds one pair, lower than both of your hole cards.';

function straightPartOf(heroRanks: number[], boardRanks: number[]): StraightPart | null {
  const completing = straightCompletingRanks(heroRanks, boardRanks);
  const kind = classifyStraightDraw([...heroRanks, ...boardRanks], completing);
  if (kind === 'none') return 'none';
  if (kind === 'oesd' || kind === 'doubleGutshot') return kind;
  if (kind === 'gutshot' || kind === 'oneEnded') return 'gutshot';
  return null;
}

/** On the turn, reject boards where one more card makes a straight on its own. */
function boardCanStraightAlone(boardRanks: number[]): boolean {
  if (boardRanks.length < 4) return false;
  return RANKS.some((r) => straightHigh(rankMask([...boardRanks, r])) > 0);
}

function sampleRanks(rng: Rng, target: TargetShape, boardSize: number): { hero: number[]; board: number[] } | null {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const ranks = rng.shuffle(RANKS).slice(0, 2 + boardSize);
    const hero = ranks.slice(0, 2);
    const board = ranks.slice(2);
    if (boardCanStraightAlone(board)) continue;
    if (straightHigh(rankMask(ranks))) continue; // already a made straight
    const straight = straightPartOf(hero, board);
    if (straight !== target.straight) continue;
    const over = hero.every((h) => board.every((b) => h > b));
    if (target.overcards && !over) continue;
    return { hero, board };
  }
  return null;
}

function assignSuits(rng: Rng, heroRanks: number[], boardRanks: number[], flush: boolean): { hero: Card[]; board: Card[] } | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    let heroSuits: Suit[];
    let boardSuits: Suit[];
    if (flush) {
      const s = rng.pick(SUITS);
      const others = SUITS.filter((x) => x !== s);
      heroSuits = [s, s];
      const idx = rng.shuffle(boardRanks.map((_, i) => i));
      boardSuits = boardRanks.map(() => rng.pick(others));
      boardSuits[idx[0]] = s;
      boardSuits[idx[1]] = s;
    } else {
      heroSuits = heroRanks.map(() => rng.pick(SUITS));
      boardSuits = boardRanks.map(() => rng.pick(SUITS));
    }
    const all = [...heroSuits, ...boardSuits];
    const countAll = (s: Suit) => all.filter((x) => x === s).length;
    const countBoard = (s: Suit) => boardSuits.filter((x) => x === s).length;
    // No 3-suited boards; without a flush target, never 4 to a flush.
    if (SUITS.some((s) => countBoard(s) > 2)) continue;
    if (!flush && SUITS.some((s) => countAll(s) > 3)) continue;
    return {
      hero: heroRanks.map((rank, i) => ({ rank, suit: heroSuits[i] })),
      board: boardRanks.map((rank, i) => ({ rank, suit: boardSuits[i] })),
    };
  }
  return null;
}

export function pickStreet(rng: Rng): Street {
  return rng.chance(CONFIG.turnShare) ? 'turn' : 'flop';
}

/**
 * Deal a heads-up spot where the hero holds no pair and is drawing, built
 * around a target draw. Outs are always computed by the engine, and the
 * spot is only accepted when they match the standard count for the target.
 */
export function dealDrawSpot(rng: Rng, opts: { target?: DrawTarget; street?: Street } = {}): DrawSpot {
  for (let attempt = 0; attempt < 500; attempt++) {
    const target = opts.target ?? rng.weighted(TARGET_WEIGHTS);
    const street = opts.street ?? pickStreet(rng);
    const shape = TARGETS[target];
    const ranks = sampleRanks(rng, shape, street === 'flop' ? 3 : 4);
    if (!ranks) continue;
    const cards = assignSuits(rng, ranks.hero, ranks.board, shape.flush);
    if (!cards) continue;
    const overcardsStated = shape.overcards;
    const outs = computeOuts(cards.hero, cards.board, { countOvercards: overcardsStated });
    if (outs.cards.length !== shape.outs) continue;
    if (shape.flush !== outs.flush.length > 0) continue;
    if (overcardsStated && !hasTwoOvercards(cards.hero, cards.board)) continue;
    const draws = describeDraws(cards.hero, cards.board, outs);
    return {
      hero: cards.hero,
      board: cards.board,
      street,
      target,
      overcardsStated,
      outs,
      draws,
    };
  }
  throw new Error('could not deal a draw spot');
}

/** Pot of 12k bb (so every bet fraction is whole) and a bet from the configured fractions. */
export function dealPotAndBet(rng: Rng, fractions: readonly number[] = CONFIG.betFractions): { pot: number; bet: number; fraction: number } {
  const [lo, hi] = CONFIG.potMultiplierRange;
  const pot = CONFIG.potUnit * rng.int(lo, hi);
  const fraction = rng.pick(fractions);
  return { pot, bet: Math.round(pot * fraction), fraction };
}

export function streetPhrase(street: Street): string {
  return street === 'flop' ? 'Flop (two cards to come)' : 'Turn (one card to come)';
}
