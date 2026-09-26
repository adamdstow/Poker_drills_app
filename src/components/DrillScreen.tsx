import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStats } from '@/stats/StatsContext';
import { colors, radius, spacing } from '@/theme';

export interface Choice<A> {
  value: A;
  label: string;
}

interface Props<A> {
  drill: string;
  /** The table: cards, pot, position. */
  children: ReactNode;
  prompt: string;
  choices: Choice<A>[];
  answer: A;
  picked: A | null;
  onPick: (value: A) => void;
  onNext: () => void;
  /** Shown once the question is answered. */
  explanation: ReactNode;
  /** The question ran out of time rather than being answered wrong. */
  timedOut?: boolean;
}

export function DrillScreen<A extends string | number>({
  drill, children, prompt, choices, answer, picked, onPick, onNext, explanation, timedOut,
}: Props<A>) {
  const { statsFor } = useStats();
  const s = statsFor(drill);
  const insets = useSafeAreaInsets();
  const answered = picked !== null || !!timedOut;
  const wasRight = picked === answer;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <View style={styles.statsBar}>
        <Stat label="Score" value={`${s.correct}/${s.attempts}`} />
        <Stat label="Accuracy" value={s.attempts ? `${Math.round((100 * s.correct) / s.attempts)}%` : '–'} />
        <Stat label="Streak" value={String(s.streak)} />
        <Stat label="Best" value={String(s.bestStreak)} />
      </View>

      <View style={styles.table}>{children}</View>

      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}

      <View style={styles.choices}>
        {choices.map((c) => {
          const isAnswer = c.value === answer;
          const isPicked = c.value === picked;
          return (
            <Pressable
              key={String(c.value)}
              disabled={answered}
              onPress={() => onPick(c.value)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.choice,
                pressed && styles.choicePressed,
                answered && isAnswer && styles.choiceCorrect,
                answered && isPicked && !isAnswer && styles.choiceWrong,
                answered && !isAnswer && !isPicked && styles.choiceDim,
              ]}
            >
              <Text style={styles.choiceText}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered ? (
        <View style={styles.feedback}>
          <Text style={[styles.verdict, { color: wasRight ? colors.correct : colors.wrong }]}>
            {wasRight ? 'Correct!' : timedOut ? 'Time’s up!' : 'Not quite.'}
          </Text>
          {explanation}
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.next, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.nextText}>Next →</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Body text for explanations, so screens share one style. */
export function Explain({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <Text style={[styles.explain, strong && styles.explainStrong]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  table: {
    backgroundColor: colors.felt,
    borderColor: colors.feltBorder,
    borderWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  prompt: { color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choicePressed: { opacity: 0.7 },
  choiceCorrect: { borderColor: colors.correct, backgroundColor: '#1d4a36' },
  choiceWrong: { borderColor: colors.wrong, backgroundColor: '#4a2323' },
  choiceDim: { opacity: 0.45 },
  choiceText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  feedback: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  verdict: { fontSize: 20, fontWeight: '800' },
  explain: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  explainStrong: { color: colors.text, fontWeight: '600' },
  next: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: { color: '#1a1a1a', fontSize: 17, fontWeight: '800' },
});
