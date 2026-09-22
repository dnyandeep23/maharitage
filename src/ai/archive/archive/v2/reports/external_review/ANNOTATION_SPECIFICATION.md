# Maharitage V2 Annotation Methodology Specification

SPECIFICATION_STATUS: COMPLETE

## Purpose

V2 exists to produce high-quality Maharashtra heritage benchmark questions before any dataset generation, model benchmarking, or LoRA training begins.

Core rule:

HIGH-QUALITY QUESTIONS > LARGE NUMBER OF QUESTIONS

The benchmark must measure genuine heritage knowledge, historical reasoning, architectural understanding, visual reasoning, and multimodal capability. It must not be optimized to artificially inflate model accuracy.

## 1. Annotation Schema

Every future annotation must be a structured record. Required fields are listed below.

### `annotation_id`

- Meaning: stable unique identifier for one annotation.
- Allowed values: string, format `v2_<site_id>_<type>_<number>`.
- Validation rule: must be unique across the dataset.
- Example: `v2_Aja0003_text_001`.

### `site_id`

- Meaning: canonical project site identifier.
- Allowed values: existing validated Maharitage site IDs.
- Validation rule: must match the site record used for source grounding.
- Example: `Aja0003`.

### `site_name`

- Meaning: human-readable site name.
- Allowed values: official project site name.
- Validation rule: must match the `site_id`.
- Example: `The Ajanta Caves`.

### `question_type`

- Meaning: modality and task type.
- Allowed values: `TEXT_MCQ`, `IMAGE_MCQ`.
- Validation rule: `IMAGE_MCQ` requires image evidence and at least `MEDIUM` visual dependency.
- Example: `IMAGE_MCQ`.

### `category`

- Meaning: research category being tested.
- Allowed values: `HISTORICAL`, `ARCHITECTURAL`, `CULTURAL_RELIGIOUS`, `INSCRIPTION`, `CHRONOLOGY`, `COMPARATIVE_REASONING`, `VISUAL_ARCHITECTURE`, `VISUAL_SCULPTURE`, `VISUAL_MATERIAL`, `VISUAL_INSCRIPTION`, `GEOGRAPHIC_METADATA`.
- Validation rule: category must match the actual reasoning required.
- Example: `VISUAL_ARCHITECTURE`.

### `difficulty`

- Meaning: reasoning complexity.
- Allowed values: `EASY`, `MODERATE`, `HARD`.
- Validation rule: must be based on reasoning steps, not difficult wording.
- Example: `MODERATE`.

### `question`

- Meaning: the MCQ prompt.
- Allowed values: clear, answerable question string.
- Validation rule: must not reveal the answer through wording, grammar, filename, or option format.
- Example: `Which visible architectural feature identifies this entrance as part of a rock-cut Buddhist cave complex?`

### `options`

- Meaning: four candidate answers.
- Allowed values: array of exactly four strings.
- Validation rule: exactly four non-empty options with similar structure, plausible distractors, and no obvious format clues.
- Example: `["Pillared rock-cut veranda", "Brick palace balcony", "Sea-fort bastion", "Timber gopuram"]`.

### `correct_option`

- Meaning: correct answer key.
- Allowed values: `A`, `B`, `C`, `D`.
- Validation rule: exactly one option must be correct and fully supported by source evidence.
- Example: `A`.

### `source_type`

- Meaning: source class used for answer grounding.
- Allowed values: `SITE_DATA`, `HISTORICAL_CONTEXT`, `ARCHITECTURAL_CONTEXT`, `CULTURAL_CONTEXT`, `INSCRIPTION_DATA`, `IMAGE_EVIDENCE`, `PROJECT_REPORT`, `MIXED_VERIFIED`.
- Validation rule: must identify where the answer comes from.
- Example: `IMAGE_EVIDENCE`.

### `source_evidence`

- Meaning: concise evidence supporting the correct answer.
- Allowed values: text field containing field path, image observation, inscription note, or verified project source.
- Validation rule: must be specific enough for review.
- Example: `Gallery image shows a carved rock-cut entrance with stone pillars and a veranda.`

### `reasoning_type`

- Meaning: cognitive operation required.
- Allowed values: `DIRECT_RECALL`, `VISUAL_RECOGNITION`, `ARCHITECTURAL_INTERPRETATION`, `HISTORICAL_LINKING`, `CHRONOLOGICAL_REASONING`, `COMPARISON`, `INSCRIPTION_INTERPRETATION`, `MATERIAL_IDENTIFICATION`.
- Validation rule: must match the answer path.
- Example: `ARCHITECTURAL_INTERPRETATION`.

### `site_relevance`

- Meaning: how meaningful the question is for the stated site.
- Allowed values: `HIGH`, `MEDIUM`, `LOW`, `INVALID`.
- Validation rule: `LOW` and `INVALID` items cannot enter the approved benchmark.
- Example: `HIGH`.

### `visual_dependency`

- Meaning: how necessary the image is.
- Allowed values: `NONE`, `LOW`, `MEDIUM`, `HIGH`.
- Validation rule: `IMAGE_MCQ` must be `MEDIUM` or `HIGH`; `TEXT_MCQ` should normally be `NONE`.
- Example: `HIGH`.

### `visual_evidence`

- Meaning: observable visual evidence used to answer the question.
- Allowed values: string or `null`.
- Validation rule: required for `IMAGE_MCQ`; must describe visible evidence, not metadata.
- Example: `The image shows a horseshoe-shaped chaitya arch above the cave entrance.`

### `visible_feature`

- Meaning: short label for the visual feature being tested.
- Allowed values: string or `null`.
- Validation rule: required for `IMAGE_MCQ`.
- Example: `horseshoe chaitya arch`.

### `image_url`

- Meaning: image attached to an `IMAGE_MCQ`.
- Allowed values: verified project gallery or inscription image URL, or `null` for `TEXT_MCQ`.
- Validation rule: required and accessible for `IMAGE_MCQ`; must not be used as a clue through filename text.
- Example: `https://.../cave19-ajnta_vfjbdc.jpg`.

### `answer_validity`

- Meaning: review status of the correct answer.
- Allowed values: `SUPPORTED`, `AMBIGUOUS`, `UNSUPPORTED`, `CONFLICTING`.
- Validation rule: only `SUPPORTED` can be approved.
- Example: `SUPPORTED`.

### `distractor_quality`

- Meaning: quality of incorrect answer options.
- Allowed values: `GOOD`, `WEAK`, `INVALID`.
- Validation rule: only `GOOD` can be approved.
- Example: `GOOD`.

### `duplicate_group`

- Meaning: concept group for duplicate tracking.
- Allowed values: stable string or `null`.
- Validation rule: same fact or same image feature must share a group ID.
- Example: `Aja0003_district_fact`.

### `duplicate_status`

- Meaning: duplicate classification for the item.
- Allowed values: `EXACT_DUPLICATE`, `SEMANTIC_DUPLICATE`, `SAME_FACT`, `SAME_IMAGE_FEATURE`, `UNIQUE`.
- Validation rule: only `UNIQUE` or intentionally controlled concept coverage can be approved.
- Example: `UNIQUE`.

### `review_status`

- Meaning: pipeline review state.
- Allowed values: `DRAFT`, `AUTO_VALIDATED`, `NEEDS_REVISION`, `HUMAN_REVIEWED`, `APPROVED`, `REJECTED`.
- Validation rule: final pilot contains only `APPROVED`.
- Example: `DRAFT`.

### `review_notes`

- Meaning: reviewer comments and rejection reasons.
- Allowed values: string or `null`.
- Validation rule: required when status is `NEEDS_REVISION` or `REJECTED`.
- Example: `Correct answer is much longer than distractors.`

### `ablation_answerable_without_image`

- Meaning: later text-only ablation flag for image questions.
- Allowed values: `YES`, `NO`, `UNCERTAIN`, `NOT_APPLICABLE`.
- Validation rule: valid `IMAGE_MCQ` should be `NO` after ablation review.
- Example: `NO`.

## 2. Question Taxonomy

- `HISTORICAL`: rulers, dynasties, patronage, events, historical context.
- `ARCHITECTURAL`: plans, structural forms, cave/fort components, stylistic features.
- `CULTURAL_RELIGIOUS`: religious traditions, ritual meaning, iconographic context, cultural significance.
- `INSCRIPTION`: script, language, content, epigraphic context from verified inscription evidence.
- `CHRONOLOGY`: periodization, sequence, era, relative dating.
- `COMPARATIVE_REASONING`: comparing sites, periods, styles, materials, or functions.
- `VISUAL_ARCHITECTURE`: visual identification of built/rock-cut architectural features.
- `VISUAL_SCULPTURE`: visual identification of sculpture, posture, relief, iconography, or figures.
- `VISUAL_MATERIAL`: visible material, surface, stone, damage, carving, or construction texture.
- `VISUAL_INSCRIPTION`: visible inscription layout, line count, damage, script traces, or carved text features.
- `GEOGRAPHIC_METADATA`: latitude, longitude, district, state, country, or basic location.

`GEOGRAPHIC_METADATA` is secondary. It may support coverage, but must not dominate the benchmark or replace meaningful heritage reasoning.

## 3. Difficulty

Difficulty reflects reasoning complexity, not complex vocabulary.

### EASY

Rules:

- One-step recall or obvious visual recognition.
- Clear, direct evidence.
- Distractors are plausible but not confusable to a prepared learner.

Valid examples:

- Identify the dynasty associated with a site from validated historical context.
- Identify a clearly visible stupa in an image.
- Identify that a site is a Buddhist cave complex from direct project data.

### MODERATE

Rules:

- Requires interpretation or connecting two pieces of evidence.
- May combine site context with visible architecture or cultural meaning.
- Distractors should be close enough to require understanding.

Valid examples:

- Connect a visible chaitya arch with Buddhist cave architecture.
- Explain which cultural tradition is represented by a visible iconographic feature.
- Identify why a cave layout indicates a monastic function.

### HARD

Rules:

- Requires multi-step reasoning, comparison, chronology, fine-grained visual reading, or architectural discrimination.
- Distractors may be historically or architecturally plausible.
- The answer should not be recoverable by metadata alone.

Valid examples:

- Distinguish vihara and chaitya hall layouts using visible interior evidence.
- Compare two architectural forms and identify the one associated with a specific period.
- Interpret an inscription image by using visible layout/damage evidence plus epigraphic context.

## 4. Image MCQ Rules

Core rule:

IMAGE ATTACHED != IMAGE REQUIRED

An item qualifies as `IMAGE_MCQ` only when actual visual inspection contributes information necessary to answer the question.

### Visual Dependency Levels

`NONE`:

- The image is irrelevant.
- The question can be answered from text metadata alone.
- Example: asking the district of a site while attaching a monument image.

`LOW`:

- The image is loosely related but not necessary.
- The answer can still be inferred from site name, topic, filename, or metadata.
- Not acceptable for final `IMAGE_MCQ`.

`MEDIUM`:

- The image provides useful evidence, but some non-image context also helps.
- Acceptable only if the visual feature is explicit and the answer cannot be confidently solved from metadata alone.

`HIGH`:

- The image is essential.
- The answer depends on visible architecture, sculpture, material, inscription layout, damage, posture, line count, or another observable feature.
- Preferred for final `IMAGE_MCQ`.

### Text-Only Ablation Test

Every future `IMAGE_MCQ` must undergo a text-only ablation test:

1. Remove the image.
2. Keep only the question and options.
3. Ask whether a knowledgeable evaluator can answer reliably without visual inspection.
4. If yes, mark `ablation_answerable_without_image = YES` and reject or rewrite.
5. If no, keep as a visual candidate.

## 5. Source Grounding

Every answer must be grounded in verified project evidence. No invented facts are allowed.

Allowed grounding sources:

- site data
- historical context
- architecture fields or verified architectural descriptions
- cultural significance fields or verified project reports
- inscription data
- gallery/image evidence
- other verified project sources

Validation rules:

- The correct answer must be directly supported.
- Ambiguous, disputed, or unsupported answers are rejected.
- AI-generated text is not ground truth unless independently validated.
- Image observations must describe visible evidence, not hidden metadata.

## 6. MCQ Quality

Required MCQ rules:

- exactly four options
- exactly one correct answer
- plausible distractors
- similar option structure
- similar answer length
- no format clues
- no grammatical clues
- no obviously absurd distractors
- no answer that is much more specific than all distractors

Prevent these issues:

- numeric vs textual mismatch, such as `20.3137` among district names
- one extremely long correct answer among short distractors
- one option with unusually formal wording
- one option that repeats the question wording
- distractors from unrelated categories, such as sea forts in a sculpture-material question unless comparison requires them
- all distractors being obviously impossible

## 7. Duplicate / Concept Grouping

Duplicate classifications:

- `EXACT_DUPLICATE`: identical question or answer set.
- `SEMANTIC_DUPLICATE`: different wording but same test and same answer.
- `SAME_FACT`: same source fact tested in multiple forms.
- `SAME_IMAGE_FEATURE`: same visual feature in the same image tested repeatedly.
- `UNIQUE`: distinct concept, source evidence, and reasoning path.

Rules:

- Two differently worded questions testing the same fact must share a `duplicate_group`.
- Repeated district, state, latitude, or classification items should usually be rejected.
- A concept may appear more than once only if it tests genuinely different reasoning or modalities.

## 8. Site Relevance

`HIGH`:

- Tests something central to the site: historical role, architecture, religious/cultural meaning, inscription evidence, or distinctive visual features.

`MEDIUM`:

- Relevant but not central. Useful as supporting knowledge.

`LOW`:

- Generic fact that says little about the site. Not suitable for benchmark approval.

`INVALID`:

- Wrong site, unsupported claim, irrelevant topic, or non-heritage content.

Approved pilot items should be `HIGH`, with limited `MEDIUM` only where justified.

## 9. Validation Pipeline

Pipeline:

RAW SOURCE  
↓  
CONCEPT IDENTIFICATION  
↓  
QUESTION GENERATION  
↓  
SOURCE VALIDATION  
↓  
ANSWER VALIDATION  
↓  
DISTRACTOR VALIDATION  
↓  
DUPLICATE CHECK  
↓  
DIFFICULTY  
↓  
VISUAL DEPENDENCY  
↓  
HUMAN REVIEW  
↓  
APPROVED

Rejection conditions:

- RAW SOURCE: reject if source is missing, inaccessible, untrusted, or unrelated to Maharashtra heritage.
- CONCEPT IDENTIFICATION: reject if the concept is trivial metadata, too generic, or unsupported.
- QUESTION GENERATION: reject unclear, leading, multi-answer, or poorly scoped questions.
- SOURCE VALIDATION: reject if source evidence does not support the answer.
- ANSWER VALIDATION: reject if multiple options are correct, answer is ambiguous, or answer key is wrong.
- DISTRACTOR VALIDATION: reject weak, absurd, mismatched, or clue-giving distractors.
- DUPLICATE CHECK: reject exact duplicates and uncontrolled semantic duplicates.
- DIFFICULTY: reject if difficulty label is inflated by wording rather than reasoning.
- VISUAL DEPENDENCY: reject `IMAGE_MCQ` items with `NONE` or `LOW` dependency.
- HUMAN REVIEW: reject if reviewer cannot verify grounding, relevance, or fairness.

## 10. Pilot Design

First pilot size:

- 40-60 total questions.
- 4-6 sites.
- Roughly 20-30 `TEXT_MCQ`.
- Roughly 20-30 `IMAGE_MCQ`.

Target difficulty mix:

- 30% Easy.
- 50% Moderate.
- 20% Hard.

Do not force a category if the source data cannot support a high-quality question. Empty coverage is better than weak coverage.

## 11. Pilot Quality Gate

Pilot pass/fail conditions:

- 0 exact duplicates.
- Minimal semantic duplicates, each justified by concept group.
- 0 unsupported answers.
- 100% four-option validity.
- 100% answer-key validity.
- No obvious option-format leakage.
- No numeric/textual category mismatch.
- No correct option that is obviously longer or more specific than distractors.
- Every image question has `image_url`, `visual_dependency`, `visual_evidence`, and `visible_feature`.
- Every image question passes visual-dependency review.
- No excessive metadata questions.
- Every item has source evidence.
- Every item has duplicate/concept grouping.
- Every item has difficulty based on reasoning complexity.
- Human review completed.
- Final pilot contains only `APPROVED` items.

## 12. Model Benchmarking - Future Only

Model benchmarking comes after the pilot is approved.

The future benchmark may compare 4-5 Hugging Face/open VLM candidate families:

- SmolVLM
- Qwen-VL
- InternVL
- LLaVA
- Idefics

These are candidate families only. Do not finalize models during annotation specification or pilot creation.

## 13. LoRA - Future Only

LoRA will not be trained during pilot creation.

Required sequence:

clean benchmark  
→ base-model comparison  
→ select promising model  
→ optional LoRA

LoRA must not be used to compensate for weak annotations, leakage, duplicates, or poor visual grounding.

## 14. Examples

BAD:

- `What is the approximate latitude of Ajanta?`
- Reason: metadata-heavy, weak heritage value, and likely to create numeric/textual option mismatch.

BAD:

- Multiple differently worded versions of the same district question.
- Reason: semantic duplication and dataset inflation without new reasoning.

BAD:

- An image attached to `What district is this heritage site located in?`
- Reason: image attached does not make the image required.

BAD:

- Correct answer is a long cultural paragraph while distractors are two-word labels.
- Reason: option-format leakage.

GOOD:

- A question requiring identification of a visible architectural feature, such as a chaitya arch, pillared veranda, carved relief, stupa, inscription line layout, stone surface, or sculpture posture.
- Reason: visually grounded and meaningful for heritage understanding.

GOOD:

- A historical question that connects a dynasty, period, and cultural significance using verified source evidence.
- Reason: tests heritage knowledge rather than raw metadata.

GOOD:

- A comparative question asking which visible feature distinguishes a cave hall from a fort gateway.
- Reason: tests architectural reasoning and plausible alternatives.

## Files Created

- `src/ai/quiz-engine/v2/reports/ANNOTATION_SPECIFICATION.md`
