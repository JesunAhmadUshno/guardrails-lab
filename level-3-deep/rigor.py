"""Uncertainty, paired tests, baselines and rule ablation. Stdlib only.

Run: python level-3-deep/rigor.py
Writes level-3-deep/results_rigor.json. No randomness, no timestamps.

Everything here is derived from the committed results files and the
repo code. Nothing new is measured on new data:
1. Wilson 95% intervals for every Learn catch rate, every Build
   bypass rate, and the Deep held-out precision, recall and
   specificity, from the recorded counts.
2. Exact McNemar (two-sided binomial) tests for paired stage
   movements per class, from the per-case audit_log verdicts.
3. Cross-validation standard deviation (sample, n-1) from the
   recorded per-fold arrays.
4. Baselines on the same held-out split as the classifier: a
   majority-class predictor and the Learn rules used as a classifier
   (block means positive).
5. Leave-one-rule-out ablation: each Learn policy rule is removed in
   turn and the Learn evaluation and the Build harness are rerun.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "level-1-learn"))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
sys.path.insert(0, HERE)

import guardrails  # noqa: E402
from harness import load_cases, run_all  # noqa: E402
from run_deep import load_dataset, stratified_split  # noqa: E402

Z = 1.959963984540054  # two-sided 95% normal quantile


def wilson(k, n, z=Z):
    """Wilson score interval for k successes in n trials, as [lo, hi]."""
    if n == 0:
        return [0.0, 1.0]
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return [round(max(0.0, centre - half), 4), round(min(1.0, centre + half), 4)]


def mcnemar_exact(b, c):
    """Two-sided exact McNemar p-value for discordant counts b and c."""
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    tail = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def sample_sd(xs):
    m = sum(xs) / len(xs)
    return round(math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1)), 4)


def metrics(conf):
    tp, fp, tn, fn = conf["tp"], conf["fp"], conf["tn"], conf["fn"]
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * p * r / (p + r) if p + r else 0.0
    return {"confusion": conf, "precision": round(p, 3), "recall": round(r, 3), "f1": round(f1, 3),
            "accuracy": round((tp + tn) / (tp + fp + tn + fn), 3)}


def confusion(y_true, y_pred):
    pairs = list(zip(y_true, y_pred))
    return {"tp": pairs.count((1, 1)), "fp": pairs.count((0, 1)),
            "tn": pairs.count((0, 0)), "fn": pairs.count((1, 0))}


def learn_eval():
    """Learn pass count and benign false positives, same rules as run_learn.py."""
    with open(os.path.join(ROOT, "level-1-learn", "evaluation.json"), encoding="utf-8") as f:
        cases = json.load(f)
    passed = fp = 0
    for c in cases:
        r = guardrails.check(c["text"])
        ok = r["action"] == c["expected_action"]
        if c["category"] == "adversarial":
            ok = ok and r["predicted_class"] == c["expected_class"]
        if c["category"] == "pii":
            ok = ok and r["redacted_text"] == c["expected_redacted"]
        if c["category"] == "benign":
            ok = ok and r["redacted_text"] == c["text"]
            fp += r["action"] != "allow"
        passed += ok
    return passed, fp


def build_bypass():
    """Total adversarial bypasses at stage 2 and stage 3, plus benign successes at stage 2."""
    out = run_all(load_cases())["scores"]
    tot = {s: sum(v.get("bypass", 0) for v in out[s].values()) for s in out}
    return tot["stage2_guarded"], tot["stage3_guarded_plus_fix"], out["stage2_guarded"]["benign"]["success"]


def ablation():
    base_learn, base_fp = learn_eval()
    base_s2, base_s3, base_benign = build_bypass()
    rows = []
    original = guardrails._COMPILED
    try:
        for cls, rules in original.items():
            for i, (_rx, weight) in enumerate(rules):
                guardrails._COMPILED = {k: (v[:i] + v[i + 1:] if k == cls else v) for k, v in original.items()}
                learn, fp = learn_eval()
                s2, s3, benign = build_bypass()
                rows.append({"cls": cls, "rule_index": i, "weight": weight,
                             "learn_passed": learn, "learn_benign_fp": fp,
                             "build_stage2_bypass": s2, "build_stage3_bypass": s3,
                             "build_stage2_benign_success": benign,
                             "learn_cases_lost": base_learn - learn,
                             "stage2_bypass_added": s2 - base_s2})
    finally:
        guardrails._COMPILED = original
    return {"baseline": {"learn_passed": base_learn, "learn_benign_fp": base_fp,
                         "build_stage2_bypass": base_s2, "build_stage3_bypass": base_s3,
                         "build_stage2_benign_success": base_benign},
            "rules": rows}


def main():
    with open(os.path.join(ROOT, "level-1-learn", "results_learn.json"), encoding="utf-8") as f:
        learn = json.load(f)["summary"]
    with open(os.path.join(ROOT, "level-2-build", "results_build.json"), encoding="utf-8") as f:
        build = json.load(f)
    with open(os.path.join(HERE, "results_deep.json"), encoding="utf-8") as f:
        deep = json.load(f)

    learn_ci = {cls: {"k": v["caught"], "n": v["total"], "ci95": wilson(v["caught"], v["total"])}
                for cls, v in learn["per_class"].items()}
    learn_ci["benign_false_positive"] = {"k": learn["benign_false_positives"], "n": learn["benign_total"],
                                         "ci95": wilson(learn["benign_false_positives"], learn["benign_total"])}

    build_ci = {}
    for stage, classes in build["scores"].items():
        build_ci[stage] = {}
        for cls, v in classes.items():
            k = v.get("bypass", v.get("success"))
            build_ci[stage][cls] = {"k": k, "n": v["total"], "ci95": wilson(k, v["total"])}

    verdict = {(a["case_id"], a["stage"]): a["bypass"] for a in build["audit_log"]}
    ids = {}
    for a in build["audit_log"]:
        if a["cls"] != "benign":
            ids.setdefault(a["cls"], []).append(a["case_id"])
    paired = {}
    for first, second in (("stage1_alone", "stage2_guarded"), ("stage2_guarded", "stage3_guarded_plus_fix")):
        key = first + "_vs_" + second
        paired[key] = {}
        for cls in sorted(ids):
            cases = sorted(set(ids[cls]))
            b = sum(1 for i in cases if verdict[(i, first)] and not verdict[(i, second)])
            c = sum(1 for i in cases if verdict[(i, second)] and not verdict[(i, first)])
            paired[key][cls] = {"fixed": b, "broken": c, "n": len(cases), "p_exact": mcnemar_exact(b, c)}

    conf = deep["held_out"]["confusion"]
    tp, fp, tn, fn = conf["tp"], conf["fp"], conf["tn"], conf["fn"]
    held_ci = {"precision": {"k": tp, "n": tp + fp, "ci95": wilson(tp, tp + fp)},
               "recall": {"k": tp, "n": tp + fn, "ci95": wilson(tp, tp + fn)},
               "specificity": {"k": tn, "n": tn + fp, "ci95": wilson(tn, tn + fp)}}

    cv = deep["cross_validation"]
    cv_sd = {m: sample_sd(cv[m + "_per_fold"]) for m in ("precision", "recall", "f1")}

    _, test = stratified_split(load_dataset())
    recorded_ids = [p["id"] for p in deep["held_out"]["predictions"]]
    assert [r["id"] for r in test] == recorded_ids, "held-out split drifted from results_deep.json"
    y = [r["label"] for r in test]
    majority = 1 if deep["dataset"]["positive_block_worthy"] >= deep["dataset"]["negative_benign"] else 0
    baselines = {
        "majority_class": metrics(confusion(y, [majority] * len(y))),
        "learn_rules_as_classifier": metrics(confusion(y, [int(guardrails.check(r["text"])["action"] == "block")
                                                           for r in test])),
        "logistic_classifier_recorded": metrics(conf),
    }

    out = {"method": {"interval": "Wilson score, 95%, z=1.96",
                      "paired_test": "exact McNemar, two-sided binomial on discordant pairs",
                      "cv_spread": "sample standard deviation (n-1) of recorded per-fold metrics",
                      "baselines_split": "same seeded held-out split as results_deep.json (20 cases)",
                      "ablation": ("leave one Learn policy rule out, rerun Learn evaluation and Build harness; "
                                   "rule_index is the position in guardrails.POLICY_RULES[cls]")},
           "learn_ci": learn_ci, "build_ci": build_ci, "paired_mcnemar": paired,
           "held_out_ci": held_ci, "cv_sd": cv_sd, "baselines": baselines, "rule_ablation": ablation()}
    path = os.path.join(HERE, "results_rigor.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print("paired", json.dumps(paired["stage2_guarded_vs_stage3_guarded_plus_fix"]))
    print("baselines", {k: (v["precision"], v["recall"], v["f1"]) for k, v in baselines.items()})
    print("wrote", path)


if __name__ == "__main__":
    main()
