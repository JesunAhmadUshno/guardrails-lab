# guardrails-lab

**Question.** How far do rule-based input and output guardrails, plus
one targeted fix for the worst attack class, cut the bypass rate per
attack class (jailbreak, prompt injection, misuse) against a RAG-style
and an agent-style target, and does a small text classifier add recall
on the same labelled cases?

**Headline.** On its own 58-case hand-built set against in-repo stand-in targets, one quarantine and data-wrapping fix cut prompt-injection bypass from 12/16 (Wilson 95% 0.51 to 0.90) under the rule guardrails to 0/16 (0.00 to 0.19), exact McNemar p = 0.0005, while jailbreak bypass stayed at 8/16 (0.28 to 0.72); the real P05 and P07 targets were never run.
The misuse classifier caught 16/16 held-out attacks (0.81 to 1.00) but
passed only 2/4 benign cases (0.15 to 0.85), two cases better than
always blocking.

**Field.** Software product (AI safety guardrails). **Job family.**
AI safety and trust engineering (safeguards).

**Verdict.** Functional, not pre-registered. Tests pass in CI on
Python 3.11 and 3.12, the results are regenerated from the labelled
sets by one command (scripts/reproduce.sh) and checked byte for byte
in CI, and the guardrails, the three-stage harness and the classifier
have run end to end on the repo's own sets. No plan with pass lines
was locked before results, the targets are stand-ins, and the Software
product profile (coverage, dependency audit and secret scan, an upgrade
path) is not met, so the repo stops at Functional.

Live dashboard: https://jesunahmadushno.github.io/guardrails-lab/
(a guard playground and a classifier retrain that rerun the repo's own
code in your browser; `npm run build` fails unless both reproduce the
recorded Python results exactly).

## Reproduce

```text
sh scripts/reproduce.sh
```

Python 3.11 or later, standard library only, under ten seconds on a
CPU. The script runs the tests and the four runners
(level-1-learn/run_learn.py, level-2-build/run_build.py,
level-3-deep/run_deep.py, level-3-deep/rigor.py), then fails if any
committed result file changed. CI runs the same script. The dashboard
rebuilds with `cd site && npm ci && npm run build`.

## Lifecycle

- Question: DONE 2026-11-04
- Proposal: OPEN (not pre-registered; see PROPOSAL.md)
- Baseline: DONE 2026-11-05
- Build: DONE 2026-11-05
- Evaluate: OPEN
- Report: DONE 2026-11-08
- Review: OPEN
- Release: OPEN

## Layout

| Path | What it holds |
| --- | --- |
| PROPOSAL.md | Question, hypotheses as recorded, the scaffold spec, novelty draft, dossier, v1.1 backlog, and what a locked confirmatory cycle needs (not locked) |
| REPORT.md | Hypotheses scored with misses, profile check, method and results per component, failure modes, the 2026-11-07 review and threats to validity |
| level-1-learn/ | Code: rule guardrails and PII redaction (guardrails.py), runner; evidence: the 30-case evaluation.json and results_learn.json |
| level-2-build/ | Code: stand-in targets, harness, fix, runner; evidence: the 58-case adversarial.json and results_build.json (174-record audit log) |
| level-3-deep/ | Code: classifier, runner, rigor pass (intervals, McNemar, baselines, ablation); results_deep.json, results_rigor.json |
| scripts/ | reproduce.sh: the one-command reproduce |
| tests/ | Unit tests for every component and the layout check (tests/test_smoke.py) |
| docs/decisions/ | Records of hard-to-reverse choices |
| site/ | The live dashboard, built from the files above |
| fanout/ | Dated publicity drafts (2026-11-05) and the channel log, fanout/PUBLICITY.md; file names inside them refer to the layout of that date |
| CHANGELOG.md, CITATION.cff, SECURITY.md, LICENSE | Release history, citation, security policy, licence |

No experiments/ or results/ folder: the labelled sets are hand-written
inputs and every result is deterministic, so each result file sits next
to the code that writes it and CI proves it regenerates unchanged
(decision 0001).

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
