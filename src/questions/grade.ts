import { num } from './format';
import type { Answer, Question } from './types';

export type Response = { kind: 'number'; raw: string } | { kind: 'choice'; id: string } | { kind: 'timeout' };

/**
 * Parse a typed number, allowing "%", "bb", "x:1", "1,250" (thousands) and
 * "2,5" (decimal comma).
 */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  s = s.replace(/\s*(%|bb|outs?|combos?|chips)$/, '').replace(/\s*:\s*1$/, '');
  s = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) ? s.replace(/,/g, '') : s.replace(/,/g, '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function isCorrect(answer: Answer, response: Response): boolean {
  if (response.kind === 'timeout') return false;
  if (answer.kind === 'number') {
    if (response.kind !== 'number') return false;
    const n = parseNumber(response.raw);
    return n !== null && Math.abs(n - answer.value) <= answer.tolerance + 1e-9;
  }
  return response.kind === 'choice' && response.id === answer.correct;
}

export function grade(q: Question, response: Response): boolean {
  return isCorrect(q.answer, response);
}

/** How the user's response reads back, e.g. "35%" or "Call". */
export function responseText(q: Question, response: Response): string {
  if (response.kind === 'timeout') return 'Time ran out';
  if (response.kind === 'choice') {
    return q.answer.kind === 'choice' ? (q.answer.options.find((o) => o.id === response.id)?.label ?? response.id) : response.id;
  }
  const unit = q.answer.kind === 'number' ? q.answer.unit : '';
  const raw = response.raw.trim();
  return raw === '' ? '(blank)' : `${raw}${unit && !raw.endsWith(unit.trim()) ? (unit.startsWith(':') || unit === '%' ? unit : ` ${unit}`) : ''}`;
}

export interface Coaching {
  /** What most likely went wrong with this answer. */
  whatWentWrong: string;
  /** How to think about this kind of question next time. */
  thinkAbout: string;
}

/** Explain a wrong answer: match known mistakes first, then say too high / too low. */
export function diagnose(q: Question, response: Response): Coaching {
  const thinkAbout = q.hint.thinkAbout;
  if (response.kind === 'timeout') {
    return { whatWentWrong: 'Time ran out. Use the shortcut on the cheat sheet rather than exact sums — close enough is marked right.', thinkAbout };
  }
  if (response.kind === 'choice') {
    return { whatWentWrong: q.hint.choices?.[response.id] ?? 'That option is not right here — work through the steps below.', thinkAbout };
  }
  const n = parseNumber(response.raw);
  if (n === null || q.answer.kind !== 'number') {
    return { whatWentWrong: 'That is not a number I can read. Type digits only, e.g. 28.5.', thinkAbout };
  }
  const answer = q.answer;
  for (const m of q.hint.mistakes ?? []) {
    // A "mistake" that equals the right answer (e.g. MDF = break-even at pot size) says nothing.
    if (Math.abs(m.value - answer.value) <= answer.tolerance + 1e-9) continue;
    if (Math.abs(n - m.value) <= (m.tolerance ?? Math.max(answer.tolerance, 0.5)) + 1e-9) {
      return { whatWentWrong: m.text, thinkAbout };
    }
  }
  if (answer.value !== 0 && Math.abs(n * 100 - answer.value) <= Math.max(answer.tolerance, 0.5) && answer.unit.includes('%')) {
    return { whatWentWrong: `You gave a decimal (${num(n, 3)}). Multiply by 100 to turn it into a percentage.`, thinkAbout };
  }
  if (answer.value !== 0 && (Math.abs(n * 10 - answer.value) <= answer.tolerance || Math.abs(n / 10 - answer.value) <= answer.tolerance)) {
    return { whatWentWrong: 'Right digits, wrong size — check where the decimal point goes (you are out by a factor of 10).', thinkAbout };
  }
  const diff = n - answer.value;
  const dir = diff > 0 ? 'too high' : 'too low';
  return { whatWentWrong: `Your answer is ${dir} by ${num(Math.abs(diff), 1)}.`, thinkAbout };
}
