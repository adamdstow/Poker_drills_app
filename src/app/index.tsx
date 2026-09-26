import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRILLS } from '@/drills';
import { useStats } from '@/stats/StatsContext';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const { stats, reset } = useStats();
  const insets = useSafeAreaInsets();
  const total = Object.values(stats).reduce(
    (acc, s) => ({ attempts: acc.attempts + s.attempts, correct: acc.correct + s.correct }),
    { attempts: 0, correct: 0 },
  );

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all drill stats?')) reset();
      return;
    }
    Alert.alert('Reset stats?', 'This clears your scores and streaks for every drill.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <Text style={styles.subtitle}>
        {total.attempts
          ? `${total.correct} of ${total.attempts} right across all drills`
          : 'Pick a drill and start training.'}
      </Text>

      {DRILLS.map((d) => {
        const s = stats[d.id];
        return (
          <Pressable
            key={d.id}
            onPress={() => router.push(d.route)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}
          >
            <Text style={[styles.symbol, { color: d.symbol === '♥' || d.symbol === '♦' ? colors.wrong : colors.text }]}>
              {d.symbol}
            </Text>
            <View style={styles.tileBody}>
              <Text style={styles.tileTitle}>{d.title}</Text>
              <Text style={styles.tileDesc}>{d.description}</Text>
              {s.attempts ? (
                <Text style={styles.tileStats}>
                  {Math.round((100 * s.correct) / s.attempts)}% of {s.attempts} · best streak {s.bestStreak}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      })}

      {total.attempts ? (
        <Pressable onPress={confirmReset} style={styles.reset} accessibilityRole="button">
          <Text style={styles.resetText}>Reset stats</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 15 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.feltBorder,
  },
  symbol: { fontSize: 34, width: 40, textAlign: 'center' },
  tileBody: { flex: 1, gap: 2 },
  tileTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  tileDesc: { color: colors.textMuted, fontSize: 14 },
  tileStats: { color: colors.accent, fontSize: 13, marginTop: 4, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 28 },
  reset: { alignSelf: 'center', padding: spacing.sm },
  resetText: { color: colors.textMuted, textDecorationLine: 'underline' },
});
