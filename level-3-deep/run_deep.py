"""Run the Deep misuse classifier and write deterministic results.

Run: python level-3-deep/run_deep.py
Writes level-3-deep/results_deep.json. Seeded, no timestamps.

Data: the repo own labelled sets only.
- level-1-learn/evaluation.json (30 cases): adversarial cases (15)
  are block-worthy with their expected_class; benign cases (8) are
  negative. PII cases (7) are excluded from the binary task and the
  exclusion is stated here and in the README: PII is a redact task,
  not a block task, and mixing it in would mislabel the classes.
- level-2-build/adversarial.json (58 cases): jailbreak, prompt
  injection and misuse (48) are block-worthy; benign (10) negative.
  The text surface is user_text plus retrieved docs plus tool output
  joined with spaces. The planted marker token for each case is
  stripped from that text: a marker is an evaluation artefact and
  using it would be leakage.

Split: stratified train and test split, test fraction 0.25, seed 42.
Cross-validation: stratified 5-fold over the full 81 cases, same
model and hyperparameters, reported as mean metrics.
"""
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from classifier import LogisticMisuseClassifier, confusion_counts, precision_recall_f1  # noqa: E402

SEED = 42
TEST_FRACTION = 0.25
BLOCK_CLASSES = ("jailbreak", "prompt_injection", "misuse")


def load_dataset():
    """Return list of dicts with id, text, label, cls, source."""
    rows = []
    with open(os.path.join(ROOT, "level-1-learn", "evaluation.json"), encoding="utf-8") as f:
        learn = json.load(f)
    for c in learn:
        if c["category"] == "adversarial":
            rows.append({"id": c["id"], "text": c["text"], "label": 1,
                         "cls": c["expected_class"], "source": "learn"})
        elif c["category"] == "benign":
            rows.append({"id": c["id"], "text": c["text"], "label": 0,
                         "cls": "benign", "source": "learn"})
    with open(os.path.join(ROOT, "level-2-build", "adversarial.json"), encoding="utf-8") as f:
        build = json.load(f)
    for c in build:
        text = " ".join([c["user_text"]] + list(c.get("docs", [])) + [c.get("tool_output", "")])
        if c.get("marker"):
            text = text.replace(c["marker"], " ")
        label = 0 if c["cls"] == "benign" else 1
        rows.append({"id": c["id"], "text": text, "label": label,
                     "cls": c["cls"], "source": "build"})
    return rows


def stratified_split(rows, seed=SEED, test_fraction=TEST_FRACTION):
    """Seeded stratified split. Returns (train, test), each sorted by id order of appearance."""
    rng = random.Random(seed)
    by_label = {}
    for i, r in enumerate(rows):
        by_label.setdefault(r["label"], []).append(i)
    test_idx = set()
    for label in sorted(by_label):
        idx = list(by_label[label])
        rng.shuffle(idx)
        k = max(1, round(len(idx) * test_fraction))
        test_idx.update(idx[:k])
    train = [r for i, r in enumerate(rows) if i not in test_idx]
    test = [r for i, r in enumerate(rows) if i in test_idx]
    return train, test


def evaluate(model, rows):
    y_true = [r["label"] for r in rows]
    y_pred = [model.predict(r["text"]) for r in rows]
    conf = confusion_counts(y_true, y_pred)
    precision, recall, f1 = precision_recall_f1(conf["tp"], conf["fp"], conf["fn"])
    per_class = {}
    for cls in sorted({r["cls"] for r in rows}):
        group = [(a, b) for r, a, b in zip(rows, y_true, y_pred) if r["cls"] == cls]
        if cls == "benign":
            correct = sum(1 for a, b in group if b == 0)
            per_class[cls] = {"total": len(group), "correct_as_benign": correct,
                              "specificity": round(correct / len(group), 3) if group else 0}
        else:
            caught = sum(1 for a, b in group if b == 1)
            per_class[cls] = {"total": len(group), "caught": caught,
                              "recall": round(caught / len(group), 3) if group else 0}
    return {"confusion": conf, "precision": round(precision, 3), "recall": round(recall, 3),
            "f1": round(f1, 3), "accuracy": round((conf["tp"] + conf["tn"]) / len(rows), 3) if rows else 0,
            "per_class": per_class,
            "predictions": [{"id": r["id"], "cls": r["cls"], "label": a, "predicted": b}
                            for r, a, b in zip(rows, y_true, y_pred)]}


def cross_validate(rows, folds=5, seed=SEED):
    rng = random.Random(seed)
    by_label = {}
    for i, r in enumerate(rows):
        by_label.setdefault(r["label"], []).append(i)
    fold_of = [0] * len(rows)
    for label in sorted(by_label):
        idx = list(by_label[label])
        rng.shuffle(idx)
        for pos, i in enumerate(idx):
            fold_of[i] = pos % folds
    precisions, recalls, f1s = [], [], []
    for fold in range(folds):
        train = [r for i, r in enumerate(rows) if fold_of[i] != fold]
        test = [r for i, r in enumerate(rows) if fold_of[i] == fold]
        model = LogisticMisuseClassifier()
        model.fit([r["text"] for r in train], [r["label"] for r in train])
        res = evaluate(model, test)
        precisions.append(res["precision"])
        recalls.append(res["recall"])
        f1s.append(res["f1"])
    return {"folds": folds, "seed": seed,
            "precision_mean": round(sum(precisions) / folds, 3),
            "recall_mean": round(sum(recalls) / folds, 3),
            "f1_mean": round(sum(f1s) / folds, 3),
            "precision_per_fold": precisions, "recall_per_fold": recalls, "f1_per_fold": f1s}


def load_bypass_table():
    with open(os.path.join(ROOT, "level-2-build", "results_build.json"), encoding="utf-8") as f:
        build = json.load(f)
    return build["scores"]


def main():
    rows = load_dataset()
    train, test = stratified_split(rows)
    model = LogisticMisuseClassifier()
    model.fit([r["text"] for r in train], [r["label"] for r in train])
    held_out = evaluate(model, test)
    cv = cross_validate(rows)
    out = {
        "dataset": {"total_usable": len(rows),
                    "positive_block_worthy": sum(1 for r in rows if r["label"] == 1),
                    "negative_benign": sum(1 for r in rows if r["label"] == 0),
                    "pii_excluded_from_learn": 7,
                    "sources": ["level-1-learn/evaluation.json", "level-2-build/adversarial.json"]},
        "split": {"seed": SEED, "test_fraction": TEST_FRACTION,
                  "train_size": len(train), "test_size": len(test),
                  "train_positive": sum(1 for r in train if r["label"] == 1),
                  "train_negative": sum(1 for r in train if r["label"] == 0),
                  "test_positive": sum(1 for r in test if r["label"] == 1),
                  "test_negative": sum(1 for r in test if r["label"] == 0)},
        "model": {"type": "logistic_regression_from_scratch",
                  "features": "word unigrams and bigrams plus character 3-grams and 4-grams, log1p counts, text only",
                  "epochs": model.epochs, "lr": model.lr, "l2": model.l2,
                  "vocab_size_train": len(model.vocab),
                  "train_loss_first_epoch": round(model.loss_history[0], 4),
                  "train_loss_final_epoch": round(model.loss_history[-1], 4)},
        "held_out": held_out,
        "cross_validation": cv,
        "build_bypass_scores_copied_from_results_build_json": load_bypass_table(),
    }
    path = os.path.join(HERE, "results_deep.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"dataset {len(rows)} train {len(train)} test {len(test)}")
    print(f"held-out precision {held_out['precision']} recall {held_out['recall']} f1 {held_out['f1']}")
    print(f"confusion {held_out['confusion']}")
    print(f"cv f1 mean {cv['f1_mean']} precision mean {cv['precision_mean']} recall mean {cv['recall_mean']}")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
