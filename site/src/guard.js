// JS port of level-1-learn/guardrails.py. Same regexes, weights, BLOCK_AT, precedence.
// guard.check.mjs re-runs every recorded case through this file at build time and fails on any mismatch.
// Known gap: Python's \b, \d and \s are Unicode-aware, these are ASCII. The repo's sets are pure ASCII.
export const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
export const PHONE_RE = /\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/g;
export const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
export const CARD_RE = /\b(?:\d{4}[ ]?){3}\d{4}\b|\b\d{13,16}\b/g;
export const BLOCK_AT = 2;

export function luhnOk(digits) {
  let total = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i];
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    total += d; alt = !alt;
  }
  return total % 10 === 0 && digits.length >= 13;
}

export function findPii(text) {
  const cand = [];
  for (const m of text.matchAll(EMAIL_RE)) cand.push(['EMAIL', m.index, m.index + m[0].length, m[0]]);
  for (const m of text.matchAll(SSN_RE)) cand.push(['SSN', m.index, m.index + m[0].length, m[0]]);
  for (const m of text.matchAll(CARD_RE)) if (luhnOk(m[0].replace(/\D/g, ''))) cand.push(['CREDIT_CARD', m.index, m.index + m[0].length, m[0]]);
  for (const m of text.matchAll(PHONE_RE)) cand.push(['PHONE', m.index, m.index + m[0].length, m[0]]);
  // Stable sort by start, longest first, exactly like Python's sort key.
  cand.sort((a, b) => a[1] - b[1] || (b[2] - b[1]) - (a[2] - a[1]));
  const used = [], out = [];
  for (const [type, start, end, val] of cand) {
    if (used.some(([s, e]) => start < e && end > s)) continue;
    used.push([start, end]);
    out.push({ type, start, end, text: val });
  }
  return out.sort((a, b) => a.start - b.start);
}

export function redact(text) {
  const findings = findPii(text);
  let out = text;
  for (const f of [...findings].reverse()) out = out.slice(0, f.start) + `[REDACTED:${f.type}]` + out.slice(f.end);
  return [out, findings];
}

export const POLICY_RULES = {
  jailbreak: [
    ['ignore (all )?(previous|prior|above) instructions', 2],
    ['disregard (your|all) instructions', 2],
    ['reveal your system prompt', 2],
    ['you are now dan\\b', 2],
    ['pretend you have no rules', 2],
    ['\\bbypass\\b.{0,30}\\b(safety|filters|restrictions)\\b', 2],
    ['developer mode', 1],
    ['no restrictions', 1],
    ['without rules', 1],
    ['\\bjailbreak\\b', 1],
  ],
  prompt_injection: [
    ['\\[system\\]', 2],
    ['system message\\s*:', 2],
    ['retrieved (document|text|content).{0,60}(ignore|override|disregard)', 2],
    ['document (says|instructs).{0,60}(ignore|reveal|print)', 2],
    ['hidden instruction', 2],
    ['end of document\\.?\\s*now (ignore|follow)', 2],
  ],
  misuse: [
    ['write malware', 2],
    ['create ransomware', 2],
    ['hack into', 2],
    ['build a (weapon|bomb)', 2],
    ['phishing email', 2],
    ['forge a (passport|document|signature)', 2],
    ['steals? passwords', 1],
    ['encrypt a .{0,30} network for payment', 1],
  ],
};
const COMPILED = Object.fromEntries(Object.entries(POLICY_RULES).map(([c, rs]) => [c, rs.map(([p, w]) => [new RegExp(p, 'i'), w, p])]));

export function scoreText(text) {
  const scores = {}, matched = {};
  for (const [cls, rules] of Object.entries(COMPILED)) {
    let total = 0; const hits = [];
    for (const [rx, w, p] of rules) if (rx.test(text)) { total += w; hits.push({ pattern: p, weight: w }); }
    scores[cls] = total; matched[cls] = hits;
  }
  return [scores, matched];
}

export function check(text, direction = 'input') {
  if (direction !== 'input' && direction !== 'output') throw new Error('direction must be input or output');
  const [scores, matched] = scoreText(text);
  // Python max() keeps the first maximum in rule order: jailbreak, prompt_injection, misuse.
  let top = null;
  for (const c of Object.keys(scores)) if (top === null || scores[c] > scores[top]) top = c;
  const blocked = scores[top] >= BLOCK_AT;
  const [redactedText, findings] = redact(text);
  const action = blocked ? 'block' : findings.length ? 'redact' : 'allow';
  return { action, blocked, predictedClass: blocked ? top : null, scores, matched, findings, redactedText };
}
