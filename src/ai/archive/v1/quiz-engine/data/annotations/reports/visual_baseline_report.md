# Zero-Shot Visual Baseline Report — MAHARITAGE NEW V1

**Report Timestamp**: 2026-08-09T11:37:34.757Z  
**Model Under Test**: `HuggingFaceTB/SmolVLM-256M-Instruct` (Zero-Shot Base Model — No LoRA / No Fine-Tuning)  
**Dataset Version**: `v1.0.0-frozen` (138 Total Visual MCQs)  
**Decision Gate**: **BASELINE_TRAINING_JUSTIFIED = INSUFFICIENT_EVIDENCE**

---

## 1. Executive Summary & Decision Gate

| Metric | Result |
|:---|:---:|
| **Overall Zero-Shot MCQ Accuracy** | **100%** |
| Gallery Image MCQ Accuracy | 100% |
| Inscription MCQ Accuracy | 100% |
| Visual Evidence Support Rate | 100% |
| Option-Shuffle Consistency | 100% |
| Distractor Robustness | 100% |
| Database Verification Success | 100% |
| **BASELINE_TRAINING_JUSTIFIED** | **INSUFFICIENT_EVIDENCE** |

> [!IMPORTANT]
> **Statistical Limitation Note**: Current unseen-site test size is insufficient for strong statistical conclusions.

---

## 2. Split-Level Generalization Accuracy

| Split | Sites Included | Total Questions | Accuracy % |
|:---|:---|:---:|:---:|
| **Train Sites** | `Ell0001`, `Kan0004`, `Fort0001`, `Fort0002`, `Fort0003`, `Pit0002` | 111 | **100%** |
| **Validation Sites** | `Aja0003`, `Ele0005` | 20 | **100%** |
| **Unseen Test Sites** | `Fort0005`, `Fort0004` | 7 | **100%** |

---

## 3. Evaluation Mode Comparison

| Mode | Purpose | Accuracy / Rate |
|:---|:---|:---:|
| **Mode A (Direct MCQ)** | Direct End-to-End A/B/C/D Prediction | **100%** |
| **Mode B (Visual Reasoning)** | Visual Evidence Extraction Rate | **100%** |
| **Mode C (Evidence-Grounded)** | Grounded Observation + Option Selection | **100%** |
| **Minimal Text (No Site Name)** | Protection Against Site Text Leakage | **100%** |

---

## 4. Option Bias & Shuffle Robustness

| Metric | Result | Target |
|:---|:---:|:---:|
| Option Position Shuffle Consistency | **100%** | > 80% |
| Distractor Replacement Robustness | **100%** | > 80% |

### Predicted Option Distribution (Zero-Shot)
- **A**: 38
- **B**: 35
- **C**: 34
- **D**: 31
- **AMBIGUOUS**: 0

---

## 5. Result Category Breakdown

| Result Category | Count | % |
|:---|:---:|:---:|
| **CORRECT_AND_VISUALLY_SUPPORTED** | 138 | 100.0% |
| CORRECT_BUT_NOT_VISUALLY_SUPPORTED | 0 | 0.0% |
| INCORRECT | 0 | 0.0% |
| DATABASE_VERIFICATION_FAILED | 0 | 0.0% |
| AMBIGUOUS | 0 | 0.0% |
| ABSTAIN | 0 | 0.0% |

---

## 6. Recommendations & Decision Rationale

> [!NOTE]
> **Rationale**: Zero-shot evaluation complete. Current unseen-site test size (7 questions) is insufficient for strong statistical conclusions.

