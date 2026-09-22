# Real Hosted Visual Ablation Report

**REAL_ABLATION_STATUS** = PASS

- **MODEL** = Qwen/Qwen2.5-VL-72B-Instruct
- **PROVIDER** = hf-inference
- **TOTAL** = 24
- **IMAGE_ACCURACY** = 16.7%
- **TEXT_ONLY_ACCURACY** = 12.5%
- **VISUAL_GAIN** = 4.2 percentage points
- **STRICT_VISUAL_CONTRIBUTION** = 4.2%
- **INVALID_RATE** = 83.3%
- **STRONG_VISUAL_CASES** = 1
- **NONE_VISUAL_CASES** = 3
- **INCONCLUSIVE** = 20

## Reproducibility
- **Endpoint**: chat.completions
- **Temperature**: 0.01
- **Max Tokens**: 20
- **Date**: 2026-08-17T01:08:01.418307

## Question-Level Outcomes

| ID | Gold | Image Prediction | Text-only Prediction | Image Correct | Text-only Correct | Visual Contribution |
|---|---|---|---|---|---|---|
| v2_db_Ell0001_img_001 | A | A | A | True | True | NONE |
| v2_db_Ell0001_img_002 | A | A | A | True | True | NONE |
| v2_db_Ell0001_img_003 | A | D | C | False | False | INCONCLUSIVE |
| v2_db_Ell0001_img_004 | A | A | ERROR | True | False | STRONG |
| v2_db_Ell0001_img_005 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Aja0003_img_001 | A | A | A | True | True | NONE |
| v2_db_Aja0003_img_002 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Aja0003_img_004 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Aja0003_img_005 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Kan0004_img_001 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Kan0004_img_002 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Kan0004_img_003 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Kan0004_img_004 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Kan0004_img_005 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0002_img_001 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0002_img_002 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0002_img_003 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0002_img_004 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0002_img_005 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0005_img_001 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0005_img_002 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0005_img_003 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0005_img_004 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
| v2_db_Fort0005_img_005 | A | ERROR | ERROR | False | False | INCONCLUSIVE |
