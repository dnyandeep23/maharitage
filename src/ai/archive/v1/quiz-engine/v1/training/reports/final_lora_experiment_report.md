# Final Autonomous Visual LoRA Experiment Report

## DATASET & AUDIT
- **Clean Images**: 23
- **Total Annotations**: 23
- **VDS=3 Percentage**: 100%
- **Database-Only Questions**: 0
- **Ground-Truth Failures**: 0
- **Image Leakage**: 0 (Verified)
- **Duplicates**: 0

## SPLITS
- **Train**: 17
- **Validation**: 3
- **Test**: 3

## TRAINING CONFIGURATION
- **Base Model**: `HuggingFaceTB/SmolVLM-256M-Instruct`
- **LoRA Parameters**: r=8, alpha=16, dropout=0.05
- **Device**: `mps`
- **Epochs**: 1
- **Training Time**: 18.32s
- **Checkpoint**: `/Users/dnyandeep/Dnyandeep/Project/maharitage/src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1`
- **Successful Batches**: 17
- **Failed Batches**: 0
- **MPS Peak Memory**: 0.68 GiB

## EXPERIMENTAL RESULTS
| Benchmark | Baseline | LoRA | Absolute Change |
|---|---|---|---|
| Validation Set | 0.0% | 0.0% | +0.0% |
| V4 Gallery Benchmark | 25.5% | 25.5% | +0.0% |
| Hard Image Diagnostic | 24.0% | 24.0% | +0.0% |

## DIAGNOSTICS
- **Overfitting Detected**: NO
- **V4 Benchmark Regression**: NO
- **Final Decision**: **LORA_NO_SIGNIFICANT_IMPROVEMENT**
- **LoRA Benefit**: **NO**
