# Website project page copy: guardrails-lab

Site: jesunahmadushno.com
Status: COPY ONLY, draft for the project page. Dated 2026-11-05.
Nothing on any website was changed by this file.

## Headline

guardrails-lab: rule filters, PII redaction, an adversarial harness, and a misuse classifier, measured in the open

## Summary

guardrails-lab is an open AI safety project built by Jesun Ahmad
Ushno as project P13 in Roadmap v3. It builds the guardrail stack
in three levels: rule-based input and output filters with PII
detection and redaction (credit cards gated by the Luhn check), an
adversarial harness that runs a 58-case labelled set against two
in-repo stand-in targets in three stages and fixes the top bypass
class, and a hand-written logistic regression misuse classifier
trained on text features only, with precision and recall published
beside the bypass table. It runs on the Python standard library
only. No external model, no API, and no credential are used. This
is defensive safety work: the labelled cases test filters and
targets, and all PII examples are synthetic.

Status: v1.0, 2026-11-05. Learn, Build, and compressed Deep are
done. Total tests: 53, all passing at v1.0.

## Results

All results below are measured runs on synthetic same-author sets,
recorded in the level READMEs in the GitHub repo. They prove the
filter logic, the harness machinery, and the classifier training
path, not production quality or rates on unseen text.

| Level | Set | Headline result | Notes |
| --- | --- | --- | --- |
| Learn | 30 cases | 30 of 30 matched, false positives 0 of 8, PII redaction 7 of 7 | Catch rates 1.000 for jailbreak, injection, misuse (5 of 5 each); 20 tests |
| Build | 58 cases (16 jailbreak, 16 injection, 16 misuse, 10 benign) | Bypass alone, guarded, guarded plus fix: jailbreak 1.000, 0.500, 0.500; injection 1.000, 0.750, 0.000; misuse 1.000, 0.625, 0.375 | Benign success 10 of 10 at all stages; 174-record audit log; 23 tests, 43 total |
| Deep (compressed) | 81 usable cases, held-out 20 (seed 42) | Precision 0.889, recall 1.000, F1 0.941, accuracy 0.900 (TP 16, FP 2, TN 2, FN 0) | Benign specificity 0.500 (2 of 4); per-class recall 1.000; 5-fold CV F1 mean 0.879; 10 tests, 53 total |

## Honest limits

- Synthetic same-author sets at every level, written by the same
  author as the rules, the targets, and the fix.
- The Build targets are stand-ins modelled on the P05 and P07
  patterns. The real repos are not imported. Stage 1 bypass rates
  are a property of the stand-ins by construction, and no rate
  here transfers to a real system.
- Rules are brittle to paraphrase and encoding. The classifier
  keys on surface vocabulary and flags benign safety discussion
  that uses attack terms (benign specificity 0.500 on held-out).
- Compressed Deep is not the full v2 Deep scope. The remainder is
  the v1.1 backlog in the repo ROADMAP.md.

## Links

- GitHub repo: https://github.com/JesunAhmadUshno/guardrails-lab
- Release v0.1 (Learn): https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.1
- Release v0.5 (Build): https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.5
- Release v1.0 (Learn, Build, compressed Deep): https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v1.0
- Tutorial: fanout/tutorial.md in the GitHub repo
- Blog post draft: fanout/blog-post.md in the GitHub repo

## License note

Code: Apache-2.0. Tutorials: CC BY 4.0.
