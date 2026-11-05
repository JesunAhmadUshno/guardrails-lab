"""Run the Learn evaluation set and write deterministic results.

Run: python level-1-learn/run_learn.py
Writes level-1-learn/results_learn.json. No timestamps, no randomness.
"""
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from guardrails import check  # noqa: E402


def main():
    with open(os.path.join(HERE, "evaluation.json"), encoding="utf-8") as f:
        cases = json.load(f)
    rows = []
    for c in cases:
        r = check(c["text"], direction="input")
        passed = r["action"] == c["expected_action"]
        if c["category"] == "adversarial":
            passed = passed and r["predicted_class"] == c["expected_class"]
        if c["category"] == "pii":
            passed = passed and r["redacted_text"] == c["expected_redacted"]
        if c["category"] == "benign":
            passed = passed and r["redacted_text"] == c["text"]
        rows.append({"id": c["id"], "category": c["category"],
                     "expected_action": c["expected_action"],
                     "expected_class": c["expected_class"],
                     "action": r["action"],
                     "predicted_class": r["predicted_class"],
                     "scores": r["scores"],
                     "findings": [f["type"] for f in r["findings"]],
                     "redacted_text": r["redacted_text"], "passed": passed})
        print(f"{c['id']} {c['category']}: action={r['action']} "
              f"class={r['predicted_class']} [{'PASS' if passed else 'FAIL'}]")
    benign = [r for r in rows if r["category"] == "benign"]
    fp = sum(1 for r in benign if r["action"] != "allow")
    per_class = {}
    adv_classes = sorted({r["expected_class"] for r in rows
                          if r["category"] == "adversarial"})
    for cls in adv_classes:
        group = [r for r in rows if r["expected_class"] == cls]
        caught = sum(1 for r in group if r["passed"])
        per_class[cls] = {"total": len(group), "caught": caught,
                          "catch_rate": round(caught / len(group), 3) if group else 0}
    pii = [r for r in rows if r["category"] == "pii"]
    summary = {
        "total": len(rows), "passed": sum(1 for r in rows if r["passed"]),
        "benign_total": len(benign), "benign_false_positives": fp,
        "false_positive_rate_benign": round(fp / len(benign), 3) if benign else 0,
        "pii_total": len(pii), "pii_passed": sum(1 for r in pii if r["passed"]),
        "per_class": per_class,
    }
    out = {"summary": summary, "results": rows}
    path = os.path.join(HERE, "results_learn.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Summary: {summary['passed']} of {len(rows)} passed; "
          f"FP rate benign={summary['false_positive_rate_benign']}; "
          f"per-class={per_class}")
    print("Wrote", path)
    return 0 if summary["passed"] == len(rows) else 1


if __name__ == "__main__":
    raise SystemExit(main())
