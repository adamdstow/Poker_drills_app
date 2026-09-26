import { DrillScreen, Explain } from '@/components/DrillScreen';
import { CardRow } from '@/components/PlayingCard';
import { OutsBreakdown } from '@/components/OutsBreakdown';
import { useDrill } from '@/components/useDrill';
import { DrawScenario, makeDrawScenario, outsChoices } from '@/poker/outs';

interface OutsQuestion {
  draw: DrawScenario;
  choices: number[];
}

const generate = (): OutsQuestion => {
  const draw = makeDrawScenario();
  return { draw, choices: outsChoices(draw.outs.length) };
};
const answerOf = (q: OutsQuestion) => q.draw.outs.length;

export default function OutsDrill() {
  const { question: q, answer, picked, pick, next } = useDrill('outs', generate, answerOf);
  const { draw } = q;
  const n = draw.outs.length;

  return (
    <DrillScreen
      drill="outs"
      prompt="How many outs do you have to a straight or better?"
      choices={q.choices.map((c) => ({ value: c, label: String(c) }))}
      answer={answer}
      picked={picked}
      onPick={pick}
      onNext={next}
      explanation={
        <>
          <OutsBreakdown draw={draw} />
          <Explain>
            {draw.street === 'flop'
              ? `Rule of 4: with two cards to come, ${n} outs ≈ ${n * 4}% to hit by the river (${n * 2}% on the turn alone).`
              : `Rule of 2: with one card to come, ${n} outs ≈ ${n * 2}% to hit on the river.`}
          </Explain>
          <Explain>Cards that only improve the board (so everyone shares the hand) don't count.</Explain>
        </>
      }
    >
      <CardRow cards={draw.board} size="md" label={draw.street === 'flop' ? 'Flop' : 'Turn'} />
      <CardRow cards={draw.hole} size="lg" label="Your hand" />
    </DrillScreen>
  );
}
