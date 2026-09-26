import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { HandClass, gridHand } from '@/poker/ranges';
import { colors } from '@/theme';

/** 13x13 starting-hand chart: pairs on the diagonal, suited top-right, offsuit bottom-left. */
export function RangeGrid({ range, highlight }: { range: Set<HandClass>; highlight?: HandClass }) {
  const { width } = useWindowDimensions();
  const cell = Math.floor(Math.min(30, (Math.min(width, 520) - 48) / 13));
  return (
    <View style={styles.grid} accessibilityLabel="Opening range chart">
      {Array.from({ length: 13 }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: 13 }, (_, col) => {
            const hand = gridHand(row, col);
            const inRange = range.has(hand);
            const isTarget = hand === highlight;
            return (
              <View
                key={col}
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  inRange && styles.inRange,
                  isTarget && styles.target,
                ]}
              >
                <Text
                  style={[styles.text, { fontSize: cell * 0.3 }, inRange && styles.inRangeText]}
                  numberOfLines={1}
                >
                  {hand}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { alignSelf: 'center', borderRadius: 4, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.background,
  },
  inRange: { backgroundColor: colors.feltBorder },
  target: { borderWidth: 2, borderColor: colors.accent },
  text: { color: colors.textMuted, fontWeight: '600' },
  inRangeText: { color: colors.text },
});
