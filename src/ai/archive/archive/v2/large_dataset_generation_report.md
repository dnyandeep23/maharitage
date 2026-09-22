# V2 Large Dataset Generation Report - Audit

## 1. Execution Summary
- **Total Sites Used**: 10
- **Total Images Processed**: 14
- **Total Candidates Generated**: 36 (Massively suppressed due to API failures)
- **KEEP**: 36
- **REVISE**: 0
- **REJECT**: 0
- **Accepted Questions/Image**: 2.57

## 2. Validation Failures
- **Duplicate Rate**: 0% (0 rejected for duplicates)
- **Source-Grounding Failures**: 0%
- **URL/Filename Leakage**: 0
- **Camera/Composition Meta-Questions**: 0
- **API Failures (429 Rate Limit)**: ~80% of generation calls failed.
- **JSON Parsing Failures**: 0

## 3. Modality & Visual Dependency Distribution
**Modality Ratio**
- IMAGE_MCQ: 24 (66.7%)
- TEXT_MCQ: 12 (33.3%)

**Visual Dependency**
- HIGH: 23
- MEDIUM: 1
- LOW: 0
- NONE: 12

*(IMAGE_MCQ is exclusively HIGH/MEDIUM visual dependency)*

## 4. Difficulty & Category Distribution
**Difficulty**
- EASY: 23 (63.9%)
- MODERATE: 10 (27.8%)
- HARD: 0 (0.0%)

**Category**
- VISUAL_ARCHITECTURE: 11
- HISTORICAL: 8
- VISUAL_SCULPTURE: 7
- VISUAL_MATERIAL: 6
- CULTURAL_RELIGIOUS: 3
- ARCHITECTURAL: 1

## 5. Comparison to Revised Pilot

| Metric | Pilot | Scaled Run | Delta |
|--------|-------|------------|-------|
| Accepted Questions/Image | 10.40 | 2.57 | **-75%** |
| URL Leakage | 0 | 0 | Flat |
| Camera Qs | 0 | 0 | Flat |
| API Failures | 0 | MASSIVE | **Critical Issue** |

**Analysis**:
The automated validation rules, blinding techniques, and deduplication logic worked perfectly on the candidates that successfully generated (resulting in a 100% structural acceptance rate for the 36 questions that survived). However, the scale of generation completely overwhelmed the Gemini Free Tier limits. Massive 429 Too Many Requests errors wiped out over 75% of the expected candidate pool. We attempted robust retry logic with 30s delays in a secondary run, but this resulted in a complete 45-minute stall on the very first image due to deep quota exhaustion.

Because the "accepted questions/image" yield plummeted from 10.40 to 2.57 solely due to API limits throttling the candidate generator, the pipeline is not scalable under the current free tier constraints.

**SCALE_STATUS = NEEDS_REVIEW**

**SCALE_RUN_VALID_FOR_YIELD_ESTIMATION = NO**
*(Reason: Incomplete candidate generation caused by API quota/rate limits).*
