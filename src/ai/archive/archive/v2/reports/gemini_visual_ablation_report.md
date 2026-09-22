# Gemini Visual Ablation Report

- **REAL_ABLATION_STATUS** = PARTIAL
- **MODEL** = gemini-2.5-flash
- **PROVIDER** = Google Gemini API

## Dataset Completion
- **TOTAL_QUESTIONS** = 24
- **BOTH_COMPLETED** = 7
- **PARTIAL** = 2
- **FAILED** = 15
- **ERROR_RATE** = 70.8%

## Accuracy Metrics
- **IMAGE_ACCURACY** (over valid images) = 85.7%
- **TEXT_ONLY_ACCURACY** (over valid text) = 88.9%
- **VISUAL_GAIN** (over BOTH_COMPLETED) = 0.0 percentage points
- **STRICT_VISUAL_CONTRIBUTION_RATE** (over BOTH_COMPLETED) = 14.3%

## Data Quality
- **IMAGE_INVALID_RATE** = 0.0%
- **TEXT_ONLY_INVALID_RATE** = 0.0%

## Scientific Interpretation of Paired Cases
- **STRONG_VISUAL_CASES** = 1 (Image inference succeeded where text-only failed, demonstrating clear visual reliance.)
- **NONE_CASES** = 5 (Both conditions correctly answered the question; the text alone was sufficient.)
- **INCONCLUSIVE_CASES** = 1 (Both conditions failed, or ambiguous outcomes preventing a strong conclusion.)
- **INCOMPLETE_CASES** = 17 (One or both model API calls timed out or failed, preventing paired comparison.)

## Limitations & Pilot Status
- Gemini was used as a high-throughput proxy to validate the visual dependency of the pilot, rather than part of the target HF benchmark set.
- **PILOT_STATUS** = CONDITIONALLY_FROZEN
- **VISUAL_ABLATION_COVERAGE** = INSUFFICIENT_FOR_FINAL_DECISION


## Question-Level Outcomes

| ID | Gold | Image Prediction | Text-only Prediction | Image Correct | Text-only Correct | Visual Contribution |
|---|---|---|---|---|---|---|
| v2_db_Ell0001_img_001 | A | A | A | True | True | NONE |
| v2_db_Ell0001_img_002 | A | B | A | False | True | INCONCLUSIVE |
| v2_db_Ell0001_img_003 | A | None | A | None | True | INCOMPLETE |
| v2_db_Ell0001_img_004 | A | A | A | True | True | NONE |
| v2_db_Ell0001_img_005 | A | A | B | True | False | STRONG |
| v2_db_Aja0003_img_001 | A | A | A | True | True | NONE |
| v2_db_Aja0003_img_002 | A | A | A | True | True | NONE |
| v2_db_Aja0003_img_004 | A | A | A | True | True | NONE |
| v2_db_Aja0003_img_005 | A | None | A | None | True | INCOMPLETE |
| v2_db_Kan0004_img_001 | A | None | None | None | None | INCOMPLETE |
| v2_db_Kan0004_img_002 | A | None | None | None | None | INCOMPLETE |
| v2_db_Kan0004_img_003 | A | None | None | None | None | INCOMPLETE |
| v2_db_Kan0004_img_004 | A | None | None | None | None | INCOMPLETE |
| v2_db_Kan0004_img_005 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0002_img_001 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0002_img_002 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0002_img_003 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0002_img_004 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0002_img_005 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0005_img_001 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0005_img_002 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0005_img_003 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0005_img_004 | A | None | None | None | None | INCOMPLETE |
| v2_db_Fort0005_img_005 | A | None | None | None | None | INCOMPLETE |
