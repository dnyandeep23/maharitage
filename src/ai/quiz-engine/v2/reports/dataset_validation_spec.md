# Dataset Validation Specification (V2)

## Architectural Source of Truth
The primary authoring source of truth for the dataset is **STRICTLY PER-SITE**.
- **Text MCQs**: `dataset/<site_id>/text/annotations.json`
- **Image MCQs**: `dataset/<site_id>/image/annotations.json`
- **Image Binaries**: `dataset/<site_id>/image/images/`

Any edits, pruning, or manual reviews MUST be performed on these per-site files. 

## Derived Global Indices
The global dataset files are **DERIVED ONLY**. They are rebuilt automatically using the local validation layer scripts:
- `src/ai/quiz-engine/v2/evaluation/build_master_annotation.js`

This script parses all valid site directories and compiles:
- `src/ai/quiz-engine/v2/annotation/annotation.json`
- `src/ai/quiz-engine/v2/dataset/image_based/annotations.json`
- `src/ai/quiz-engine/v2/dataset/text_based/annotations.json`

## Validation Layer
To ensure strict schema compliance before committing annotations, the pipeline enforces a multi-tier validation layer.

### 1. Site-Level Validation (`validate_site_annotations.js`)
Checks local integrity of a single site directory:
- Annotation ID uniqueness
- Exact conformity to `TEXT_MCQ` and `IMAGE_MCQ` expected schemas (categories, difficulty, visual dependency rules)
- Strict requirement of exactly 4 options with answers bounded strictly to A, B, C, D
- Image binary physical existence checks (`fs.existsSync` and non-zero bytes checks)
- Prevention of cross-contamination (e.g. text questions attempting to reference visual evidence or containing images)

### 2. Global Validation (`validate_dataset.js`)
Checks global consistency across the derived master index:
- Cross-site annotation ID collision prevention
- Ensures valid aggregate distribution targets
- Detects orphaned files or missing source evidence links across the entire repository.

If any site fails validation, the scripts throw deterministic structural errors and halt execution.
