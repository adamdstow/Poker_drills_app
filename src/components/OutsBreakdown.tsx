import { DrawScenario } from '@/poker/outs';
import { Explain } from './DrillScreen';
import { CardRow } from './PlayingCard';

export function OutsBreakdown({ draw }: { draw: DrawScenario }) {
  const parts = [
    draw.flushOuts && `${draw.flushOuts} to a flush`,
    draw.straightOuts && `${draw.straightOuts} to a straight`,
    draw.fullHouseOuts && `${draw.fullHouseOuts} to a full house or better`,
  ].filter(Boolean);
  return (
    <>
      <Explain strong>
        {draw.outs.length} outs: {parts.join(', ')}.
      </Explain>
      <CardRow cards={draw.outs} size="sm" />
    </>
  );
}
