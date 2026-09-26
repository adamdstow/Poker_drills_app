import { StyleSheet, Text, View } from 'react-native';
import { Card, SUIT_SYMBOLS, rankChar } from '@/poker/cards';
import { colors, radius } from '@/theme';

const SIZES = {
  sm: { width: 34, height: 48, rank: 16, suit: 14 },
  md: { width: 52, height: 74, rank: 24, suit: 20 },
  lg: { width: 64, height: 90, rank: 30, suit: 26 },
};

export type CardSize = keyof typeof SIZES;

export function PlayingCard({ card, size = 'md' }: { card: Card; size?: CardSize }) {
  const s = SIZES[size];
  const color = colors.suit[card.suit];
  const label = rankChar(card.rank) === 'T' ? '10' : rankChar(card.rank);
  return (
    <View
      style={[styles.card, { width: s.width, height: s.height }]}
      accessibilityLabel={`${label} of ${{ s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' }[card.suit]}`}
    >
      <Text style={[styles.rank, { color, fontSize: s.rank }]}>{label}</Text>
      <Text style={{ color, fontSize: s.suit }}>{SUIT_SYMBOLS[card.suit]}</Text>
    </View>
  );
}

export function CardRow({ cards, size = 'md', label }: { cards: Card[]; size?: CardSize; label?: string }) {
  return (
    <View style={styles.rowWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {cards.map((c) => (
          <PlayingCard key={`${c.rank}${c.suit}`} card={c} size={size} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardFace,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rank: { fontWeight: '800' },
  rowWrap: { alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
