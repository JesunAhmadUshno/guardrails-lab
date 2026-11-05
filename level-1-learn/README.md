# Level 1, Learn: guardrails-lab

Status: DONE (2026-11-05). Rule-based input and output filters, PII
detection and redaction, and a hand-built adversarial evaluation set,
built with the Python standard library only. Defensive safety work
only: the adversarial cases are short labelled evaluation prompts in
the style of public safety eval sets. They test the filters. They are
not instructions for wrongdoing, and all PII examples are synthetic.

## Honest scope line

These are rules, not a model. They match explicit phrases and patterns
listed in guardrails.py. A paraphrase that avoids every listed phrase
will pass. That brittleness is a stated limit below, not a surprise.

## Method

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

## Run it

    python level-1-learn/run_learn.py
    python -m unittest tests.test_learn_guardrails -v
    python tests/test_smoke.py

The runner writes level-1-learn/results_learn.json deterministically:
run it twice and the file is identical (verified by hash).

## Results (measured 2026-11-05, Muse VM, Python 3.12)

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

## Failure modes and limits

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
  BlackBoxV2. That costs a grade deduction, named in the grade.

## Grade

Grade: 7,700 of 10,000.

Deductions, named and summing to 2,300:
- Synthetic hand-built set, rules and cases by the same author: minus 700.
- Rules not ML, paraphrase brittleness: minus 600.
- Narrow PII coverage (4 types, one phone region): minus 400.
- No external dataset or real-world validation: minus 300.
- Output filter is the same code path as the input filter: minus 200.
- Run on Muse VM, not BlackBoxV2: minus 100.
Total deducted: 2,300. 10,000 minus 2,300 = 7,700.

## What Build adds next

Run this set against the P05 RAG system and the P07 agent, score the
bypass rate per class there, fix the top class, and rerun. See SPEC.md.
