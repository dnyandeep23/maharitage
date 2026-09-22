# Maharitage V1 Training Data Readiness Report

## Executive Summary

- **Clean Assets Discovered**: 92
- **Evaluation-Locked Assets**: 55
- **Clean Training Candidates**: 92
- **Successfully Annotated**: 22
- **Rejected (API Quota Exceeded)**: 70
- **Failed**: 0
- **VDS=3 Percentage**: 100.0%
- **Ground-Truth Failures**: 0
- **Duplicates**: 0
- **Empty Files**: 0
- **Image Leakage**: 0 (Verified)

## Dataset Splits

- **Train**: 16 images / 16 examples (72.7%)
- **Validation**: 3 images / 3 examples (13.6%)
- **Test**: 3 images / 3 examples (13.6%)

## Option Distribution
- **A**: 27.3%
- **B**: 27.3%
- **C**: 22.7%
- **D**: 22.7%

## Canonical V4 Reconciliation

- **Original V4 Baseline Reported**: 84.5% (Synthetic summary in `v4_runner_and_evaluator.js`)
- **Previous `train_lora.py` Baseline**: 100.0% (Invalid run using `v4_gallery_items.json` without question text)
- **Canonical Reproducible Zero-Shot Baseline**: **25.45% (14/55)** on true `v4_gallery_gold.json`

## Final Training Decision

**DO_NOT_TRAIN_YET**

### Reason
The training dataset currently contains only 22 annotated examples out of 92 candidate assets because the Gemini API free tier daily quota (20 requests/day for `gemini-2.5-flash`) was exhausted. 

While the existing 22 annotations pass all quality gate criteria (0 leakage, 100% VDS=3, 0 duplicates, balanced options), training on only 16 training examples will not yield a statistically meaningful LoRA model. Training should resume only after the daily quota resets or a paid tier key is provided to complete annotations for all 92 clean assets.
