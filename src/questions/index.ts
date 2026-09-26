import { generateA1, generateA2, generateA3, generateA4, generateA5, generateA6 } from './arithmetic';
import { CHEAT_SHEETS } from './cheatsheets';
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
import type { Generator, LevelDef } from './types';

function arith(n: number, name: string, summary: string, generate: Generator): LevelDef {
  const key = `A${n}`;
  return { key, group: 'arithmetic', badge: key, name, summary, generate, cheatSheet: CHEAT_SHEETS[key], ramp: true };
}

function poker(n: number, name: string, summary: string, generate: Generator): LevelDef {
  const key = String(n);
  return { key, group: 'poker', badge: key, name, summary, generate, cheatSheet: CHEAT_SHEETS[key] };
}

export const ARITHMETIC_LEVELS: LevelDef[] = [
  arith(1, 'Pot addition', 'Pot + bet + call, from tens to thousands, raises and several streets.', generateA1),
  arith(2, 'Times tables', 'Outs × 2 and × 4, bet multiples, 1.5× and 2.5×.', generateA2),
  arith(3, 'Division', 'Halves, thirds and quarters of the pot, then ÷ 6, 8 and 12.', generateA3),
  arith(4, 'Fractions ↔ %', 'The fraction table by heart, and % of a number.', generateA4),
  arith(5, 'Division to %', 'Call ÷ final pot as a % — simplify and estimate.', generateA5),
  arith(6, 'Multi-step sums', 'Odds, the Rule of 4 correction and the full pot-odds chain.', generateA6),
];

const POKER_BASE: LevelDef[] = [
  poker(1, 'Outs', 'Count the cards that complete your draw — never count a card twice.', generateLevel1),
  poker(2, 'Equity from outs', 'Rule of 4 and 2, with the above-8 correction on the flop.', generateLevel2),
  poker(3, 'Equity ↔ odds', 'Translate % into X:1 and back.', generateLevel3),
  poker(4, 'Required equity', 'Call ÷ final pot — the bet and your call go in too.', generateLevel4),
  poker(5, 'Call or fold', 'The full loop: outs → equity → required equity → decision.', generateLevel5),
  poker(6, 'Bet sizing', 'Sizes that deny a draw correct odds.', generateLevel6),
  poker(7, 'Implied odds', 'Winnings needed later, and draws that hit but still lose.', generateLevel7),
  poker(8, 'GTO bluffing', 'Break-even fold %, balanced bluff share and MDF — both directions.', generateLevel8),
  poker(9, 'Range construction', 'How many bluffs balance your value bets.', generateLevel9),
];

export const POKER_LEVELS: LevelDef[] = [
  ...POKER_BASE,
  poker(10, 'Mixed drills', 'Everything from levels 1–9, plus exploit spots.', makeLevel10(POKER_BASE.map((l) => l.generate))),
];

export const LEVELS: LevelDef[] = [...ARITHMETIC_LEVELS, ...POKER_LEVELS];

export function getLevel(key: string): LevelDef {
  const l = LEVELS.find((x) => x.key === key);
  if (!l) throw new Error(`no level ${key}`);
  return l;
}

/** "A3 · Division" or "Level 5 · Call or fold". */
export function levelTitle(l: LevelDef): string {
  return l.group === 'arithmetic' ? `${l.key} · ${l.name}` : `Level ${l.key} · ${l.name}`;
}

export * from './types';
export { buildRun } from './run';
export { diagnose, grade, parseNumber, responseText } from './grade';
