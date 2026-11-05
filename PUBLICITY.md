# PUBLICITY: guardrails-lab (P13)

Publicity log under the documentation and publishing standard,
Section 7. Every finished level produces its written fan-out set,
each piece graded on the 1,000-point publicity rubric (accuracy 300,
research 200, gap fit 200, clarity 150, reach format 150), ship line
900. Drafts are prepared by the loop. Actual social posting follows
the standing platform rules and gates. The loop itself never posts
to social.

Project state at this pack: Level 1 Learn DONE and Level 2 Build
DONE (2026-11-05). Level 3 Deep is scaffold only. Level grades in
the repo: Learn 7,700 of 10,000, Build 8,200 of 10,000. Unit tests:
43 passing (20 Learn, 23 Build), plus the scaffold smoke test.

## Fan-out set (2026-11-05)

Fan-out set date: 2026-11-05. Project state: v1.0, Learn, Build,
and compressed Deep done 2026-11-05, 53 tests passing. Level
grades on record: Learn 7,700 of 10,000, Build 8,200 of 10,000,
Deep 7,800 of 10,000. Deep detail: a hand-written logistic
regression misuse classifier (word unigram and bigram plus
character 3-gram and 4-gram features, text only, no rule outputs
as features), dataset 81 usable cases (63 block-worthy, 18 benign,
7 Learn PII cases excluded), held-out 20 cases with seed 42: TP
16, FP 2, TN 2, FN 0, precision 0.889, recall 1.000, F1 0.941,
accuracy 0.900, benign specificity 0.500 (2 of 4), per-class
held-out recall 1.000 for jailbreak (5 of 5), prompt injection (5
of 5), and misuse (6 of 6), 5-fold cross-validation means
precision 0.844, recall 0.922, F1 0.879. Build detail: a 58-case
adversarial set against two in-repo stand-in targets (real repos
not imported; stage 1 rates are a property of the stand-ins by
construction), bypass alone, guarded, guarded plus fix: jailbreak
1.000, 0.500, 0.500; prompt injection 1.000, 0.750, 0.000; misuse
1.000, 0.625, 0.375; benign success 10 of 10 at all stages, with a
174-record audit log. All data is synthetic and same-author, and
every fan-out piece states that plainly.

### Channel log (2026-11-05)

| Channel | Outcome on 2026-11-05 |
| --- | --- |
| GitHub releases | Live: v0.1 https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.1 , v0.5 https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v0.5 , v1.0 https://github.com/JesunAhmadUshno/guardrails-lab/releases/tag/v1.0 (verified with gh release list, 2026-11-05). Draft release notes for all three are in fanout/release-notes.md. No new release was created for the fan-out. |
| Portfolio index | Held: fan-out links are ready, the index update is a coordinator step outside this cycle. Named reason: held for index refresh. |
| Website page | Draft in fanout/website-page.md. Held: not published to jesunahmadushno.com. |
| Blog | Draft in fanout/blog-post.md. Held: not posted. |
| Tutorial | In repo: fanout/tutorial.md. Every command in it was run and verified on 2026-11-05 (three runners, three per-level test discoveries, scaffold smoke test, full suite at 53 tests). |
| LinkedIn post | Draft in fanout/linkedin-post.md, marked DRAFT NOT POSTED, link carried as the first-comment line per the LinkedIn rule. Held: not posted, loop never posts. |
| X | Draft held: no X copy is shipped in this set beyond the LinkedIn draft source text. Held under the standing social rules; posting is outside the loop. |
| Facebook | Draft held: no Facebook copy posted. Standing rule applies (no link in body or comments, keyword call to action fulfilled by DM). Held: not posted, loop never posts. |
| Instagram | Draft held: no Instagram copy posted. Standing rule applies (no clickable link in caption, link in bio). Held: not posted, loop never posts. |
| Threads | Draft held: no Threads copy posted. Threads waits for Jesun's tap per post, hash-locked on exact text and media. Held: awaiting Jesun's tap. |
| Video | Held: engine queue, January production for lab projects per the December Compression Protocol. No video was produced in this cycle. |
| Book chapter | Draft angle in fanout/blog-post.md and SPEC.md ("The Guard At The Door"). Held: chapter draft follows the finished project set; not a published chapter. |
| Paper candidate | Draft brief in fanout/paper-candidate.md (bypass-rate red-team study). Submission is Jesun's tap. Nothing submitted, no venue contacted. The publications tracker is updated by the coordinator, not by this cycle. |

### Publicity grades (1,000-point rubric, ship line 900)

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach format /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| fanout/blog-post.md | 295 | 190 | 195 | 145 | 140 | 965 |
| fanout/tutorial.md | 300 | 185 | 195 | 148 | 142 | 970 |
| fanout/website-page.md | 295 | 180 | 190 | 148 | 145 | 958 |
| fanout/linkedin-post.md | 290 | 175 | 190 | 145 | 140 | 940 |
| fanout/paper-candidate.md | 295 | 195 | 195 | 140 | 130 | 955 |
| fanout/release-notes.md | 298 | 185 | 185 | 145 | 135 | 948 |

All six pieces are at or above the 900 ship line. No piece was
shipped ungraded. Overall fan-out grade: 9,560 of 10,000 (mean of
the six piece totals, 956 of 1,000).

### Named deductions (unclosable in this cycle)

- Blog post, minus 35: research is condensed from DOSSIER.md v1,
  whose prior art section is brief (minus 10 research); synthetic
  same-author sets and stand-in targets limit how far the results
  travel, stated in the piece (minus 10 reach, minus 5 accuracy
  for reader interpretation risk, minus 5 gap fit, minus 5
  clarity).
- Tutorial, minus 30: research framing is thinner than the blog by
  design, because the module teaches runs rather than the field
  (minus 15 research); no worked example beyond the shipped sets
  (minus 5 gap fit, minus 2 clarity, minus 8 reach).
- Website page, minus 42: condensed research (minus 20), condensed
  gap framing (minus 10), and the page is copy only, not a live
  page (minus 5 reach, minus 5 accuracy, minus 2 clarity).
- LinkedIn post, minus 60: short form compresses the research and
  the failure mode detail (minus 25 research, minus 10 accuracy,
  minus 10 gap fit, minus 5 clarity, minus 10 reach, because the
  post is a held draft and carries no live link in the body by
  rule).
- Paper candidate, minus 45: this is a brief, not a drafted paper
  (minus 20 reach, minus 10 clarity); venue is classed, not named
  (minus 5 research, minus 5 gap fit, minus 5 accuracy for the
  synthetic-only, stand-in evidence base the paper must carry).
- Release notes, minus 52: notes summarise releases that already
  exist, so research and gap framing are summary grade (minus 15
  research, minus 15 gap fit); format is repo-bound (minus 15
  reach, minus 2 accuracy, minus 5 clarity).

### Jev gate (2026-11-05)

claim_check on the blog main results paragraph, extracted
byte-exact from fanout/blog-post.md by script. Spec:
hidden_files/jev-p13-fanout-claim-spec-2026-11-05.json in the goal
workspace. Results:
hidden_files/jev-p13-fanout-claim-results-2026-11-05.json. Model
jev-1.13.0, question id supported, noul 0.63, route REVIEW (clear
at 0.85 or above, block at 0.10 or below, review between), input
tokens 1827, output tokens 20. Arithmetic was pre-computed in the
spec evidence (16 divided by 18 is 0.889 precision, 18 divided by
20 is 0.900 accuracy, 58 times 3 is 174 audit records, test totals
20 plus 23 is 43 and 43 plus 10 is 53). No claim was blocked, so
no re-gate was needed.

## Actions polish pack (2026-11-05)

Applied through a pull request on 2026-11-05, following the Actions
polish pack standard. The pack adds: CI on a Python 3.11 and 3.12
matrix with a ruff lint step (all pre-existing P13 CI steps
preserved: scaffold smoke test, Learn unit tests and runner, Build
unit tests and runner), CodeQL scanning, Dependabot for pip and
GitHub Actions, a release workflow that attaches a source tarball
named guardrails-lab-<tag>.tar.gz to v* tag releases, Labeler,
Greetings (snake_case inputs for actions/first-interaction@v3:
repo_token, issue_message, pr_message), Stale in comment-only
mode (days-before-close: -1, never closes), and a docs summary
page at docs/index.md for GitHub Pages. Ruff scope is recorded in
ruff.toml (E, F, I, line-length 120). Ruff fixes in this pull
request were style only: 4 initial errors (1 unused import in
level-1-learn/run_learn.py, 3 import order or formatting in
level-2-build/harness.py, level-2-build/run_build.py, and
tests/test_smoke.py), fixed by ruff fix output with no change to
behaviour, verified by the full test suite (43 tests) and both
level runners with results files byte-identical.
requirements.txt records the standard-library-only fact so
Dependabot pip has a manifest to watch.

| Channel | Outcome on 2026-11-05 |
| --- | --- |
| GitHub Pages | Docs page added at docs/index.md in this pull request. Pages enablement and live build status are verified after merge and recorded in the batch ledger; no live claim is made in this file before that check. |
| Release workflow | Held: unproven until the next v* tag release. No tag was created in this cycle. |
| PyPI publishing | Held: needs a PyPI token, a new credential. Jesun's tap only. Not set up. |
| Social channels (LinkedIn, X, Facebook, Instagram, Threads) | Held: no posts made. The loop never posts to social; Threads waits for Jesun's tap per post under the standing gates. |

Publicity grade for this polish pack log piece, on the 1,000
point rubric (accuracy 300, research 200, gap fit 200, clarity
150, reach format 150), ship line 900:

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLICITY.md polish pack section (2026-11-05) | 295 | 180 | 195 | 145 | 100 | 915 |

At or above the 900 ship line. Named deductions: research minus
20, because the pack is a standard applied across repos and this
section records its application rather than new research; reach
minus 50, because the docs page is copy in this pull request with
no live Pages claim yet, the release workflow is unproven until
the next tag, PyPI publishing is held, and no social channel
carries this piece by the standing gates; accuracy minus 5, gap
fit minus 5, and clarity minus 5 for summary compression of the
full pack standard, which lives in the batch files.
