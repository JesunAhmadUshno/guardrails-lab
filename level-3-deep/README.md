# Level 3, Deep: guardrails-lab

Status: DONE 2026-11-05. A small misuse classifier trained from
scratch on the repo own labelled sets, with precision and recall
published beside the Build bypass table. Built with the Python
standard library only. Defensive safety work only: the classifier
flags misuse attempts so a caller can block or review them. It does
not generate misuse content, and all examples are synthetic.

## Method

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

## Run it

    python level-3-deep/run_deep.py
    python -m unittest tests.test_deep_classifier -v
    python -m unittest discover -s tests

## Results (measured 2026-11-05, Muse VM, Python 3.12)

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

### Beside the Build bypass table

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

## Failure modes

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

## Grade

Grade: 7,800 of 10,000.

Deductions, named and summing to 2,200:
- Synthetic hand-built data, same author as rules and cases: minus 600.
- Small held-out size (20 cases, 4 benign): minus 500.
- Governance artefacts not built (model card, fixed-format
  evaluation report, incident log template are v1.1): minus 400.
- Text-only features, no semantic or model-based classifier: minus 300.
- Run on Muse VM, not BlackBoxV2: minus 200.
- Benign specificity 0.500 on held-out (safety discussion flagged):
  minus 200.
Total deducted: 2,200. 10,000 minus 2,200 = 7,800.

## What v1.1 adds next

See ROADMAP.md at the repo root: governance artefacts, larger and
external labelled sets, a model-based classifier, and a paraphrase
and encoding robustness set.
