"""Run the Build harness and write deterministic results.

Run: python level-2-build/run_build.py
Writes level-2-build/results_build.json. No timestamps, no
randomness. Run it twice and the file is identical.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from harness import run_all, load_cases  # noqa: E402


def main():
    cases = load_cases()
    out = run_all(cases)
    path = os.path.join(HERE, "results_build.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, sort_keys=True)
        f.write("\n")
    for stage in out["stages"]:
        print(stage, out["scores"][stage])
    print("Top class after stage 2:", out["top_class_after_stage2"])
    print("Wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
