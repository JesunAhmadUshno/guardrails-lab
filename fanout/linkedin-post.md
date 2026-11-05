# LinkedIn post draft: P13 guardrails-lab v1.0

Status: DRAFT NOT POSTED
Date drafted: 2026-11-05
Author: Jesun Ahmad Ushno
Rule for this platform: the link goes in the first comment, not in the
post body. The first comment line is at the end of this file.

## Post body

Guardrails fail quietly until you measure them. So I built a
guardrail stack in the open and published the bypass rates,
including the ones that stay bad.

guardrails-lab v1.0 is done: Learn, Build, and a compressed Deep,
Python standard library only. Defensive safety work only, and all
PII examples are synthetic.

Learn: rule-based input and output filters with PII detection and
redaction. Credit cards are flagged only when the digits pass the
Luhn check. On a 30-case hand-labelled set: 30 of 30 matched,
false positives 0 of 8 benign, PII redaction 7 of 7, catch rates
1.000 for jailbreak, prompt injection, and misuse. 20 tests.
Grade 7,700 of 10,000.

Build: a 58-case adversarial set (16 jailbreak, 16 prompt
injection, 16 misuse, 10 benign) against two in-repo stand-in
targets modelled on my RAG and agent patterns. The real repos are
not imported. Bypass rates alone, guarded, guarded plus fix:
jailbreak 1.000, 0.500, 0.500; prompt injection 1.000, 0.750,
0.000; misuse 1.000, 0.625, 0.375. Benign success 10 of 10 at
every stage, with a 174-record audit log. The fix (quarantine plus
data wrapping on retrieved and tool text) took prompt injection to
zero on this set. Stage 1 rates are a property of the stand-ins by
construction, stated in the repo, not a finding about real
systems. 43 tests in total. Grade 8,200 of 10,000.

Deep (compressed): a logistic regression misuse classifier written
from scratch, text features only, no rule outputs as features.
Trained on 81 usable cases. On a held-out split of 20 (seed 42):
precision 0.889, recall 1.000, F1 0.941, accuracy 0.900 (TP 16,
FP 2, TN 2, FN 0). Per-class recall 1.000 across jailbreak,
injection, and misuse. 53 tests in total. Grade 7,800 of 10,000,
with deductions named in the repo.

The honest limits, in the post and not in a footnote: synthetic
same-author data at every level; rules brittle to paraphrase; the
classifier flags benign safety discussion that uses attack
vocabulary (benign specificity 0.500, 2 of 4 on held-out, the
worst number in the project); user-channel jailbreak still
bypasses at 0.500 after the fix; and the Deep held-out set is
small, with only 4 benign cases. The rest of the Deep scope is
named as the v1.1 backlog in the repo, not claimed as done.

If you ship models: do you publish your guardrail bypass rates, or
only your catch rates?

## First comment (post this as the first comment, per the standing rule)

Repo, releases v0.1, v0.5, and v1.0, and the full tutorial: https://github.com/JesunAhmadUshno/guardrails-lab
