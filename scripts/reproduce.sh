#!/bin/sh
# One-command reproduce: tests, the four runners, then check that every
# committed result file came back byte for byte (same check as CI).
set -e
cd "$(dirname "$0")/.."
python3 -m unittest discover -s tests -v
python3 level-1-learn/run_learn.py
python3 level-2-build/run_build.py
python3 level-3-deep/run_deep.py
python3 level-3-deep/rigor.py
git diff --exit-code -- level-1-learn/results_learn.json level-2-build/results_build.json \
  level-3-deep/results_deep.json level-3-deep/results_rigor.json
echo "Reproduced: every committed result matches."
