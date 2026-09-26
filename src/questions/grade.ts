import type { Answer, Question } from './types';

export type Response = { kind: 'number'; raw: string } | { kind: 'choice'; id: string } | { kind: 'timeout' };

/** Parse a typed number, allowing "%", "bb", "x:1", commas as decimal points. */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/,/g, '.');
  s = s.replace(/\s*(%|bb|outs?|combos?)$/, '').replace(/\s*:\s*1$/, '');
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
