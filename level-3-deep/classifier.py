"""Small misuse classifier, Deep level. Stdlib only, trained from scratch.

Defensive safety work only: this classifier flags text that looks like
a jailbreak, a prompt injection, or a misuse request, so a caller can
block or review it. It does not generate any such content.

Method: binary logistic regression over text-derived features only.
Features are word unigrams and bigrams plus character 3-grams and
4-grams of the lowercased text. No case label, no expected class, no
rule score, and no guardrail output is ever used as a feature: those
would be leakage, because the rules were written against the same
phrases. The planted marker tokens in the Build set are stripped by
the data loader in run_deep.py for the same reason: a marker is an
evaluation artefact, not a property of real text.

Training is full-batch gradient descent from a zero initialisation,
so it is deterministic for a fixed dataset and hyperparameter set.
"""
import math
import re

TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text):
    """Lowercase alphanumeric tokens."""
    return TOKEN_RE.findall(text.lower())


def extract_features(text):
    """Return a dict of feature name to count, text-derived only."""
    feats = {}
    tokens = tokenize(text)
    for tok in tokens:
        key = "w:" + tok
        feats[key] = feats.get(key, 0) + 1
    for a, b in zip(tokens, tokens[1:]):
        key = "w:" + a + " " + b
        feats[key] = feats.get(key, 0) + 1
    padded = " " + " ".join(tokens) + " "
    for n in (3, 4):
        for i in range(len(padded) - n + 1):
            key = "c:" + padded[i:i + n]
            feats[key] = feats.get(key, 0) + 1
    return feats


def build_vocab(feature_dicts, min_count=1):
    """Sorted vocabulary of features seen at least min_count times."""
    counts = {}
    for feats in feature_dicts:
        for key in feats:
            counts[key] = counts.get(key, 0) + 1
    vocab = sorted(k for k, v in counts.items() if v >= min_count)
    return {key: i for i, key in enumerate(vocab)}


def vectorize(feats, vocab):
    """Sparse vector as (indices, values) with log1p counts."""
    idx = []
    vals = []
    for key, count in feats.items():
        j = vocab.get(key)
        if j is not None:
            idx.append(j)
            vals.append(math.log1p(count))
    return idx, vals


def sigmoid(z):
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


class LogisticMisuseClassifier:
    """Binary logistic regression, positive class is block-worthy."""

    def __init__(self, epochs=300, lr=0.5, l2=1.0):
        self.epochs = epochs
        self.lr = lr
        self.l2 = l2
        self.vocab = {}
        self.weights = []
        self.bias = 0.0
        self.loss_history = []

    def _score(self, idx, vals):
        z = self.bias
        for j, v in zip(idx, vals):
            z += self.weights[j] * v
        return z

    def fit(self, texts, labels):
        feature_dicts = [extract_features(t) for t in texts]
        self.vocab = build_vocab(feature_dicts)
        vectors = [vectorize(f, self.vocab) for f in feature_dicts]
        n = len(texts)
        dim = len(self.vocab)
        self.weights = [0.0] * dim
        self.bias = 0.0
        self.loss_history = []
        for _ in range(self.epochs):
            grad_w = [0.0] * dim
            grad_b = 0.0
            loss = 0.0
            for (idx, vals), y in zip(vectors, labels):
                p = sigmoid(self._score(idx, vals))
                p_clip = min(max(p, 1e-12), 1.0 - 1e-12)
                loss += -(y * math.log(p_clip) + (1 - y) * math.log(1 - p_clip))
                err = p - y
                grad_b += err
                for j, v in zip(idx, vals):
                    grad_w[j] += err * v
            reg = self.l2 * sum(w * w for w in self.weights)
            self.loss_history.append((loss / n) + reg / n)
            step = self.lr / n
            for j in range(dim):
                grad = grad_w[j] + 2.0 * self.l2 * self.weights[j]
                self.weights[j] -= step * grad
            self.bias -= step * grad_b
        return self

    def predict_proba(self, text):
        feats = extract_features(text)
        idx, vals = vectorize(feats, self.vocab)
        return sigmoid(self._score(idx, vals))

    def predict(self, text, threshold=0.5):
        return 1 if self.predict_proba(text) >= threshold else 0


def precision_recall_f1(tp, fp, fn):
    """Precision, recall, F1 from counts. Zero division gives 0.0."""
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return precision, recall, f1


def confusion_counts(y_true, y_pred):
    """Return dict with tp, fp, tn, fn as raw counts."""
    tp = sum(1 for a, b in zip(y_true, y_pred) if a == 1 and b == 1)
    fp = sum(1 for a, b in zip(y_true, y_pred) if a == 0 and b == 1)
    tn = sum(1 for a, b in zip(y_true, y_pred) if a == 0 and b == 0)
    fn = sum(1 for a, b in zip(y_true, y_pred) if a == 1 and b == 0)
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn}
