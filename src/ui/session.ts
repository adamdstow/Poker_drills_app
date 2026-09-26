import { CONFIG, type MedalTier, timeLimitFor } from '../config';
import type { Rng } from '../engine/rng';
import { grade, responseText, type Response } from '../questions/grade';
import { buildRun } from '../questions/run';
import type { LevelDef, Question } from '../questions/types';
import type { RunRecord } from '../progress/types';

export interface AnswerResult {
  question: Question;
  response: Response;
  correct: boolean;
  ms: number;
}

/** State of one 20-question run. No DOM code, so it can be tested directly. */
export class RunSession {
  readonly questions: Question[];
  readonly results: AnswerResult[] = [];
  readonly timed: boolean;
  readonly timeLimitMs: number;
  private readonly startedAt: number;

  constructor(
    readonly level: LevelDef,
    readonly tier: MedalTier,
    rng: Rng,
    now: number = Date.now(),
  ) {
    this.questions = buildRun(level, rng, CONFIG.runLength);
    this.timed = CONFIG.medals[tier].timed;
    this.timeLimitMs = timeLimitFor(level.id) * 1000;
    this.startedAt = now;
  }

  get index(): number {
    return this.results.length;
  }

  get done(): boolean {
    return this.results.length >= this.questions.length;
  }

  get current(): Question {
    return this.questions[Math.min(this.index, this.questions.length - 1)];
  }

  get score(): number {
    return this.results.filter((r) => r.correct).length;
  }

  answer(response: Response, ms: number): AnswerResult {
    if (this.done) throw new Error('run is finished');
    const question = this.current;
    // A late answer on a timed run counts as a timeout.
    const effective: Response = this.timed && ms > this.timeLimitMs ? { kind: 'timeout' } : response;
    const result = { question, response: effective, correct: grade(question, effective), ms };
    this.results.push(result);
    return result;
  }

  toRecord(id: string, now: number = Date.now()): RunRecord {
    return {
      id,
      level: this.level.id,
      tier: this.tier,
      date: new Date(now).toISOString(),
      score: this.score,
      total: this.questions.length,
      timed: this.timed,
      durationMs: now - this.startedAt,
      missed: this.results
        .filter((r) => !r.correct)
        .map((r) => ({
          type: r.question.type,
          typeLabel: r.question.typeLabel,
          prompt: r.question.prompt,
          given: responseText(r.question, r.response),
          correct: r.question.answerText,
        })),
    };
  }
}
