import { Href, router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BONUS_DRILLS, LEVELS } from '@/curriculum';
import { DrillStats, isMastered, useStats } from '@/stats/StatsContext';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const { statsFor, reset, totals } = useStats();
  const insets = useSafeAreaInsets();
  const upNext = LEVELS.find((l) => !isMastered(statsFor(l.id)));

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all drill stats?')) reset();
      return;
    }
    Alert.alert('Reset stats?', 'This clears your scores and progress for every level.', [
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
        Work up from level 0. A level is mastered when you get 8 of your last 10 right.
        {totals.attempts ? ` ${totals.correct} of ${totals.attempts} right so far.` : ''}
      </Text>

      <Text style={styles.section}>Curriculum</Text>
      {LEVELS.map((level) => {
        const s = statsFor(level.id);
        const mastered = isMastered(s);
        const next = level === upNext;
        return (
          <Tile
            key={level.id}
            href={`/level/${level.id}`}
            badge={mastered ? '✓' : String(level.number)}
            badgeStyle={mastered ? styles.badgeDone : next ? styles.badgeNext : undefined}
            title={level.title}
            summary={level.summary}
            stats={s}
            highlight={next}
            note={[next && 'Up next', level.timeLimit && `Timed · ${level.timeLimit}s`].filter(Boolean).join(' · ')}
          />
        );
      })}

      <Text style={styles.section}>Bonus drills</Text>
      {BONUS_DRILLS.map((d) => (
        <Tile key={d.id} href={d.route} badge={d.id === 'preflop' ? '♠' : '♥'} title={d.title} summary={d.summary} stats={statsFor(d.id)} />
      ))}

      {totals.attempts ? (
        <Pressable onPress={confirmReset} style={styles.reset} accessibilityRole="button">
          <Text style={styles.resetText}>Reset stats</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

interface TileProps {
  href: Href;
  badge: string;
  badgeStyle?: object;
  title: string;
  summary: string;
  stats: DrillStats;
  highlight?: boolean;
  note?: string;
}

function Tile({ href, badge, badgeStyle, title, summary, stats, highlight, note }: TileProps) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, highlight && styles.tileNext, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileDesc}>{summary}</Text>
        {note || stats.attempts ? (
          <Text style={styles.tileStats}>
            {[note, stats.attempts && `${Math.round((100 * stats.correct) / stats.attempts)}% of ${stats.attempts}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  section: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileNext: { borderColor: colors.accent },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNext: { backgroundColor: colors.accent },
  badgeDone: { backgroundColor: colors.correct },
  badgeText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  tileBody: { flex: 1, gap: 2 },
  tileTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  tileDesc: { color: colors.textMuted, fontSize: 14 },
  tileStats: { color: colors.accent, fontSize: 13, marginTop: 4, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 28 },
  reset: { alignSelf: 'center', padding: spacing.sm, marginTop: spacing.md },
  resetText: { color: colors.textMuted, textDecorationLine: 'underline' },
});
