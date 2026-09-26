export type Suit = 's' | 'h' | 'd' | 'c';
export const SUITS: readonly Suit[] = ['s', 'h', 'd', 'c'];
/** Ranks 2..14 (14 = ace). */
export const RANKS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  rank: number;
  suit: Suit;
}

export const SUIT_SYMBOL: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
export const SUIT_NAME: Record<Suit, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

const RANK_CHAR: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
const RANK_NAME: Record<number, string> = {
  2: 'deuce', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'jack', 12: 'queen', 13: 'king', 14: 'ace',
};

export function rankChar(rank: number): string {
  const c = RANK_CHAR[rank === 1 ? 14 : rank];
  if (!c) throw new Error(`bad rank ${rank}`);
  return c;
}

export function rankName(rank: number): string {
  return RANK_NAME[rank === 1 ? 14 : rank];
}

/** Short code, e.g. "Ah", "Td". */
export function cardCode(c: Card): string {
  return rankChar(c.rank) + c.suit;
}

/** Display label, e.g. "A♥". */
export function cardLabel(c: Card): string {
  return rankChar(c.rank) + SUIT_SYMBOL[c.suit];
}

export function cardsLabel(cards: readonly Card[]): string {
  return cards.map(cardLabel).join(' ');
}

export function parseCard(code: string): Card {
  const m = /^([2-9TJQKA])([shdc])$/i.exec(code.trim());
  if (!m) throw new Error(`bad card "${code}"`);
  const rank = Number(Object.keys(RANK_CHAR).find((k) => RANK_CHAR[Number(k)] === m[1].toUpperCase()));
  return { rank, suit: m[2].toLowerCase() as Suit };
}

/** Parse "Ah Kd 7c" into cards. */
export function parseCards(codes: string): Card[] {
  return codes.trim().split(/\s+/).filter(Boolean).map(parseCard);
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  return deck;
}

/** Cards not in `known`. */
export function unseenCards(known: readonly Card[]): Card[] {
  return fullDeck().filter((c) => !known.some((k) => sameCard(k, c)));
}

export function sortByRankDesc(cards: readonly Card[]): Card[] {
  return cards.slice().sort((a, b) => b.rank - a.rank || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit));
}
