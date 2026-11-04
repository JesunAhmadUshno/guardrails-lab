# SPEC: guardrails-lab (P13)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: BlackBoxV2. Wave: Wave 5.
Hiring evidence: 5 of 5 (3 Anthropic plus 3 DeepMind safety postings read in full) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

## Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

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

## Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.
