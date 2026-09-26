import type { Rng } from '../engine/rng';
import { equitySteps, outsSteps } from './explain';
import { dealDrawSpot, OVERCARDS_STATEMENT, streetPhrase } from './spots';
import type { Question } from './types';

export function generateLevel1(rng: Rng): Question {
  const spot = dealDrawSpot(rng);
  const n = spot.outs.cards.length;
  const combo = spot.draws.length > 1;
  return {
    type: combo ? 'L1.combo' : `L1.${spot.draws[0].kind}`,
    typeLabel: combo ? 'Outs: combo draw' : `Outs: ${spot.draws[0].name.toLowerCase()}`,
    sourceLevel: 1,
    prompt: `${streetPhrase(spot.street)}. How many outs do you have?${spot.overcardsStated ? ` ${OVERCARDS_STATEMENT}` : ''}`,
    cards: { hero: spot.hero, board: spot.board },
    answer: { kind: 'number', value: n, tolerance: 0, unit: 'outs' },
    answerText: `${n} outs`,
    explanation: [...outsSteps(spot), ...equitySteps(n, spot.street).map((s) => `For reference — ${s}`)],
  };
}
