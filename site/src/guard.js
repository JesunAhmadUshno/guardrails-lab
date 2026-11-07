// JS port of level-1-learn/guardrails.py. Same regexes, weights, BLOCK_AT, precedence.
// guard.check.mjs re-runs every recorded case through this file at build time and fails on any mismatch.
// Known gap: Python's \b, \d and \s are Unicode-aware, these are ASCII. The repo's sets are pure ASCII.
export const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
export const PHONE_RE = /\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/g;
export const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
export const CARD_RE = /\b(?:\d{4}[ ]?){3}\d{4}\b|\b\d{13,16}\b/g;

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

// The policy rules are not copied here: they are parsed from level-1-learn/guardrails.py itself
// (POLICY_RULES block, r"..." pattern plus weight), so the port cannot drift from the Python rules.
export function parsePolicyRules(pySource) {
  const block = pySource.slice(pySource.indexOf('POLICY_RULES = {'), pySource.indexOf('\n}\n', pySource.indexOf('POLICY_RULES = {')));
  const rules = {};
  let cls = null;
  for (const line of block.split('\n')) {
    const c = line.match(/^ {4}"(\w+)": \[/);
    if (c) { cls = c[1]; rules[cls] = []; continue; }
    const r = line.match(/^ {8}\(r"(.*)", (\d+)\),$/);
    if (r && cls) rules[cls].push([r[1], +r[2]]);
  }
  return rules;
}

export function createGuard(pySource) {
  const POLICY_RULES = parsePolicyRules(pySource);
  const BLOCK_AT = +pySource.match(/^BLOCK_AT = (\d+)$/m)[1];
  const COMPILED = Object.fromEntries(Object.entries(POLICY_RULES).map(([c, rs]) => [c, rs.map(([p, w]) => [new RegExp(p, 'i'), w, p])]));
  function scoreText(text) {
    const scores = {}, matched = {};
    for (const [cls, rules] of Object.entries(COMPILED)) {
      let total = 0; const hits = [];
      for (const [rx, w, p] of rules) if (rx.test(text)) { total += w; hits.push({ pattern: p, weight: w }); }
      scores[cls] = total; matched[cls] = hits;
    }
    return [scores, matched];
  }
  function check(text, direction = 'input') {
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
  return { POLICY_RULES, BLOCK_AT, scoreText, check };
}
