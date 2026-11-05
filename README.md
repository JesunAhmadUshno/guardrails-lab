# guardrails-lab

AI safety in production: filters, PII redaction, a jailbreak test set, a policy engine, a red-team track inside the isolated lab only.

Status: Level 1 Learn DONE (2026-11-05, ROADMAP-V3-BATCH). Levels 2 and 3 are scaffold only.
Project: P13. Fleet node: BlackBoxV2. Wave: Wave 5.

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: DONE. Rule-based input and output filters, PII detection and redaction (Luhn-checked cards), and a 30-case hand-built evaluation set (benign, synthetic PII, jailbreak, prompt injection, misuse), stdlib only.
- Level 2, Build: a real working system other people can run. Not built yet.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases. Not built yet.

## Benchmarks

Measured 2026-11-05, Muse VM, Python 3.12, by level-1-learn/run_learn.py.

| Test | Result |
| --- | --- |
| Evaluation set, all cases | 30 of 30 matched expected action and class |
| Benign false positive rate | 0 of 8, rate 0.000 |
| PII exact redaction | 7 of 7 |
| Jailbreak catch rate | 5 of 5, rate 1.000 |
| Prompt injection catch rate | 5 of 5, rate 1.000 |
| Misuse catch rate | 5 of 5, rate 1.000 |
| Unit tests | 20 passing, plus scaffold smoke test |

The perfect rates are on a small hand-built set written by the same
author as the rules. They are not a claim about unseen text. See the
level README limits and grade (7,700 of 10,000).

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
