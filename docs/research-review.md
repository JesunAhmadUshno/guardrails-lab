# Research review: guardrails-lab

Reviewed 2026-11-07 against a PhD-level research rubric. Every number
below comes from a committed results file: level-1-learn/results_learn.json,
level-2-build/results_build.json, level-3-deep/results_deep.json, or
level-3-deep/results_rigor.json (written by level-3-deep/rigor.py in this
change, deterministic, under a second on CPU).

## Verdict

As research: about 5.5 of 10 before this change, about 6 of 10 after it.
As engineering hygiene: about 8 of 10 (deterministic runners, recorded
hashes, a CI matrix, honest limits in every level README, and now
build-time parity checks for the browser ports).

The cheap gaps are closed in this change: uncertainty intervals, paired
significance tests, cross-validation spread, baselines, a threshold sweep
and a rule ablation. The gaps that remain are all about data and targets:
the sets are small, synthetic and written by the same author as the
defences, and the targets are stand-ins. No amount of extra analysis on
the same 88 cases fixes that, and this review does not pretend otherwise.

## Rubric

| Criterion | Grade | Evidence and gap |
| --- | --- | --- |
| Research question | 6/10 | Implicit: how far do rule guardrails and one targeted fix cut bypass per attack class, and does a small classifier add recall? It is answerable, but it is not written as a question with a population it generalises to. |
| Hypotheses | 4/10 | No pre-stated hypotheses or success thresholds. The fix was chosen from stage-2 numbers by code (good), but its expected effect was not stated before the stage-3 run. |
| Method | 7/10 | Clear, mechanical bypass definition (marker in output or tool fired); three stages; marker stripping and text-only features to avoid leakage; seeded split. Method is well documented in each level README. |
| Baselines | 6/10 (was 2/10) | Added: majority-class and rules-as-classifier baselines on the same held-out split. Missing: any external guardrail library. |
| Statistics and uncertainty | 7/10 (was 2/10) | Added: Wilson 95% intervals, exact McNemar paired tests, CV standard deviation. Small n still makes most intervals wide. |
| Reproducibility | 9/10 | Stdlib only, no randomness beyond a fixed seed, recorded sha256 hashes, CI reruns every runner. The dashboard build now fails if the JS ports drift from the Python results. |
| Threats to validity | 6/10 | Named honestly in each README (same author, stand-ins, small sets). Not yet organised as internal / external / construct validity; done below. |
| Related work | 2/10 | NOVELTY.md is an unverified placeholder ("NO MEASUREMENT YET"). DOSSIER.md defers prior art. No measured comparison with any published system or set. |
| Limitations | 8/10 | Each level lists failure modes and a deduction-by-deduction grade. The dashboard quotes them at build time. |

## What this change fixed

1. Docs drift. docs/index.md said "Deep: scaffold only" after Deep had
   shipped; it now states the Deep results and the Deep grade. The README
   Learn benchmark row said "20 passing" beside a 53-test total stated
   later; it now names the 20 as the Learn subset.
2. Uncertainty. Wilson 95% intervals for every rate (results_rigor.json
   learn_ci, build_ci, held_out_ci). Examples: Learn catch rate 5 of 5 per
   class is 0.5655 to 1.0; benign false positives 0 of 8 is 0.0 to 0.3244;
   stage-3 prompt-injection bypass 0 of 16 is 0.0 to 0.1936; held-out
   specificity 2 of 4 is 0.15 to 0.85. The perfect Learn rates are
   compatible with a true catch rate near 57%.
3. Paired significance. Exact two-sided McNemar on the per-case audit_log
   verdicts (paired_mcnemar). Stage 2 to stage 3: prompt injection 12
   cases stopped, 0 newly bypassed, p = 0.000488; misuse 4 and 0,
   p = 0.125 (not significant at 0.05); jailbreak 0 and 0, p = 1.0.
   Stage 1 to stage 2: jailbreak 8 and 0, p = 0.0078; misuse 6 and 0,
   p = 0.031; prompt injection 4 and 0, p = 0.125.
4. Cross-validation spread. Sample SD (n-1) of the recorded folds
   (cv_sd): precision 0.0484, recall 0.0545, F1 0.0269.
5. Baselines on the same 20 held-out cases (baselines). Majority class
   (always block): precision 0.8, recall 1.0, F1 0.889, accuracy 0.8.
   Learn rules as a classifier: precision 1.0, recall 0.375, F1 0.545.
   Logistic classifier: precision 0.889, recall 1.0, F1 0.941. The
   classifier beats always-block by two benign cases, which is within
   noise at 4 held-out negatives.
6. Threshold sweep. The dashboard retrains the classifier in the browser
   on the recorded split and sweeps the threshold, recomputing the
   confusion matrix, precision, recall, specificity and Wilson intervals.
   site/src/classifier.check.mjs asserts the retrain reproduces the
   recorded vocabulary size, first and final loss, every held-out
   prediction and the confusion matrix.
7. Rule ablation. Leave-one-rule-out over all 24 Learn rules, rerunning
   the Learn evaluation and the full Build harness (rule_ablation). 10 of
   24 rules change nothing on either set when removed; no single removal
   adds a benign false positive. The most load-bearing rules on the Build
   set are "write malware" and "ignore ... instructions" (+2 stage-2
   bypasses each).

## Threats to validity

- Internal: the fix was designed and evaluated on the same 58 cases, so
  the stage-3 prompt-injection result (0 of 16) risks overfitting to the
  set. The McNemar p-values test this fixed set, not unseen attacks.
- Construct: "bypass" means a planted marker reached the output or a tool
  fired. A real leak that paraphrases rather than echoes would not count.
- External: every case is synthetic and written by the author of the
  rules, targets, fix and classifier. Stage-1 bypass of 1.0 holds by
  construction of the stand-ins. Nothing here predicts a rate on a real
  model or on real traffic.
- Statistical: n = 16 per attack class, n = 4 held-out benign. Most
  intervals span 40 or more percentage points.

## Remaining gaps and exactly what each needs

| Gap | What it needs |
| --- | --- |
| Real targets (SPEC asks for the P05 RAG and P07 agent) | The P05 and P07 systems running locally with a model behind them (a GPU host such as the fleet node BlackBoxV2), and a harness adapter. Hours of GPU time, no paid API if self-hosted. |
| External validity | A license-reviewed public jailbreak and prompt-injection set, scored as its own table. Needs the licence review first (Owner decision), then CPU only. |
| Held-out attack set for the fix | New attack cases written after the fix was frozen, ideally by a different author, so the stage-3 result is tested on cases the fix never saw. Needs a second author or an external set. |
| Paraphrase and encoding robustness | A paraphrase, base64, leetspeak and spacing set. Hand-writing it now would repeat the same-author bias, so it is a deliberate v1.1 step (ROADMAP.md). |
| Comparison with an existing guardrail library | Installing and running a third-party guardrail or safety classifier on the same cases. Model-based ones need a GPU host; this repo is stdlib only by design. |
| Model-based classifier and calibration | An embedding or small language model scorer (GPU), plus a larger benign set so calibration and a PR curve are not driven by 4 negatives. |
| Classifier tuning on a validation split | More labelled data. With 61 training cases a further validation split would leave too few benign cases to tune on. |
| Governance track (model card, fixed-format evaluation report, incident log template) | New scope named in SPEC.md and deferred to v1.1 in ROADMAP.md. Generating them from results_deep.json is cheap, but it needs the Owner's approval as new scope, so it is not done in this change. |
| Related work and novelty | A dated prior-art pass replacing the NOVELTY.md placeholder, with a measured difference against at least one published system. Pointers for that pass, not yet compared against: Perez and Ribeiro 2022, "Ignore Previous Prompt" (arXiv 2211.09527); Greshake et al. 2023 on indirect prompt injection (arXiv 2302.12173); Zou et al. 2023 on universal adversarial suffixes (arXiv 2307.15043); NeMo Guardrails (arXiv 2310.10501); Llama Guard (arXiv 2312.06674). |
| Hypotheses | Cannot be fixed after the fact: hypotheses written now, after every result is known, would not be pre-registered. Needs the next experiment (v1.1) to commit its hypotheses and thresholds before it runs. |

## Reproduce this review

    python3 level-3-deep/rigor.py
    python3 -m unittest tests.test_rigor -v
    git diff --exit-code level-3-deep/results_rigor.json
