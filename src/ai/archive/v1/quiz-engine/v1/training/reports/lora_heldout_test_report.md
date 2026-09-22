# Held-Out Visual LoRA Model Test Report

## SUMMARY & DECISION
- **Test Questions Count**: 10
- **Training Image Overlap**: 0 (Verified)
- **Base Model Accuracy**: **40.0%** (4/10)
- **LoRA Model Accuracy**: **40.0%** (4/10)
- **Improvement**: **+0.0 percentage points**
- **Base Invalid Rate**: 0.0%
- **LoRA Invalid Rate**: 0.0%
- **Adapter Attached & Verified**: **YES**
- **Peak MPS Memory**: 1.29 GiB
- **FINAL DECISION**: **`LORA_NO_CHANGE`**

---

## QUESTION-BY-QUESTION EVALUATION TABLE

| Question | Gold | Base Parsed (Raw) | LoRA Parsed (Raw) | Base Correct | LoRA Correct | Status |
|---|---|---|---|---|---|---|
| Q1 | `D` | B (`B.

#`) | B (`B.

#`) | NO | NO | **UNCHANGED** |
| Q2 | `A` | B (`B.

The`) | B (`B.

The`) | NO | NO | **UNCHANGED** |
| Q3 | `A` | D (`D

Answer:`) | D (`D

Answer:`) | NO | NO | **UNCHANGED** |
| Q4 | `A` | D (`D.

Answer`) | D (`D.

Answer`) | NO | NO | **UNCHANGED** |
| Q5 | `B` | B (`B

A`) | B (`B

A`) | YES | YES | **UNCHANGED** |
| Q6 | `C` | B (`B.

The`) | B (`B.

The`) | NO | NO | **UNCHANGED** |
| Q7 | `C` | C (`C.

Answer`) | C (`C.

Answer`) | YES | YES | **UNCHANGED** |
| Q8 | `C` | B (`B.

Answer`) | B (`B.

Answer`) | NO | NO | **UNCHANGED** |
| Q9 | `D` | D (`D

Answer:`) | D (`D

Answer:`) | YES | YES | **UNCHANGED** |
| Q10 | `D` | D (`D.

Answer`) | D (`D.

Answer`) | YES | YES | **UNCHANGED** |

---

## PERFORMANCE CATEGORIZATION

- **LoRA Improvements (0)**: None
- **LoRA Regressions (0)**: None
- **Unchanged (10)**: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10
