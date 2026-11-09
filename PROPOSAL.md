# PROPOSAL: guardrails-lab (P13)

Status: NOT LOCKED. This repo is **not pre-registered**. The scaffold
spec (commit 0432e67, 2026-11-04, before any code) set scope and
acceptance criteria but no hypotheses and no pass lines, and the
2026-11-07 review recorded that "no pre-stated hypotheses or success
thresholds" exist. Under the portfolio standard (METHOD section 7) the
repo is capped at Functional until a confirmatory cycle runs under a
newly locked proposal. No lock is invented after the results.

This file gathers the planning record that used to sit in SPEC.md,
NOVELTY.md, DOSSIER.md and ROADMAP.md, moved here on 2026-11-08 with
the text kept. The "remaining gaps" table from docs/research-review.md
is the next-cycle plan below.

Inside the moved sections, a mention of SPEC.md, NOVELTY.md, DOSSIER.md
or ROADMAP.md means the PROPOSAL.md section marked "was" that file; a
mention of a level README or the research review means the REPORT.md
section marked "was" that file.

## Question

How far do rule-based input and output guardrails, plus one targeted
fix for the worst attack class, cut the bypass rate per attack class
(jailbreak, prompt injection, misuse) against a RAG-style and an
agent-style target, and does a small text classifier add recall on
the same labelled cases?

## Hypotheses as recorded after the fact (not pre-registered)

These restate the scaffold spec's Learn, Build and Deep scope as
testable claims. They were written down with the results, so they are
scored in REPORT.md but do not count as a locked test.

- H1: the rule guardrails block every labelled attack in the Learn set
  and allow every benign case.
- H2: the guardrails cut bypass per class against the targets, compared
  with the targets alone.
- H3: one fix aimed at the top class after the guardrails cuts that
  class's bypass on the rerun.
- H4: a small misuse classifier trained on the labelled sets reaches
  useful precision and recall, published beside the bypass table.
- H5: the governance artefacts (model card, fixed-format evaluation
  report, incident log from one seeded case) ship with Deep.

## Next cycle: what a locked confirmatory proposal needs

To lift the cap, a new PROPOSAL revision is locked (tagged) before any
of these runs, with numeric pass lines. For the Software product
profile that also means coverage reported, a dependency audit and a
secret scan in CI, and release notes with an upgrade path. The gaps
found by the 2026-11-07 review, and what each needs (moved from
docs/research-review.md):

| Gap | What it needs |
| --- | --- |
| Real targets (SPEC asks for the P05 RAG and P07 agent) | The P05 and P07 systems running locally with a model behind them (a GPU host such as the fleet node BlackBoxV2), and a harness adapter. Hours of GPU time, no paid API if self-hosted. |
| External validity | A license-reviewed public jailbreak and prompt-injection set, scored as its own table. Needs the licence review first (Owner decision), then CPU only. |
| Held-out attack set for the fix | New attack cases written after the fix was frozen, ideally by a different author, so the stage-3 result is tested on cases the fix never saw. Needs a second author or an external set. |
| Paraphrase and encoding robustness | A paraphrase, base64, leetspeak and spacing set. Hand-writing it now would repeat the same-author bias, so it is a deliberate v1.1 step (ROADMAP.md). |
| Comparison with an existing guardrail library | Installing and running a third-party guardrail or safety classifier on the same cases. Model-based ones need a GPU host; this repo is stdlib only by design. |
| Model-based classifier and calibration | An embedding or small language model scorer (GPU), plus a larger benign set so calibration and a PR curve are not driven by 4 negatives. |
| Classifier tuning on a validation split | More labelled data. With 61 training cases a further validation split would leave too few benign cases to tune on. |
| Governance track (model card, fixed-format evaluation report, incident log template) | New scope named in SPEC.md and deferred to v1.1 in ROADMAP.md. Generating them from results_deep.json is cheap, but it needs the Owner's approval as new scope, so it is not done in this change. |
| Related work and novelty | A dated prior-art pass replacing the NOVELTY.md placeholder, with a measured difference against at least one published system. Pointers for that pass, not yet compared against: Perez and Ribeiro 2022, "Ignore Previous Prompt" (arXiv 2211.09527); Greshake et al. 2023 on indirect prompt injection (arXiv 2302.12173); Zou et al. 2023 on universal adversarial suffixes (arXiv 2307.15043); NeMo Guardrails (arXiv 2310.10501); Llama Guard (arXiv 2312.06674). |
| Hypotheses | Cannot be fixed after the fact: hypotheses written now, after every result is known, would not be pre-registered. Needs the next experiment (v1.1) to commit its hypotheses and thresholds before it runs. |

## Scaffold spec (was SPEC.md)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: BlackBoxV2. Wave: Wave 5.
Hiring evidence: 5 of 5 (3 Anthropic plus 3 DeepMind safety postings read in full) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

### Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

guardrails-lab: EXPAND

Subject: AI safety in production. Direct fits: Anthropic Safeguards (3 postings read) and DeepMind Frontier Safety and CBN safety (3 postings read) [confirmed, career documentation Sections A and D rank 4]. His ISO 27001 audit record supports this lane [self-reported, KPMG record].
v1 core [confirmed, v1]: input and output filters; PII detection and redaction with a jailbreak test set; Deep is a policy engine with audit logs and measured bypass rates.
Added track 1, red team:
- Learn: build an adversarial test set by hand: jailbreaks, prompt injection through retrieved text, and misuse requests in the classes the safety postings name.
- Build: run the set against the P05 RAG system and the P07 agent; score bypass rate per class; fix the top class and rerun.
- Deep: a small misuse classifier trained on the test set results, with precision and recall published beside the bypass table.
Added track 2, governance artefacts:
- Deep step inside this project: ship the artefacts a buyer or a regulator asks for: a model card for one system he built, an evaluation report in a fixed format, and an incident log template filled from one real (or seeded) case. The dates that make this track timely sit in Section 7.
Fan-out: Book chapter "The Guard At The Door". Paper angle: the bypass-rate red-team study. Course module: P13-guardrails-lab.

### Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.

## Novelty draft (was NOVELTY.md)

Status: DRAFT, PROPOSED. Not verified. This text does not move into any public post, paper, or profile until the Jev claim_check gate passes on the exact text.

### Proposed claim

Against guardrail libraries and published jailbreak sets: this project aims to differ in the way its SPEC.md section text defines (a from-zero or self-hosted build, measured in public, on a named home fleet, with the failure modes written down). The exact difference is stated at the project's wave, after the prior art is re-read.

### Prior art table

| Prior art | What it does | What this project does differently | Measured difference |
| --- | --- | --- | --- |
| guardrail libraries and published jailbreak sets | See DOSSIER.md, Past | PROPOSED, see the claim above | NO MEASUREMENT YET |

### Honest size

If the novelty proves small, this file will say so and name the real value instead (a cleaner reproduction, a better benchmark, a first public dataset). No novelty is invented to fill this section.

## Dossier (was DOSSIER.md)

Written under the documentation and publishing standard (past, present, future). Updated at ship time.

### Past

Prior art for this project is named in NOVELTY.md (guardrail libraries and published jailbreak sets). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md and will be expanded with dated sources at the project's wave, before Build opens.

### Present

Current demand evidence: hiring value 5 of 5 (3 Anthropic plus 3 DeepMind safety postings read in full) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md]. Tools and versions are pinned at Build time, not in this v1.

### Future

Open problems and the project's next steps sit in the Deep level scope in SPEC.md. Any forecast about this field is [unverified] unless a dated primary source is added here at the wave update.

### Deep ship note (2026-11-05)

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
level-3-deep/README.md. Named limits (synthetic same-author data, small held-out size,
governance artefacts not built, text-only features, Muse VM not
BlackBoxV2, benign specificity). The v1.1 backlog is in
ROADMAP.md: governance artefacts, larger and external labelled
sets, a model-based classifier, and a paraphrase and encoding
robustness set. Earlier sections of this dossier are kept as
history and were not rewritten.

## v1.1 backlog (was ROADMAP.md)

v1.0 shipped 2026-11-05: Learn, Build, and compressed Deep (a small
misuse classifier trained on the repo own labelled sets, precision
and recall published beside the Build bypass table).

### v1.1 backlog

- Governance artefacts: a model card for the Deep classifier, a
  fixed-format evaluation report generated from results_deep.json,
  and an incident log template filled from one seeded case.
- Larger and external labelled sets: license-checked public
  jailbreak and prompt injection sets, reported separately from the
  synthetic sets, with per-source results.
- Model-based classifier: an embedding or small language model
  scorer beside the logistic baseline, with a calibration study.
- Paraphrase and encoding robustness set: paraphrased, base64,
  leetspeak, and spacing-obfuscated variants of the attack classes,
  plus benign safety discussion controls, scored as their own table.
- Benign discussion fix: more benign cases that use attack
  vocabulary in a research or defence context, aimed at the
  measured benign specificity weakness (0.500 on held-out at v1.0).
- Channel-aware features: score user, retrieved, and tool surfaces
  separately instead of one joined surface.
