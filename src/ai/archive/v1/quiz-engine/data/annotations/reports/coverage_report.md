# Coverage Audit Report — MAHARITAGE NEW V1

**Audit Timestamp**: 2026-08-09T11:39:25.246Z

---

## 1. Independent Coverage Gates

> [!NOTE]
> Coverage gates evaluate numerical target completion independently from the Visual Quality Gate.

| Coverage Gate | Status | Details |
|:---|:---:|:---|
| **TEXT_COVERAGE_GATE** | **PARTIAL** | 569 grounded text MCQs across 10 sites |
| **IMAGE_COVERAGE_GATE** | **NO** | 78 TRUE_VISUAL MCQs across 55 gallery images |
| **INSCRIPTION_COVERAGE_GATE** | **NO** | 60 TRUE_VISUAL MCQs across 60 inscription scans |
| **OVERALL_COVERAGE_COMPLETE** | **NO** | Visual quality is 100% PASS, but numerical coverage (10-20 per image) is PARTIAL due to strict visual_dependency_score=3 filtering (Quality First rule). |

---

## 2. Site-Level Coverage Summary

| Site ID | Site Name | Type | Text Count | Image Count | Inscription Count | Total | Text Status |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---|
| Pit0002 | The Pitalkhora Caves | Buddhist Rock-Cut Monastic Complex | 26 | 1 | 0 | **27** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Ell0001 | The Ellora Caves | Multi-Religious Rock-Cut Cave Complex (Buddhist, Hindu, and Jain) | 29 | 28 | 4 | **61** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Aja0003 | The Ajanta Caves | Buddhist Rock-Cut Monastic Complex | 29 | 15 | 3 | **47** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Kan0004 | The Kanheri Caves | Buddhist Rock-Cut Monastic and University Complex | 32 | 8 | 53 | **93** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Ele0005 | Elephanta Cave | Hindu Rock-Cut Cave Temple Complex | 26 | 2 | 0 | **28** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Fort0001 | Raigad Fort | Hill Fort | 89 | 8 | 0 | **97** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Fort0002 | Rajgad Fort | Hill Fort | 75 | 5 | 0 | **80** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Fort0003 | Devgiri Fort (Daulatabad Fort) | Hill Fort (conical rock) | 100 | 4 | 0 | **104** | TARGET_REACHED |
| Fort0004 | Sindhudurg Fort | Sea Fort (Island) | 76 | 3 | 0 | **79** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |
| Fort0005 | Murud-Janjira Fort | Sea Fort (Island) | 87 | 4 | 0 | **91** | TEXT_TARGET_NOT_REACHED_SOURCE_LIMIT |

---

## 3. Per-Gallery Image Breakdown Table

| Site ID | Image | Existing | Generated | Rejected | Final | Target | Status | Feasibility Reason |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---|
| Pit0002 | gallery[0] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Pit0002 | gallery[1] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Pit0002 | gallery[2] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Pit0002 | gallery[3] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Pit0002 | gallery[4] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[0] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[1] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[2] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[3] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[4] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[5] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[6] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[7] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[8] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[9] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[10] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[11] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[12] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ell0001 | gallery[13] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[0] | 3 | 5 | 2 | **3** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[1] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[2] | 4 | 6 | 2 | **4** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[3] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[4] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[5] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Aja0003 | gallery[6] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Kan0004 | gallery[0] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Kan0004 | gallery[1] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Kan0004 | gallery[2] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Kan0004 | gallery[3] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Kan0004 | gallery[4] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Ele0005 | gallery[0] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0001 | gallery[0] | 3 | 5 | 2 | **3** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0001 | gallery[1] | 3 | 5 | 2 | **3** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0001 | gallery[2] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0001 | gallery[3] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[0] | 2 | 4 | 2 | **2** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[1] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[2] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[3] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[4] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0002 | gallery[5] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0003 | gallery[0] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0003 | gallery[1] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0003 | gallery[2] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0003 | gallery[3] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0004 | gallery[0] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0004 | gallery[1] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0004 | gallery[2] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0004 | gallery[3] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0005 | gallery[0] | 0 | 2 | 2 | **0** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0005 | gallery[1] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0005 | gallery[2] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0005 | gallery[3] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |
| Fort0005 | gallery[4] | 1 | 3 | 2 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Visual feature capacity exhausted while maintaining score=3 visual quality. Zero database-only questions permitted. |

---

## 4. Per-Inscription Scan Breakdown Table

| Site ID | Inscription Scan | Existing | Generated | Rejected | Final | Target | Status | Feasibility Reason |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---|
| Ell0001 | Insc_01 | 4 | 5 | 1 | **4** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Ell0001 | Insc_01 | 4 | 5 | 1 | **4** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Ell0001 | Insc_01 | 4 | 5 | 1 | **4** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Ell0001 | Insc_01 | 4 | 5 | 1 | **4** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Aja0003 | Insc_01 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Aja0003 | Insc_02 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Aja0003 | Insc_03 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_01 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_02 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_03 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_04 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_05 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_06 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_07 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_08 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_09 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_10 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_11 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_12 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_13 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_14 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_15 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_16 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_17 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_18 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_19 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_20 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_21 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_22 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_23 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_24 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_25 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_26 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_27 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_28 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_29 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_30 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_31 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_32 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_33 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_34 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_35 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_36 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_37 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_38 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_39 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_40 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_41 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_42 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_43 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_44 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_45 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_46 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_47 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_48 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_49 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_50 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_51 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_52 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
| Kan0004 | Insc_53 | 1 | 2 | 1 | **1** | 10–20 | TARGET_NOT_REACHED_VISUAL_LIMIT | Paleographic visual features (stroke, line, script) exhausted without adding text translation/historical facts. |
