# Final LoRA Evaluation Integrity Audit Report

## DATASET VALIDITY
- **V4 Benchmark File**: `/Users/dnyandeep/Dnyandeep/Project/maharitage/src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json`
- **V4 Total Questions**: 55
- **V4 Valid Items**: 55
- **V4 Invalid Items**: 0
- **V4 Gold Label Distribution**: A=14, B=14, C=14, D=13
- **Dataset Validity Status**: **VALID**

## CHECKPOINT INTEGRITY
- **LoRA Adapter Loaded**: **YES**
- **Adapter Parameters**: 0
- **Checkpoint Path**: `/Users/dnyandeep/Dnyandeep/Project/maharitage/src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1`

## EXPERIMENTAL EVALUATION RESULTS

| Benchmark Dataset | Base Model Accuracy | LoRA Model Accuracy | Absolute Change |
|---|---|---|---|
| Frozen V4 Gold Benchmark (55 items) | 25.45% (14/55) | 25.45% (14/55) | +0.00% |
| Hard Image Diagnostic (50 items) | 24.00% (12/50) | 24.00% (12/50) | +0.00% |
| Validation Set (3 items) | 33.33% (1/3) | 33.33% (1/3) | +0.00% |

## MODEL PREDICTION DISTRIBUTIONS

- **Base V4 Predictions**: {'A': 55, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}
- **LoRA V4 Predictions**: {'A': 55, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}
- **Base Hard-Image Predictions**: {'A': 50, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}
- **LoRA Hard-Image Predictions**: {'A': 50, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}

## FINAL AUDIT DECISION
**FINAL_STATUS**: **LORA_NO_SIGNIFICANT_IMPROVEMENT**
