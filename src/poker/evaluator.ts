import { Card, Rank, rankName } from './cards';

export enum HandCategory {
  HighCard,
  OnePair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
}

export const CATEGORY_NAMES: Record<HandCategory, string> = {
  [HandCategory.HighCard]: 'High Card',
  [HandCategory.OnePair]: 'One Pair',
  [HandCategory.TwoPair]: 'Two Pair',
  [HandCategory.ThreeOfAKind]: 'Three of a Kind',
  [HandCategory.Straight]: 'Straight',
  [HandCategory.Flush]: 'Flush',
  [HandCategory.FullHouse]: 'Full House',
  [HandCategory.FourOfAKind]: 'Four of a Kind',
  [HandCategory.StraightFlush]: 'Straight Flush',
};

export interface HandValue {
  category: HandCategory;
  /** Ranks compared in order to break ties within a category. */
  tiebreak: Rank[];
  /** The five cards making the hand, most significant first. */
  cards: Card[];
}

/** Returns the straight's high card, or null. Treats A-2-3-4-5 as five-high. */
function straightHigh(uniqueDesc: Rank[]): Rank | null {
  if (uniqueDesc.length !== 5) return null;
  if (uniqueDesc[0] - uniqueDesc[4] === 4) return uniqueDesc[0];
  if (uniqueDesc.join() === '14,5,4,3,2') return 5;
  return null;
}

export function evaluateFive(cards: Card[]): HandValue {
  if (cards.length !== 5) throw new Error('evaluateFive needs exactly 5 cards');

  const counts = new Map<Rank, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  // Groups ordered by size then rank, e.g. full house KKK77 -> [K, 7].
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const groupRanks = groups.map(([r]) => r);
  const shape = groups.map(([, n]) => n).join('');

  const ordered = [...cards].sort(
    (a, b) => groupRanks.indexOf(a.rank) - groupRanks.indexOf(b.rank),
  );
  const isFlush = cards.every((c) => c.suit === cards[0].suit);
  const high = straightHigh(groupRanks);

  if (high !== null) {
    // Wheel plays the ace low.
    const straightCards = high === 5 ? [...ordered.slice(1), ordered[0]] : ordered;
    return {
      category: isFlush ? HandCategory.StraightFlush : HandCategory.Straight,
      tiebreak: [high],
      cards: straightCards,
    };
  }
  if (isFlush) return { category: HandCategory.Flush, tiebreak: groupRanks, cards: ordered };

  const category = {
    '41': HandCategory.FourOfAKind,
    '32': HandCategory.FullHouse,
    '311': HandCategory.ThreeOfAKind,
    '221': HandCategory.TwoPair,
    '2111': HandCategory.OnePair,
    '11111': HandCategory.HighCard,
  }[shape];
  if (category === undefined) throw new Error(`Invalid hand: duplicate cards?`);
  return { category, tiebreak: groupRanks, cards: ordered };
}

export function compareHands(a: HandValue, b: HandValue): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const diff = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  return [
    ...combinations(rest, k - 1).map((combo) => [first, ...combo]),
    ...combinations(rest, k),
  ];
}

/** Best five-card hand from 5 to 7 cards. */
export function evaluate(cards: Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) throw new Error('evaluate needs 5-7 cards');
  let best: HandValue | null = null;
  for (const combo of combinations(cards, 5)) {
    const value = evaluateFive(combo);
    if (!best || compareHands(value, best) > 0) best = value;
  }
  return best!;
}

/** Human readable description, e.g. "Two Pair, Kings and Nines". */
export function describeHand(value: HandValue): string {
  const [a, b] = value.tiebreak;
  const name = CATEGORY_NAMES[value.category];
  switch (value.category) {
    case HandCategory.StraightFlush:
      return a === 14 ? 'Royal Flush' : `${name}, ${rankName(a)} high`;
    case HandCategory.FourOfAKind:
      return `Four ${rankName(a, true)}`;
    case HandCategory.FullHouse:
      return `Full House, ${rankName(a, true)} full of ${rankName(b, true)}`;
    case HandCategory.Flush:
    case HandCategory.Straight:
    case HandCategory.HighCard:
      return `${name}, ${rankName(a)} high`;
    case HandCategory.ThreeOfAKind:
      return `Three ${rankName(a, true)}`;
    case HandCategory.TwoPair:
      return `Two Pair, ${rankName(a, true)} and ${rankName(b, true)}`;
    case HandCategory.OnePair:
      return `Pair of ${rankName(a, true)}`;
  }
}
