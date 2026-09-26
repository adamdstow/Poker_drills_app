import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/config';
import { cardCode } from '../../src/engine/cards';
import { requiredEquity, ruleOf4And2Pct } from '../../src/engine/formulas';
import { computeOuts } from '../../src/engine/outs';
import { createRng } from '../../src/engine/rng';
import { grade } from '../../src/questions/grade';
import { buildRun, getLevel, LEVELS, type Question } from '../../src/questions';
import { OVERCARDS_STATEMENT } from '../../src/questions/spots';

const N = 300;

function sample(levelId: number, n = N): Question[] {
  const rng = createRng(1000 + levelId);
  return Array.from({ length: n }, () => getLevel(levelId).generate(rng));
}

/** Every question has exactly one gradeable answer. */
function assertUnambiguous(q: Question) {
  expect(q.prompt.length).toBeGreaterThan(0);
  expect(q.explanation.length).toBeGreaterThan(0);
  expect(q.answerText.length).toBeGreaterThan(0);
  for (const step of q.explanation) {
    expect(step).not.toMatch(/NaN|undefined|Infinity/);
  }
  expect(q.prompt).not.toMatch(/NaN|undefined|Infinity/);
  if (q.answer.kind === 'number') {
    expect(Number.isFinite(q.answer.value)).toBe(true);
    expect(q.answer.tolerance).toBeGreaterThanOrEqual(0);
    // The stated answer grades as correct; anything well outside the tolerance does not.
    expect(grade(q, { kind: 'number', raw: String(q.answer.value) })).toBe(true);
    const off = q.answer.tolerance + Math.max(1, Math.abs(q.answer.value) * 0.2);
    expect(grade(q, { kind: 'number', raw: String(q.answer.value + off) })).toBe(false);
  } else {
    const ids = q.answer.options.map((o) => o.id);
    const labels = q.answer.options.map((o) => o.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(ids.filter((id) => id === (q.answer as { correct: string }).correct)).toHaveLength(1);
    for (const id of ids) {
      expect(grade(q, { kind: 'choice', id })).toBe(id === q.answer.correct);
    }
  }
  expect(grade(q, { kind: 'timeout' })).toBe(false);
  // Opponent's hand is never shown: only hero (2) and board (3–5) cards.
  if (q.cards) {
    expect(q.cards.hero).toHaveLength(2);
    expect(q.cards.board.length).toBeGreaterThanOrEqual(3);
    expect(q.cards.board.length).toBeLessThanOrEqual(5);
    const codes = [...q.cards.hero, ...q.cards.board].map(cardCode);
    expect(new Set(codes).size).toBe(codes.length);
  }
}

describe.each(LEVELS.map((l) => [l.id, l.name] as const))('level %i (%s)', (id) => {
  const qs = sample(id);
  it('generates questions with one unambiguous correct answer', () => {
    qs.forEach(assertUnambiguous);
  });
  it('builds a 20-question run', () => {
    const run = buildRun(getLevel(id), createRng(7));
    expect(run).toHaveLength(CONFIG.runLength);
  });
  it('is reproducible from a seed', () => {
    const a = getLevel(id).generate(createRng(99));
    const b = getLevel(id).generate(createRng(99));
    expect(a.prompt).toBe(b.prompt);
  });
});

describe('level 1 outs', () => {
  const qs = sample(1, 500);
  it('answers equal the engine enumeration and a standard count', () => {
    for (const q of qs) {
      const counted = computeOuts(q.cards!.hero, q.cards!.board, { countOvercards: q.prompt.includes(OVERCARDS_STATEMENT) });
      expect(q.answer.kind === 'number' && q.answer.value).toBe(counted.cards.length);
      expect([4, 6, 8, 9, 10, 12, 15]).toContain(counted.cards.length);
    }
  });
  it('only counts overcards when the prompt says so', () => {
    for (const q of qs) {
      const without = computeOuts(q.cards!.hero, q.cards!.board, { countOvercards: false });
      if (!q.prompt.includes(OVERCARDS_STATEMENT)) {
        expect(q.answer.kind === 'number' && q.answer.value).toBe(without.cards.length);
      }
    }
  });
  it('covers combo draws that tempt double counting', () => {
    expect(qs.some((q) => q.type === 'L1.combo' && q.answer.kind === 'number' && q.answer.value === 15)).toBe(true);
  });
});

describe('level 2 equity', () => {
  it('grades against the Rule of 4 and 2 ± 1 point', () => {
    for (const q of sample(2)) {
      const m = /You have (\d+) outs/.exec(q.prompt)!;
      const street = q.prompt.startsWith('Flop') ? 'flop' : 'turn';
      expect(q.answer.kind === 'number' && q.answer.value).toBe(ruleOf4And2Pct(Number(m[1]), street));
      expect(q.answer.kind === 'number' && q.answer.tolerance).toBe(1);
    }
  });
});

describe('level 5 call/fold', () => {
  it('never deals borderline spots and decides by shortcut vs required equity', () => {
    for (const q of sample(5)) {
      const pot = Number(/pot is ([\d.]+) bb/.exec(q.prompt)![1]);
      const bet = Number(/(?:all-in for|bets) ([\d.]+) bb/.exec(q.prompt)![1]);
      const outs = computeOuts(q.cards!.hero, q.cards!.board, { countOvercards: q.prompt.includes(OVERCARDS_STATEMENT) }).cards.length;
      const street = q.cards!.board.length === 3 ? 'flop' : 'turn';
      const eq = ruleOf4And2Pct(outs, street);
      const req = requiredEquity(pot, bet, bet) * 100;
      expect(Math.abs(eq - req)).toBeGreaterThanOrEqual(CONFIG.borderlineMarginPct);
      expect(q.answer.kind === 'choice' && q.answer.correct).toBe(eq > req ? 'call' : 'fold');
    }
  });
  it('produces both calls and folds', () => {
    const answers = new Set(sample(5).map((q) => (q.answer.kind === 'choice' ? q.answer.correct : '')));
    expect(answers).toEqual(new Set(['call', 'fold']));
  });
});

describe('level 7 reverse implied odds', () => {
  it('produces both nut and non-nut spots', () => {
    const rev = sample(7).filter((q) => q.type === 'L7.reverseImplied');
    const answers = new Set(rev.map((q) => (q.answer.kind === 'choice' ? q.answer.correct : '')));
    expect(answers).toEqual(new Set(['nuts', 'notNuts']));
  });
});

describe('level 8 GTO', () => {
  const qs = sample(8);
  it('covers all three figures in both directions', () => {
    const types = new Set(qs.map((q) => q.type));
    for (const f of ['breakEven', 'bluffShare', 'mdf']) {
      expect(types).toContain(`L8.${f}.forward`);
      expect(types).toContain(`L8.${f}.reverse`);
    }
  });
  it('every explanation names which figure is asked', () => {
    for (const q of qs) {
      const names = ['BREAK-EVEN FOLD', 'BALANCED BLUFF SHARE', 'MINIMUM DEFENCE FREQUENCY'];
      expect(names.filter((n) => q.explanation[0].includes(n))).toHaveLength(1);
    }
  });
  it('uses the corrected bluff share (pot bet → 33%, not 50%)', () => {
    const rng = createRng(3);
    for (let i = 0; i < 400; i++) {
      const q = getLevel(8).generate(rng);
      if (q.type === 'L8.bluffShare.forward' && q.prompt.includes('pot-size bet')) {
        expect(q.answer.kind === 'number' && q.answer.value).toBeCloseTo(100 / 3);
        return;
      }
    }
    throw new Error('no pot-size bluff share question generated');
  });
});

describe('level 9 range construction', () => {
  it('answers are whole combos', () => {
    for (const q of sample(9)) {
      expect(q.answer.kind === 'number' && Number.isInteger(Math.round(q.answer.value * 1e9) / 1e9)).toBe(true);
    }
  });
});

describe('level 10 mixed', () => {
  it('draws from levels 1–9 and exploit spots', () => {
    const sources = new Set(sample(10, 600).map((q) => q.sourceLevel));
    expect([...sources].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('exploit spots keep a margin from break-even', () => {
    for (const q of sample(10, 600).filter((x) => x.type === 'L10.exploit')) {
      const pot = Number(/pot is ([\d.]+) bb/.exec(q.prompt)![1]);
      const bet = Number(/\(([\d.]+) bb\)/.exec(q.prompt)![1]);
      const fold = Number(/folds (\d+)%/.exec(q.prompt)![1]);
      expect(Math.abs(fold - (bet / (pot + bet)) * 100)).toBeGreaterThanOrEqual(CONFIG.exploitMarginPct);
    }
  });
});

describe('level 6 bet sizing', () => {
  it('pick-the-size questions always include a size that fails to deny', () => {
    const picks = sample(6, 600).filter((q) => q.type === 'L6.pickSize');
    expect(picks.length).toBeGreaterThan(50);
    for (const q of picks) {
      expect(q.answer.kind === 'choice' && q.answer.correct).not.toBe('0');
      expect(q.explanation.some((s) => s.includes('calling is fine'))).toBe(true);
    }
  });
});
