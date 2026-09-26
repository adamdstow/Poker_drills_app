import { StyleSheet, Text, View } from 'react-native';
import { CardRow } from '@/components/PlayingCard';
import { DrillScreen, Explain } from '@/components/DrillScreen';
import { RangeGrid } from '@/components/RangeGrid';
import { useDrill } from '@/components/useDrill';
import { POSITIONS, POSITION_NAMES, PreflopQuestion, makePreflopQuestion, rangeFor, rangePercent } from '@/poker/ranges';
import { colors } from '@/theme';

type Action = 'raise' | 'fold';
const answerOf = (q: PreflopQuestion): Action => (q.shouldRaise ? 'raise' : 'fold');
const generate = () => makePreflopQuestion();

export default function PreflopDrill() {
  const { question: q, answer, picked, pick, next } = useDrill('preflop', generate, answerOf);
  const range = rangeFor(q.position);

  return (
    <DrillScreen
      drill="preflop"
      prompt="Everyone folds to you. Raise or fold?"
      choices={[
        { value: 'fold', label: 'Fold' },
        { value: 'raise', label: 'Raise' },
      ]}
      answer={answer}
      picked={picked}
      onPick={pick}
      onNext={next}
      explanation={
        <>
          <Explain strong>
            {q.hand} {q.shouldRaise ? 'is' : 'is not'} in the {q.position} opening range (
            {Math.round(rangePercent(range) * 100)}% of hands).
          </Explain>
          <Explain>
            {q.openFrom.length
              ? `Standard open from: ${q.openFrom.join(', ')}.`
              : 'This hand is a fold from every position.'}
          </Explain>
          <RangeGrid range={range} highlight={q.hand} />
          <Explain>
            Simplified 6-max, 100bb charts. Later positions open wider because fewer players are left to act.
          </Explain>
        </>
      }
    >
      <View style={styles.seats}>
        {POSITIONS.map((p) => (
          <View key={p} style={[styles.seat, p === q.position && styles.seatActive]}>
            <Text style={[styles.seatText, p === q.position && styles.seatTextActive]}>{p}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.position}>{POSITION_NAMES[q.position]}</Text>
      <CardRow cards={q.hole} size="lg" label={`Your hand · ${q.hand}`} />
    </DrillScreen>
  );
}

const styles = StyleSheet.create({
  seats: { flexDirection: 'row', gap: 6 },
  seat: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.25)' },
  seatActive: { backgroundColor: colors.accent },
  seatText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  seatTextActive: { color: '#1a1a1a' },
  position: { color: colors.text, fontSize: 20, fontWeight: '700' },
});
