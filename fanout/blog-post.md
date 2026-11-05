# The Guard at the Door: Building guardrails-lab in the Open

By Jesun Ahmad Ushno
Date: 2026-11-05
Status: DRAFT, written fan-out for P13 guardrails-lab v1.0. Not posted.

## The problem

A model in production meets text it did not ask for: user prompts
that try to override its instructions, retrieved documents that
carry planted instructions, tool output that suggests actions, and
ordinary traffic that contains personal data. Guardrails are the
checks that sit at that door: filters on the way in, redaction of
personal data, and a record of what was blocked and why. This
project builds those checks in the open, measures them on labelled
sets, and writes down where they fail.

This project, P13 in Roadmap v3, builds guardrails in three levels:
rule-based input and output filters with PII detection and
redaction, an adversarial harness that runs a larger labelled set
against two stand-in targets in three stages, and a small misuse
classifier trained from scratch on the repo own labelled sets. All
code runs with the Python standard library only. This is defensive
safety work only: the labelled cases test the filters and the
targets. They are not instructions for wrongdoing, and all PII
examples are synthetic.

Repository: https://github.com/JesunAhmadUshno/guardrails-lab

## Past, present, future (the dossier, condensed)

Past: guardrail libraries and published jailbreak sets already
exist. The prior art and the problem history are recorded in
DOSSIER.md and NOVELTY.md in the repo. The novelty claim there
stays marked PROPOSED. This post makes no novelty claim beyond the
measured work below.

Present: v1.0 closes three levels on 2026-11-05. Learn built
rule-based filters and PII redaction and measured them on a 30-case
hand-labelled set (grade 7,700 of 10,000). Build ran a 58-case
adversarial set against two in-repo stand-in targets and fixed the
top bypass class, prompt injection (grade 8,200 of 10,000).
Compressed Deep trained a hand-written logistic regression misuse
classifier on text features only and published its precision and
recall beside the Build bypass table (grade 7,800 of 10,000).

Future: the rest of the v2 Deep scope is named in ROADMAP.md in
the repo as the v1.1 backlog. It includes governance artefacts (a
model card, a fixed-format evaluation report, an incident log
template), larger and external labelled sets, a model-based
classifier, a paraphrase and encoding robustness set, a benign
discussion fix, and channel-aware features. None of that is done,
and none of it is claimed here.

## Main results claim

At v1.0, on synthetic same-author data only: Learn passed 20 tests with 30 of 30 cases matching expected action and class, false positives 0 of 8 benign, PII exact redaction 7 of 7 with a Luhn-gated card check, and catch rates 1.000 for jailbreak (5 of 5), prompt injection (5 of 5) and misuse (5 of 5); Build passed 23 tests (43 tests in total) on a 58-case adversarial set (16 jailbreak, 16 prompt injection, 16 misuse, 10 benign) run against two in-repo stand-in targets in three stages, with bypass rates alone, guarded and guarded plus fix of jailbreak 1.000, 0.500 and 0.500, prompt injection 1.000, 0.750 and 0.000, misuse 1.000, 0.625 and 0.375, benign success 10 of 10 at all three stages, and a 174-record audit log; compressed Deep passed 10 tests (53 tests in total) with a hand-written logistic regression misuse classifier using word unigram and bigram plus character 3-gram and 4-gram features from text only, trained on 81 usable cases (63 block-worthy, 18 benign, 7 Learn PII cases excluded), and on a held-out split of 20 cases with seed 42 it scored TP 16, FP 2, TN 2, FN 0, precision 0.889, recall 1.000, F1 0.941, accuracy 0.900, benign specificity 0.500 (2 of 4), per-class held-out recall 1.000 for jailbreak (5 of 5), prompt injection (5 of 5) and misuse (6 of 6), with 5-fold cross-validation means of precision 0.844, recall 0.922 and F1 0.879.

Every number in that claim comes from a run recorded in the level
READMEs in the repo, on synthetic same-author sets. Read the limits
section below before quoting any of it.

## Results by level

### Level 1, Learn (release v0.1)

Learn is rules, not a model. Four PII detectors run by pattern:
EMAIL, PHONE in North American 3-3-4 form, SSN in 3-2-4 form, and
CREDIT_CARD only when the digits pass the Luhn check, so a
card-like number that fails Luhn is not flagged. Redaction replaces
spans in reverse order with [REDACTED:TYPE]. The input filter
scores three policy classes (jailbreak, prompt_injection, misuse)
with weighted rules: a strong imperative phrase scores 2, a weak
topic word scores 1, and a class blocks at 2 or more, so a benign
discussion of a topic word alone never blocks. The output filter
reuses the same scoring and redacts PII found in generated text.

| Measure | Result |
| --- | --- |
| Cases matched expected action and class | 30 of 30 |
| Benign false positives | 0 of 8, rate 0.000 |
| PII exact redaction | 7 of 7 |
| Jailbreak catch rate | 1.000 (5 of 5) |
| Prompt injection catch rate | 1.000 (5 of 5) |
| Misuse catch rate | 1.000 (5 of 5) |
| Tests | 20 |
| Determinism | results_learn.json identical across two runs (hash verified) |

Grade: 7,700 of 10,000. Deductions are itemized in the Learn
README: minus 700 for the synthetic same-author set, minus 600 for
rule brittleness to paraphrase, minus 400 for narrow PII coverage,
minus 300 for no external dataset, minus 200 because the output
filter is the same code path as the input filter, and minus 100
for running on the Muse VM instead of BlackBoxV2. Total
deductions 2,300, and 10,000 minus 2,300 is 7,700.

### Level 2, Build (release v0.5)

Build runs the guardrails against targets. The real P05 RAG repo
and the real P07 agent repo are not imported. Two in-repo stand-in
targets model their patterns in miniature: a retriever that answers
from retrieved text and follows instruction-like text planted in
it, and a toy tool caller that fires a tool action suggested by
tool output text. Firing a tool only records its toy name. Nothing
real executes. A case bypasses when its planted marker ends up in
the final target output, or its suggested tool action fires. The
58-case set arrives on three channels: user text, retrieved
documents, and tool output.

Three stages run: the target alone, the target with the Learn
guardrails on every surface, and the guardrails plus one targeted
fix. The fix was chosen by the code from the stage 2 numbers, not
hard-coded. The top class after stage 2 was prompt injection, so
the fix acts on retrieved and tool text only: quarantine, which
replaces a sentence carrying a marker token or a tool suggestion
together with an imperative verb, and data wrapping, which wraps
the remaining text as data the targets do not follow.

| Class | Alone | Guarded | Guarded plus fix |
| --- | --- | --- | --- |
| Jailbreak (16) | 1.000 | 0.500 | 0.500 |
| Prompt injection (16) | 1.000 | 0.750 | 0.000 |
| Misuse (16) | 1.000 | 0.625 | 0.375 |
| Benign (10) | 1.000 success | 1.000 success | 1.000 success |

Benign success was 10 of 10 at all three stages. The audit log in
results_build.json carries 174 records, one per case per stage
(58 times 3). Read the stage 1 rates with care: the stand-ins
follow any marker instruction by construction, so 1.000 alone is a
property of the stand-ins, not a finding about real systems. The
informative numbers are the stage 2 to stage 3 movements. The fix
also cut misuse from 0.625 to 0.375, because four misuse cases
arrive through retrieved or tool text. Jailbreak did not move
(0.500 in stages 2 and 3), because those attacks arrive on the user
channel, which this fix deliberately does not touch.

Tests: 23 Build tests, 43 in total with Learn.

Grade: 8,200 of 10,000. Deductions are itemized in the Build
README: minus 700 for stand-in targets instead of the real P05 and
P07 systems, minus 500 for the synthetic same-author set, minus
300 for pattern-based brittleness, minus 200 for no model-based
defence at this level, and minus 100 for running on the Muse VM
instead of BlackBoxV2. Total deductions 1,800, and 10,000 minus
1,800 is 8,200.

### Level 3, Deep, compressed (release v1.0)

Deep adds a learned layer beside the rules. The classifier is
binary logistic regression written from scratch: full-batch
gradient descent, zero initialisation, 300 epochs, learning rate
0.5, L2 strength 1.0. Features come from the text alone: word
unigrams and bigrams plus character 3-grams and 4-grams, log1p
counts, with a vocabulary of 4,474 features built from the
training split only. Case labels, expected classes, Learn rule
scores, and guardrail outputs are never features, because the rules
were written against the same phrases and rule-hit features would
leak the answer. The planted marker token in each Build case is
stripped from the text before featurising for the same reason.

The dataset is the repo own labelled sets: 81 usable cases, 63
block-worthy and 18 benign. The 7 Learn PII cases are excluded and
named, because PII is a redact task, not a block task. The seeded
stratified split (seed 42, test fraction 0.25) gives train 61 and
held-out test 20 (16 block-worthy, 4 benign).

| Metric | Held-out value |
| --- | --- |
| True positives | 16 |
| False positives | 2 |
| True negatives | 2 |
| False negatives | 0 |
| Precision | 0.889 |
| Recall | 1.000 |
| F1 | 0.941 |
| Accuracy | 0.900 |
| Benign specificity | 0.500 (2 of 4) |

Per-class held-out recall: jailbreak 1.000 (5 of 5), prompt
injection 1.000 (5 of 5), misuse 1.000 (6 of 6). Stratified 5-fold
cross validation over all 81 cases: precision mean 0.844, recall
mean 0.922, F1 mean 0.879. The cross-validation F1 sits below the
held-out F1, which is the expected direction for a small sample.
The two false positives are both benign cases that discuss
jailbreak research (B05 and BN06). The classifier flags safety
discussion that uses attack vocabulary. That is the worst class
result in this level and it is named here, not averaged away.

Tests: 10 Deep tests, 53 in total with Learn and Build.

Grade: 7,800 of 10,000. Deductions are itemized in the Deep
README: minus 600 for synthetic same-author data, minus 500 for
the small held-out size (20 cases, 4 benign), minus 400 because
the governance artefacts are not built, minus 300 for text-only
features, minus 200 for running on the Muse VM instead of
BlackBoxV2, and minus 200 for benign specificity 0.500 on
held-out. Total deductions 2,200, and 10,000 minus 2,200 is 7,800.

## Honest limits

- Synthetic same-author data at every level. The same author wrote
  the rules, the cases, the targets, and the fix. The perfect Learn
  rates show the rules work as written on their own examples. They
  do not predict a rate on unseen text.
- Rules are brittle by design scope. A paraphrase that avoids every
  listed phrase, a spelling change, or encoded text passes the
  Learn filter. Injection rules key on explicit markers, and
  unmarked injected instructions in fluent prose are largely missed
  at Learn level.
- The Build targets are stand-ins, not the real P05 and P07
  systems, and they are not imported. Stage 1 bypass rates are a
  property of the stand-ins by construction. No rate in this
  project transfers to a real model.
- The Build fix covers retrieved and tool text only. User-channel
  jailbreak (0.500 bypass after the fix) and the user-channel
  misuse cases (6 of 16) survive stage 3 unchanged. They are the
  next fix queue.
- The Deep classifier keys on surface vocabulary. A paraphrase
  that avoids attack vocabulary, or an encoded attack, can pass
  unseen, and benign safety discussion that names attack terms is
  flagged, as the 0.500 benign specificity shows.
- The Deep sample is small: 81 usable cases, 20 held out, only 4
  benign held out, so one benign case moves specificity by 0.250.
  The class balance is 63 positive to 18 negative, which biases
  the classifier toward the block class.
- PII coverage is narrow: 4 types, North American phone format
  only, no names, addresses, or free-text identifiers. Card
  detection needs a Luhn-valid number in a recognised grouping.
- Compressed Deep is not the full v2 Deep scope. The governance
  artefacts and the rest of the Deep scope are the named v1.1
  backlog in ROADMAP.md.
- The runs executed on the Muse VM, not the assigned BlackBoxV2
  node. That deduction is named in each level grade.

## Where to go next

- Tutorial: fanout/tutorial.md in the repo, a step-by-step module
  that runs all three levels and the full test suite.
- Releases: v0.1 (Learn), v0.5 (Build), v1.0 (Learn, Build,
  compressed Deep) on the GitHub repo linked above.
- Book chapter: "The Guard At The Door" per SPEC.md, held as a
  draft angle in this fan-out set.
- License: code Apache-2.0, tutorials CC BY 4.0.
