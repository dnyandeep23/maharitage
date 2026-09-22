# MAHARITAGE — RESEARCH CONTEXT

## 1. Project Overview

Maharitage is a Maharashtra heritage learning and quiz project. The application presents heritage-focused AI chat and quiz experiences around Maharashtra sites, monuments, caves, forts, inscriptions, dynasties, art, architecture, and cultural history.

The current application supports conversational heritage assistance and quiz generation. The AI quiz goal is to produce useful multiple-choice questions for learning and assessment. Two research directions are important:

- TEXT MCQ: questions answerable from validated heritage knowledge, database fields, historical context, inscriptions, chronology, and cultural material.
- IMAGE MCQ: questions that require visual inspection of a photograph, sculpture, architectural element, material, inscription scan, or heritage scene.

The project focus is Maharashtra heritage. The system should avoid drifting into generic Indian history unless it directly supports Maharashtra heritage learning.

## 2. Current Production Architecture

This section describes the CURRENT production AI system, based on the code in:

- `src/app/ai/page.jsx`
- `src/app/api/ai/route.js`
- `src/models/Site.js`
- `src/models/Chat.js`
- `src/models/AIUsage.js`
- `src/lib/modelConfig.ts`

Frontend: `src/app/ai/page.jsx`

- Provides the AI chat and quiz UI.
- Supports general and student audiences.
- Supports chat mode and quiz mode.
- Supports quiz configuration: topic, difficulty, question count, and question type including MCQ, Short Answer, Mixed, and Image MCQ.
- Collects anonymous browser fingerprints with FingerprintJS.
- Sends requests to `/api/ai`.
- Streams the AI response from the backend and updates the UI incrementally.
- Supports image upload by reading files as base64 inline image data.
- Stores selected chat IDs in session storage and fetches persisted chats for logged-in users.

Backend: `src/app/api/ai/route.js`

- Handles `POST /api/ai`.
- Connects to MongoDB.
- Verifies optional bearer tokens.
- Applies anonymous usage limits through `AIUsage`.
- Builds Gemini-compatible chat history.
- Retrieves relevant `Site` records from MongoDB using keyword-based matching and random site sampling for broad quiz mode.
- Builds a RAG-style context block from matched and general Maharashtra sites.
- Sends the prompt, context, chat history, and optional inline image data to Gemini.
- Streams the response back to the frontend.
- Saves user and AI messages to `Chat` for logged-in users.

Database: MongoDB

Important models:

- `Site`: stores site identifiers, site names, heritage type, location, and additional flexible heritage fields through `strict: false`.
- `Chat`: stores user chats, mode, audience type, score, progress, and messages. Chat documents expire after 30 days.
- `AIUsage`: stores anonymous fingerprint usage counts and first query time.

Current AI: Google Gemini model chain

`src/lib/modelConfig.ts` defines the current model fallback chain:

1. `gemini-3.1-flash-lite-preview`
2. `gemini-3-flash-preview`
3. `gemini-3.1-pro-preview`

Production flow:

User -> frontend (`src/app/ai/page.jsx`) -> `/api/ai` -> MongoDB retrieval/RAG -> Gemini model chain -> streaming response -> frontend

Current production behavior includes:

- RAG: MongoDB site records are retrieved and inserted into the system prompt as heritage context.
- Streaming: Gemini streaming output is wrapped in a `ReadableStream` and sent as plain text.
- Fallback models: retryable Gemini failures and quota conditions can trigger fallback to the next configured Gemini model.
- Anonymous usage limits: anonymous users require a fingerprint and are limited to 3 queries.
- Chat persistence: logged-in user chats are created or updated in MongoDB.
- Image handling: the frontend sends image data as inline base64; the backend appends it to Gemini user parts. The system also maps `[Image needed: Site Name]` tags to local database gallery URLs during streaming.

This is the CURRENT production architecture. It is Gemini-based and MongoDB/RAG-based.

## 3. Experimental VLM / LoRA Track

`src/ai/quiz-engine/v1/` contains experimental work separate from the production `/api/ai` architecture.

The V1 area includes work on:

- annotation generation
- text, image, and inscription MCQs
- visual benchmarks
- SmolVLM evaluation
- LoRA training
- dataset building
- train/validation/test splits
- visual inference experiments
- audit reports

Important distinction: the V1 VLM/LoRA experiment is currently separate from the production `/api/ai` quiz architecture. The production quiz currently uses the Gemini model chain and MongoDB retrieval. Do not claim that LoRA currently powers the production quiz.

## 4. Previous Annotation Dataset

The previous annotation dataset under `src/ai/quiz-engine/data/annotations/` contained text, image, and inscription MCQs across 10 sites. The audit report `src/ai/quiz-engine/data/annotations/reports/annotation_quality_audit.md` records:

- 1776 total annotations
- 602 text MCQs
- 550 image MCQs
- 624 inscription MCQs
- 10 sites covered
- Training readiness: NOT READY for visual-model training

The discovered problem was alignment. Many annotations were valid database questions, but not aligned with the intended research objective of benchmarking historical, architectural, cultural, inscriptional, chronological, reasoning, and visual understanding.

Some annotations focused heavily on:

- latitude/longitude
- district/location
- state/country
- simple heritage classification
- repeated versions of the same fact

For example, `src/ai/quiz-engine/data/annotations/text/Aja0003.json` includes multiple Ajanta location questions about district, state, country, latitude, and repeated district phrasing. These are useful for basic data verification but weak as a research benchmark.

The intended benchmark should instead emphasize:

- historical knowledge
- architectural knowledge
- cultural heritage
- inscriptions
- chronology
- reasoning
- genuine visual understanding

The audit also reports 208 semantic duplicates and states that many current image and inscription annotations function as text or database questions with an image URL attached.

## 5. Example of Current Annotation Problem

### Example 1 - Simple Metadata Question

- Site: The Ajanta Caves (`Aja0003`)
- File: `src/ai/quiz-engine/data/annotations/text/Aja0003.json`
- Annotation: `Aja0003_text_007`
- Question: What is the approximate latitude of The Ajanta Caves?
- Options: Sindhudurg; Vidarbha; 20.3137; Satara
- Correct answer: 20.3137
- Source: MongoDB field `location.latitude`
- Why useful/problematic: useful for checking database grounding, but problematic as a heritage benchmark because it tests metadata recall and even mixes a coordinate with place-name distractors.

### Example 2 - Repeated/Near-Duplicate Question

- Site: The Ajanta Caves (`Aja0003`)
- File: `src/ai/quiz-engine/data/annotations/text/Aja0003.json`
- Annotations: `Aja0003_text_001`, `Aja0003_text_002`, `Aja0003_text_003`
- Questions:
  - In which district of Maharashtra is The Ajanta Caves located?
  - Which district serves as the administrative region for The Ajanta Caves?
  - The Ajanta Caves is situated in which district?
- Options: each set includes Chhatrapati Sambhaji Nagar with distractor districts.
- Correct answer: Chhatrapati Sambhaji Nagar
- Source: MongoDB field `location.district`
- Why useful/problematic: each question is individually valid, but the group repeats the same fact and inflates dataset size without adding research diversity.

### Example 3 - Good Historical/Cultural Question

- Site: The Ajanta Caves (`Aja0003`)
- File: `src/ai/quiz-engine/data/annotations/text/Aja0003.json`
- Annotation: `Aja0003_text_021`
- Question: What is the cultural significance of The Ajanta Caves?
- Options: Coronation site of a major ruler; Strategic military stronghold; UNESCO World Heritage Site; Ajanta Caves represent the height of Buddhist religious art during the Gupta-Vakataka period, illustrating Jataka tales and the evolution of Buddhist monastic architecture and mural painting.
- Correct answer: Ajanta Caves represent the height of Buddhist religious art during the Gupta-Vakataka period, illustrating Jataka tales and the evolution of Buddhist monastic architecture and mural painting.
- Source: MongoDB field `historical_context.cultural_significance`
- Why useful/problematic: closer to the desired benchmark because it tests cultural and historical meaning, although the correct option is much longer than the distractors and may be answerable by option-length bias.

### Example 4 - Genuine Image Question

- Site: The Ajanta Caves (`Aja0003`)
- File: `src/ai/quiz-engine/data/annotations/visual/image/Aja0003.json`
- Annotation: `Aja0003_img_001_q001`
- Question: Which distinct architectural feature is visible at the entrance of Cave 17 depicted in this photograph?
- Options: A rock-cut veranda supported by carved stone pillars with bracket capitals; A zig-zag defensive stone gateway; A circular brick stupa dome; A multi-tiered wooden gopuram
- Correct answer: A rock-cut veranda supported by carved stone pillars with bracket capitals
- Source: Cloudinary gallery image `gallary[0]`
- Why useful/problematic: useful because the question refers to visible architectural evidence and has `visual_dependency_score: 3`.

### Example 5 - Questionable Image Question

- Site: The Ajanta Caves (`Aja0003`)
- File: `src/ai/quiz-engine/data/annotations/visual/image/Aja0003.json`
- Annotation: `Aja0003_img_002_q005`
- Question: Which heritage monument is identified by this rock-cut cave architecture visible in gallery photograph 'caveimage_rzplhc'?
- Options: The Ajanta Caves; Raigad Fort; Sindhudurg Fort; Murud-Janjira Fort
- Correct answer: The Ajanta Caves
- Source: Cloudinary gallery image `gallary[1]`
- Why useful/problematic: partly visual, but weaker than a feature-specific image question. It may reward site recognition or filename/context clues rather than detailed visual reasoning.

The audit file `src/ai/quiz-engine/data/annotations/reports/annotation_quality_audit.md` also gives broader problematic examples, including latitude/longitude duplicates and repeated inscription questions such as:

- What script is used in Insc_01 at The Ajanta Caves?
- What script is used in Insc_02 at The Ajanta Caves?
- What script is used in Insc_03 at The Ajanta Caves?

## 6. Previous SmolVLM Experiment

Model:

- `HuggingFaceTB/SmolVLM-256M-Instruct`

LoRA:

- `smolvlm_lora_v1`

The reports document several stages and corrections.

Initial training was blocked in `src/ai/quiz-engine/v1/training/reports/training_report.md` because of COMPLETE_IMAGE_LEAKAGE:

- Total annotation images: 138
- Images leaking into evaluation: 78 (56.5%)
- Clean images available for training: 60
- Decision: DO_NOT_TRAIN

`src/ai/quiz-engine/v1/training/reports/training_data_readiness_report.md` later documents a cleaner setup:

- Clean assets discovered: 92
- Evaluation-locked assets: 55
- Successfully annotated: 22
- Rejected due to Gemini API quota: 70
- Image leakage: 0 verified
- VDS=3: 100%
- Final decision at that stage: DO_NOT_TRAIN_YET because only 16 train examples were available.

`src/ai/quiz-engine/v1/training/reports/final_lora_experiment_report.md` documents a memory-safe LoRA run:

- Base model: `HuggingFaceTB/SmolVLM-256M-Instruct`
- LoRA parameters: r=8, alpha=16, dropout=0.05
- Device: MPS
- Epochs: 1
- Checkpoint: `src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1`
- Successful batches: 17
- Failed batches: 0
- MPS peak memory: 0.68 GiB

Measured results in that final report:

| Benchmark | Baseline | LoRA | Absolute Change |
|---|---:|---:|---:|
| Validation Set | 0.0% | 0.0% | +0.0% |
| V4 Gallery Benchmark | 25.5% | 25.5% | +0.0% |
| Hard Image Diagnostic | 24.0% | 24.0% | +0.0% |

`src/ai/quiz-engine/v1/training/reports/lora_heldout_test_report.md` records:

- Test questions: 10
- Training image overlap: 0 verified
- Base model accuracy: 40.0% (4/10)
- LoRA model accuracy: 40.0% (4/10)
- Improvement: +0.0 percentage points
- Peak MPS memory: 1.29 GiB
- Final decision: `LORA_NO_CHANGE`

`src/ai/quiz-engine/v1/training/reports/final_v4_strict_evaluation.md` records an earlier/final clean V4 strict evaluation:

- Benchmark questions: 55
- Base accuracy: 47.27% (26/55)
- LoRA accuracy: 47.27% (26/55)
- Absolute change: +0.00%
- Relative change: +0.00%

Observed improvement across these documented runs: 0 percentage points.

This does NOT prove that LoRA failed permanently. It means the tested LoRA dataset/configuration showed no measurable improvement under the documented evaluation settings.

## 7. Why We Are Restarting Annotation Design

We are restarting annotation design because the previous methodology was not sufficiently aligned with the intended research objective.

The old dataset contains many valid database-grounded questions, but too many are weak for VLM research. A high-quality benchmark should test visual reasoning, architectural recognition, cultural and historical knowledge, inscription evidence, chronology, and controlled difficulty.

The current plan is:

- archive the old experiment as V1 history
- restart annotation design
- create a cleaner benchmark methodology
- avoid immediate retraining
- prioritize a high-quality benchmark over a large number of weak questions

## 8. New Research Goal

The project aims to benchmark 4-5 Hugging Face/open-weight vision-language models on Maharashtra heritage MCQs.

The benchmark should test:

- TEXT MCQ
- IMAGE MCQ

The image benchmark should contain questions that genuinely require visual inspection. A question with an image attached is not automatically a visual reasoning question.

## 9. Desired Question Categories

Intended categories:

- Historical
- Architectural
- Cultural
- Religious
- Inscription
- Visual Architecture
- Visual Sculpture
- Visual Material
- Chronology
- Comparative
- Geographic/supporting metadata

Simple latitude, longitude, district, state, and location questions may be included only as supporting metadata. They should not dominate the benchmark.

## 10. Desired Difficulty System

Difficulty should be based on reasoning complexity, not complicated wording.

EASY:

- Direct recognition or direct recall.
- One-step answer.
- Clear evidence in the text or image.
- Example: identify a visible stupa, cave entrance, district, dynasty, or broad site type.

MODERATE:

- Requires connecting two pieces of evidence.
- May require understanding function, style, period, or context.
- Example: connect a visible chaitya arch to Buddhist cave architecture.

HARD:

- Requires comparison, chronology, fine-grained visual discrimination, inscription interpretation, or architectural reasoning.
- Distractors should be plausible.
- Example: distinguish a vihara layout from a chaitya hall using visible hall structure and shrine/stupa evidence.

## 11. Desired Visual Dependency

IMAGE ATTACHED != IMAGE REQUIRED.

A visual question should require the image. If the same question can be answered from the site name, district, database field, or filename alone, it is not a strong image benchmark item.

BAD:

- What district is this site located in?

GOOD:

- Which architectural feature is visible in the entrance shown in this photograph?

Visual dependency should be explicitly labeled and reviewed. Strong visual MCQs should require observable evidence such as pillars, arches, sculptural figures, stone material, inscription layout, damage pattern, line count, posture, facade arrangement, or visible architectural plan.

## 12. Desired Annotation Fields

Proposed fields:

- `annotation_id`: stable unique ID for the question.
- `site_id`: site identifier from the project.
- `site_name`: human-readable site name.
- `question_type`: text, image, inscription, or another controlled type.
- `category`: historical, architectural, visual sculpture, inscription, chronology, etc.
- `difficulty`: EASY, MODERATE, or HARD.
- `question`: MCQ prompt.
- `options`: four answer options.
- `correct_option`: correct option label or index.
- `source_type`: MongoDB, Cloudinary, human review, scholarly note, or mixed.
- `source_evidence`: exact field, image evidence, or reviewed evidence supporting the answer.
- `reasoning_type`: direct recall, visual recognition, comparison, chronology, inscription reading, etc.
- `site_relevance`: why the question matters for the site.
- `visual_dependency`: none, weak, useful, or required.
- `visual_evidence`: what must be seen in the image to answer.
- `answer_validity`: validated, ambiguous, disputed, or rejected.
- `distractor_quality`: good, weak, too obvious, misleading, or invalid.
- `duplicate_group`: identifier for semantically similar questions.
- `review_status`: draft, AI-reviewed, human-reviewed, accepted, or rejected.

## 13. Multi-Model Research Plan

1. Clean annotations.
2. Deduplicate.
3. Validate answer keys and evidence.
4. Add difficulty labels.
5. Validate visual dependency.
6. Conduct human review.
7. Freeze the final benchmark.
8. Benchmark 4-5 Hugging Face/open-weight models.
9. Perform error analysis.
10. Select the most promising model.
11. Attempt optional LoRA only after benchmark quality is established.
12. Run final evaluation on held-out data.

## 14. Model Candidates

These are candidate families for future review, not final selections:

- SmolVLM
- Qwen-VL / Qwen2.5-VL
- InternVL
- LLaVA
- Idefics
- other appropriate Hugging Face VLMs

Model selection should be based on:

- accuracy
- visual reasoning
- efficiency
- model size
- Hugging Face availability
- reproducibility
- hardware/cost

## 15. AI Responsibility Principle

AI should be used where it adds real value.

Deterministic systems should handle:

- answer-key lookup
- scoring
- XP
- progress
- quiz state
- image URL mapping

AI should handle:

- question generation/phrasing
- explanations
- conversational interaction
- visual reasoning when a model is explicitly being tested

VLMs should be used for:

- genuine image interpretation
- visual architecture questions
- visual sculpture questions
- visual material questions
- visual inscription questions

The production quiz should not depend on a VLM for deterministic tasks such as scoring or answer-key lookup.

## 16. Open Research Questions

External AI reviewers should help answer:

- What should the final annotation schema be?
- What is the ideal Easy/Moderate/Hard distribution?
- How much of the benchmark should be Image MCQ?
- How should visual dependency be measured?
- What benchmark size is realistic?
- Which 4-5 Hugging Face models should be selected?
- Should SmolVLM remain in the comparison?
- When should LoRA be attempted?
- How should train/validation/test be split?
- How should duplicate concepts be grouped?
- How should human + AI annotation review work?

## 17. Important Constraints

- Do not modify production quiz architecture during dataset design.
- Do not train LoRA before benchmark quality is established.
- Do not use weak metadata questions as the main visual benchmark.
- Do not claim model improvement without evidence.
- Do not treat AI-generated answers as ground truth without validation.
- Do not claim that LoRA powers the current production quiz.
- Do not treat image attachment as proof of visual dependency.

## 18. Two-Minute Project Summary

Maharitage is a Maharashtra heritage AI quiz and learning system. The current production app uses a Next.js frontend, `/api/ai` backend route, MongoDB site retrieval/RAG, and a Google Gemini fallback model chain to provide streaming chat and quiz responses. It supports chat, quiz mode, anonymous query limits, logged-in chat persistence, and image uploads.

Separately, the repository contains an experimental V1 quiz-engine track for annotation generation, visual benchmarks, SmolVLM evaluation, and LoRA experiments. That V1 track does not currently power the production `/api/ai` quiz.

The previous annotation dataset became large, but audits found that it was not sufficiently aligned with the intended research benchmark. Many questions tested district, coordinates, simple metadata, repeated facts, or database-only knowledge with an image attached. Some strong visual questions exist, but the benchmark needs to be redesigned around historical, architectural, cultural, inscriptional, chronological, reasoning, and genuine visual understanding.

The documented SmolVLM/LoRA experiments used `HuggingFaceTB/SmolVLM-256M-Instruct` and `smolvlm_lora_v1`. The measured results showed no improvement: held-out accuracy stayed at 40.0% vs 40.0%, and V4 strict evaluation stayed at 47.27% vs 47.27%. This does not mean LoRA can never help; it means the tested dataset/configuration produced 0 percentage-point improvement.

The new research goal is to restart annotation design, create a clean benchmark, and evaluate 4-5 Hugging Face/open-weight VLMs on Maharashtra heritage TEXT MCQ and IMAGE MCQ tasks. LoRA should only be reconsidered after a high-quality, deduplicated, visually dependent, human-reviewed benchmark exists.

## Sources Used

- `src/app/ai/page.jsx`
- `src/app/api/ai/route.js`
- `src/lib/modelConfig.ts`
- `src/models/Site.js`
- `src/models/Chat.js`
- `src/models/AIUsage.js`
- `src/ai/quiz-engine/data/annotations/text/Aja0003.json`
- `src/ai/quiz-engine/data/annotations/visual/image/Aja0003.json`
- `src/ai/quiz-engine/data/annotations/reports/annotation_quality_audit.md`
- `src/ai/quiz-engine/data/annotations/reports/visual_annotation_quality_audit.md`
- `src/ai/quiz-engine/v1/training/reports/training_report.md`
- `src/ai/quiz-engine/v1/training/reports/training_data_readiness_report.md`
- `src/ai/quiz-engine/v1/training/reports/final_lora_experiment_report.md`
- `src/ai/quiz-engine/v1/training/reports/lora_heldout_test_report.md`
- `src/ai/quiz-engine/v1/training/reports/final_v4_strict_evaluation.md`
- `src/ai/quiz-engine/v1/training/reports/final_lora_integrity_audit.md`
- `src/ai/quiz-engine/v1/training/reports/v4_reconciliation_report.md`
