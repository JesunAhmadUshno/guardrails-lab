// JS port of level-3-deep/classifier.py and run_deep.load_dataset. Full-batch gradient descent from zero.
// classifier.check.mjs retrains on the recorded split at build time and asserts the recorded held-out confusion.
const TOKEN_RE = /[a-z0-9]+/g;
export const tokenize = (text) => text.toLowerCase().match(TOKEN_RE) || [];

export function extractFeatures(text) {
  const feats = new Map();
  const add = (k) => feats.set(k, (feats.get(k) || 0) + 1);
  const toks = tokenize(text);
  for (const t of toks) add('w:' + t);
  for (let i = 0; i + 1 < toks.length; i++) add('w:' + toks[i] + ' ' + toks[i + 1]);
  const padded = ' ' + toks.join(' ') + ' ';
  for (const n of [3, 4]) for (let i = 0; i + n <= padded.length; i++) add('c:' + padded.slice(i, i + n));
  return feats;
}

// Same text surface as run_deep.load_dataset: Learn adversarial + benign, Build user_text + docs + tool_output, marker stripped.
export function loadDataset(evaluation, adversarial) {
  const rows = [];
  for (const c of evaluation) {
    if (c.category === 'adversarial') rows.push({ id: c.id, text: c.text, label: 1, cls: c.expected_class, source: 'learn' });
    else if (c.category === 'benign') rows.push({ id: c.id, text: c.text, label: 0, cls: 'benign', source: 'learn' });
  }
  for (const c of adversarial) {
    let text = [c.user_text, ...(c.docs || []), c.tool_output || ''].join(' ');
    if (c.marker) text = text.replaceAll(c.marker, ' ');
    rows.push({ id: c.id, text, label: c.cls === 'benign' ? 0 : 1, cls: c.cls, source: 'build' });
  }
  return rows;
}

const sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

export function train(texts, labels, { epochs = 300, lr = 0.5, l2 = 1.0 } = {}) {
  const fds = texts.map(extractFeatures);
  const keys = new Set();
  fds.forEach((f) => f.forEach((_, k) => keys.add(k)));
  const vocabList = [...keys].sort(); // ASCII-only keys, so UTF-16 order equals Python's code-point order
  const vocab = new Map(vocabList.map((k, i) => [k, i]));
  const vec = (f) => { const idx = [], val = []; f.forEach((c, k) => { const j = vocab.get(k); if (j !== undefined) { idx.push(j); val.push(Math.log1p(c)); } }); return [idx, val]; };
  const X = fds.map(vec);
  const n = texts.length, dim = vocabList.length;
  const w = new Float64Array(dim);
  let b = 0;
  const loss = [];
  for (let e = 0; e < epochs; e++) {
    const gw = new Float64Array(dim);
    let gb = 0, L = 0;
    for (let r = 0; r < n; r++) {
      const [idx, val] = X[r], y = labels[r];
      let z = b;
      for (let k = 0; k < idx.length; k++) z += w[idx[k]] * val[k];
      const p = sigmoid(z), pc = Math.min(Math.max(p, 1e-12), 1 - 1e-12);
      L += -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
      const err = p - y;
      gb += err;
      for (let k = 0; k < idx.length; k++) gw[idx[k]] += err * val[k];
    }
    let reg = 0;
    for (let j = 0; j < dim; j++) reg += w[j] * w[j];
    loss.push(L / n + (l2 * reg) / n);
    const step = lr / n;
    for (let j = 0; j < dim; j++) w[j] -= step * (gw[j] + 2 * l2 * w[j]);
    b -= step * gb;
  }
  const score = (text) => {
    const [idx, val] = vec(extractFeatures(text));
    let z = b;
    const contrib = idx.map((j, k) => [vocabList[j], w[j] * val[k]]);
    for (const [, c] of contrib) z += c;
    return { p: sigmoid(z), contrib };
  };
  return { vocabSize: dim, loss, bias: b, proba: (t) => score(t).p, explain: score };
}

export function confusion(yTrue, yPred) {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  yTrue.forEach((y, i) => { const p = yPred[i]; c[y ? (p ? 'tp' : 'fn') : (p ? 'fp' : 'tn')]++; });
  return c;
}

export function prf(c) {
  const precision = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0;
  const recall = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const specificity = c.tn + c.fp ? c.tn / (c.tn + c.fp) : 0;
  return { precision, recall, f1, specificity, accuracy: (c.tp + c.tn) / (c.tp + c.fp + c.tn + c.fn) };
}

// The recorded split: held-out ids come from results_deep.json, train is every other usable row in dataset order.
export function recordedSplit(rows, deep) {
  const held = new Set(deep.held_out.predictions.map((p) => p.id));
  return { train: rows.filter((r) => !held.has(r.id)), test: rows.filter((r) => held.has(r.id)) };
}

export function fitRecorded(evaluation, adversarial, deep) {
  const rows = loadDataset(evaluation, adversarial);
  const { train: tr, test } = recordedSplit(rows, deep);
  const m = deep.model;
  const model = train(tr.map((r) => r.text), tr.map((r) => r.label), { epochs: m.epochs, lr: m.lr, l2: m.l2 });
  const probs = test.map((r) => model.proba(r.text));
  return { rows, train: tr, test, model, probs };
}
