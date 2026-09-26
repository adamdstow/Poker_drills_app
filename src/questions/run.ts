import { CONFIG } from '../config';
import type { Rng } from '../engine/rng';
import type { LevelDef, Question } from './types';

/** Build a run of questions for a level, avoiding repeated prompts. */
export function buildRun(level: LevelDef, rng: Rng, length: number = CONFIG.runLength): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < length) {
    const q = level.generate(rng);
    const key = q.prompt + JSON.stringify(q.cards ?? null);
    if (seen.has(key) && tries++ < length * 20) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
