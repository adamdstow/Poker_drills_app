export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
}

/** Returns a float in [0, 1). Injectable so drills are deterministic in tests. */
export type Rng = () => number;

export const RANKS: Rank[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

const RANK_CHARS: Record<Rank, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};

const RANK_NAMES: Record<Rank, [singular: string, plural: string]> = {
  14: ['Ace', 'Aces'], 13: ['King', 'Kings'], 12: ['Queen', 'Queens'],
  11: ['Jack', 'Jacks'], 10: ['Ten', 'Tens'], 9: ['Nine', 'Nines'],
  8: ['Eight', 'Eights'], 7: ['Seven', 'Sevens'], 6: ['Six', 'Sixes'],
  5: ['Five', 'Fives'], 4: ['Four', 'Fours'], 3: ['Three', 'Threes'], 2: ['Two', 'Twos'],
};

export const SUIT_SYMBOLS: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

export function rankChar(rank: Rank): string {
  return RANK_CHARS[rank];
}

export function rankName(rank: Rank, plural = false): string {
  return RANK_NAMES[rank][plural ? 1 : 0];
}

export function parseRank(ch: string): Rank {
  const entry = Object.entries(RANK_CHARS).find(([, c]) => c === ch.toUpperCase());
  if (!entry) throw new Error(`Invalid rank: ${ch}`);
  return Number(entry[0]) as Rank;
}

export function cardToString(card: Card): string {
  return rankChar(card.rank) + card.suit;
}

/** Parses "Ah" style notation. */
export function parseCard(text: string): Card {
  const suit = text[1]?.toLowerCase() as Suit;
  if (text.length !== 2 || !SUITS.includes(suit)) throw new Error(`Invalid card: ${text}`);
  return { rank: parseRank(text[0]), suit };
}

/** Parses a space-separated list like "Ah Kd 7c". */
export function parseCards(text: string): Card[] {
  return text.trim().split(/\s+/).map(parseCard);
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function fullDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function remainingDeck(exclude: Card[]): Card[] {
  return fullDeck().filter((c) => !exclude.some((e) => sameCard(c, e)));
}

export function randomInt(maxExclusive: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * maxExclusive);
}

export function pick<T>(items: readonly T[], rng: Rng = Math.random): T {
  return items[randomInt(items.length, rng)];
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deals `count` cards from a freshly shuffled deck, skipping any in `exclude`. */
export function deal(count: number, rng: Rng = Math.random, exclude: Card[] = []): Card[] {
  return shuffle(remainingDeck(exclude), rng).slice(0, count);
}
