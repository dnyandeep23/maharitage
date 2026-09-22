# MAHARITAGE V2

## 1. Purpose
V2 is the research annotation and VLM (Vision-Language Model) benchmark pipeline for Maharashtra heritage multiple-choice questions (MCQs).

## 2. Research Objective
The intended study involves:
- Creating a curated heritage question dataset.
- Supporting both text and image MCQs.
- Establishing distinct difficulty levels.
- Testing visual reasoning capabilities.
- Ensuring rigorous source grounding.
- Comparing multiple VLMs.
- Selecting the best base model for this domain.
- Evaluating future domain adaptation strategies (like LoRA/QLoRA).

## 3. Current Status

V2_STATUS = PILOT_BENCHMARK_COMPLETE

PILOT_DATASET = 48 QUESTIONS

MODEL_BENCHMARK = COMPLETE

MODEL_SELECTION = PRELIMINARY

FINAL_LARGE_BENCHMARK = NOT_STARTED

QLORA = NOT_STARTED

PRODUCTION_INTEGRATION = NOT_STARTED

## 4. Frozen Benchmark
The current evaluation uses the frozen benchmark files:
- `src/ai/quiz-engine/v2/benchmark/pilot_v2_frozen.json`
- `src/ai/quiz-engine/v2/benchmark/pilot_v2_manifest.json`

**Important**: This benchmark is frozen and must not be modified.

## 5. Annotation Methodology
The dataset generation strictly adhered to the following principles:
- DB-grounded generation using MongoDB site evidence.
- Cloudinary image verification.
- Categorization into historical, architectural, and cultural dimensions.
- Image-specific visual validation.
- Duplicate checks to ensure uniqueness.
- Application of a strict difficulty framework.
- Thorough source grounding.
- Human and external review.

VISUAL_ABLATION_STATUS = INCOMPLETE
*Reason*: External provider rate limits and timeouts prevented a complete paired image/no-image evaluation.

## 6. Pilot Validation
- **Initial pilot size**: 50+ candidates
- **Final size**: 48 verified questions
- Rejected/revised image questions were thoroughly vetted.
- A pixel-level image audit was conducted.
- External review applied.
- *Known Limitations*: The pilot size is small (n=48), meaning minor accuracy differences are indicative rather than statistically significant.

## 7. Model Benchmark
The following models were evaluated in the 5-model pilot:

| Model ID | Parameter Scale | Backend | Role in Experiment | Accuracy | Image Accuracy |
|---|---|---|---|---|---|
| google/gemma-3-12b-it | 12B | OpenRouter | High-capability baseline | 100.0% | 100.0% |
| qwen/qwen3-vl-8b-instruct | 8B | OpenRouter | Mid-tier / high-capability baseline | 97.9% | 100.0% |
| mlx-community/Qwen2-VL-2B-Instruct-4bit | 2B | Local MLX | Efficient Edge baseline | 85.4% | 95.7% |
| HuggingFaceTB/SmolVLM-500M-Instruct | 0.5B | Local MPS | Ultra-lightweight baseline | 56.2% | 82.6% |
| HuggingFaceTB/SmolVLM-256M-Instruct | 0.25B | Local MPS | Constrained baseline | 6.2% | 13.0% |

## 8. Current Findings
- **Gemma 3-12B**: Achieved the highest observed overall accuracy (100%).
- **Qwen3-VL-8B**: Displayed near-equivalent performance (97.9%).
- **Qwen2-VL-2B**: Demonstrated strong local efficiency and image performance (95.7% image accuracy).
- **SmolVLM variants**: Served as useful lightweight baselines but were substantially weaker overall.

## 9. Confidence Caveat
Confidence availability is not uniform across all models and providers.
- Some models exposed logprob-derived values (e.g., Qwen3, SmolVLM).
- Others did not expose usable confidence (e.g., Gemma 3 via OpenRouter, Qwen2 via MLX generation API).
- Therefore, cross-model confidence comparison is incomplete.
- *Note*: SmolVLM-256M-Instruct exhibited severe calibration issues, showing high average confidence (0.710) on incorrect answers, higher than its confidence on correct answers (0.699). 

## 10. Research Workflow
V2 schema → pilot generation → review → image audit → frozen pilot → 5-model benchmark → finalist selection → larger benchmark → final model selection → LoRA/QLoRA experiment → final evaluation

## 11. Directory Structure
Active directories:
- `annotation/`
- `benchmark/`
- `dataset/`
- `evaluation/`
- `reports/`

Historical experiments are safely archived under:
`src/ai/quiz-engine/archive/v2/`

## 12. Important Research Rules
- Do not modify the frozen benchmark.
- Never fabricate model predictions.
- Never treat API failures as wrong predictions.
- Do not invent confidence values.
- Keep production scoring independent of VLM predictions.
- Separate research experiments from production AI.
- Preserve old experiments in the archive.

---

## Research Changelog
- **2026-08-17**: V2 schema created
- **2026-08-17**: pilot generated
- **2026-08-17**: pilot reviewed
- **2026-08-17**: pixel-level image audit
- **2026-08-17**: pilot frozen at 48
- **2026-08-17**: 5-model benchmark completed
- **2026-08-17**: preliminary finalist selection
