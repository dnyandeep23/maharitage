# Canonical V4 Baseline Reconciliation Report

## Summary of Investigation

| Baseline Version | Accuracy | Underlying Data File | Notes |
|---|---|---|---|
| Original Reported Baseline | 84.5% | `v4_gallery_gold.json` (synthetic summary) | Hardcoded empirical summary printed by `v4_runner_and_evaluator.js` |
| Previous `train_lora.py` Baseline | 100.0% | `v4_gallery_items.json` | Invalid test file containing only image URLs without question/options text; default answer 'A' matched default target 'A' |
| Canonical Reproducible Zero-Shot Baseline | **25.45% (14/55)** | `v4_gallery_gold.json` | True empirical zero-shot evaluation of `SmolVLM-256M-Instruct` on the frozen 55-question V4 gold benchmark |

## Root Cause of Inconsistency

1. **Incorrect File Reference in `train_lora.py`**:
   - `train_lora.py` loaded `v4_gallery_items.json` instead of `v4_gallery_gold.json`.
   - Because `v4_gallery_items.json` contains no `question` or `options` fields, the prompt collapsed to empty option letters.
   - The evaluator defaulted the predicted option to `'A'` and the ground truth option index to `0` (`'A'`), scoring 100% false accuracy across all items.

2. **Resolution**:
   - `train_lora.py` has been updated to point directly to `src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json`.
   - Zero-shot `SmolVLM-256M-Instruct` achieves **25.45% (14/55)** on the true frozen V4 benchmark.
