// Small statistics used live on the page. Mirrors level-3-deep/rigor.py; stats.check.mjs asserts equality.
const Z = 1.959963984540054;
const r4 = (x) => Math.round(x * 1e4) / 1e4;

export function wilson(k, n, z = Z) {
  if (!n) return [0, 1];
  const p = k / n, den = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return [r4(Math.max(0, centre - half)), r4(Math.min(1, centre + half))];
}

const comb = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
export function mcnemarExact(b, c) {
  const n = b + c;
  if (!n) return 1;
  let tail = 0;
  for (let i = 0; i <= Math.min(b, c); i++) tail += comb(n, i);
  return Math.min(1, (2 * tail) / 2 ** n);
}

export function sampleSd(xs) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return r4(Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)));
}

export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Paired per-class stage comparison from the audit log rows.
export function paired(audit, first, second) {
  const v = new Map(audit.map((a) => [`${a.case_id}|${a.stage}`, a.bypass]));
  const out = {};
  for (const cls of [...new Set(audit.filter((a) => a.cls !== 'benign').map((a) => a.cls))].sort()) {
    const ids = [...new Set(audit.filter((a) => a.cls === cls).map((a) => a.case_id))];
    const fixed = ids.filter((i) => v.get(`${i}|${first}`) && !v.get(`${i}|${second}`)).length;
    const broken = ids.filter((i) => v.get(`${i}|${second}`) && !v.get(`${i}|${first}`)).length;
    out[cls] = { fixed, broken, n: ids.length, p_exact: mcnemarExact(fixed, broken) };
  }
  return out;
}
