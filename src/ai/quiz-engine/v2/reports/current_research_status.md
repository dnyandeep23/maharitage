# Current Research Status

**CURRENT_STAGE**: PRELIMINARY_MODEL_SELECTION

## COMPLETED
- V2 Schema Definition
- Pilot Generation (48 questions)
- Pixel-Level Image Audit
- Human & External Review
- Freezing Pilot Dataset
- 5-Model Benchmark Execution (SmolVLM-256M, SmolVLM-500M, Qwen2-VL-2B-Instruct-4bit, Qwen3-VL-8B, Gemma-3-12B)
- Result Audit & Documentation
- Preliminary Finalist Selection

## IN_PROGRESS
- Preparation for larger dataset generation

## NOT_STARTED
- Large Validated Benchmark Execution
- Full Visual Ablation Study
- Final Model Selection
- LoRA/QLoRA Experimentation
- Production AI Integration

## KNOWN_LIMITATIONS
- **Pilot Size**: The 48-question pilot is small; therefore, small accuracy differences (e.g., between Gemma 3 12B and Qwen3-VL 8B) are strictly preliminary and indicative.
- **Confidence Inconsistency**: Confidence metrics are not exposed uniformly across models/backends, preventing a perfect 1:1 cross-model calibration analysis. 
- **Ablation Constraints**: Visual ablation study is incomplete due to rate limits and external provider constraints. 

## NEXT_EXPERIMENT
**LARGE VALIDATED BENCHMARK**
*(Note: QLoRA will not be started until the large benchmark is fully completed and evaluated).*
