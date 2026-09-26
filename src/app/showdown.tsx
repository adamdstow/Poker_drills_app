import { StyleSheet, View } from 'react-native';
import { CardRow } from '@/components/PlayingCard';
import { DrillScreen, Explain } from '@/components/DrillScreen';
import { useDrill } from '@/components/useDrill';
import { cardToString } from '@/poker/cards';
import { HandValue, describeHand } from '@/poker/evaluator';
import { ShowdownQuestion, Winner, makeShowdownQuestion } from '@/poker/showdown';

const answerOf = (q: ShowdownQuestion): Winner => q.winner;
const generate = () => makeShowdownQuestion();

const summary = (v: HandValue) => `${describeHand(v)} (${v.cards.map(cardToString).join(' ')})`;

export default function ShowdownDrill() {
  const { question: q, answer, picked, pick, next } = useDrill('showdown', generate, answerOf);

  return (
    <DrillScreen
      drill="showdown"
      prompt="Who wins at showdown?"
      choices={[
        { value: 'A', label: 'Player A' },
        { value: 'B', label: 'Player B' },
        { value: 'split', label: 'Split pot' },
      ]}
      answer={answer}
      picked={picked}
      onPick={pick}
      onNext={next}
      explanation={
        <>
          <Explain strong>A: {summary(q.valueA)}</Explain>
          <Explain strong>B: {summary(q.valueB)}</Explain>
          <Explain>
            {q.winner === 'split'
              ? 'Both players make the same best five cards, so the pot is split.'
              : q.valueA.category === q.valueB.category
                ? `Same hand type, so it comes down to ranks and kickers: Player ${q.winner} wins.`
                : `${describeHand(q.winner === 'A' ? q.valueA : q.valueB).split(',')[0]} beats ${describeHand(q.winner === 'A' ? q.valueB : q.valueA).split(',')[0]}.`}
          </Explain>
        </>
      }
    >
      <CardRow cards={q.board} size="md" label="Board" />
      <View style={styles.players}>
        <CardRow cards={q.handA} size="md" label="Player A" />
        <CardRow cards={q.handB} size="md" label="Player B" />
      </View>
    </DrillScreen>
  );
}

const styles = StyleSheet.create({
  players: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' },
});
