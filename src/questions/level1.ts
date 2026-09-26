import { doubleCounted } from '../engine/draws';
import { hasTwoOvercards } from '../engine/outs';
import type { Rng } from '../engine/rng';
import { equitySteps, outsSteps } from './explain';
import { dealDrawSpot, OVERCARDS_STATEMENT, streetPhrase } from './spots';
import type { Mistake, Question } from './types';

export const OUTS_THINK =
  'Name each draw, count its outs, then take away any card that completes two draws. Standard counts: flush 9, open-ender 8, double gutshot 8, gutshot 4, two overcards 6 (only when the question says so).';

export function generateLevel1(rng: Rng): Question {
  const spot = dealDrawSpot(rng);
  const n = spot.outs.cards.length;
  const combo = spot.draws.length > 1;
  const mistakes: Mistake[] = [];
  const twice = doubleCounted(spot.draws).length;
  if (twice) {
    mistakes.push({ value: n + twice, tolerance: 0, text: `You counted ${twice} card${twice === 1 ? '' : 's'} twice — ${twice === 1 ? 'it completes' : 'they complete'} both draws, so count ${twice === 1 ? 'it' : 'them'} once.` });
  }
  if (combo) {
    for (const d of spot.draws) {
      const others = spot.draws.filter((x) => x !== d).map((x) => x.name.toLowerCase());
      mistakes.push({ value: d.outs.length, tolerance: 0, text: `You only counted the ${d.name.toLowerCase()}. You also have ${others.join(' and ')}.` });
    }
  }
  if (!spot.overcardsStated && hasTwoOvercards(spot.hero, spot.board)) {
    mistakes.push({ value: n + 6, tolerance: 0, text: 'You added overcard outs. Only count them when the question says the opponent holds a pair below both your cards.' });
  }
  if (spot.overcardsStated) {
    mistakes.push({ value: n - 6, tolerance: 0, text: 'The question says the opponent holds a pair below both your cards — so your 6 overcard outs count too.' });
  }
  return {
    type: combo ? 'L1.combo' : `L1.${spot.draws[0].kind}`,
    typeLabel: combo ? 'Outs: combo draw' : `Outs: ${spot.draws[0].name.toLowerCase()}`,
    sourceLevel: '1',
    prompt: `${streetPhrase(spot.street)}. How many outs do you have?${spot.overcardsStated ? ` ${OVERCARDS_STATEMENT}` : ''}`,
    cards: { hero: spot.hero, board: spot.board },
    answer: { kind: 'number', value: n, tolerance: 0, unit: 'outs' },
    answerText: `${n} outs`,
    explanation: [...outsSteps(spot), ...equitySteps(n, spot.street).map((s) => `For reference — ${s}`)],
    hint: { thinkAbout: OUTS_THINK, mistakes },
  };
}
