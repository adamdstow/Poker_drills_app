import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Countdown } from '@/components/Countdown';
import { DrillScreen, Explain } from '@/components/DrillScreen';
import { CardRow } from '@/components/PlayingCard';
import { useDrill } from '@/components/useDrill';
import { Level, Question, findLevel } from '@/curriculum';
import { colors, radius } from '@/theme';

const answerOf = (q: Question) => q.answer;

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = findLevel(id);
  if (!level) return <Redirect href="/" />;
  return <LevelDrill key={level.id} level={level} />;
}

function LevelDrill({ level }: { level: Level }) {
  const generate = useCallback(() => level.generate(Math.random), [level]);
  const { question: q, answer, picked, pick, next, timedOut, timeOut, round } = useDrill(level.id, generate, answerOf);
  const hasScene = !!(q.hole || q.board || q.facts);

  return (
    <>
      <Stack.Screen options={{ title: `${level.number}. ${level.title}` }} />
      <DrillScreen
        drill={level.id}
        prompt={q.display || hasScene ? q.prompt : ''}
        choices={q.choices.map((label, i) => ({ value: i, label }))}
        answer={answer}
        picked={picked}
        onPick={pick}
        onNext={next}
        timedOut={timedOut}
        explanation={
          <>
            {q.explanation.map((line, i) => (
              <Explain key={i} strong={i === 0}>
                {line}
              </Explain>
            ))}
            {q.reveal && q.reveal.cards.length ? <CardRow cards={q.reveal.cards} size="sm" label={q.reveal.label} /> : null}
          </>
        }
      >
        {level.timeLimit ? (
          <Countdown key={round} seconds={level.timeLimit} running={picked === null && !timedOut} onExpire={timeOut} />
        ) : null}
        {q.tag ? <Text style={styles.tag}>{q.tag}</Text> : null}
        {q.facts ? (
          <View style={styles.facts}>
            {q.facts.map((f) => (
              <View key={f.label} style={styles.fact}>
                <Text style={styles.factLabel}>{f.label}</Text>
                <Text style={[styles.factValue, f.accent && { color: colors.accent }]}>{f.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {q.board ? <CardRow cards={q.board} label={q.board.length === 3 ? 'Flop' : 'Turn'} /> : null}
        {q.hole ? <CardRow cards={q.hole} size="lg" label="Your hand" /> : null}
        {q.display ? <Text style={styles.display}>{q.display}</Text> : null}
        {!q.display && !hasScene ? <Text style={styles.textPrompt}>{q.prompt}</Text> : null}
      </DrillScreen>
    </>
  );
}

const styles = StyleSheet.create({
  tag: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  fact: { alignItems: 'center' },
  factLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  factValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  display: { color: colors.text, fontSize: 44, fontWeight: '800', paddingVertical: 12 },
  textPrompt: { color: colors.text, fontSize: 19, fontWeight: '600', textAlign: 'center', lineHeight: 26, paddingVertical: 8 },
});
