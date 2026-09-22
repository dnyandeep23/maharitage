# Annotation Quality Audit — MAHARITAGE NEW V1

**Audit Date**: 2026-08-09
**Architecture**: NEW V1 Site-Agnostic Quiz Engine

---

## 1. Executive Summary

| Metric | Count |
|:---|:---:|
| **Total annotations** | 1776 |
| Text MCQs | 602 |
| Image MCQs | 550 |
| Inscription MCQs | 624 |
| Sites covered | 10 |

**Training Readiness**: **NOT READY**

> [!WARNING]
> The visual annotation dataset is **NOT READY** for visual-model training.
>
> - 49.0% of sampled image questions are DATABASE_ONLY (image irrelevant)
> - 208 semantic duplicates detected

---

## 2. Site-by-Site Results

| Site ID | Site Name | Type | Text | Image | Inscription | Total |
|:---|:---|:---|:---:|:---:|:---:|:---:|
| Aja0003 | The Ajanta Caves | Buddhist Rock-Cut Monastic Complex | 36 | 70 | 36 | **142** |
| Ele0005 | Elephanta Cave | Hindu Rock-Cut Cave Temple Complex | 26 | 10 | 0 | **36** |
| Ell0001 | The Ellora Caves | Multi-Religious Rock-Cut Cave Complex (Buddhist, Hindu, and Jain) | 31 | 140 | 44 | **215** |
| Fort0001 | Raigad Fort | Hill Fort | 93 | 40 | 0 | **133** |
| Fort0002 | Rajgad Fort | Hill Fort | 72 | 60 | 0 | **132** |
| Fort0003 | Devgiri Fort (Daulatabad Fort) | Hill Fort (conical rock) | 104 | 40 | 0 | **144** |
| Fort0004 | Sindhudurg Fort | Sea Fort (Island) | 73 | 40 | 0 | **113** |
| Fort0005 | Murud-Janjira Fort | Sea Fort (Island) | 81 | 50 | 0 | **131** |
| Kan0004 | The Kanheri Caves | Buddhist Rock-Cut Monastic and University Complex | 59 | 50 | 544 | **653** |
| Pit0002 | The Pitalkhora Caves | Buddhist Rock-Cut Monastic Complex | 27 | 50 | 0 | **77** |

---

## 3. Text Annotation Audit

**Sample size**: 100 (10 per site)

| Result | Count |
|:---|:---:|
| PASS | 82 |
| FAIL | 0 |
| AMBIGUOUS | 18 |

---

## 4. Image Annotation Audit

**Sample size**: 100

### URL Accessibility

| Status | Count |
|:---|:---:|
| Accessible | 100 |
| Failed | 0 |

### Visual Dependency Classification

| Classification | Count | % of sample |
|:---|:---:|:---:|
| TRUE_VISUAL | 40 | 40.0% |
| DATABASE_ONLY | 49 | 49.0% |
| MIXED | 11 | 11.0% |
| INVALID | 0 | 0.0% |

### Image Dependency Score

| Score | Meaning | Count | % |
|:---:|:---|:---:|:---:|
| 0 | Image irrelevant | 8 | 8.0% |
| 1 | Weakly related | 41 | 41.0% |
| 2 | Useful evidence | 11 | 11.0% |
| 3 | Image essential | 40 | 40.0% |

### Image Question Categories

| Category | Count |
|:---|:---:|
| Visual Identification | 15 |
| Architectural Feature | 12 |
| Heritage Classification | 11 |
| Site Scale | 11 |
| Cultural Context | 11 |
| Historical Patron | 10 |
| Chronological Era | 9 |
| Geographical Context | 8 |
| Monument Component | 7 |
| Visual Material | 6 |

### Template Overuse Detection

| Template | Count |
|:---|:---:|
| Which heritage site is depicted in gallery photograph #N?... | 15 |
| What primary architectural feature is visible in gallery photograph #N of {SITE}... | 12 |
| Based on the structure visible in photograph #N, what type of heritage monument ... | 11 |
| Based on photograph #N, what is the approximate scale or extent of {SITE}?... | 11 |
| What cultural or religious tradition does the monument shown in photograph #N of... | 11 |

> [!IMPORTANT]
> Templates are repeated across gallery images. Each image gets the same set of 10 category templates. This is by design but limits visual specificity.

---

## 5. Inscription Annotation Audit

**Sample size**: 30

### URL Accessibility

| Status | Count |
|:---|:---:|
| Accessible | 30 |
| Failed | 0 |

### Inscription Dependency Classification

| Classification | Count | % |
|:---|:---:|:---:|
| VISUALLY_ANSWERABLE | 0 | 0.0% |
| DB_GROUNDED + IMAGE_CONTEXTUAL | 26 | 86.7% |
| DATABASE_ONLY | 0 | 0.0% |
| INVALID | 0 | 0.0% |

### Inscription Dependency Score

| Score | Count | % |
|:---:|:---:|:---:|
| 0 | 0 | 0.0% |
| 1 | 4 | 13.3% |
| 2 | 26 | 86.7% |
| 3 | 0 | 0.0% |

---

## 6. Distractor Quality Analysis

| Quality | Count | % |
|:---|:---:|:---:|
| GOOD | 226 | 98.3% |
| WEAK | 4 | 1.7% |
| INVALID | 0 | 0.0% |

### Distractor Issues (sample)

- **Aja0003_insc_003_q034** [WEAK]: 3 generic/nonsense distractor(s)
- **Aja0003_insc_001_q010** [WEAK]: 2 generic/nonsense distractor(s)
- **Aja0003_insc_002_q022** [WEAK]: 3 generic/nonsense distractor(s)
- **Kan0004_insc_029_q302** [WEAK]: 2 generic/nonsense distractor(s)

---

## 7. Option Position Distribution

### Text (n=602)

| Position | Count | % |
|:---:|:---:|:---:|
| A (0) | 154 | 25.6% |
| B (1) | 151 | 25.1% |
| C (2) | 150 | 24.9% |
| D (3) | 147 | 24.4% |

### Image (n=550)

| Position | Count | % |
|:---:|:---:|:---:|
| A (0) | 140 | 25.5% |
| B (1) | 140 | 25.5% |
| C (2) | 135 | 24.5% |
| D (3) | 135 | 24.5% |

### Inscription (n=624)

| Position | Count | % |
|:---:|:---:|:---:|
| A (0) | 156 | 25.0% |
| B (1) | 156 | 25.0% |
| C (2) | 156 | 25.0% |
| D (3) | 156 | 25.0% |

### Global (n=1776)

| Position | Count | % |
|:---:|:---:|:---:|
| A (0) | 450 | 25.3% |
| B (1) | 447 | 25.2% |
| C (2) | 441 | 24.8% |
| D (3) | 438 | 24.7% |

---

## 8. Duplicate Analysis

| Type | Count |
|:---|:---:|
| Exact duplicates | 0 |
| Normalized duplicates | 0 |
| Semantic duplicates (Jaccard > 0.75) | 208 |

### Sample Duplicate Pairs

- **semantic(0.78)**: `Aja0003_text_007` ↔ `Aja0003_text_008`
  - "What is the approximate latitude of The Ajanta Caves?"
  - "What is the approximate longitude of The Ajanta Caves?"
- **semantic(0.78)**: `Aja0003_text_026` ↔ `Aja0003_text_027`
  - "Is Buddha historically connected to The Ajanta Caves?"
  - "Is Bodhisattvas historically connected to The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_029` ↔ `Aja0003_text_032`
  - "What script is used in Insc_01 at The Ajanta Caves?"
  - "What script is used in Insc_02 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_029` ↔ `Aja0003_text_035`
  - "What script is used in Insc_01 at The Ajanta Caves?"
  - "What script is used in Insc_03 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_030` ↔ `Aja0003_text_033`
  - "What language is detected in Insc_01 at The Ajanta Caves?"
  - "What language is detected in Insc_02 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_030` ↔ `Aja0003_text_036`
  - "What language is detected in Insc_01 at The Ajanta Caves?"
  - "What language is detected in Insc_03 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_031` ↔ `Aja0003_text_034`
  - "What is the English translation of Insc_01 at The Ajanta Caves?"
  - "What is the English translation of Insc_02 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_031` ↔ `Aja0003_text_037`
  - "What is the English translation of Insc_01 at The Ajanta Caves?"
  - "What is the English translation of Insc_03 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_032` ↔ `Aja0003_text_035`
  - "What script is used in Insc_02 at The Ajanta Caves?"
  - "What script is used in Insc_03 at The Ajanta Caves?"
- **semantic(0.82)**: `Aja0003_text_033` ↔ `Aja0003_text_036`
  - "What language is detected in Insc_02 at The Ajanta Caves?"
  - "What language is detected in Insc_03 at The Ajanta Caves?"

---

## 9. Source Field Audit

| Status | Count |
|:---|:---:|
| Valid | 602 |
| Missing field | 0 |
| Value mismatch | 0 |

---

## 10. Question Uniqueness (in sample)

| Classification | Count | % |
|:---|:---:|:---:|
| UNIQUE | 187 | 81.3% |
| PARAPHRASE | 32 | 13.9% |
| DUPLICATE | 11 | 4.8% |

---

## 11. Empty File Cleanup

| Metric | Count |
|:---|:---:|
| Empty files found | 7 |
| Empty files removed | 7 |
| Remaining empty | 0 |
| Valid files preserved | 23 |
| Sites represented | [object Set] |

### Removed Files

- `src/ai/quiz-engine/data/annotations/visual/inscription/Ele0005.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Fort0001.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Fort0002.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Fort0003.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Fort0004.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Fort0005.json` — Site has no applicable inscriptions — empty is expected (2 bytes)
- `src/ai/quiz-engine/data/annotations/visual/inscription/Pit0002.json` — Site has no applicable inscriptions — empty is expected (2 bytes)

---

## 12. Recommended Fixes

> [!CAUTION]
> **Critical Issues**
>
> 1. **Image questions are mostly DATABASE_ONLY**: The current 10-category template system generates questions like "Which dynasty patronized this?" and "What period does this belong to?" — answers come from MongoDB, not the image. These are text questions with an image attached.
> 2. **Inscription questions are mostly DATABASE_ONLY**: Questions about translations, historical descriptions, and site context can be answered without viewing the inscription image.
> 3. **Semantic duplicates**: Multiple paraphrases of the same fact per site inflate the dataset without adding diversity.

### Action Items

1. **Redesign image question templates** to require actual visual reasoning (e.g., "How many pillars are visible?", "What color is the stone?", "Is there an entrance visible?")
2. **Redesign inscription templates** to test visual epigraphical skills (e.g., "What script characters are visible?", "How many lines of text appear?")
3. **Reduce paraphrasing** — 1–2 questions per fact, not 3+
4. **Add image-specific metadata** per gallery image (what the image actually shows) so templates can reference real visual content
5. **Separate visual-training-candidate annotations** from database-quiz annotations

---

## 13. Training Readiness Assessment

### Decision: **NOT READY**

> [!CAUTION]
> The visual annotation dataset is **NOT READY** for visual-model training.
>
> - 49.0% of sampled image questions are DATABASE_ONLY (image irrelevant)
> - 208 semantic duplicates detected

### Why NOT READY

The current image and inscription annotations are functionally **text/knowledge questions with an image URL attached**. A visual model trained on these would learn to map images → database lookups rather than develop genuine visual understanding.

**Text annotations are READY** for deterministic runtime quiz answering. They are ground-truth verified against MongoDB and correctly indexed.

**Visual annotations require redesign** before being used for visual-model training.
