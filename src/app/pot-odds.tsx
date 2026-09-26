import { StyleSheet, Text, View } from 'react-native';
import { CardRow } from '@/components/PlayingCard';
import { DrillScreen, Explain } from '@/components/DrillScreen';
import { OutsBreakdown } from '@/components/OutsBreakdown';
import { useDrill } from '@/components/useDrill';
import { unseenCount } from '@/poker/outs';
import { PotOddsQuestion, makePotOddsQuestion } from '@/poker/potOdds';
import { colors } from '@/theme';

type Action = 'call' | 'fold';
const answerOf = (q: PotOddsQuestion): Action => (q.shouldCall ? 'call' : 'fold');
const generate = () => makePotOddsQuestion();
const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function PotOddsDrill() {
  const { question: q, answer, picked, pick, next } = useDrill('potOdds', generate, answerOf);
  const { draw } = q;
  const n = draw.outs.length;
  const unseen = unseenCount(draw.street);
  const nextCard = draw.street === 'flop' ? 'turn' : 'river';

  return (
    <DrillScreen
      drill="potOdds"
      prompt={`Villain bets $${q.bet} into $${q.pot}. Counting only the ${nextCard} card, call or fold?`}
      choices={[
        { value: 'fold', label: 'Fold' },
        { value: 'call', label: 'Call' },
      ]}
      answer={answer}
      picked={picked}
      onPick={pick}
      onNext={next}
      explanation={
        <>
          <Explain strong>
            You need {pct(q.requiredEquity)}, you have {pct(q.equity)} → {q.shouldCall ? 'call' : 'fold'}.
          </Explain>
          <Explain>
            Pot odds: call ${q.bet} to win ${q.pot + q.bet}. Break-even equity = {q.bet} ÷ ({q.pot} + {q.bet} + {q.bet}) ={' '}
            {pct(q.requiredEquity)}.
          </Explain>
          <Explain>
            Equity: {n} outs of {unseen} unseen cards = {pct(q.equity)} (rule of 2 says ≈ {n * 2}%).
          </Explain>
          <OutsBreakdown draw={draw} />
        </>
      }
    >
      <View style={styles.pot}>
        <Text style={styles.potLabel}>Pot</Text>
        <Text style={styles.potValue}>${q.pot}</Text>
        <Text style={styles.potLabel}>Bet to you</Text>
        <Text style={[styles.potValue, { color: colors.accent }]}>${q.bet}</Text>
      </View>
      <CardRow cards={draw.board} size="md" label={draw.street === 'flop' ? 'Flop' : 'Turn'} />
      <CardRow cards={draw.hole} size="lg" label="Your hand" />
    </DrillScreen>
  );
}

const styles = StyleSheet.create({
  pot: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  potLabel: { color: colors.textMuted, fontSize: 13, textTransform: 'uppercase' },
  potValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginRight: 8 },
});
