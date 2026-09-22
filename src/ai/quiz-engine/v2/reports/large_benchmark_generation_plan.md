# Large Benchmark Generation Plan (120-200 Questions)

## 1. Dataset Naming and Conceptual Phases
- **48-question pilot**: DEVELOPMENT / MODEL-SELECTION DATA
  *(Must not be included in the final unseen test set)*
- **150-question dataset**: LARGE RESEARCH DATASET
  *(The broad candidate pool post-review)*
- **Validated frozen evaluation subset**: FINAL BENCHMARK
  *(The highly curated subset used for definitive testing)*

## 2. The Generation Unit
The fundamental unit of candidate generation is **ONE VERIFIED HERITAGE IMAGE**.
The generation flow per unit is:
`MongoDB Site Context + Actual Cloudinary Image`  →  `Gemini`  →  `10–12 DISTINCT QUESTION CANDIDATES`

**Note**: 10-12 is strictly a *CANDIDATE TARGET*. It is not a requirement that 10-12 questions survive the review process. After filtering, it is perfectly acceptable to retain fewer high-quality questions.

## 3. Image-Based Scale & Distribution Targets
Rather than simply targeting "questions per site", the scale is defined by selected images:
- **Selected Sites**: ~10 to 15 sites
- **Selected Images per Site**: ~2 to 4 high-quality images per site (varies based on available DB evidence)
- **Candidate Questions per Image**: 10–12 generated candidates
- **Expected Pipeline**: ~10 sites × ~3 images/site × 10–12 candidates/image → Large candidate pool → Filter down to **~150 approved questions**.
*(Do not force identical image counts across all sites if the DB does not contain equivalent evidence).*

**Target Quotas (Guidelines, not hard limits)**
- `Text / Image`: ~50% / 50%
- `Difficulty`: ~25% EASY / ~50% MODERATE / ~25% HARD
- *Quality over Quota*: Priority is source validity, answer validity, image alignment, duplicate avoidance, and reasoning quality. Do not generate weak questions merely to satisfy quotas.

## 4. Question Purpose & Visual Dependency
Every generated question **must** contain two specific metadata fields:

**A. `question_purpose`**
- `VISUAL`
- `HISTORICAL_CONTEXT`
- `CULTURAL_CONTEXT`
- `CHRONOLOGY`
- `COMPARATIVE_REASONING`

**B. `visual_dependency`**
- `HIGH`: Image pixels are absolutely necessary.
- `MEDIUM`: Image provides important evidence, but site context is also needed.
- `LOW`: Question is mainly contextual, with the image serving as a reference.
- `NONE`: Image is unnecessary or purely decorative.
*(IMAGE_MCQ benchmark items should strongly prefer HIGH dependency. Do NOT call LOW/NONE questions "visual reasoning" merely because an image is attached).*

## 5. Question Family Mix Per Image
When generating 10–12 candidates from one image, seek diversity across the following targets (never invent a category if the source does not support it):
- 2–3 Visual Architecture
- 1–2 Visual Material/Sculpture
- 1 Visual Inscription (when applicable)
- 2 Historical Context
- 1 Cultural/Religious
- 1 Chronology
- 1 Comparative Reasoning
- 1 Site-specific reasoning

## 6. Strict Duplicate Control
**Mandatory Rule**: *"Every question must remain independently valid; sharing the same image does not justify repeating the same fact in different wording."*

- **Within the same image**: No paraphrase duplicates, no repeated facts, no repeated answer patterns, and no repeated reasoning tasks unless materially different.
- **Across the dataset**: The same fact is allowed *only* if the reasoning task is genuinely different and explicitly documented.

## 7. Source of Truth
Gemini acts as a **CANDIDATE GENERATOR** only. The ultimate source of truth remains:
- MongoDB Site data
- Verified historical/architectural context
- Actual image pixels
- Validated project sources

Gemini-generated facts must never become ground truth by themselves. Any generated fact unsupported by the verified context must be rejected.

## 8. Split Strategy & Data Management
- **Site-Level Split**: The dataset will be split at the site level to test genuine generalization. (Train: ~70%, Validation: ~15%, Test: ~15%).
- **Master Dataset**: The dataset will maintain a single master annotation source at `src/ai/quiz-engine/v2/annotation/annotation.json`, from which format-specific splits (`train.json`, `validation.json`, `test.json`) are derived.
