# ROADMAP: guardrails-lab (P13) v1.1 backlog

v1.0 shipped 2026-11-05: Learn, Build, and compressed Deep (a small
misuse classifier trained on the repo own labelled sets, precision
and recall published beside the Build bypass table).

## v1.1 backlog

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
