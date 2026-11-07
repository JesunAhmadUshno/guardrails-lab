// Known-answer parity check, run by `npm run build`: the JS guard must reproduce the Python guardrails exactly.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { check, luhnOk } from './guard.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const evalSet = read('level-1-learn/evaluation.json');
const learn = read('level-1-learn/results_learn.json').results;
const adv = read('level-2-build/adversarial.json');
const build = read('level-2-build/results_build.json');

// README hand checks.
assert.equal(luhnOk('4111111111111111'), true);
assert.equal(luhnOk('4111111111111112'), false);

// 1. All 30 Learn cases: action, class, per-class scores, redacted text, finding types.
assert.equal(learn.length, evalSet.length);
for (const c of evalSet) {
  const want = learn.find((r) => r.id === c.id);
  const got = check(c.text, 'input');
  assert.equal(got.action, want.action, `${c.id} action`);
  assert.equal(got.predictedClass, want.predicted_class, `${c.id} class`);
  assert.deepEqual(got.scores, want.scores, `${c.id} scores`);
  assert.equal(got.redactedText, want.redacted_text, `${c.id} redacted`);
  assert.deepEqual(got.findings.map((f) => f.type), want.findings, `${c.id} findings`);
}

// 2. Stage-2 guard actions recorded in the Build audit log, for every surface the guard saw before the target ran.
let surfaces = 0;
for (const c of adv) {
  const rec = build.audit_log.find((a) => a.case_id === c.id && a.stage === 'stage2_guarded');
  const inp = check(c.user_text, 'input');
  assert.equal(inp.action, rec.actions.input, `${c.id} input`); surfaces++;
  if (inp.action === 'block') continue;
  if (c.docs?.length) { assert.equal(check(c.docs.at(-1)).action, rec.actions.retrieved, `${c.id} retrieved`); surfaces++; }
  if (c.tool_output) { assert.equal(check(c.tool_output).action, rec.actions.tool, `${c.id} tool`); surfaces++; }
}
console.log(`guard ok: ${evalSet.length} Learn cases and ${surfaces} Build stage-2 surfaces match the Python results`);
