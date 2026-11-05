# DOSSIER: guardrails-lab (P13) v1, 2026-11-04

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

## Past

Prior art for this project is named in NOVELTY.md (guardrail libraries and published jailbreak sets). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

## Present

Current demand evidence: hiring value 5 of 5 (3 Anthropic plus 3 DeepMind safety postings read in full) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

## Future

Open problems and the project's next steps sit in the Deep level scope in SPEC.md. Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.

## Deep ship note (2026-11-05)

Level 3 Deep shipped as v1.0 on 2026-11-05. A binary misuse
classifier (logistic regression from scratch, stdlib only, word
and character features from text only, no rule-output leakage,
planted markers stripped) was trained on the repo own labelled
sets: 81 usable cases (63 block-worthy, 18 benign; the 7 Learn PII
cases excluded as a redact task, not a block task). Seeded
stratified split, seed 42, test fraction 0.25: held-out 20 cases,
precision 0.889, recall 1.000, F1 0.941, confusion TP 16, FP 2,
TN 2, FN 0. Benign specificity on held-out was 0.500 (2 of 4),
the named worst class: benign jailbreak-research discussion was
flagged. Stratified 5-fold cross validation: F1 mean 0.879.
Classifier metrics are published beside the Build bypass table in
level-3-deep/README.md. Grade 7,800 of 10,000 with named
deductions (synthetic same-author data, small held-out size,
governance artefacts not built, text-only features, Muse VM not
BlackBoxV2, benign specificity). The v1.1 backlog is in
ROADMAP.md: governance artefacts, larger and external labelled
sets, a model-based classifier, and a paraphrase and encoding
robustness set. Earlier sections of this dossier are kept as
history and were not rewritten.
