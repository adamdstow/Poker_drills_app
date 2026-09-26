import { Card, Rng } from '@/poker/cards';

export interface Fact {
  label: string;
  value: string;
  accent?: boolean;
}

export interface Question {
  prompt: string;
  /** Large text shown on the table when there are no cards, e.g. "9 × 4". */
  display?: string;
  /** Which level a mixed-drill question came from. */
  tag?: string;
  hole?: Card[];
  board?: Card[];
  facts?: Fact[];
  choices: string[];
  answer: number;
  /** First line is the headline; the rest are the working. */
  explanation: string[];
  reveal?: { label: string; cards: Card[] };
}

export interface Level {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** Seconds per question, for the timed levels. */
  timeLimit?: number;
  generate: (rng: Rng) => Question;
}
