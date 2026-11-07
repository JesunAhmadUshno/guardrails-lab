// Known-answer check, run by `npm run build`: live statistics must equal level-3-deep/results_rigor.json.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wilson, sampleSd, paired } from './stats.js';
import { createGuard } from './guard.js';
import { loadDataset, recordedSplit, confusion } from './classifier.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const { check } = createGuard(readFileSync(new URL('../../level-1-learn/guardrails.py', import.meta.url), 'utf8'));
const rigor = read('level-3-deep/results_rigor.json');
const build = read('level-2-build/results_build.json');
const deep = read('level-3-deep/results_deep.json');
let n = 0;
for (const [stage, classes] of Object.entries(build.scores)) for (const [cls, v] of Object.entries(classes)) {
  const k = v.bypass ?? v.success;
  assert.deepEqual(wilson(k, v.total), rigor.build_ci[stage][cls].ci95, `${stage} ${cls}`); n++;
}
for (const v of Object.values(rigor.learn_ci)) { assert.deepEqual(wilson(v.k, v.n), v.ci95); n++; }
for (const v of Object.values(rigor.held_out_ci)) { assert.deepEqual(wilson(v.k, v.n), v.ci95); n++; }
for (const m of ['precision', 'recall', 'f1']) { assert.equal(sampleSd(deep.cross_validation[`${m}_per_fold`]), rigor.cv_sd[m]); n++; }
for (const [key, want] of Object.entries(rigor.paired_mcnemar)) {
  const [a, b] = key.split('_vs_');
  assert.deepEqual(paired(build.audit_log, a, b), want, key); n++;
}
// Rules-as-classifier baseline on the recorded held-out split, computed with the JS guard.
const { test } = recordedSplit(loadDataset(read('level-1-learn/evaluation.json'), read('level-2-build/adversarial.json')), deep);
const conf = confusion(test.map((r) => r.label), test.map((r) => +(check(r.text).action === 'block')));
assert.deepEqual(conf, rigor.baselines.learn_rules_as_classifier.confusion); n++;
console.log(`stats ok: ${n} interval, spread, paired-test and baseline values match results_rigor.json`);
