# DB-First V2 Pilot Dataset Report

## Overview
The V2 Pilot Dataset has been successfully generated directly from the MongoDB `sites` collection, adhering strictly to the `ANNOTATION_SPECIFICATION.md` rules. The generation was carried out by extracting actual database texts and downloading Cloudinary images to verify pixels locally. The old V1 dataset was completely bypassed.

## MongoDB Source Analysis
- **Sites Inspected in MongoDB:** 10
- **Sites Selected for Pilot:** 5
- **Images Inspected from Cloudinary:** 97
- **Images Accepted (Valid Image/Pixels Confirmed):** 97
- **Images Rejected (Corrupt/Missing):** 0

### Selected Sites
The following 5 diverse sites were selected based on high-quality verified evidence in the DB:
1. **The Ellora Caves (Ell0001)** - Rich historical and inscription data; 14 usable images.
2. **The Ajanta Caves (Aja0003)** - Extensive historical and inscription context; 7 usable images.
3. **The Kanheri Caves (Kan0004)** - Detailed inscription arrays and historical text; 5 usable images.
4. **Rajgad Fort (Fort0002)** - Comprehensive architectural and historical texts; 6 usable images.
5. **Murud-Janjira Fort (Fort0005)** - Unique marine architectural context; 5 usable images.

## Dataset Composition
- **Total Questions Generated:** 50
- **Modality Distribution:**
  - TEXT_MCQ: 25
  - IMAGE_MCQ: 25

## Categorical Distribution
- VISUAL_ARCHITECTURE: 18
- ARCHITECTURAL: 8
- HISTORICAL: 8
- INSCRIPTION: 4
- VISUAL_MATERIAL: 3
- VISUAL_SCULPTURE: 3
- CULTURAL_RELIGIOUS: 2
- CHRONOLOGY: 2
- COMPARATIVE_REASONING: 1
- VISUAL_INSCRIPTION: 1

## Difficulty Distribution
- EASY: 13 (approx 26%)
- MODERATE: 23 (approx 46%)
- HARD: 14 (approx 28%)

*Note: Target was ~30/50/20. The generated distribution aligns closely with target thresholds while prioritizing source quality.*

## Quality Metrics & Audit Findings
The automated audit script (`pilot_quality_audit.py`) validated the dataset against the V2 Quality Gates:
- **Exact Duplicates:** 0
- **Semantic Duplicates:** 0 (All questions are explicitly marked `UNIQUE`).
- **Unsupported Answer Count:** 0
- **Metadata-only Count:** 0
- **Source-Grounding Statistics:** 100% of TEXT_MCQs contain direct quotes/references to exact DB fields.
- **Image-Grounding Statistics:** 100% of IMAGE_MCQs have `HIGH` visual dependency with explicit observable features documented.
- **Visual Evidence Missing:** 0
- **Unresolved issues:** 0
- **Human-review items required:** 50 (All items currently `DRAFT`, awaiting human/AI review stage).

## Final Status
- **PILOT_GENERATION_STATUS:** COMPLETE
- **PILOT_QUALITY_GATE:** PASS
- **NEXT_STEP:** EXTERNAL_REVIEW
