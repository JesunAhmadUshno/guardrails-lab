# 0001: Code and evidence stay in the level-*/ folders

Date: 2026-11-08. Status: accepted.

Context. The portfolio standard puts code in src/, raw evidence in
experiments/ and scores in results/, but allows domain-named folders
listed in the README layout table.

Decision. Keep level-1-learn/, level-2-build/ and level-3-deep/ as the
code folders, with each labelled set and result file next to the code
that reads or writes it. The labelled sets are hand-written inputs and
every runner is deterministic (fixed seed, no timestamps), so there is
no captured raw data to keep apart; CI proves every result file
regenerates unchanged.

Consequences. The tests, the CI reproduce step, the dashboard's imports
(site/src/App.jsx reads the JSON and guardrails.py at build time) and
the release tags v0.1, v0.5 and v1.0 keep working without path changes.
Moving to src/ later means updating those four places together.
