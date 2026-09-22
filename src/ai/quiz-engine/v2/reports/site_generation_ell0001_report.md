# Site Generation Report: Ell0001

## GENERATION RESULT
- **STATUS** = PARTIAL
- **REASON** = Quota exhausted while processing images. All completed work has been persisted.
- **NEXT_STEP** = RETRY_AFTER_QUOTA_RESET

## Execution Summary
- **SITE_ID**: Ell0001
- **TOTAL_URLS_DISCOVERED**: 18
- **TOTAL_IMAGES_VALID**: 18
- **TOTAL_IMAGES_DUPLICATE**: 0
- **TOTAL_UNIQUE_IMAGES**: 18
- **TOTAL_IMAGES_PROCESSED**: 7 (including 2 from prior run)
- **TOTAL_IMAGES_PENDING**: 11 (including 1 FAILED_QUOTA)

## Candidate Yield

### TEXT
- **TEXT_CANDIDATES**: 57 (10 prior + 47 new)
- **TEXT_APPROVED**: 52 (Draft)
- **TEXT_REJECTED**: 5

### IMAGE
- **IMAGE_CANDIDATES**: 32 (12 prior + 20 new)
- **IMAGE_APPROVED**: 22 (Draft)
- **IMAGE_REJECTED**: 10

## Per-Image Yield (New Architecture Only)

| Image | Candidates | Accepted | Rejected |
|-------|-----------:|---------:|---------:|
| Ell0001_img_img_001 | 4 | 0 | 4 |
| Ell0001_img_img_002 | 6 | 4 | 2 |
| Ell0001_img_img_003 | 4 | 0 | 4 |
| Ell0001_img_img_004 | 6 | 6 | 0 |
| Ell0001_img_img_005 | 0 | 0 | 0 |

*(Note: Ell0001_img_0 and Ell0001_img_1 were processed in the prior run and yielded 6 accepted candidates each).*

## Visual Dependency Profile (Image MCQs)
- **HIGH_VISUAL**: 22
- **MEDIUM_VISUAL**: 0
- **LOW_VISUAL**: 0
- **NONE_VISUAL**: 0

## Validation & Errors
- **DUPLICATES**: 2
- **SOURCE_FAILURES**: 0
- **QUOTA_ERRORS**: 1

## Status Note
The exhaustive massive scale generator successfully inventoried 18 unique images. It completed the 7 topical text batches yielding a robust pool of 57 candidates. Image generation proceeded correctly through 5 images, isolating the results into `per_image` outputs before safely hitting the quota limit on image 006. 

FINAL STATUS:
ELL0001_SITE_GENERATION = PARTIAL
