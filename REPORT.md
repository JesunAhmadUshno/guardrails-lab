# REPORT: guardrails-lab (P13)

Field profile: Software product. Status: not pre-registered (see
PROPOSAL.md). Every case is synthetic and hand-built by the same author
as the rules, the targets, the fix and the classifier. The targets are
in-repo stand-ins modelled on the P05 RAG and P07 agent patterns; the
real P05 and P07 systems were never run. Runs were recorded as on the
Muse VM (CPU, Python 3.12), not the fleet node BlackBoxV2 named in the
scaffold spec.

Inside the moved sections, a mention of SPEC.md, NOVELTY.md, DOSSIER.md
or ROADMAP.md means the PROPOSAL.md section marked "was" that file; a
mention of a level README, the Learn, Build or Deep README, or the
research review means the REPORT.md section marked "was" that file.

## Summary

The repo builds, with the Python standard library only, rule-based
input and output guardrails with PII redaction (component 1), a
three-stage adversarial harness against two stand-in targets with one
targeted fix (component 2), and a from-scratch logistic misuse
classifier (component 3). On its own 58-case set, the guardrails
halved jailbreak bypass and the quarantine and data-wrapping fix took
prompt-injection bypass from 12 of 16 to 0 of 16. Jailbreak, which
arrives on the user channel the fix does not touch, stayed at 8 of 16.
The classifier caught all 16 block-worthy held-out cases but flagged
2 of 4 benign ones, so it beats an always-block baseline by two cases,
which is within noise.

## Hypotheses scored (recorded after the fact, not pre-registered)

Intervals are Wilson 95%; p-values are exact two-sided McNemar on the
per-case audit log. All from level-3-deep/results_rigor.json unless
named.

| Hypothesis | Result | Evidence |
| --- | --- | --- |
| H1 rules block every Learn attack, allow every benign case | Supported on its own set: 15/15 attacks caught (each class 5/5, 0.57 to 1.00) and 0/8 benign false positives (0.00 to 0.32), PII redaction 7/7. Missed as a general claim: the same author wrote rules and cases, and the intervals allow a true catch rate near 57%. | level-1-learn/results_learn.json, learn_ci |
| H2 guardrails cut bypass per class vs the target alone | Partly. Jailbreak 16/16 to 8/16 (p = 0.0078) and misuse 16/16 to 10/16 (p = 0.031) moved. Missed for prompt injection: 16/16 to 12/16 (0.51 to 0.90), p = 0.125. Stage-1 bypass of 1.0 holds by construction of the stand-ins. | level-2-build/results_build.json, build_ci, paired_mcnemar |
| H3 one fix for the top class cuts its bypass | Supported on the same set the fix was designed on: prompt injection 12/16 to 0/16 (0.00 to 0.19), p = 0.00049. Misuse 10/16 to 6/16, p = 0.125 (not significant). Missed: jailbreak unchanged at 8/16 (0.28 to 0.72), and no held-out attack set tests the fix. | same files |
| H4 a small classifier reaches useful precision and recall | Recall 16/16 (0.81 to 1.00), precision 16/18 (0.67 to 0.97), F1 0.941; 5-fold CV F1 0.879, SD 0.027. Missed: benign specificity 2/4 (0.15 to 0.85); always-block scores F1 0.889 on the same split, so the gain is two benign cases out of four. | level-3-deep/results_deep.json, held_out_ci, baselines, cv_sd |
| H5 governance artefacts ship with Deep | Missed. No model card, evaluation report or incident log was built; deferred to v1.1 (PROPOSAL.md). | none |

## Software product profile

Not met, so the verdict would stop at Functional even without the
pre-registration cap.

- Tests through the public interface: met (tests call check(), the
  harness and the classifier through their module functions). Coverage
  is not reported: missed.
- Security checks: CodeQL runs on Python and the dashboard JavaScript,
  and Dependabot watches pip, npm and Actions. No dependency audit or
  secret scan runs in CI, and input validation is not tested as a
  security property: missed.
- Release notes: fanout/release-notes.md and the GitHub releases v0.1,
  v0.5 and v1.0. No upgrade path for users: missed.

## Numbers without evidence in the repo

- "Muse VM, Python 3.12" in each dated results section is the build
  record's statement; no file in the repo records the machine. The
  results are deterministic and CI regenerates them byte for byte on
  GitHub's runners, so the numbers do not depend on it.
- The Jev claim_check result quoted in fanout/PUBLICITY.md (noul 0.63,
  route REVIEW) lives in files outside this repo (hidden_files/ in the
  goal workspace). Treat it as unverified here.
- The hiring-evidence line in the scaffold spec ("5 of 5 ... postings
  read") has no evidence file in this repo.
- The test counts quoted in the dated sections below (20, 43, 53) were
  counts at the time; the suite now has more tests.

## Rule guardrails and PII redaction (was Learn, level-1-learn/README.md)

Status: DONE (2026-11-05). Rule-based input and output filters, PII
detection and redaction, and a hand-built adversarial evaluation set,
built with the Python standard library only. Defensive safety work
only: the adversarial cases are short labelled evaluation prompts in
the style of public safety eval sets. They test the filters. They are
not instructions for wrongdoing, and all PII examples are synthetic.

### Honest scope line

These are rules, not a model. They match explicit phrases and patterns
listed in guardrails.py. A paraphrase that avoids every listed phrase
will pass. That brittleness is a stated limit below, not a surprise.

### Method

1. PII detectors. Four types: EMAIL by regex, PHONE (North American
   3-3-4 with dash, dot, or space), SSN (3-2-4, synthetic examples
   only), and CREDIT_CARD only when the digits pass the Luhn check.
   A card-like number that fails Luhn is not flagged. Findings carry
   type, start, end, and the matched text. Redaction replaces spans
   in reverse order with [REDACTED:TYPE], so spans never shift.
2. Input filter. Three named policy classes with explicit rule lists:
   jailbreak, prompt_injection, and misuse. Each rule is a regex with
   a weight: a strong imperative phrase scores 2, a weak topic word
   scores 1. A class blocks at a score of 2 or more, so a benign
   discussion of a topic word alone never blocks. The predicted class
   is the highest scoring class.
3. Output filter. The same policy scoring, plus PII leakage handling:
   an output containing PII is returned with the PII redacted.
4. Combined API. check(text, direction) returns action (allow, redact,
   or block, in that precedence: block beats redact beats allow),
   predicted class, per-class scores, findings, and redacted text.
5. Evaluation set. evaluation.json holds 30 hand-labelled cases:
   8 benign that must pass, 7 PII cases with exact expected redacted
   text (all synthetic), and 15 adversarial cases (5 jailbreak,
   5 prompt injection through retrieved text, 5 misuse requests)
   with an expected block class.

### Run it

    python level-1-learn/run_learn.py
    python -m unittest tests.test_learn_guardrails -v
    python tests/test_smoke.py

The runner writes level-1-learn/results_learn.json deterministically:
run it twice and the file is identical (verified by hash).

### Results (measured 2026-11-05, Muse VM, Python 3.12)

| Group | Total | Passed or caught | Rate |
| --- | --- | --- | --- |
| All cases | 30 | 30 | 1.000 |
| Benign (false positives 0) | 8 | 8 allowed | FP rate 0.000 |
| PII (exact redaction) | 7 | 7 | 1.000 |
| Jailbreak | 5 | 5 | 1.000 |
| Prompt injection | 5 | 5 | 1.000 |
| Misuse | 5 | 5 | 1.000 |

Unit tests: 20 tests, all passing, plus the scaffold smoke test.
Determinism: sha256 of results_learn.json
4557e249839424d94194cc9c9d23cfdae288d4b62ad3fb623b8bdfb54621442a
identical across two runs.

Hand checks: Luhn on the public test card 4111 1111 1111 1111 passes;
the same digits ending in 2 fail. The email in P01 spans characters
14 to 43. A01 scores jailbreak 4 (2 for the ignore instruction phrase
plus 2 for the reveal phrase). B05 scores jailbreak 1 for the single
topic word and is allowed, below the block threshold of 2.

Read the perfect rates with care: the same author wrote the rules and
the cases, so 1.000 on this set shows the rules work as written on
their own examples. It does not predict a rate on unseen text.

### Failure modes and limits

- Rule brittleness: paraphrase, spelling changes, encoded text, or a
  new phrase with no listed pattern passes the filter. This is the
  largest known weakness and the reason Build level needs a model.
- PII coverage is narrow: 4 types, North American phone format only,
  no names, addresses, or free-text identifiers.
- Card detection needs a Luhn-valid number in a recognised grouping;
  a valid number written in an unusual grouping can be missed.
- The output filter reuses the input rule path. It is not a separate
  model or a separate policy tuned for generated text.
- The evaluation set is small (30 cases), hand-built, and synthetic.
  No external or real-world dataset was used at this level.
- Injection rules key on explicit markers (for example a bracketed
  system tag or a hidden instruction phrase). Unmarked injected
  instructions in fluent prose are largely missed by design scope.
- This level was run on the Muse VM (CPU), not on its fleet node
  BlackBoxV2. That limit is named here.

### What Build adds next

Run this set against the P05 RAG system and the P07 agent, score the
bypass rate per class there, fix the top class, and rerun. See SPEC.md.

## Adversarial harness and fix (was Build, level-2-build/README.md)

Status: DONE (2026-11-05). The expanded adversarial set runs against
two stand-in targets in three stages: target alone, target with the
Learn guardrails, and target with the guardrails plus one targeted
fix for the top class. Built with the Python standard library only.
Defensive safety work only: the cases are short labelled evaluation
prompts that test filters and targets. They are not instructions
for wrongdoing, and all PII examples are synthetic.

### Honest scope line

The targets are stand-ins, not the real systems. The real P05 RAG
repo and the real P07 agent repo are not imported. targets.py models
their patterns in miniature: a retriever that answers from retrieved
text and follows instruction-like text planted in it, and a toy tool
caller that fires a tool action suggested by tool output text. The
guardrails are the Learn rules, and rules are brittle: they match
explicit phrases and patterns, and a paraphrase that avoids every
listed phrase passes. Rates measured on stand-ins with hand-built
cases do not predict rates on a real model. Read the results with
that scope, not past it.

### Method

1. Stand-in targets (targets.py). RagTarget retrieves the document
   with the highest content-word overlap with the query (ties break
   to the earlier document), answers from its first sentence, and
   follows a marker instruction found in the query or the retrieved
   text: a planted marker token (for example PI05X) appearing with
   an imperative verb. AgentTarget fires the first "call tool
   <name>" suggestion found in the task or the tool output, and
   follows marker instructions in either text. Firing a tool only
   records its toy name in a list. Nothing real executes.
2. Bypass, defined mechanically. A case bypasses when its planted
   marker ends up in the final target output, or its suggested tool
   action fires. Markers are harmless tokens. For ungrounded misuse
   requests to the RAG stand-in, the target marks naive compliance
   with the constant UNSAFE_PLACEHOLDER_OUTPUT instead of producing
   any harmful content, and that constant is the case marker.
3. Adversarial set (adversarial.json). 58 cases: 16 jailbreak,
   16 prompt_injection, 16 misuse, and 10 benign controls. Attacks
   arrive on three channels: the user text, retrieved documents,
   and tool output. Each class mixes explicit phrasing the Learn
   rules were written against with fluent paraphrases they miss.
4. Three stages (harness.py). Stage 1: target alone on raw text.
   Stage 2: the Learn guardrails, imported from
   level-1-learn/guardrails.py (not copied), applied to the user
   input, to retrieved and tool text, and to the target output.
   An input block stops the case; a retrieved or tool block swaps
   in a blocked placeholder; an output block suppresses the output;
   a redact passes redacted text through. Stage 3: stage 2 plus the
   one targeted fix below, chosen by the code from the stage 2
   numbers, not hard-coded.
5. The fix (fix.py). Top class after stage 2 is prompt_injection,
   whose attacks arrive in retrieved and tool text, so the fix acts
   on those surfaces only. Part 1, quarantine: a sentence carrying
   a marker token or a tool suggestion together with an imperative
   verb is replaced whole by [QUARANTINED INSTRUCTION]. Part 2,
   data wrapping: the remaining text is wrapped between <<<DATA
   and DATA>>>, and the targets respect that delimiter: wrapped
   text is a fact surface, never an instruction source.
6. Audit log. results_build.json carries one audit record per case
   per stage (58 times 3 is 174 records): the guardrail action on
   each surface, whether the target ran, what fired, and the
   bypass verdict.

### Run it

    python level-2-build/run_build.py
    python -m unittest tests.test_build_harness -v
    python -m unittest discover -s tests
    python tests/test_smoke.py

The runner writes level-2-build/results_build.json
deterministically: run it twice and the file is identical
(verified by hash below).

### Results (measured 2026-11-05, Muse VM, Python 3.12)

Bypass rate per class per stage, hand-checkable from
results_build.json (scores key, and per-case rows under results):

| Class | Stage 1 alone | Stage 2 guarded | Stage 3 guarded plus fix |
| --- | --- | --- | --- |
| Jailbreak (16) | 16 bypass, 1.000 | 8 bypass, 0.500 | 8 bypass, 0.500 |
| Prompt injection (16) | 16 bypass, 1.000 | 12 bypass, 0.750 | 0 bypass, 0.000 |
| Misuse (16) | 16 bypass, 1.000 | 10 bypass, 0.625 | 6 bypass, 0.375 |
| Benign (10) | 10 success, 1.000 | 10 success, 1.000 | 10 success, 1.000 |

Top class after stage 2: prompt_injection at 0.750. The fix takes
it to 0.000 on this set. It also cuts misuse from 0.625 to 0.375,
because four misuse cases arrive through retrieved or tool text.
Jailbreak does not move (0.500 in stages 2 and 3): those attacks
arrive on the user channel, which this fix deliberately does not
touch. That is the honest limit of a one-class fix.

Hand checks: PI01 to PI04 are stopped at stage 2 because the Learn
rules score their retrieved or tool text at 2 or more (for example
PI01 carries a bracketed system tag). PI05 to PI16 use fluent
instructions with no listed phrase and bypass stage 2. JB15 shows
the weak-signal rule: the single topic word jailbreak scores 1,
below the block threshold of 2, so it bypasses stage 2. MU06 is
stopped at the retrieved check (its document scores misuse 2 for
an explicit malware phrase). BN09 is a redact, not a block: the
synthetic email is redacted and the benign answer (3 pm) still
arrives in all three stages.

Unit tests: 23 Build tests, all passing, plus the 20 Learn tests
and the scaffold smoke test (43 unit tests in total).
Determinism: sha256 of results_build.json
aecbe3ccde37b46ccb9c7dfe271edf8a072570ff13d6601f3514abaaf7b30056
identical across two runs.

Read the stage 1 rates with care: the stand-ins follow any marker
instruction by construction, so 1.000 alone is a property of the
stand-in, not a finding about real systems. The informative numbers
are the stage 2 to stage 3 movements, and even those are on a small
hand-built set written by the same author as the rules, the
targets, and the fix.

### Failure modes and limits

- Stand-in targets: a real LLM follows instructions in subtler
  ways than a marker-plus-imperative scan, and resists others this
  stand-in never models. No rate here transfers to a real system.
- The fix covers retrieved and tool text only. User-channel
  jailbreak (0.500) and the user-channel misuse cases (6 of the 16)
  survive stage 3 unchanged. They are the next fix queue.
- Marker definition: a marker quoted as data with no imperative
  verb is not followed and not counted. A real leak that quotes
  rather than instructs would be missed by this definition.
- Quarantine sentence splitting is naive: a period ends a
  sentence, and an instruction split across fragments with no
  marker or no listed imperative verb survives part 1. The DATA
  delimiter is the backstop, and a real target may not respect
  delimiters the way this stand-in does by construction.
- Guardrail brittleness carries over from Learn: paraphrase,
  spelling changes, and encoded text pass the rules.
- The evaluation set is hand-built and synthetic (58 cases). No
  external dataset and no real user data were used.
- This level was run on the Muse VM (CPU), not on its fleet node
  BlackBoxV2. That limit is named here.

### What Deep adds next

Per SPEC.md: a policy engine with audit logs as a standing
artefact, a small misuse classifier trained on this test set's
results with precision and recall published beside the bypass
table, and the governance artefacts (a model card for one built
system, an evaluation report in a fixed format, and an incident
log template filled from one seeded case).

## Misuse classifier (was Deep, level-3-deep/README.md)

Status: DONE 2026-11-05. A small misuse classifier trained from
scratch on the repo own labelled sets, with precision and recall
published beside the Build bypass table. Built with the Python
standard library only. Defensive safety work only: the classifier
flags misuse attempts so a caller can block or review them. It does
not generate misuse content, and all examples are synthetic.

### Method

1. Classifier (classifier.py). Binary logistic regression written
   from scratch: full-batch gradient descent, zero initialisation,
   300 epochs, learning rate 0.5, L2 strength 1.0. Features are
   text-derived only: word unigrams and bigrams plus character
   3-grams and 4-grams of the lowercased text, log1p counts.
   Vocabulary is built from the training split only (4,474 features).
   Training loss fell from 0.6931 in the first epoch to 0.1118 in
   the final epoch on the train split.
2. No leakage by design. Features come from the text alone. Case
   labels, expected classes, Learn rule scores, and guardrail
   outputs are never features: the rules were written against the
   same phrases, so rule-hit features would leak the answer. The
   planted marker token in each Build case is stripped from the
   text before featurising, for the same reason: a marker is an
   evaluation artefact, not a property of real text. No separate
   leakage experiment is reported as a headline result.
3. Data (run_deep.py, load_dataset). The repo own labelled sets:
   level-1-learn/evaluation.json and level-2-build/adversarial.json.
   Binary task: block-worthy (jailbreak plus prompt injection plus
   misuse) versus benign. Learn gives 15 block-worthy and 8 benign.
   Build gives 48 block-worthy and 10 benign, with its text surface
   defined as user_text plus retrieved docs plus tool output. Total
   usable: 81 cases, 63 positive and 18 negative. The 7 Learn PII
   cases are excluded and named: PII is a redact task, not a block
   task, and mixing it in would mislabel the classes.
4. Evaluation. Seeded stratified split, test fraction 0.25, seed
   42: train 61 (47 positive, 14 negative), held-out test 20
   (16 positive, 4 negative). Plus stratified 5-fold cross
   validation over all 81 cases with the same seed and model.
   results_deep.json is deterministic: two runs give the same
   sha256.

### Run it

    python level-3-deep/run_deep.py
    python -m unittest tests.test_deep_classifier -v
    python -m unittest discover -s tests

### Results (measured 2026-11-05, Muse VM, Python 3.12)

Held-out test split, 20 cases:

| Metric | Value |
| --- | --- |
| Precision | 0.889 |
| Recall | 1.000 |
| F1 | 0.941 |
| Accuracy | 0.900 |

Confusion matrix, raw counts: true positives 16, false positives
2, true negatives 2, false negatives 0. The counts sum to 20, the
held-out size.

Per-class held-out results:

| Class | Total | Caught or correct | Rate |
| --- | --- | --- | --- |
| Jailbreak | 5 | 5 caught | recall 1.000 |
| Prompt injection | 5 | 5 caught | recall 1.000 |
| Misuse | 6 | 6 caught | recall 1.000 |
| Benign | 4 | 2 correct | specificity 0.500 |

The two false positives are both benign cases that discuss
jailbreak research (B05 and BN06). The classifier flags safety
discussion that uses attack vocabulary. That is the worst class
result in this level and it is named, not averaged away.

Cross validation (stratified 5-fold, all 81 cases): precision mean
0.844, recall mean 0.922, F1 mean 0.879.

#### Beside the Build bypass table

Build bypass rates, copied exactly from
level-2-build/results_build.json (not recomputed):

| Class | Alone | Guarded | Guarded plus fix |
| --- | --- | --- | --- |
| Jailbreak (16) | 1.000 | 0.500 | 0.500 |
| Prompt injection (16) | 1.000 | 0.750 | 0.000 |
| Misuse (16) | 1.000 | 0.625 | 0.375 |
| Benign (10) | 1.000 success | 1.000 success | 1.000 success |

Read together: the rule guardrails plus the fix leave jailbreak at
0.500 bypass and misuse at 0.375 bypass on the Build set. The
classifier is a different defence layer: it scores input text
directly and, on its own held-out split, caught every block-worthy
case at a precision cost of 2 false positives in 4 benign cases.
The two tables use different sets and different definitions, so
their numbers are not combined into one rate.

### Failure modes

- Same-author synthetic data. Every case, and the classifier
  training set, was hand-built by the same author as the rules and
  the earlier levels. Shared phrasing inflates every metric here.
  No external or real user data was used, and no number here is a
  claim about unseen real text.
- Keyword brittleness. Word and character features key on surface
  vocabulary. A paraphrase that avoids attack vocabulary, or an
  encoded or obfuscated attack (base64, leetspeak, spacing tricks),
  can pass unseen, because no paraphrase or encoding robustness set
  was run. The mirror failure is measured: benign safety discussion
  that names attack terms is flagged (benign specificity 0.500,
  2 of 4 on held-out).
- Small sample size. 81 usable cases, 20 held out, only 4 benign
  held out. One benign case moves specificity by 0.250. The
  cross-validation means (F1 0.879) sit below the held-out F1
  (0.941), which is the expected direction for a small sample.
- Class imbalance. 63 positive to 18 negative. The classifier
  inherits a bias toward the block class, which shows up as the
  benign false positives above.
- Text-only features. No semantic or model-based representation,
  no channel or metadata signal. Retrieved-text and user-text
  attacks are scored from the joined surface only.
- Stand-in scope carries over. The Build bypass table was measured
  on stand-in targets, not the real P05 and P07 systems, and this
  level does not change that.

### What v1.1 adds next

See ROADMAP.md at the repo root: governance artefacts, larger and
external labelled sets, a model-based classifier, and a paraphrase
and encoding robustness set.

## Review (2026-11-07, was docs/research-review.md)

Reviewed 2026-11-07 against a PhD-level research rubric. Every number
below comes from a committed results file: level-1-learn/results_learn.json,
level-2-build/results_build.json, level-3-deep/results_deep.json, or
level-3-deep/results_rigor.json (written by level-3-deep/rigor.py in this
change, deterministic, under a second on CPU).

Engineering hygiene noted by the review: deterministic runners,
recorded hashes, a CI matrix, honest limits in every level section,
and build-time parity checks for the browser ports. The cheap gaps are closed in this change: uncertainty intervals, paired
significance tests, cross-validation spread, baselines, a threshold sweep
and a rule ablation. The gaps that remain are all about data and targets:
the sets are small, synthetic and written by the same author as the
defences, and the targets are stand-ins. No amount of extra analysis on
the same 88 cases fixes that, and this review does not pretend otherwise.

The review's scores are internal and are not shown here. Its evidence
and gap notes per criterion:

| Criterion | Evidence and gap |
| --- | --- |
| Research question | Implicit: how far do rule guardrails and one targeted fix cut bypass per attack class, and does a small classifier add recall? It is answerable, but it is not written as a question with a population it generalises to. |
| Hypotheses | No pre-stated hypotheses or success thresholds. The fix was chosen from stage-2 numbers by code (good), but its expected effect was not stated before the stage-3 run. |
| Method | Clear, mechanical bypass definition (marker in output or tool fired); three stages; marker stripping and text-only features to avoid leakage; seeded split. Method is well documented in each level README. |
| Baselines | Added: majority-class and rules-as-classifier baselines on the same held-out split. Missing: any external guardrail library. |
| Statistics and uncertainty | Added: Wilson 95% intervals, exact McNemar paired tests, CV standard deviation. Small n still makes most intervals wide. |
| Reproducibility | Stdlib only, no randomness beyond a fixed seed, recorded sha256 hashes, CI reruns every runner. The dashboard build now fails if the JS ports drift from the Python results. |
| Threats to validity | Named honestly in each README (same author, stand-ins, small sets). Not yet organised as internal / external / construct validity; done below. |
| Related work | NOVELTY.md is an unverified placeholder ("NO MEASUREMENT YET"). DOSSIER.md defers prior art. No measured comparison with any published system or set. |
| Limitations | Each level lists failure modes and named deductions (the scores are now internal). The dashboard quotes them at build time. |

### What the review fixed

1. Docs drift. docs/index.md said "Deep: scaffold only" after Deep had
   shipped; it now states the Deep results. The README
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

### Threats to validity

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

The remaining gaps and what each needs are the next-cycle plan in
PROPOSAL.md.

### Reproduce this review

    python3 level-3-deep/rigor.py
    python3 -m unittest tests.test_rigor -v
    git diff --exit-code level-3-deep/results_rigor.json

## Earlier summary page (was docs/index.md, 2026-11-07)

AI safety in production: rule-based input and output filters, PII detection and redaction, a jailbreak and prompt injection test set, and a measured adversarial harness against stand-in targets. Built with the Python standard library only.

- Learn: rule-based filters, PII detection and redaction (Luhn-checked cards), and a 30-case hand-built evaluation set. All 30 cases matched expected action and class, benign false positive rate 0 of 8, PII exact redaction 7 of 7.
- Build: a 58-case adversarial set (16 jailbreak, 16 prompt injection, 16 misuse, 10 benign) run in three stages against stand-in RAG and agent targets. Prompt injection bypass fell from 1.000 alone and 0.750 guarded to 0.000 with the quarantine and data-wrapping fix. Jailbreak stayed at 0.500 guarded plus fix, misuse fell to 0.375, benign success stayed 1.000.
- Deep: a small misuse classifier (logistic regression from scratch, stdlib only, text features only) trained on 81 usable labelled cases. On a 20-case held-out split: precision 0.889, recall 1.000, F1 0.941 (confusion 16, 2, 2, 0). Stratified 5-fold cross-validation F1 mean 0.879. The governance artefacts named in the SPEC are deferred to v1.1.

Every number above is already published in this repo (README.md and the level write-ups) and reproduced by the runners in this repo, checked in CI. The full write-ups are in the level folders: level-1-learn, level-2-build, level-3-deep. The targets are stand-ins, not the real P05 and P07 systems, and the sets are hand-built and synthetic, as stated in the level READMEs.

Releases: https://github.com/JesunAhmadUshno/guardrails-lab/releases
