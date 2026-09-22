# Final Clean V4 Visual Evaluation Report

## EXECUTIVE SUMMARY

- **Canonical Frozen Benchmark**: `src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json`
- **Total Benchmark Questions**: 55
- **Base Model (`SmolVLM-256M-Instruct`) Accuracy**: **47.27%** (26/55) [95% CI: 34.69% – 60.21%]
- **LoRA Model (`smolvlm_lora_v1`) Accuracy**: **47.27%** (26/55) [95% CI: 34.69% – 60.21%]
- **Absolute Change**: **+0.00%**
- **Relative Change**: **+0.00%**
- **FINAL DECISION**: **`BASELINE_ESTABLISHED`**

---

## STATISTICAL COMPARISON & MCNEMAR CONTINGENCY TABLE

| Metric | Base Model | LoRA Model |
|---|---|---|
| Correct Predictions | 26 / 55 | 26 / 55 |
| Accuracy | 47.27% | 47.27% |
| 95% Wilson Confidence Interval | 34.69% – 60.21% | 34.69% – 60.21% |

### McNemar 2x2 Contingency Table
- **Both Base & LoRA Correct**: 26
- **Base Correct / LoRA Wrong**: 0 (Regressed)
- **Base Wrong / LoRA Correct**: 0 (Improved)
- **Both Base & LoRA Wrong**: 29

---

## PREDICTION DISTRIBUTIONS

- **Base Prediction Distribution**: `{'A': 6, 'B': 0, 'C': 16, 'D': 33, 'INVALID': 0}`
- **LoRA Prediction Distribution**: `{'A': 6, 'B': 0, 'C': 16, 'D': 33, 'INVALID': 0}`

---

## ACCURACY BY GOLD TARGET

| Gold Answer Target | Question Count | Base Model Accuracy | LoRA Model Accuracy |
|---|---|---|---|
| Gold A | 14 | 21.43% | 21.43% |
| Gold B | 14 | 0.00% | 0.00% |
| Gold C | 14 | 100.00% | 100.00% |
| Gold D | 13 | 69.23% | 69.23% |

---

## VISUAL FAILURE ANALYSIS (10 Representative Base Failures)

### Failure Case 1 (Q#1)
- **Benchmark ID**: `v4_gold_001`
- **Site ID**: `Pit0002` | **Category**: `Architecture & Structural Elements`
- **Question**: Which architectural element is most prominently visible in gallery photograph #1?
- **Gold Answer**: `A` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 2 (Q#2)
- **Benchmark ID**: `v4_gold_002`
- **Site ID**: `Pit0002` | **Category**: `Architecture & Structural Elements`
- **Question**: What type of structural or defensive form is shown in image #2?
- **Gold Answer**: `B` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 3 (Q#5)
- **Benchmark ID**: `v4_gold_005`
- **Site ID**: `Pit0002` | **Category**: `Architecture & Structural Elements`
- **Question**: Which geometric or construction element is visually observable in this picture #5?
- **Gold Answer**: `A` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 4 (Q#6)
- **Benchmark ID**: `v4_gold_006`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What specific physical feature defines the structure seen in gallery scan #6?
- **Gold Answer**: `B` | **Base Prediction**: `A` | **LoRA Prediction**: `A`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 5 (Q#8)
- **Benchmark ID**: `v4_gold_008`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What visible sculptural or masonry composition appears in image #8?
- **Gold Answer**: `D` | **Base Prediction**: `A` | **LoRA Prediction**: `A`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 6 (Q#10)
- **Benchmark ID**: `v4_gold_010`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What structural configuration distinguishes the form shown in this image (#10)?
- **Gold Answer**: `B` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 7 (Q#14)
- **Benchmark ID**: `v4_gold_014`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What structural arrangement distinguishes the building visible in this image (#14)?
- **Gold Answer**: `B` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 8 (Q#16)
- **Benchmark ID**: `v4_gold_016`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What specific physical feature defines the structure seen in gallery scan #16?
- **Gold Answer**: `D` | **Base Prediction**: `A` | **LoRA Prediction**: `A`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 9 (Q#17)
- **Benchmark ID**: `v4_gold_017`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: Which type of opening, arch, or bastion is visible in this photograph (#17)?
- **Gold Answer**: `A` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

### Failure Case 10 (Q#18)
- **Benchmark ID**: `v4_gold_018`
- **Site ID**: `Ell0001` | **Category**: `Architecture & Structural Elements`
- **Question**: What visible sculptural or masonry composition appears in image #18?
- **Gold Answer**: `B` | **Base Prediction**: `D` | **LoRA Prediction**: `D`
- **Primary Failure Factor**: `fine-grained architecture`

