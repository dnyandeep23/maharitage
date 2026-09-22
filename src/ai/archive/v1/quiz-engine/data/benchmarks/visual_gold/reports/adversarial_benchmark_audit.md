# Adversarial Visual Gold Audit — MAHARITAGE NEW V1

**Audit Date**: 2026-08-09  
**Final Benchmark Status**: **BENCHMARK_STATUS = VALID_WITH_LIMITATIONS**

---

## 1. Adversarial Integrity Gate Summary

| Gate Name | Status | Target / Threshold |
|:---|:---:|:---|
| **CROSS_SITE_SANITY** | **PASS** | Zero site-type visual feature collisions (e.g. Caves vs Fort ramparts) |
| **EVIDENCE_QUALITY** | **PASS** | Boilerplate percentage: 0% (<30% PASS) |
| **QUESTION_DIVERSITY** | **PASS** | Max single template <= 20% of total |
| **CONCEPT_DIVERSITY** | **PASS** | 55 unique visual concepts |
| **OPTION_FAMILY_INDEPENDENCE** | **PASS** | Distractor set rotation independence |
| **IMAGE_SWAP_TEST** | **PASS** | Image dependency counterfactual test |
| **SITE_BALANCE** | **PASS** | Max single site proportion <= 35% |
| **STATISTICAL_SUFFICIENCY** | **FAIL** | Unseen-site test questions >= 50 |
| **FINAL BENCHMARK STATUS** | **VALID_WITH_LIMITATIONS** | Overarching validation status |

---

## 2. Invalid / Suspicious Cross-Site Items Detected

*No invalid cross-site feature collisions detected.*

---

## 3. Effective Dataset Size Analysis

- **Raw Questions**: 55
- **Unique Images**: 55
- **Unique Visual Concepts**: 55
- **Effective Question Count**: 55

