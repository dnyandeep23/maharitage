# Research Workspace Reset

## 1. What Was Found Under `src/ai`

The active `src/ai` workspace contained an experimental `quiz-engine` tree with:

- annotation datasets under `quiz-engine/data/annotations`
- benchmark files under `quiz-engine/data/benchmarks`
- visual datasets under `quiz-engine/data/datasets`
- V1 annotation generators under `quiz-engine/v1/annotation`
- baseline and evaluation scripts under `quiz-engine/v1/baseline`
- pipeline scripts under `quiz-engine/v1/pipeline`
- router, service, verification, and generation utilities
- training annotations, assets, checkpoints, dataset scripts, and reports under `quiz-engine/v1/training`
- the old quiz-engine README

The old active tree contained 237 files at the time of reset.

An empty stray nested directory tree existed at `src/ai/src/ai/quiz-engine/v1/training/...`; it contained no files and was cleared from the active workspace.

## 2. Production vs Experimental Identification

Production/current application files were identified outside `src/ai`, including:

- `src/app/ai/page.jsx`
- `src/app/api/ai/route.js`
- `src/models/`
- `src/lib/`
- authentication and middleware files
- production UI files

The current production AI architecture is the Gemini/MongoDB/RAG `/api/ai` path. That production path does not require the archived V1 research scripts for this reset.

The `src/ai/quiz-engine` workspace was identified as experimental/research work: annotations, benchmarks, training scripts, visual inference experiments, LoRA artifacts, and audit reports.

## 3. What Was Archived

The old active research workspace was archived to:

- `src/ai/archive/v1/quiz-engine/`

Archived materials include:

- annotation datasets
- annotation generators
- audit reports
- benchmark files
- dataset files
- training scripts
- LoRA checkpoints and scripts
- evaluation scripts
- visual inference experiments
- experiment reports
- walkthrough/readme material

An archive README was created at:

- `src/ai/archive/v1/README.md`

## 4. What Was Cleared From The Active Research Workspace

The old `src/ai/quiz-engine/` tree was removed from the active location by moving it into `src/ai/archive/v1/quiz-engine/`.

The empty stray nested `src/ai/src/` directory tree was removed.

The active research workspace now contains the clean V2 structure only:

- `src/ai/quiz-engine/v2/`

## 5. V1 Limitations

V1 is archived because it is not suitable as the final benchmark methodology.

Major limitations:

- metadata-heavy questions about latitude, longitude, district, state, and country
- semantic duplicates and repeated facts
- pseudo-visual questions where the image was attached but not required
- weak or format-biased distractors
- insufficient visual grounding in some visual and inscription items
- small or unstable clean LoRA training datasets
- previous leakage issues between training/annotation images and evaluation assets
- no measurable LoRA improvement under documented tested configurations

## 6. New V2 Research Objective

V2 will create a clean benchmark for meaningful Maharashtra heritage understanding.

Priority categories:

- Historical
- Architectural
- Cultural / Religious
- Inscription
- Chronology
- Comparative / Reasoning
- Visual Architecture
- Visual Sculpture
- Visual Material
- Visual Inscription

Geographical metadata may be used only as supporting content and must not dominate the benchmark.

Future V2 questions must be:

- strongly relevant to the specific heritage site
- factually grounded
- non-duplicative
- meaningful for research
- free of obvious option-format clues
- appropriate for Easy / Moderate / Hard classification

For image questions, IMAGE ATTACHED != IMAGE REQUIRED. A valid `IMAGE_MCQ` must require the image and later include `image_url`, `visual_dependency`, `visual_evidence`, and `visible_feature`.

## 7. New V2 Directory Structure

Created:

- `src/ai/quiz-engine/v2/annotation/`
- `src/ai/quiz-engine/v2/dataset/`
- `src/ai/quiz-engine/v2/benchmark/`
- `src/ai/quiz-engine/v2/evaluation/`
- `src/ai/quiz-engine/v2/reports/`
- `src/ai/quiz-engine/v2/README.md`
- `src/ai/quiz-engine/v2/reports/research_workspace_reset.md`

## 8. Production Files Not Modified

Confirmed for this reset:

- No `src/app/` files were edited.
- No `src/models/` files were edited.
- No `src/lib/` files were edited.
- `/api/ai` was not edited.
- Production quiz UI was not edited.
- MongoDB production data was not modified.
- Cloudinary assets were not modified.
- Authentication files were not edited.
- No questions were generated.
- No annotations were generated.
- No LoRA training was run.
- No model benchmarks were run.

Reset status:

- ARCHIVE COMPLETE
- OLD RESEARCH WORKSPACE CLEARED
- V2 WORKSPACE CREATED
- PRODUCTION CODE UNCHANGED
