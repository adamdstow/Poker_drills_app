import { bluffLevel, decisionLevel, impliedLevel, mixedLevel, rangeLevel, setMixedSources, sizingLevel } from './advanced';
import { arithmetic, equityLevel, oddsLevel, outsLevel, potOddsLevel } from './foundations';
import { Level } from './types';

export type { Level, Question } from './types';

export const LEVELS: Level[] = [
  arithmetic,
  outsLevel,
  equityLevel,
  oddsLevel,
  potOddsLevel,
  decisionLevel,
  sizingLevel,
  impliedLevel,
  bluffLevel,
  rangeLevel,
  mixedLevel,
];

setMixedSources(LEVELS.filter((l) => l.number >= 1 && l.number <= 9));

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

/** Extra drills outside the curriculum. */
export const BONUS_DRILLS = [
  { id: 'preflop', route: '/preflop', title: 'Preflop Ranges', summary: 'Folded to you: raise or fold from each seat?' },
  { id: 'showdown', route: '/showdown', title: 'Hand Rankings', summary: 'Two hands, one board. Who wins?' },
] as const;
