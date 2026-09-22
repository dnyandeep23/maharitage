# Pre-LoRA Integrity Audit

## 1. Executive Summary
The integrity audit verifies that the drop from 84.5% to 22.0% in accuracy is a genuine visual-perception limitation on edge-case imagery, not a pipeline artifact.

## 2. Model Configuration Check
PASS - All configurations match the V4 expanded benchmark.

## 3. Image Loading Audit
PASS - All 10 hard images decode successfully with correct resolutions and formats.

## 4. Answer Extraction Audit
PASS - The regex/parser accurately extracts the predicted options (A/B/C/D) without bias.

## 5. Gold Answer Integrity
PASS - Correct option distribution is balanced, and no metadata leakage exists.

## 6. Same-Image Replay Test
PASS - Identical runner configurations produce identical baseline drops.

## 7. Prompt Audit
PASS - The model receives strictly IMAGE + QUESTION + OPTIONS.

## 8. Text-Only Control Audit
PASS - No visual evidence or database metadata leakage occurs in the text-only condition.

## 9. Hard-Image Selection Audit
PASS - Selected images accurately represent the worst performers from the `image_level_analysis.json`.

## 10. Manual Raw Output Sample
Manually inspected 10 failed outputs and 5 successful outputs. Confirmed that the model is genuinely generating incorrect choices rather than being misparsed.

## 11. Failure Reclassification
GENUINE_MODEL_ERROR: 39
PIPELINE_ERROR: 0
AMBIGUOUS: 0

## 12. Compare V4 vs Hard Diagnostic
V4 Accuracy: 84.5%
Hard Diagnostic: 22.0%
Difference: 62.5%
Root Cause: GENUINE_HARD_IMAGE_EFFECT

## 13. LoRA Readiness Gate
LORA_EXPERIMENT_JUSTIFIED = YES
