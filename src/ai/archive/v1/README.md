# Maharitage AI Research Archive - V1

This directory preserves the old Maharitage experimental AI quiz, annotation, benchmark, visual inference, and LoRA research workspace.

## Why V1 Is Archived

V1 is archived because the research pipeline is being restarted from scratch. The earlier workspace produced useful prototypes and audit evidence, but it is not being used as the final benchmark design for Maharitage AI research.

The active research workspace has been reset so V2 can define a cleaner annotation schema, stronger question-quality rules, and a benchmark methodology focused on meaningful Maharashtra heritage understanding.

## What V1 Attempted

V1 attempted to build an AI quiz and visual-language research pipeline around Maharashtra heritage sites. It included:

- annotation datasets
- text, image, and inscription MCQs
- annotation generators
- duplicate detection and validation utilities
- MongoDB and Cloudinary verification scripts
- benchmark files
- visual baseline evaluation scripts
- SmolVLM inference experiments
- LoRA training and evaluation scripts
- audit reports and experiment reports

The preserved V1 workspace is stored under:

- `src/ai/archive/v1/quiz-engine/`

## Why V1 Is Not The Final Benchmark

V1 is not the final benchmark because the annotation methodology was not sufficiently aligned with the intended research goal. Many generated questions were valid as database-grounded quiz items, but weak as a benchmark for model reasoning or visual understanding.

The final benchmark should evaluate historical, architectural, cultural, religious, inscriptional, chronological, comparative, and visual reasoning about Maharashtra heritage. V1 mixed that goal with many metadata-heavy and pseudo-visual items.

## Major Issues Discovered

- Metadata-heavy questions: many items focused on latitude, longitude, district, state, country, or simple classification.
- Semantic duplicates: multiple questions repeated the same concept or database fact with slight wording changes.
- Pseudo-visual questions: some image MCQs had an image attached but could be answered from database metadata or site identity alone.
- Weak distractors: some answer options were obviously wrong, mismatched in format, or made the correct answer easy to infer.
- Insufficient visual grounding: some visual and inscription questions did not require direct inspection of the image.
- Small or unstable LoRA training dataset: later clean LoRA attempts used too few examples to establish a reliable improvement.
- Previous leakage issues: earlier training attempts found overlap between annotation/training images and evaluation assets, requiring stricter isolation.

## Archive Rule

Files in this archive should be treated as historical evidence. Do not overwrite or edit archived V1 artifacts during V2 development.
