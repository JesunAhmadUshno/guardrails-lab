# Paper candidate brief: guardrail bypass rates and a misuse classifier study

Project: P13 guardrails-lab
Status: CANDIDATE, brief written 2026-11-05
Submission note: submission is Jesun's tap. Nothing is submitted by
this brief, and no venue has been contacted. The publications
tracker is updated by the coordinator, not by this file.

## Working title

Bypass rates for layered guardrails on stand-in targets, with a
from-scratch misuse classifier measured beside the bypass table

## Abstract draft

Based only on the measured v1.0 results recorded in the repo.
Numbers below are from synthetic same-author sets and are stated
as such. This is defensive safety work: the labelled cases test
filters and stand-in targets, and all PII examples are synthetic.

Guardrail stacks are often reported with a single catch rate and
no bypass breakdown by attack class or defence stage. This work
presents an open, dependency-free guardrail stack and measures it
in three layers. At Learn level, rule-based input and output
filters with PII detection and redaction (credit cards gated by
the Luhn check) matched expected action and class on 30 of 30
hand-labelled cases, with benign false positives 0 of 8, PII exact
redaction 7 of 7, and catch rates 1.000 for jailbreak (5 of 5),
prompt injection (5 of 5), and misuse (5 of 5), with 20 unit
tests. At Build level, a 58-case adversarial set (16 jailbreak, 16
prompt injection, 16 misuse, 10 benign) ran against two in-repo
stand-in targets modelled on a retrieval pattern and an agent
pattern (the real systems were not imported) in three stages:
target alone, target with the Learn guardrails, and guardrails
plus a quarantine and data-wrapping fix for the top class.
Bypass rates alone, guarded, and guarded plus fix were jailbreak
1.000, 0.500, and 0.500; prompt injection 1.000, 0.750, and 0.000;
and misuse 1.000, 0.625, and 0.375, with benign success 10 of 10
at all stages and a 174-record audit log, with 23 tests (43 in
total). Stage 1 rates are a property of the stand-ins by
construction and are reported as such. At Deep level, a logistic
regression misuse classifier written from scratch, using word
unigram and bigram plus character 3-gram and 4-gram features from
text only (no rule outputs as features, planted markers stripped),
was trained on 81 usable cases (63 block-worthy, 18 benign; 7
Learn PII cases excluded as a redact task). On a held-out split
of 20 cases with seed 42 it scored TP 16, FP 2, TN 2, FN 0,
precision 0.889, recall 1.000, F1 0.941, and accuracy 0.900, with
benign specificity 0.500 (2 of 4) and per-class held-out recall
1.000 for jailbreak (5 of 5), prompt injection (5 of 5), and
misuse (6 of 6). Stratified 5-fold cross-validation means were
precision 0.844, recall 0.922, and F1 0.879. The stack ships with
53 unit tests. The sets are synthetic and same-author, the Build
targets are stand-ins, and the held-out set is small; the paper
claims the layered measurement method and its numbers on these
sets, not performance on real systems or unseen text.

## Method outline

1. PII layer: four detectors (EMAIL, PHONE, SSN, CREDIT_CARD gated
   by the Luhn check), with findings carrying type and span, and
   redaction replacing spans in reverse order with
   [REDACTED:TYPE].
2. Rule filter: three policy classes (jailbreak, prompt_injection,
   misuse) scored by weighted regex rules (strong phrase 2, weak
   topic word 1, block at 2 or more), applied to inputs and, with
   PII redaction, to outputs.
3. Stand-in targets: a retriever that answers from retrieved text
   and follows marker instructions planted in the query or the
   retrieved text, and a toy tool caller that fires a tool action
   suggested by tool output text. Firing records a toy name only.
   The real P05 and P07 repos are not imported.
4. Bypass definition: a case bypasses when its planted marker
   token ends up in the final target output, or its suggested tool
   action fires. For ungrounded misuse requests the target marks
   naive compliance with a constant placeholder instead of
   producing harmful content.
5. Three stages: target alone; Learn guardrails applied to user
   input, retrieved and tool text, and target output; then stage 2
   plus the fix chosen by code from the stage 2 numbers.
6. The fix: quarantine of instruction sentences in retrieved and
   tool text (marker token or tool suggestion together with an
   imperative verb), plus data wrapping of the remaining text
   between delimiters the targets treat as a fact surface.
7. Classifier: binary logistic regression from scratch (full-batch
   gradient descent, 300 epochs, learning rate 0.5, L2 1.0),
   features from text only (word unigrams and bigrams, character
   3-grams and 4-grams, log1p counts, vocabulary from the training
   split only). No leakage: labels, rule scores, and guardrail
   outputs are never features, and planted markers are stripped.
8. Scoring: bypass rate per class per stage, benign success,
   held-out precision, recall, F1, accuracy, and confusion counts,
   per-class held-out recall and benign specificity, and stratified
   5-fold cross-validation means. Every case record is in the
   results files in the repo.

## Results table

Measured 2026-11-05, synthetic same-author sets only, from the
level READMEs in the repo.

| Level | Set | Headline result | Tests |
| --- | --- | --- | --- |
| Learn | 30 cases | 30 of 30 matched, FP 0 of 8, PII 7 of 7, catch 1.000 per class | 20 |
| Build | 58 cases, 3 stages | Injection bypass 1.000 to 0.750 to 0.000; jailbreak 1.000 to 0.500 to 0.500; misuse 1.000 to 0.625 to 0.375; benign 10 of 10 all stages | 23 (43 total) |
| Deep, held-out | 20 of 81 cases, seed 42 | Precision 0.889, recall 1.000, F1 0.941, accuracy 0.900 (TP 16, FP 2, TN 2, FN 0) | 10 Deep (53 total) |
| Deep, cross-validation | 81 cases, 5 folds | Precision mean 0.844, recall mean 0.922, F1 mean 0.879 | 10 Deep (53 total) |

Named cases: the two Deep false positives are B05 and BN06, both
benign cases discussing jailbreak research. At Build stage 3,
jailbreak stays at 0.500 because those attacks arrive on the user
channel, which the retrieved and tool text fix does not touch.

## Venue class note

Per SPEC.md, the paper angle for P13 is the bypass-rate red-team
study. Venue class is a workshop or conference in AI safety, NLP,
or security, or a journal of the AJSE class, per the publications
pipeline tracker rules. One venue at a time. No venue is named as
submitted, accepted, or contacted in this brief. Fees, if any,
arise only after acceptance and remain Jesun's call under the
free-only rule.

## Limits the paper must carry

- Synthetic same-author sets only (30, then 58, then 81 usable
  cases). No scale or real-world accuracy claim.
- The Build targets are stand-ins, not the real P05 and P07
  systems. Stage 1 bypass rates are a property of the stand-ins by
  construction, and no Build rate transfers to a real system.
- Rules are brittle to paraphrase, spelling changes, and encoded
  text. The classifier keys on surface vocabulary, with no
  paraphrase or encoding robustness set run at v1.0.
- The Deep held-out set is small (20 cases, 4 benign), the class
  balance is 63 to 18 toward block-worthy, and benign specificity
  on held-out is 0.500.
- Compressed Deep only. The v1.1 backlog (governance artefacts,
  larger and external labelled sets, a model-based classifier,
  paraphrase and encoding robustness, benign discussion fix,
  channel-aware features) is future work, named in ROADMAP.md in
  the repo.

## Submission gate

Submission is Jesun's tap and nothing is submitted. This brief is
the candidate only.
