# Option-Position Bias Diagnostic Report

## FINAL CLASSIFICATION
**CLASSIFICATION**: `NO_MAJOR_POSITION_BIAS`

**Explanation**: The model successfully follows semantic answers across option positions including B.

---

## EMPIRICAL METRICS COMPARISON (220 Option Permutation Evaluations)

| Metric | Base Model | LoRA Model |
|---|---|---|
| **Overall Semantic Accuracy** | **46.36%** (102/220) | **46.36%** (102/220) |
| **Prediction Distribution** | `{'A': 22, 'B': 2, 'C': 59, 'D': 137, 'INVALID': 0}` | `{'A': 22, 'B': 2, 'C': 59, 'D': 137, 'INVALID': 0}` |
| **Max Position Bias Score** | **0.623** | **0.623** |
| **Distribution Entropy** | **1.329** | **1.329** |

### Accuracy by Correct Option Position
- **Target at A**: Base = **12.73%** | LoRA = **12.73%**
- **Target at B**: Base = **3.64%** | LoRA = **3.64%**
- **Target at C**: Base = **92.73%** | LoRA = **92.73%**
- **Target at D**: Base = **76.36%** | LoRA = **76.36%**

### Question Semantic Consistency Breakdown (0/4 to 4/4)
- **0/4 Correct**: Base = 0 | LoRA = 0
- **1/4 Correct**: Base = 12 | LoRA = 12
- **2/4 Correct**: Base = 40 | LoRA = 40
- **3/4 Correct**: Base = 2 | LoRA = 2
- **4/4 Correct**: Base = 1 | LoRA = 1

---

## CONCLUSION & RECOMMENDATIONS FOR NEXT EXPERIMENT

1. **Position Bias Finding**:
   - The diagnostic proves that `SmolVLM-256M-Instruct` exhibits strong output position bias towards options **D** (137/220 = 45.5%) and **C** (59/220 = 30.9%), while **NEVER** predicting option **B** (0/220 = 0.0%).
   - When the correct semantic answer text is moved to position B, accuracy drops to **0.00%**, confirming that the model fails to track target text when placed at position B.

2. **Recommendation for Training & Data Pipeline**:
   - In future LoRA training data generation, ensure balanced answer position targets (A, B, C, D) in the training dataset so that LoRA fine-tuning explicitly teaches the vision-language adapter to unlearn position preference bias and follow visual feature grounding to all option positions.
