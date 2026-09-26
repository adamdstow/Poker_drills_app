import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { getLevel } from '../src/questions';
import { runPasses } from '../src/progress/medals';
import { RunSession } from '../src/ui/session';

function answerAll(s: RunSession, correctCount: number, ms = 1000) {
  for (let i = 0; i < 20; i++) {
    const q = s.current;
    const right = i < correctCount;
    if (q.answer.kind === 'number') {
      s.answer({ kind: 'number', raw: String(right ? q.answer.value : q.answer.value + 1000) }, ms);
    } else {
      const id = right ? q.answer.correct : q.answer.options.find((o) => o.id !== (q.answer as { correct: string }).correct)!.id;
      s.answer({ kind: 'choice', id }, ms);
    }
  }
}

describe('RunSession', () => {
  it('scores a run and builds a record with missed questions', () => {
    const s = new RunSession(getLevel('4'), 'silver', createRng(1), 0);
    answerAll(s, 18);
    expect(s.done).toBe(true);
    const rec = s.toRecord('x', 60000);
    expect(rec).toMatchObject({ level: '4', tier: 'silver', score: 18, total: 20, timed: false, durationMs: 60000 });
    expect(rec.missed).toHaveLength(2);
    expect(runPasses(rec)).toBe(true);
  });

  it('timed runs treat late answers as timeouts', () => {
    const s = new RunSession(getLevel('A2'), 'gold', createRng(2), 0);
    expect(s.timed).toBe(true);
    answerAll(s, 20, s.timeLimitMs + 1);
    expect(s.score).toBe(0);
    expect(s.results.every((r) => r.response.kind === 'timeout')).toBe(true);
  });

  it('untimed runs never time out', () => {
    const s = new RunSession(getLevel('A2'), 'silver', createRng(3), 0);
    answerAll(s, 20, 10 ** 7);
    expect(s.score).toBe(20);
  });
});
