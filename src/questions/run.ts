import { CONFIG } from '../config';
import type { Rng } from '../engine/rng';
import type { LevelDef, Question } from './types';

/** Build a run of questions for a level, avoiding repeated prompts. */
export function buildRun(level: LevelDef, rng: Rng, length: number = CONFIG.runLength): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < length) {
    // Ramped levels go from difficulty 0 to 3 through the run.
    const difficulty = level.ramp ? Math.min(3, Math.floor((out.length * 4) / length)) : rng.int(0, 3);
    const q = level.generate(rng, { difficulty });
    const key = q.prompt + JSON.stringify(q.cards ?? null);
    if (seen.has(key) && tries++ < length * 20) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
