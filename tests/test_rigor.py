"""Rigor script tests. Hand-checked expectations, stdlib only."""
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
DEEP = os.path.join(HERE, "..", "level-3-deep")
sys.path.insert(0, DEEP)

from rigor import confusion, mcnemar_exact, metrics, sample_sd, wilson  # noqa: E402


class TestRigorMath(unittest.TestCase):
    def test_wilson_zero_of_eight(self):
        # 0 of 8: upper bound z^2/(n+z^2) = 3.8415/11.8415 = 0.3244
        self.assertEqual(wilson(0, 8), [0.0, 0.3244])

    def test_wilson_all_of_sixteen(self):
        # 16 of 16: lower bound n/(n+z^2) = 16/19.8415 = 0.8064
        self.assertEqual(wilson(16, 16), [0.8064, 1.0])

    def test_mcnemar_exact(self):
        # 12 discordant pairs all one way: 2 * 0.5^12 = 0.000488 (unrounded)
        self.assertAlmostEqual(mcnemar_exact(12, 0), 2 / 4096)
        self.assertEqual(mcnemar_exact(0, 0), 1.0)
        self.assertEqual(mcnemar_exact(4, 0), 0.125)

    def test_sample_sd(self):
        self.assertEqual(sample_sd([1.0, 3.0]), 1.4142)

    def test_majority_baseline_metrics(self):
        m = metrics(confusion([1] * 16 + [0] * 4, [1] * 20))
        self.assertEqual((m["precision"], m["recall"], m["f1"], m["accuracy"]), (0.8, 1.0, 0.889, 0.8))


class TestRigorResults(unittest.TestCase):
    def test_results_match_recorded_counts(self):
        with open(os.path.join(DEEP, "results_rigor.json"), encoding="utf-8") as f:
            out = json.load(f)
        pi = out["paired_mcnemar"]["stage2_guarded_vs_stage3_guarded_plus_fix"]["prompt_injection"]
        self.assertEqual((pi["fixed"], pi["broken"]), (12, 0))
        self.assertEqual(out["baselines"]["logistic_classifier_recorded"]["f1"], 0.941)
        self.assertEqual(len(out["rule_ablation"]["rules"]), 24)


if __name__ == "__main__":
    unittest.main()
