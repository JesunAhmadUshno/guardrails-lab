# Release notes draft: guardrails-lab

Status: DRAFT notes for releases that already exist. Dated 2026-11-05.
These notes summarise the existing GitHub releases. No new release is
created by this file.

Releases verified with gh release list on 2026-11-05:
v0.1, v0.5, and v1.0, at the URLs below.

## v0.1, Learn: rule filters and PII redaction

URL: https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.1

- Rule-based input and output filters built with the Python
  standard library only: four PII detectors (EMAIL, PHONE, SSN,
  and CREDIT_CARD gated by the Luhn check), reverse-order redaction
  with [REDACTED:TYPE], and weighted policy scoring for jailbreak,
  prompt injection, and misuse (block at a score of 2 or more).
  Defensive safety work only; all PII examples are synthetic.
- Measured run: 30-case hand-labelled set, 30 of 30 matched
  expected action and class, benign false positives 0 of 8, PII
  exact redaction 7 of 7, catch rates 1.000 for jailbreak (5 of 5),
  prompt injection (5 of 5), and misuse (5 of 5).
- Tests: 20 unit tests in tests/test_learn_guardrails.py, plus the
  scaffold smoke test.
- Limits carried in the release: rules not a model, paraphrase
  brittleness, narrow PII coverage (4 types, one phone region),
  synthetic same-author set.

## v0.5, Build: adversarial harness against stand-in targets

URL: https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.5

- A 58-case adversarial set (16 jailbreak, 16 prompt injection, 16
  misuse, 10 benign) run against two in-repo stand-in targets
  modelled on the P05 RAG and P07 agent patterns. The real repos
  are not imported, and firing a tool only records its toy name.
  Three stages: target alone, target with the Learn guardrails,
  and guardrails plus a quarantine and data-wrapping fix for the
  top class, prompt injection.
- Measured run: bypass rates alone, guarded, guarded plus fix:
  jailbreak 1.000, 0.500, 0.500; prompt injection 1.000, 0.750,
  0.000; misuse 1.000, 0.625, 0.375. Benign success 10 of 10 at all
  three stages. Audit log: 174 records (58 cases times 3 stages)
  in level-2-build/results_build.json.
- Stage 1 rates are a property of the stand-ins by construction,
  stated in the release and the Build README, not a finding about
  real systems.
- Tests: 23 Build unit tests, 43 in total with Learn.
- Limits carried in the release: stand-in targets, synthetic
  same-author set, pattern-based brittleness, fix covers retrieved
  and tool text only (user-channel jailbreak stays at 0.500).

## v1.0, Deep: misuse classifier beside the bypass table

URL: https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v1.0

- Compressed Deep under the December Compression Protocol: a
  misuse classifier on the Build harness. Logistic regression
  written from scratch (full-batch gradient descent, 300 epochs,
  learning rate 0.5, L2 1.0), with word unigram and bigram plus
  character 3-gram and 4-gram features from text only. No rule
  outputs as features, and planted marker tokens stripped before
  featurising, so the classifier cannot learn the evaluation
  artefacts.
- Dataset: the repo own labelled sets, 81 usable cases (63
  block-worthy, 18 benign). The 7 Learn PII cases are excluded as
  a redact task, not a block task. Seeded stratified split (seed
  42, test fraction 0.25): train 61, held-out test 20.
- Measured run: held-out TP 16, FP 2, TN 2, FN 0, precision 0.889,
  recall 1.000, F1 0.941, accuracy 0.900, benign specificity 0.500
  (2 of 4, both false positives discuss jailbreak research),
  per-class held-out recall 1.000 for jailbreak (5 of 5), prompt
  injection (5 of 5), and misuse (6 of 6). Stratified 5-fold cross
  validation: precision mean 0.844, recall mean 0.922, F1 mean
  0.879. Classifier metrics are published beside the Build bypass
  table in the Deep README. Full traces are in
  level-3-deep/results_deep.json, identical across two runs.
- Tests: 10 Deep unit tests, 53 in total with Learn and Build.
- The rest of the v2 Deep scope is the v1.1 backlog in ROADMAP.md.
  It is not part of v1.0 and is not claimed by these notes.
