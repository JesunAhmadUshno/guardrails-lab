# Changelog

All notable changes to this project. Format: Keep a Changelog 1.1.
Versions follow Semantic Versioning. The tags v0.1, v0.5 and v1.0 were
cut under the old Learn / Build / Deep ladder; under the portfolio
standard v2 the repo's verdict is Functional, not "v1.0 Released".

## [Unreleased]

### Changed
- 2026-11-08: Restructured to the portfolio standard v2. README is the
  abstract (question, headline with its intervals, field, job family,
  verdict: Functional, not pre-registered). PROPOSAL.md gathers SPEC.md,
  NOVELTY.md, DOSSIER.md, ROADMAP.md and the review's remaining-gaps
  table. REPORT.md gathers the three level READMEs, docs/research-review.md
  and docs/index.md, and scores five after-the-fact hypotheses with
  their misses. PUBLICITY.md moved to fanout/. Grades and rubric scores
  left every public file and the dashboard. Code stays in the level-*/
  folders (decision 0001). The dashboard reads its limits and hashes
  from REPORT.md and links PROPOSAL.md and REPORT.md.
- 2026-11-08: One-command reproduce, scripts/reproduce.sh, run in CI,
  which also checks every result file regenerates byte for byte. CI
  declares read-only permissions and runs the layout check (required
  files, abstract order, no public grade). CodeQL also scans the
  dashboard's JavaScript; Dependabot watches site/ npm packages.

### Added
- 2026-11-07: Rigor pass (level-3-deep/rigor.py): Wilson intervals,
  exact McNemar paired tests, cross-validation spread, majority-class
  and rules-as-classifier baselines, leave-one-rule-out ablation.
- 2026-11-07: Live dashboard in site/ with JavaScript ports of the
  guardrails and the classifier, gated by build-time parity checks, and
  a Pages workflow. vite pinned to 6.4.5.
- 2026-11-05: Fan-out drafts in fanout/ (blog, tutorial, website copy,
  LinkedIn draft, paper candidate, release notes). Nothing posted.
- 2026-11-05: CI matrix on Python 3.11 and 3.12 with ruff, CodeQL,
  Dependabot, release, labeler, greetings and stale workflows.

### Fixed
- 2026-11-07: Stale Deep status in docs/index.md and the Learn
  unit-test row in the README.

## [1.0] - 2026-11-05

### Added
- Misuse classifier: logistic regression from scratch, text features
  only, trained on 81 labelled cases; held-out precision 0.889, recall
  1.000, F1 0.941; 5-fold CV F1 mean 0.879.

## [0.5] - 2026-11-05

### Added
- Three-stage adversarial harness: a 58-case set against stand-in RAG
  and agent targets, scored alone, guarded, and guarded plus a
  quarantine and data-wrapping fix for prompt injection.

## [0.1] - 2026-11-05

### Added
- Rule-based input and output guardrails, PII detection and redaction
  with Luhn-checked cards, and a 30-case hand-built evaluation set.

[Unreleased]: https://github.com/JesunAhmadUshno/guardrails-lab/compare/v1.0...HEAD
[1.0]: https://github.com/JesunAhmadUshno/guardrails-lab/compare/v0.5...v1.0
[0.5]: https://github.com/JesunAhmadUshno/guardrails-lab/compare/v0.1...v0.5
[0.1]: https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.1
