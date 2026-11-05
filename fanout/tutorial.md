# Tutorial: P13 guardrails-lab, course module

Module: P13-guardrails-lab
By Jesun Ahmad Ushno
Date: 2026-11-05
License for this tutorial: CC BY 4.0. Code in the repo: Apache-2.0.

## What you will do

You will clone the guardrails-lab repo, run all three levels, run
the test suite for each level, and read your own results against
the recorded v1.0 numbers. Every command below exists in the repo
as shipped at v1.0 and was run by the author of this module on
2026-11-05 to verify it. The project needs Python 3.12 and uses
the standard library only. No model, no API, and no credential are
needed. This is a defensive safety module: the labelled cases test
filters and stand-in targets. All PII examples are synthetic.

All recorded numbers in this module come from synthetic
same-author sets. They prove the filter logic, the harness
machinery, and the classifier training path. They do not prove
production quality or rates on unseen text.

## Step 0: Clone and enter the repo

```text
git clone https://github.com/JesunAhmadUshno/guardrails-lab.git
cd guardrails-lab
```

## Step 1: Level 1, Learn, rule filters and PII redaction

Read level-1-learn/README.md first. It explains the four PII
detectors (EMAIL, PHONE, SSN, and CREDIT_CARD gated by the Luhn
check), reverse-order redaction, the weighted policy scoring for
jailbreak, prompt_injection, and misuse (block at a score of 2 or
more), and the 30-case hand-labelled evaluation set.

Run the Learn evaluation:

```text
python3 level-1-learn/run_learn.py
```

Run the Learn tests:

```text
python3 -m unittest tests.test_learn_guardrails -v
```

Run the scaffold smoke test:

```text
python3 tests/test_smoke.py
```

Read your results:

- Expected summary: 30 of 30 cases passed, benign false positive
  rate 0.0, and per-class catch rates 1.0 for jailbreak, misuse,
  and prompt injection.
- Expected tests: 20 tests, all passing.
- Expected smoke test line: scaffold smoke test PASS.
- The runner writes level-1-learn/results_learn.json. Run it twice
  and the file is identical.

## Step 2: Level 2, Build, the adversarial harness

Read level-2-build/README.md. The real P05 and P07 repos are not
imported. Two in-repo stand-in targets model their patterns: a
retriever that follows instruction-like text planted in retrieved
documents, and a toy tool caller that fires a tool action suggested
by tool output text. A case bypasses when its planted marker ends
up in the final output, or its suggested tool action fires. Three
stages run: target alone, target with the Learn guardrails, and
guardrails plus a quarantine and data-wrapping fix for the top
class, prompt injection.

Run the Build harness:

```text
python3 level-2-build/run_build.py
```

Run the Build tests:

```text
python3 -m unittest tests.test_build_harness -v
```

Read your results:

- Expected stage 1 (alone): bypass 1.000 for jailbreak, prompt
  injection, and misuse, benign success 1.000. The stand-ins follow
  any marker instruction by construction, so stage 1 is a property
  of the stand-ins, not a finding about real systems.
- Expected stage 2 (guarded): jailbreak 0.500, prompt injection
  0.750, misuse 0.625, benign success 1.000.
- Expected stage 3 (guarded plus fix): jailbreak 0.500, prompt
  injection 0.000, misuse 0.375, benign success 1.000 (10 of 10).
- The runner writes level-2-build/results_build.json, including a
  174-record audit log (58 cases times 3 stages).
- Expected tests: 23 Build tests, all passing.

## Step 3: Level 3, Deep, the misuse classifier

Read level-3-deep/README.md. The classifier is logistic regression
written from scratch, with word unigram and bigram plus character
3-gram and 4-gram features from the text only. Rule scores and
guardrail outputs are never features, and the planted marker token
is stripped before featurising, so the classifier cannot learn the
evaluation artefacts. The dataset is 81 usable cases (63
block-worthy, 18 benign); the 7 Learn PII cases are excluded
because PII is a redact task, not a block task.

Run the Deep evaluation:

```text
python3 level-3-deep/run_deep.py
```

Run the Deep tests:

```text
python3 -m unittest tests.test_deep_classifier -v
```

Read your results:

- Expected dataset line: dataset 81, train 61, test 20.
- Expected held-out line: precision 0.889, recall 1.0, F1 0.941,
  with confusion TP 16, FP 2, TN 2, FN 0.
- Expected cross-validation line: F1 mean 0.879, precision mean
  0.844, recall mean 0.922.
- Per-class held-out recall is 1.000 for jailbreak (5 of 5),
  prompt injection (5 of 5), and misuse (6 of 6). Benign
  specificity is 0.500 (2 of 4): both false positives are benign
  cases discussing jailbreak research.
- The runner writes level-3-deep/results_deep.json. The Deep
  results are deterministic: run it twice and the file is
  identical.
- Expected tests: 10 Deep tests, all passing.

## Step 4: Run the full test suite

```text
python3 -m unittest discover -s tests -v
```

Expected: 53 tests in total (20 Learn, 23 Build, 10 Deep), all
passing, plus the scaffold smoke test.

## Step 5: Check your understanding

1. Why does a card-like number that fails the Luhn check pass the
   PII filter? (Answer: card detection is gated on Luhn by design,
   so random digit strings and order numbers are not flagged as
   cards. Only a Luhn-valid number in a recognised grouping is
   treated as a card.)
2. Why is the Build stage 1 bypass rate 1.000 for every attack
   class, and why is that not a finding about real systems?
   (Answer: the stand-in targets follow any marker instruction by
   construction. Stage 1 measures the stand-in definition. The
   informative numbers are the stage 2 to stage 3 movements.)
3. Why are Learn rule scores never used as classifier features in
   Deep? (Answer: the rules were written against the same phrases
   as the cases, so rule-hit features would leak the label into
   training. The classifier learns from text features only, and
   the planted marker token is stripped for the same reason.)

## Limits to keep with the numbers

- Synthetic same-author sets at every level.
- The Build targets are stand-ins. The real P05 and P07 repos are
  not imported, and no rate here transfers to a real system.
- Rules are brittle to paraphrase, spelling changes, and encoded
  text. The classifier keys on surface vocabulary and flags benign
  safety discussion that uses attack terms.
- The Deep held-out set is small: 20 cases, only 4 benign.
