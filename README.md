# guardrails-lab

AI safety in production: filters, PII redaction, a jailbreak test set, a policy engine, a red-team track inside the isolated lab only.

Status: Level 1 Learn DONE and Level 2 Build DONE (2026-11-05, ROADMAP-V3-BATCH). Level 3 is scaffold only.
Project: P13. Fleet node: BlackBoxV2. Wave: Wave 5.

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: DONE. Rule-based input and output filters, PII detection and redaction (Luhn-checked cards), and a 30-case hand-built evaluation set (benign, synthetic PII, jailbreak, prompt injection, misuse), stdlib only.
- Level 2, Build: DONE. A 58-case adversarial set (16 jailbreak, 16 prompt injection, 16 misuse, 10 benign) run against two stand-in targets modelled on the P05 RAG and P07 agent patterns (the real repos are not imported), scored in three stages: target alone, Learn guardrails, and guardrails plus a quarantine and data-wrapping fix for the top class, prompt injection.
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

## Build results

Measured 2026-11-05, Muse VM, Python 3.12, by
level-2-build/run_build.py. Bypass rate per class per stage
(hand-checkable in level-2-build/results_build.json):

| Class | Alone | Guarded | Guarded plus fix |
| --- | --- | --- | --- |
| Jailbreak (16) | 1.000 | 0.500 | 0.500 |
| Prompt injection (16) | 1.000 | 0.750 | 0.000 |
| Misuse (16) | 1.000 | 0.625 | 0.375 |
| Benign (10) | 1.000 success | 1.000 success | 1.000 success |

Top class after the guarded stage: prompt injection. The fix
(quarantine of instruction sentences in retrieved and tool text,
plus wrapping that text as data the targets do not follow) takes
it to 0.000 on this set. The targets are stand-ins, not the real
P05 and P07 systems, and the set is hand-built and synthetic. See
level-2-build/README.md for method, failure modes, and the grade
(8,200 of 10,000). Unit tests: 43 passing (20 Learn, 23 Build),
plus the scaffold smoke test.

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
