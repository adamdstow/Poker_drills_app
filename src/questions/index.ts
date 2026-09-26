import { generateLevel0 } from './level0';
import { generateLevel1 } from './level1';
import { generateLevel2 } from './level2';
import { generateLevel3 } from './level3';
import { generateLevel4 } from './level4';
import { generateLevel5 } from './level5';
import { generateLevel6 } from './level6';
import { generateLevel7 } from './level7';
import { generateLevel8 } from './level8';
import { generateLevel9 } from './level9';
import { makeLevel10 } from './level10';
import type { LevelDef } from './types';

const BASE_LEVELS: LevelDef[] = [
  { id: 0, name: 'Arithmetic', summary: 'Fast mental maths: fractions, %, × 2 / × 4, division.', generate: generateLevel0 },
  { id: 1, name: 'Outs', summary: 'Count the cards that complete your draw — never count a card twice.', generate: generateLevel1 },
  { id: 2, name: 'Equity from outs', summary: 'Rule of 4 and 2, with the above-8 correction on the flop.', generate: generateLevel2 },
  { id: 3, name: 'Equity ↔ odds', summary: 'Translate % into X:1 and back.', generate: generateLevel3 },
  { id: 4, name: 'Required equity', summary: 'Call ÷ final pot — the bet and your call go in too.', generate: generateLevel4 },
  { id: 5, name: 'Call or fold', summary: 'The full loop: outs → equity → required equity → decision.', generate: generateLevel5 },
  { id: 6, name: 'Bet sizing', summary: 'Sizes that deny a draw correct odds.', generate: generateLevel6 },
  { id: 7, name: 'Implied odds', summary: 'Winnings needed later, and draws that hit but still lose.', generate: generateLevel7 },
  { id: 8, name: 'GTO bluffing', summary: 'Break-even fold %, balanced bluff share and MDF — both directions.', generate: generateLevel8 },
  { id: 9, name: 'Range construction', summary: 'How many bluffs balance your value bets.', generate: generateLevel9 },
];

export const LEVELS: LevelDef[] = [
  ...BASE_LEVELS,
  {
    id: 10,
    name: 'Mixed drills',
    summary: 'Everything from levels 1–9, plus exploit spots.',
    generate: makeLevel10(BASE_LEVELS.filter((l) => l.id >= 1).map((l) => l.generate)),
  },
];

export function getLevel(id: number): LevelDef {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}

export * from './types';
export { buildRun } from './run';
export { grade, parseNumber, responseText } from './grade';
