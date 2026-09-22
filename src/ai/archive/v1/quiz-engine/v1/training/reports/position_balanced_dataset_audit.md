# Position-Balanced Dataset Audit Report

## DATASET STATUS

- **Total Clean Candidate Assets**: 92
- **Total Clean Training Examples**: 23
- **Unique Training Images**: 23
- **Train Split**: 17 images / 17 examples
- **Validation Split**: 3 images / 3 examples
- **Test Split**: 3 images / 3 examples

## DATASET INTEGRITY & QUALITY GATE

- **VDS=3 Percentage**: 100.0% (23/23)
- **Image Leakage**: **0** (Verified zero overlap with evaluation benchmarks)
- **Exact Duplicates**: 0
- **Empty Files**: 0
- **Ground-Truth Failures**: 0

## OPTION POSITION DISTRIBUTION (Seed 2026)

### Overall Dataset Option Distribution (1:1:1:1 Target)
- **A**: 6 (26.1%)
- **B**: 6 (26.1%)
- **C**: 6 (26.1%)
- **D**: 5 (21.7%)

### Train-Only Option Distribution
- **A**: 3 (17.6%)
- **B**: 5 (29.4%)
- **C**: 6 (35.3%)
- **D**: 3 (17.6%)

## TARGET FORMAT VALIDITY

- **Valid Single-Character Target (`^[ABCD]$`)**: 23 / 23 (100.0%)
- **Invalid Targets**: 0

## BASELINES FOR REFERENCE

- **Random Baseline**: 25.0%
- **ALWAYS-D Baseline**: 23.64% (13/55 on V4 Gold)

---

## FINAL DATASET DECISION

**FINAL_DECISION**: **`READY_FOR_BALANCED_LORA_TRAINING`**
