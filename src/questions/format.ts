/** Round to at most `dp` decimals and drop trailing zeros. */
export function num(x: number, dp = 1): string {
  const f = 10 ** dp;
  const r = Math.round(x * f) / f;
  return Object.is(r, -0) ? '0' : String(r);
}

/** Percentage points, e.g. pct(33.333) → "33.3%". */
export function pct(points: number, dp = 1): string {
  return `${num(points, dp)}%`;
}

/** Fraction to percentage string, e.g. frac(0.25) → "25%". */
export function fpct(fraction: number, dp = 1): string {
  return pct(fraction * 100, dp);
}

export function bb(x: number, dp = 1): string {
  return `${num(x, dp)} bb`;
}

const FRACTION_LABELS: [number, string][] = [
  [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, 'pot'], [1.5, '1.5×'], [2, '2×'],
];

/** "⅔-pot bet", "pot-size bet", "2× pot bet". */
export function sizeName(fraction: number): string {
  const hit = FRACTION_LABELS.find(([f]) => Math.abs(f - fraction) < 1e-9);
  if (!hit) return `${num(fraction * 100, 0)}%-pot bet`;
  if (hit[1] === 'pot') return 'pot-size bet';
  if (hit[1].endsWith('×')) return `${hit[1]} pot bet`;
  return `${hit[1]}-pot bet`;
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
