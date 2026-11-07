// Known-answer check, run by `npm run build`: the in-browser retrain must reproduce level-3-deep/results_deep.json.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitRecorded, confusion, prf } from './classifier.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const deep = read('level-3-deep/results_deep.json');
const t0 = performance.now();
const { rows, train, test, model, probs } = fitRecorded(read('level-1-learn/evaluation.json'), read('level-2-build/adversarial.json'), deep);
const ms = performance.now() - t0;

assert.equal(rows.length, deep.dataset.total_usable);
assert.equal(rows.filter((r) => r.label).length, deep.dataset.positive_block_worthy);
assert.equal(train.length, deep.split.train_size);
assert.equal(test.length, deep.split.test_size);
assert.deepEqual(test.map((r) => r.id), deep.held_out.predictions.map((p) => p.id), 'held-out order');
assert.equal(model.vocabSize, deep.model.vocab_size_train);
assert.equal(+model.loss[0].toFixed(4), deep.model.train_loss_first_epoch);
assert.equal(+model.loss.at(-1).toFixed(4), deep.model.train_loss_final_epoch);
const pred = probs.map((p) => +(p >= 0.5));
deep.held_out.predictions.forEach((p, i) => assert.equal(pred[i], p.predicted, `${p.id} prediction`));
const conf = confusion(test.map((r) => r.label), pred);
assert.deepEqual(conf, deep.held_out.confusion);
const m = prf(conf);
for (const k of ['precision', 'recall', 'f1', 'accuracy']) assert.equal(+m[k].toFixed(3), deep.held_out[k], k);
// No held-out probability sits so close to 0.5 that float summation order could flip it.
const margin = Math.min(...probs.map((p) => Math.abs(p - 0.5)));
assert.ok(margin > 1e-6, `margin ${margin}`);
console.log(`classifier ok: vocab ${model.vocabSize}, loss ${model.loss[0].toFixed(4)} -> ${model.loss.at(-1).toFixed(4)}, confusion ${JSON.stringify(conf)}, min margin ${margin.toFixed(4)}, ${ms.toFixed(0)} ms`);
