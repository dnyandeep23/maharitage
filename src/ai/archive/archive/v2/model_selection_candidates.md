# V2 Benchmark Model Selection Candidates

## qwen/qwen2.5-vl-72b-instruct (TIER 1)
- **Family**: Qwen-VL
- **Parameters**: 72B
- **Inference**: OpenRouter
- **Confidence Support**: logprobs (OpenRouter top_logprobs)
- **Reason**: State of the art open weights VLM, highly capable of visual reasoning.

## google/gemma-3-12b-it (TIER 1)
- **Family**: Gemma 3
- **Parameters**: 12B
- **Inference**: OpenRouter
- **Confidence Support**: logprobs (if supported by OR provider)
- **Reason**: Latest Google multimodal model, extremely efficient and capable in the 12B class.

## nvidia/nemotron-nano-12b-v2-vl:free (TIER 1)
- **Family**: Nemotron
- **Parameters**: 12B
- **Inference**: OpenRouter
- **Confidence Support**: logprobs (if supported)
- **Reason**: NVIDIA's efficient 12B VLM offering free inference via OpenRouter.

## lmms-lab/llava-onevision-qwen2-7b-ov (TIER 1)
- **Family**: LLaVA-OneVision
- **Parameters**: 7B
- **Inference**: HuggingFace Inference API
- **Confidence Support**: Not natively via simple HF chat API, might require custom inference or self-reported.
- **Reason**: Strong community fine-tune for single/multi-image tasks.

## OpenGVLab/InternVL2-8B (TIER 2)
- **Family**: InternVL
- **Parameters**: 8B
- **Inference**: HuggingFace Inference API, OpenRouter
- **Confidence Support**: Unknown / Self-reported
- **Reason**: Very strong academic VLM, but API availability can be flaky.

## HuggingFaceTB/SmolVLM-Instruct (TIER 2)
- **Family**: SmolVLM
- **Parameters**: 2B
- **Inference**: HuggingFace Inference API
- **Confidence Support**: Unknown / Self-reported
- **Reason**: Requested by methodology, but 2B might struggle heavily with zero-shot MCQs.

