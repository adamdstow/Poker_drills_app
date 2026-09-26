import type { Card } from '../engine/cards';
import type { Rng } from '../engine/rng';

export interface NumericAnswer {
  kind: 'number';
  value: number;
  /** Accept |given − value| ≤ tolerance. */
  tolerance: number;
  /** Shown next to the input, e.g. "%", "bb", ":1", "outs". */
  unit: string;
  /** Unit shown before the input instead (none today, kept for "$" later). */
  prefix?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceAnswer {
  kind: 'choice';
  options: ChoiceOption[];
  correct: string;
}

export type Answer = NumericAnswer | ChoiceAnswer;

export interface CardDisplay {
  hero: Card[];
  board: Card[];
  /** Index into `board` of a card to highlight (e.g. the river that just came). */
  highlightBoardIndex?: number;
}

export interface Fact {
  label: string;
  value: string;
}

export interface Question {
  /** Stable key for stats, e.g. "L8.mdf.forward". */
  type: string;
  /** Human label for the type, e.g. "MDF (size → %)". */
  typeLabel: string;
  /** Key of the level the question came from (Level 10 mixes others in). */
  sourceLevel: string;
  prompt: string;
  cards?: CardDisplay;
  facts?: Fact[];
  answer: Answer;
  /** Correct answer as shown to the user, e.g. "53%". */
  answerText: string;
  /** Step-by-step worked explanation. */
  explanation: string[];
  /** Coaching shown after a wrong answer. */
  hint: Hint;
}

/** A specific wrong answer we can recognise, and what it means. */
export interface Mistake {
  value: number;
  /** Defaults to the question's own tolerance. */
  tolerance?: number;
  text: string;
}

export interface Hint {
  /** General "what to think about" for this question type. */
  thinkAbout: string;
  /** Common wrong numeric answers. */
  mistakes?: Mistake[];
  /** What choosing a wrong option usually means, by option id. */
  choices?: Record<string, string>;
}

export interface GenOptions {
  /** 0 (easiest) to 3 (hardest). Runs ramp up through the levels. */
  difficulty: number;
}

export type Generator = (rng: Rng, opts?: GenOptions) => Question;

export interface CheatSheet {
  /** Short tricks and rules. */
  howTo: string[];
  /** Worked examples. */
  examples: { q: string; steps: string[] }[];
  /** Optional reference table. */
  table?: { title: string; head: [string, string]; rows: [string, string][] };
}

export type LevelGroup = 'arithmetic' | 'poker';

export interface LevelDef {
  /** Stable key used in saved runs: "A1"–"A6" or "1"–"10". */
  key: string;
  group: LevelGroup;
  /** Short badge text, e.g. "A3" or "5". */
  badge: string;
  name: string;
  summary: string;
  generate: Generator;
  cheatSheet: CheatSheet;
  /** Questions get harder through the run (arithmetic levels). */
  ramp?: boolean;
}
