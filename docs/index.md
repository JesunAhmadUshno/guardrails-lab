# guardrails-lab

AI safety in production: rule-based input and output filters, PII detection and redaction, a jailbreak and prompt injection test set, and a measured adversarial harness against stand-in targets. Built with the Python standard library only.

- Learn: rule-based filters, PII detection and redaction (Luhn-checked cards), and a 30-case hand-built evaluation set. All 30 cases matched expected action and class, benign false positive rate 0 of 8, PII exact redaction 7 of 7.
- Build: a 58-case adversarial set (16 jailbreak, 16 prompt injection, 16 misuse, 10 benign) run in three stages against stand-in RAG and agent targets. Prompt injection bypass fell from 1.000 alone and 0.750 guarded to 0.000 with the quarantine and data-wrapping fix. Jailbreak stayed at 0.500 guarded plus fix, misuse fell to 0.375, benign success stayed 1.000.
- Deep: a small misuse classifier (logistic regression from scratch, stdlib only, text features only) trained on 81 usable labelled cases. On a 20-case held-out split: precision 0.889, recall 1.000, F1 0.941 (confusion 16, 2, 2, 0). Stratified 5-fold cross-validation F1 mean 0.879. The governance artefacts named in the SPEC are deferred to v1.1.

Grades on record (of 10,000): Learn 7,700, Build 8,200, Deep 7,800.

Every number above is already published in this repo (README.md and the level write-ups) and reproduced by the runners in this repo, checked in CI. The full write-ups are in the level folders: level-1-learn, level-2-build, level-3-deep. The targets are stand-ins, not the real P05 and P07 systems, and the sets are hand-built and synthetic, as stated in the level READMEs.

Releases: https://github.com/JesunAhmadUshno/guardrails-lab/releases
