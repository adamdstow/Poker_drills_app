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
  /** Level the question came from (Level 10 mixes others in). */
  sourceLevel: number;
  prompt: string;
  cards?: CardDisplay;
  facts?: Fact[];
  answer: Answer;
  /** Correct answer as shown to the user, e.g. "53%". */
  answerText: string;
  /** Step-by-step worked explanation. */
  explanation: string[];
}

export type Generator = (rng: Rng) => Question;

export interface LevelDef {
  id: number;
  name: string;
  summary: string;
  generate: Generator;
}
